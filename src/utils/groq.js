import { tools } from './database.js';
import { processQuestionLocally, detectAction, extractAppointmentDetails, extractFeedbackDetails } from './localAI.js';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
let apiKey = null;

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
        max_tokens: 300,
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
        { role: 'assistant', content: assistantMessage },
        { role: 'system', content: `Function ${functionMatch.name} returned: ${JSON.stringify(result)}. Provide a response.` }
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
          max_tokens: 1024,
        }),
      });

      const followUpData = await followUpResponse.json();
      return followUpData.choices[0]?.message?.content || assistantMessage;
    }

    return assistantMessage;
  } catch (error) {
    console.error('Error chatting with Groq:', error);
    throw error;
  }
};

// Detect if a function call is needed based on the response
const detectFunctionCall = (message, companyContext) => {
  const upperMessage = message.toUpperCase();

  // ONLY trigger on explicit Uppercase Command Keywords to avoid false positives

  if (upperMessage.includes('BOOK_APPOINTMENT')) {
    const details = extractAppointmentDetails(message);
    return {
      name: 'book_appointment',
      args: {
        entityId: companyContext?.id,
        type: 'doctor',
        personName: details.personName || 'Arjun',
        date: details.date || new Date().toISOString().split('T')[0],
        time: details.time || '10:00',
        userEmail: companyContext?.userEmail,
        userName: companyContext?.userName,
        userInfo: { name: companyContext?.userName || 'Customer' }
      }
    };
  }

  if (upperMessage.includes('BOOK_ORDER')) {
    return {
      name: 'book_order',
      args: {
        companyId: companyContext?.id,
        item: 'Product',
        quantity: 1,
        userEmail: companyContext?.userEmail
      }
    };
  }

  if (upperMessage.includes('COLLECT_FEEDBACK') || upperMessage.includes('COLLECT_RATING')) {
    const details = extractFeedbackDetails(message);
    return {
      name: 'collect_feedback',
      args: {
        entityId: companyContext?.id,
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
