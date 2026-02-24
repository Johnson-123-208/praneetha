import { tools } from './database.js';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_AUDIO_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';

// Cleanup utility for internal markers
// Cleanup utility for internal markers
export const cleanInternalCommands = (text) => {
  if (!text) return '';
  return text
    .replace(/^(Callix|Agent|Assistant|System):\s*/i, '')
    // Match commands with or without brackets, and all contents of brackets
    .replace(/\[(BOOK_APPOINTMENT|BOOK_TABLE|BOOK_ORDER|COLLECT_RATING|COLLECT_FEEDBACK|COLLECT_ITEM|HANG_UP|QUERY_ENTITY_DATABASE|TRACE_ORDER).*?\]/gim, '')
    // Match any remaining words in all caps with underscores (commands)
    .replace(/\b(BOOK_APPOINTMENT|BOOK_TABLE|BOOK_ORDER|COLLECT_FEEDBACK|HANG_UP|QUERY_ENTITY_DATABASE)\b/gi, '')
    .replace(/[\[\]]/g, '') // Remove any dangling brackets
    .replace(/\s+/g, ' ')
    .trim();
};

// API Key Management - Dynamically load all keys starting with VITE_GROQ_API_KEY
const API_KEYS = Object.keys(import.meta.env)
  .filter(key => key.includes('GROQ_API_KEY'))
  .sort() // Ensure consistent order
  .map(key => import.meta.env[key])
  .filter(Boolean);

let currentKeyIndex = 0;
let primaryApiKey = null; // Stays for compatibility if initialized from App.jsx

export const initializeGroq = (key) => {
  if (!key) return false;
  primaryApiKey = key;
  // If the key initialized isn't in our list (maybe it's a user-provided key), we can prepend it
  if (!API_KEYS.includes(key)) {
    API_KEYS.unshift(key);
  }
  return true;
};

/**
 * Gets the current active key. If a key is known to be limited, we can skip it.
 */
const getActiveKey = () => {
  if (API_KEYS.length === 0) return primaryApiKey;
  return API_KEYS[currentKeyIndex];
};

/**
 * Rotates to the next available API key
 */
const rotateKey = () => {
  if (API_KEYS.length <= 1) return false;
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
  console.warn(`🔄 Rate limit reached. Switching to API Key #${currentKeyIndex + 1}...`);
  return true;
};

/**
 * Enhanced fetch with intelligent key rotation and retry logic
 */
const fetchWithRetry = async (url, options, maxRetries = 3) => {
  let attempt = 0;

  while (attempt <= maxRetries) {
    const currentKey = getActiveKey();

    try {
      const currentOptions = {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${currentKey}`
        }
      };

      const response = await fetch(url, currentOptions);

      if (response.status === 429) {
        console.warn(`⚠️ API Key #${currentKeyIndex + 1} hit rate limit (429).`);

        // If we have more keys, rotate and try again immediately without counting as a "retry" for the logic
        if (rotateKey()) {
          // Reset retries for the new key if you want, or just continue
          continue;
        }

        // If no more keys to rotate, wait and retry
        const delay = 2000 * (attempt + 1);
        console.warn(`⏳ All keys limited. Retrying in ${delay}ms... (Attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(r => setTimeout(r, delay));
        attempt++;
        continue;
      }

      // Check for other errors
      if (!response.ok) {
        // Some errors shouldn't be retried with rotation (like bad request)
        if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          return response;
        }
      }

      return response;
    } catch (err) {
      console.error(`❌ Request failed:`, err);
      if (attempt === maxRetries) throw err;

      const delay = 1000 * (attempt + 1);
      await new Promise(r => setTimeout(r, delay));
      attempt++;
    }
  }
};

/**
 * Main AI Reasoning - Uses Groq Llama 3
 */
export const chatWithGroq = async (prompt, history = [], companyContext = null, customSystemMessage = null) => {
  if (API_KEYS.length === 0 && !primaryApiKey) throw new Error('No Groq API keys configured. Please check your .env file or add a key in settings.');

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
    6. Speak warmly and naturally. Only output the [COMMAND] on its own line at the VERY END.
    7. CRITICAL: Never include brackets [] or commands like BOOK_APPOINTMENT in the visible part of your response meant for the user.`;

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

      // Clean the original message to remove the bracketed command for the user
      const cleanedMessageForUser = cleanInternalCommands(assistantMessage);

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
        const confirmationText = finalData.choices[0]?.message?.content;

        // If the confirmation text is short or simple, it's perfect. 
        // We prepend the cleaned original message if it contained important conversational context
        return cleanedMessageForUser.length > 5 ? `${cleanedMessageForUser} ${confirmationText}` : confirmationText;
      }

      // If confirmation call failed, fallback to cleaned primary message
      return cleanedMessageForUser;
    }

    // Even for non-intents, always clean internal markers before returning
    return cleanInternalCommands(assistantMessage);
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
      const industry = context?.industry?.toLowerCase() || '';
      let type = 'general';
      if (industry.includes('health') || industry.includes('hosp')) type = 'doctor';
      else if (industry.includes('tech') || industry.includes('it') || industry.includes('business')) type = 'interview';

      return {
        name: 'book_appointment',
        args: {
          entityId,
          entityName,
          type,
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
      const fullText = match[1].trim();
      // Try to extract price if AI included it like "iPhone 15 (₹1,34,900)"
      const priceMatch = fullText.match(/[₹\$]\s?([\d,]+)/);
      const totalPrice = priceMatch ? parseInt(priceMatch[1].replace(/,/g, '')) : 0;
      const item = fullText.replace(/[\(\)\[\]]/g, '').split('₹')[0].split('$')[0].trim();

      return {
        name: 'book_order',
        args: {
          companyId: entityId,
          item,
          totalPrice,
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
  if (API_KEYS.length === 0 && !primaryApiKey) throw new Error('No Groq API keys configured for transcription.');

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
