import { tools } from './database.js';
import { processQuestionLocally, detectAction, extractAppointmentDetails, extractFeedbackDetails } from './localAI.js';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_AUDIO_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';

// Cleanup utility for internal markers (Exposed for UI & Internal use)
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

/**
 * Transcribes audio blob using Groq Whisper Large v3
 */
export const transcribeAudio = async (audioBlob, languageCode = 'en') => {
  if (!apiKey) throw new Error('Groq API key not configured');

  try {
    const formData = new FormData();
    // Groq expects a file with an extension, 'audio.webm' is common for MediaRecorder
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'whisper-large-v3');

    // Convert 'te-IN' to 'te', 'hi-IN' to 'hi'
    const lang = languageCode.split('-')[0];
    formData.append('language', lang);
    formData.append('task', 'transcribe');
    formData.append('response_format', 'verbose_json');

    const response = await fetch(GROQ_AUDIO_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || 'Transcription failed');
    }

    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error('Transcription Error:', error);
    throw error;
  }
};

export const initializeGroq = (key) => {
  if (!key) {
    console.warn('Groq API key not provided');
    return false;
  }

  try {
    apiKey = key;
    return true;
  } catch (error) {
    console.error('Failed to initialize Groq:', error);
    return false;
  }
};

// For text-based interactions with Groq
export const chatWithGroq = async (prompt, history = [], companyContext = null, customSystemMessage = null) => {
  // Use local AI if Groq API is not available
  if (!apiKey) {
    console.log('Using local AI mode (no API key required)');
    return await processWithLocalAI(prompt, history, companyContext);
  }

  try {
    // Build context with company information if available
    let systemMessage = customSystemMessage || `You are an AI calling agent.
    ${companyContext ? `CURRENT ENTITY CONTEXT: ${companyContext.name}
    Industry: ${companyContext.industry}
    Context: ${companyContext.nlpContext}` : ''}`;

    // Convert history to Groq format
    const messages = [
      { role: 'system', content: systemMessage },
      ...history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.text || msg.content || ''
      })),
      { role: 'user', content: prompt }
    ];

    // Make API call to Groq
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Groq API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices[0]?.message?.content || 'I apologize, but I could not generate a response.';

    // Check if the response indicates a function call need
    const functionMatch = detectFunctionCall(assistantMessage, companyContext);


    if (functionMatch) {
      const result = await executeFunctionCall(functionMatch);
      const followUpMessages = [
        ...messages,
        { role: 'assistant', content: cleanInternalCommands(assistantMessage) },
        {
          role: 'system', content: `ACTION SUCCESSFUL. Result: ${JSON.stringify(result)}. 
        Tell the user that the action (booking/order/rating) is confirmed. 
        DO NOT repeat the internal commands (BOOK_APPOINTMENT, etc.) or mention tool names. 
        Speak like a helpful human assistant. Mention specific details if available.` }
      ];

      const followUpResponse = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: followUpMessages,
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!followUpResponse.ok) {
        console.warn('⚠️ Groq follow-up failed (possibly rate limited). Using first response.');
        return cleanInternalCommands(assistantMessage);
      }

      const followUpData = await followUpResponse.json();
      return followUpData.choices?.[0]?.message?.content || cleanInternalCommands(assistantMessage);
    }

    return assistantMessage;
  } catch (error) {
    console.error('Error chatting with Groq:', error);
    throw error;
  }
};

// Detect if a function call is needed based on the response
const detectFunctionCall = (message, companyContext) => {
  // Normalize message to handle variants like [BOOK_APPOINTMENT]
  const normalizedMessage = message.replace(/\[(BOOK_APPOINTMENT|BOOK_TABLE|BOOK_ORDER|COLLECT_RATING|COLLECT_FEEDBACK|HANG_UP)\]/gi, '$1');
  const upperMessage = normalizedMessage.toUpperCase();

  // ONLY trigger on explicit Command Keywords or clear intent

  if (upperMessage.includes('BOOK_APPOINTMENT')) {
    const details = extractAppointmentDetails(message);
    const isHospital = companyContext?.industry?.toLowerCase().includes('health') ||
      companyContext?.name?.toLowerCase().includes('hospital');

    // Explicitly detect if it's an interview based on the command text
    let appType = isHospital ? 'doctor' : 'demo';
    if (upperMessage.includes('INTERVIEW')) appType = 'interview';

    return {
      name: 'book_appointment',
      args: {
        entityId: companyContext?.id,
        entityName: companyContext?.name,
        type: appType,
        personName: details.personName || (isHospital ? 'Medical Staff' : (appType === 'interview' ? 'Candidate' : 'Callix Professional')),
        date: details.date || new Date().toISOString().split('T')[0],
        time: details.time || '10:00',
        userEmail: companyContext?.userEmail,
        userName: companyContext?.userName,
        userInfo: { ...details, specialization: appType === 'interview' ? 'Interview' : (isHospital ? 'Consultation' : 'Business') }
      }
    };
  }

  if (upperMessage.includes('BOOK_ORDER')) {
    const itemMatch = message.match(/BOOK_ORDER\s+([a-zA-Z0-9\s]+)/i);
    const itemName = itemMatch ? itemMatch[1].trim() : 'Premium Product';
    // Generate a semi-realistic price based on item name keywords
    let price = 49.99;
    if (itemName.toLowerCase().includes('phone')) price = 699.00;
    else if (itemName.toLowerCase().includes('laptop')) price = 1299.00;
    else if (itemName.toLowerCase().includes('watch')) price = 199.00;
    else if (itemName.toLowerCase().includes('pizza') || itemName.toLowerCase().includes('food')) price = 15.00;

    return {
      name: 'book_order',
      args: {
        companyId: companyContext?.id,
        item: itemName,
        quantity: 1,
        totalPrice: price,
        currency: 'USD',
        userEmail: companyContext?.userEmail,
        customerName: companyContext?.userName || 'Customer'
      }
    };
  }

  // Robust Feedback detection - either keyword or message containing a rating if we expect one
  const feedbackMatch = upperMessage.includes('COLLECT_FEEDBACK') ||
    upperMessage.includes('COLLECT_RATING') ||
    (upperMessage.includes('RATING') && /\b[1-5]\b/.test(upperMessage));

  if (feedbackMatch) {
    const details = extractFeedbackDetails(message);
    return {
      name: 'collect_feedback',
      args: {
        entityId: companyContext?.id,
        entityName: companyContext?.name,
        rating: details.rating || 5,
        comment: details.comment || message,
        category: 'performance',
        userEmail: companyContext?.userEmail
      }
    };
  }

  if (upperMessage.includes('BOOK_TABLE')) {
    const details = extractAppointmentDetails(message);
    return {
      name: 'book_appointment',
      args: {
        entityId: companyContext?.id,
        entityName: companyContext?.name,
        type: 'table',
        date: details.date || new Date().toISOString().split('T')[0],
        time: details.time || '19:00',
        personName: companyContext?.userName || 'Customer',
        userEmail: companyContext?.userEmail,
        userInfo: {
          peopleCount: details.peopleCount || 2,
          notes: message
        }
      }
    };
  }

  if (upperMessage.includes('TRACE_ORDER')) {
    return { name: 'trace_order', args: { userEmail: companyContext?.userEmail } };
  }

  return null;
};

// Execute function calls
const executeFunctionCall = async (functionMatch) => {
  const { name, args } = functionMatch;

  switch (name) {
    case 'get_company_directory':
      return await tools.get_company_directory();
    case 'get_company_insights':
      return await tools.get_company_insights(args.companyId);
    case 'book_order':
      return await tools.book_order(args);
    case 'trace_order':
      return await tools.trace_order(args.orderId ?? args);
    case 'check_vacancies':
      return await tools.check_vacancies(args);
    case 'book_appointment':
      return await tools.book_appointment(args);
    case 'collect_feedback':
      return await tools.collect_feedback(args);
    case 'get_available_slots':
      return await tools.get_available_slots(args);
    case 'query_entity_database':
      return await tools.query_entity_database(args);
    default:
      return { error: `Unknown function: ${name}` };
  }
};

// Process with local AI (fallback)
const processWithLocalAI = async (prompt, history, companyContext) => {
  try {
    const action = detectAction(prompt);

    if (action === 'appointment') {
      const details = extractAppointmentDetails(prompt);
      if (details.date && details.time) {
        return `I understand you'd like to book an appointment on ${details.date} at ${details.time}. However, I need an API key to process this request. Please configure your Groq API key.`;
      }
    }

    if (action === 'feedback') {
      const details = extractFeedbackDetails(prompt);
      return `Thank you for your feedback! I've noted your ${details.rating}-star rating. However, I need an API key to save this. Please configure your Groq API key.`;
    }

    return processQuestionLocally(prompt);
  } catch (error) {
    console.error('Local AI processing error:', error);
    return "I'm having trouble processing your request. Please try again.";
  }
};

// Check if Groq is initialized
export const isGroqInitialized = () => {
  return apiKey !== null;
};

// Get the API key (for debugging)
export const getGroqApiKey = () => {
  return apiKey ? '***configured***' : null;
};
