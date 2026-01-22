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
export const chatWithGroq = async (prompt, history = [], companyContext = null) => {
  // Use local AI if Groq API is not available
  if (!apiKey) {
    console.log('Using local AI mode (no API key required)');
    return processWithLocalAI(prompt, history, companyContext);
  }

  try {
    // Build context with company information if available
    let systemMessage = `You are an AI calling agent named Fenrir (male voice) or Zephyr (female voice). 
You are professional, helpful, and efficient. You can answer general questions and perform database operations.

IMPORTANT LANGUAGE PROTOCOL:
1. Always start conversations in English
2. Detect when users switch to: Hindi, Telugu, Tamil, Kannada, Malayalam, or Marathi
3. When a language switch is detected, immediately switch your responses to that language
4. Maintain your professional persona in all languages

CAPABILITIES:
1. Answer general questions on any topic (knowledge, information, advice)
2. Query company/hospital databases for information
3. Check job vacancies and positions
4. Book appointments with doctors, CEOs, executives, etc.
5. Collect feedback from users
6. Check available appointment slots

${companyContext ? `CURRENT ENTITY CONTEXT: ${companyContext.name || 'Unknown'}
Industry: ${companyContext.industry || 'Unknown'}
Context: ${companyContext.contextSummary || companyContext.nlpContext || 'No specific context provided.'}` : ''}

DATABASE OPERATIONS AVAILABLE:
- check_vacancies: Check job vacancies for positions
- book_appointment: Book appointments (doctors, CEOs, executives)
- collect_feedback: Collect user feedback and ratings
- get_available_slots: Check available appointment time slots
- query_entity_database: Query any entity's database information
- get_company_directory: Get list of all companies
- get_company_insights: Get company details
- book_order: Create orders for companies
- trace_order: Check order status

When users ask about:
- Job vacancies → Use check_vacancies
- Booking appointments → Use book_appointment or get_available_slots
- Feedback → Use collect_feedback
- General questions → Answer directly using your knowledge
- Database queries → Use appropriate query function`;

    // Convert history to Groq format
    const messages = [
      { role: 'system', content: systemMessage },
      ...history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.text
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
        model: 'llama-3.3-70b-versatile', // Using Groq's powerful model
        messages: messages,
        temperature: 0.7,
        max_tokens: 150, // Limit to ~2-3 sentences
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices[0]?.message?.content || 'I apologize, but I could not generate a response.';

    // Check if the response indicates a function call need
    const functionMatch = detectFunctionCall(assistantMessage, companyContext);
    if (functionMatch) {
      const result = await executeFunctionCall(functionMatch);
      // Get a follow-up response with the function result
      const followUpMessages = [
        ...messages,
        { role: 'assistant', content: assistantMessage },
        { role: 'system', content: `Function ${functionMatch.name} returned: ${JSON.stringify(result)}. Please provide a natural language response to the user based on this data.` }
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
  const lowerMessage = message.toLowerCase();

  // Check for various function call patterns
  if (lowerMessage.includes('vacancy') || lowerMessage.includes('job opening')) {
    return { name: 'check_vacancies', args: { companyId: companyContext?.id } };
  }
  if (lowerMessage.includes('book') && lowerMessage.includes('appointment')) {
    return { name: 'book_appointment', args: { entityId: companyContext?.id } };
  }
  if (lowerMessage.includes('feedback')) {
    return { name: 'collect_feedback', args: { entityId: companyContext?.id } };
  }
  if (lowerMessage.includes('available slot')) {
    return { name: 'get_available_slots', args: { entityId: companyContext?.id } };
  }
  if (lowerMessage.includes('company directory') || lowerMessage.includes('list of companies')) {
    return { name: 'get_company_directory', args: {} };
  }
  if (lowerMessage.includes('order status') || lowerMessage.includes('trace order')) {
    return { name: 'trace_order', args: {} };
  }

  return null;
};

// Execute function calls
const executeFunctionCall = async (functionMatch) => {
  const { name, args } = functionMatch;

  switch (name) {
    case 'get_company_directory':
      return tools.get_company_directory();
    case 'get_company_insights':
      return tools.get_company_insights(args.companyId);
    case 'book_order':
      return tools.book_order(args);
    case 'trace_order':
      return tools.trace_order(args.orderId);
    case 'check_vacancies':
      return tools.check_vacancies(args);
    case 'book_appointment':
      return tools.book_appointment(args);
    case 'collect_feedback':
      return tools.collect_feedback(args);
    case 'get_available_slots':
      return tools.get_available_slots(args);
    case 'query_entity_database':
      return tools.query_entity_database(args);
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
