import { tools } from './database.js';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_AUDIO_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';

// Cleanup utility for internal markers
export const cleanInternalCommands = (text) => {
  if (!text) return '';
  return text
    .replace(/^(Callix|Agent|Assistant|System):\s*/i, '')
    // Match commands with or without brackets, and alles following them on the same line
    .replace(/\[?(BOOK_APPOINTMENT|BOOK_TABLE|BOOK_ORDER|COLLECT_RATING|COLLECT_FEEDBACK|COLLECT_)\]?.*$/gim, '')
    .replace(/\[?(TRACE_ORDER|HANG_UP)\]?/gi, '')
    .replace(/[\[\]]/g, '') // Remove any dangling brackets
    .replace(/\s+/g, ' ')
    .trim();
};

let primaryApiKey = null;
const FALLBACK_API_KEY = import.meta.env.VITE_FALLBACK_GROQ_API_KEY;

export const initializeGroq = (key) => {
  if (!key) return false;
  primaryApiKey = key;
  return true;
};

/**
 * Main AI Reasoning - Uses Groq Llama 3
 * Integrated with Auto-Key Rotation (Primary -> Fallback)
 */
const fetchWithRetry = async (url, options, maxRetries = 3, delay = 1000) => {
  let currentKey = primaryApiKey;
  let usingFallback = false;

  for (let i = 0; i <= maxRetries; i++) {
    try {
      // Inject current key into headers
      const currentOptions = {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${currentKey || FALLBACK_API_KEY}`
        }
      };

      const response = await fetch(url, currentOptions);

      if (response.status === 429) {
        if (!usingFallback && FALLBACK_API_KEY) {
          console.warn("🔄 Primary API Limit Reached. Switching to Fallback Key...");
          currentKey = FALLBACK_API_KEY;
          usingFallback = true;
          i = 0; // Reset retries for the new key
          continue;
        }

        if (i < maxRetries) {
          const actualDelay = delay * (i + 1);
          console.warn(`⚠️ Both keys limited (429). Waiting ${actualDelay}ms... (Attempt ${i + 1}/${maxRetries})`);
          await new Promise(r => setTimeout(r, actualDelay));
          continue;
        }
      }
      return response;
    } catch (err) {
      if (i === maxRetries) throw err;
      await new Promise(r => setTimeout(r, delay));
    }
  }
};

/**
 * Main AI Reasoning - Uses Groq Llama 3
 */
export const chatWithGroq = async (prompt, history = [], companyContext = null, customSystemMessage = null) => {
  if (!primaryApiKey && !FALLBACK_API_KEY) throw new Error('Groq API key not configured');

  try {
    const now = new Date();
    // Use YYYY-MM-DD (Day) for absolute clarity
    const dateStr = now.toISOString().split('T')[0];
    const dayName = now.toLocaleDateString('en-IN', { weekday: 'long' });
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

    const systemMessage = customSystemMessage || `You are Callix, a professional AI calling agent.
    CURRENT DATE: ${dateStr} (${dayName})
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

    const response = await fetchWithRetry(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages,
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Groq Error: ${response.status} - ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices[0]?.message?.content || '';
    // Intent post-processing
    // STAGE 2: If the AI output a [COMMAND], we execute it and get a confirmation
    const commandMatch = assistantMessage.match(/\[(BOOK_APPOINTMENT|BOOK_TABLE|BOOK_ORDER|COLLECT_FEEDBACK|HANG_UP|QUERY_ENTITY_DATABASE).*?\]/i);

    const intent = commandMatch ? detectIntent(assistantMessage, companyContext) : null;

    if (intent) {
      const result = await executeAction(intent);
      const followUpText = assistantMessage.includes('?') ? '' : 'Is there anything else I can help you with?';

      const finalResponse = await fetchWithRetry(GROQ_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            {
              role: 'system',
              content: `ACTION RESULT: ${JSON.stringify(result)}. 
              
              Confirm this result to the user naturally in 1 SHORT, COMPLETE sentence. 
              REQUESTED LANGUAGE: ${companyContext?.currLangName || 'English'}
              
              CRITICAL: You MUST respond ONLY in ${companyContext?.currLangName || 'English'} using its native script.
              DO NOT repeat the user's name or greet them again. 
              Use a natural, human-like conversational tone.
              
              Example (Telugu): "మీ బుకింగ్ విజయవంతంగా పూర్తయింది."
              Example (Hindi): "आपकी बुकिंग सफलतापूर्वक हो गई है।"
              Example (English): "Your booking has been successfully saved."
              
              Always include the follow-up if provided: ${followUpText}`
            }
          ],
          temperature: 0.5,
          max_tokens: 150
        })
      });

      if (finalResponse && finalResponse.ok) {
        const finalData = await finalResponse.json();
        return finalData.choices[0]?.message?.content;
      }

      // If confirmation call failed, fallback to cleaned primary message
      return cleanInternalCommands(assistantMessage);
    }

    return assistantMessage;
  } catch (error) {
    console.error('Groq AI Error:', error);
    throw error;
  }
};

const detectIntent = (message, context) => {
  const msg = message.toUpperCase();
  const entityId = context?._id || context?.id || 'manual';
  const entityName = context?.name || 'General';
  const userEmail = context?.userEmail || '';
  const userName = context?.userName || 'Guest';

  if (message.includes('BOOK_APPOINTMENT')) {
    const match = message.match(/BOOK_APPOINTMENT for (.*?) on (.*?) at ([^\n.\r]*)/i);
    if (match) {
      return {
        name: 'book_appointment',
        args: {
          entityId,
          entityName,
          personName: match[1].trim(),
          date: match[2].trim(),
          time: match[3].trim(),
          userEmail,
          userName
        }
      };
    }
  }

  if (message.includes('BOOK_TABLE')) {
    const match = message.match(/BOOK_TABLE for (.*?) on (.*?) at ([^\n.\r]*)/i);
    if (match) {
      return {
        name: 'book_appointment',
        args: {
          entityId,
          entityName,
          type: 'table',
          personName: `Table for ${match[1].trim()}(${userName})`,
          date: match[2].trim(),
          time: match[3].trim(),
          userEmail,
          userName,
          partySize: match[1].trim()
        }
      };
    }
  }

  if (message.includes('BOOK_ORDER')) {
    const match = message.match(/BOOK_ORDER (.*)/i);
    if (match) {
      return {
        name: 'book_order',
        args: {
          companyId: entityId,
          item: match[1].trim(),
          customerName: userName,
          userEmail
        }
      };
    }
  }

  // Rating / Feedback Detection
  const feedbackTriggers = ['COLLECT_FEEDBACK', 'COLLECT_RATING', 'RATING', 'FEEDBACK', 'STAR'];
  const hasFeedbackMarker = feedbackTriggers.some(t => msg.includes(t));

  // Native number mapping
  const nativeNumbers = {
    'ఒకటి': 1, 'एक': 1, 'ONE': 1,
    'రెండు': 2, 'दो': 2, 'TWO': 2,
    'మూడు': 3, 'तीन': 3, 'THREE': 3,
    'నాలుగు': 4, 'चार': 4, 'FOUR': 4,
    'ఐదు': 5, 'పాంచ్': 5, 'FIVE': 5, 'PAANCH': 5, 'AIDU': 5
  };

  let extractedRating = null;
  const digitMatch = message.match(/[1-5]/);
  if (digitMatch) {
    extractedRating = parseInt(digitMatch[0]);
  } else {
    // Check for native words
    for (const [word, val] of Object.entries(nativeNumbers)) {
      if (message.toUpperCase().includes(word)) { // Convert message to uppercase for case-insensitive matching
        extractedRating = val;
        break;
      }
    }
  }

  if (hasFeedbackMarker || extractedRating) {
    return {
      name: 'collect_feedback',
      args: {
        entityId,
        entityName,
        rating: extractedRating || 5, // Default to 5 if match found but rating unclear
        userEmail,
        userName
      }
    };
  }

  if (msg.includes('QUERY_ENTITY_DATABASE')) return { name: 'query_entity_database', args: { entityId, query: message } };

  return null;
};

const executeAction = async (match) => {
  const { name, args } = match;
  if (tools[name]) return await tools[name](args);
  return { error: 'Unknown action' };
};

export const transcribeAudio = async (audioBlob, languageCode = 'en') => {
  if (!primaryApiKey && !FALLBACK_API_KEY) throw new Error('Groq API key not configured');

  const formData = new FormData();
  formData.append('file', audioBlob, 'audio.webm');
  formData.append('model', 'whisper-large-v3');
  formData.append('language', languageCode.split('-')[0]);

  const response = await fetchWithRetry(GROQ_AUDIO_URL, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) throw new Error('Groq Transcription Error');
  const data = await response.json();
  return data.text;
};
