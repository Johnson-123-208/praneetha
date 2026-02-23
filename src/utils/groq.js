import { tools } from './database.js';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_AUDIO_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';

// Cleanup utility for internal markers
export const cleanInternalCommands = (text) => {
  if (!text) return '';
  return text
    .replace(/^(Callix|Agent|Assistant|System):\s*/i, '')
    .replace(/\b(BOOK_APPOINTMENT|BOOK_TABLE|BOOK_ORDER|COLLECT_RATING|COLLECT_FEEDBACK|COLLECT_)\b.*$/gim, '')
    .replace(/\b(TRACE_ORDER|HANG_UP)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
};

let apiKey = null;

export const initializeGroq = (key) => {
  if (!key) return false;
  apiKey = key;
  return true;
};

/**
 * Main AI Reasoning - Uses Groq Llama 3
 */
export const chatWithGroq = async (prompt, history = [], companyContext = null, customSystemMessage = null) => {
  if (!apiKey) throw new Error('Groq API key not configured');

  try {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

    const systemMessage = customSystemMessage || `You are Callix, a professional AI calling agent.
    CURRENT DATE: ${dateStr}
    CURRENT TIME: ${timeStr}
    ${companyContext ? `ENTITY: ${companyContext.name} (${companyContext.industry})\nCONTEXT: ${companyContext.nlpContext}` : ''}
    
    CAPABILITIES:
    - [QUERY_ENTITY_DATABASE]: For menu/doctors/vacancies/info.
    - [BOOK_APPOINTMENT]: For doctors/slots/interviews.
    - [BOOK_TABLE]: For restaurant bookings.
    - [BOOK_ORDER]: For e-commerce orders.
    - [COLLECT_FEEDBACK]: For ratings and reviews.
    - [HANG_UP]: To end the call.
    
    IMPORTANT CONVERSATIONAL RULES:
    1. If user says "Yes" to a booking/order, DO NOT guess the details. 
    2. Ask the user for the missing fields (Date, Time, People, or Item Name) naturally in their language.
    3. AFTER any successful action (booking/order), ALWAYS ask "Is there anything else I can help you with?".
    4. If the user says "No" or "Nothing else", ALWAYS ask "Could you please give me a quick rating from 1 to 5 stars for this call?".
    5. AFTER receiving feedback (rating), say "Thank you! Have a great day. Goodbye!" and include [HANG_UP].
    6. Speak warmly and naturally. Only output the [COMMAND] once you have all the necessary information.`;

    const messages = [
      { role: 'system', content: systemMessage },
      ...history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.text || msg.content || ''
      })),
      { role: 'user', content: prompt }
    ];

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: messages,
        temperature: 0.6,
        max_tokens: 800,
      }),
    });

    if (!response.ok) throw new Error(`Groq Error: ${response.status}`);

    const data = await response.json();
    const assistantMessage = data.choices[0]?.message?.content || '';

    // Action Detection
    const functionMatch = detectIntent(assistantMessage, companyContext);

    if (functionMatch) {
      const result = await executeAction(functionMatch);

      // Simple follow-up confirm with the FAST model
      const finalResponse = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            ...messages,
            { role: 'assistant', content: cleanInternalCommands(assistantMessage) },
            {
              role: 'system', content: `ACTION RESULT: ${JSON.stringify(result)}. 
            
            Confirm this result to the user naturally in 1 short sentence. 
            LANGUAGE: Use the same language as the user (Telugu/English/Hindi).
            FOLLOW-UP: Ask "Is there anything else I can help you with?" or gather missing info if the result was a search.` }
          ],
          temperature: 0.5,
          max_tokens: 150
        })
      });

      if (finalResponse.ok) {
        const finalData = await finalResponse.json();
        return finalData.choices[0]?.message?.content;
      }
    }

    return assistantMessage;
  } catch (error) {
    console.error('Groq AI Error:', error);
    throw error;
  }
};

const detectIntent = (message, context) => {
  const msg = message.toUpperCase();

  if (msg.includes('BOOK_APPOINTMENT')) return { name: 'book_appointment', args: { entityId: context?.id, entityName: context?.name } };
  if (msg.includes('BOOK_TABLE')) return { name: 'book_appointment', args: { entityId: context?.id, entityName: context?.name, type: 'table' } };
  if (msg.includes('BOOK_ORDER')) return { name: 'book_order', args: { companyId: context?.id } };
  if (msg.includes('COLLECT_FEEDBACK')) return { name: 'collect_feedback', args: { entityId: context?.id, entityName: context?.name } };
  if (msg.includes('QUERY_ENTITY_DATABASE')) return { name: 'query_entity_database', args: { entityId: context?.id } };

  return null;
};

const executeAction = async (match) => {
  const { name, args } = match;
  if (tools[name]) return await tools[name](args);
  return { error: 'Unknown action' };
};

export const transcribeAudio = async (audioBlob, languageCode = 'en') => {
  if (!apiKey) throw new Error('Groq API key not configured');

  const formData = new FormData();
  formData.append('file', audioBlob, 'audio.webm');
  formData.append('model', 'whisper-large-v3');
  formData.append('language', languageCode.split('-')[0]);

  const response = await fetch(GROQ_AUDIO_URL, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}` },
    body: formData,
  });

  if (!response.ok) throw new Error('Groq Transcription Error');
  const data = await response.json();
  return data.text;
};
