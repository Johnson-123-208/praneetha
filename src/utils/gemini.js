import { GoogleGenerativeAI } from '@google/generative-ai';
import { tools } from './database.js';
import { processQuestionLocally, detectAction, extractAppointmentDetails, extractFeedbackDetails } from './localAI.js';

let genAI = null;
let model = null;

export const initializeGemini = (apiKey) => {
  if (!apiKey) {
    console.warn('Gemini API key not provided');
    return false;
  }

  try {
    genAI = new GoogleGenerativeAI(apiKey);
    // Note: Gemini Live API model name as specified
    model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash-native-audio-preview-09-2025',
    });
    return true;
  } catch (error) {
    console.error('Failed to initialize Gemini:', error);
    return false;
  }
};

// For text-based interactions (fallback when audio API is not directly available)
export const chatWithGemini = async (prompt, history = [], companyContext = null) => {
  // Use local AI if Gemini API is not available
  if (!model) {
    console.log('Using local AI mode (no API key required)');
    return processWithLocalAI(prompt, history, companyContext);
  }

  try {
    // Build context with company information if available
    let systemInstruction = `You are an AI calling agent named Fenrir (male voice) or Zephyr (female voice). 
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

    const chat = model.startChat({
      history: history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }],
      })),
      systemInstruction,
      tools: [
        {
          functionDeclarations: [
            {
              name: 'get_company_directory',
              description: 'Get the list of all companies in the portfolio',
              parameters: {
                type: 'OBJECT',
                properties: {},
              },
            },
            {
              name: 'get_company_insights',
              description: 'Get detailed context and information about a specific company',
              parameters: {
                type: 'OBJECT',
                properties: {
                  companyId: {
                    type: 'STRING',
                    description: 'The ID of the company',
                  },
                },
                required: ['companyId'],
              },
            },
            {
              name: 'book_order',
              description: 'Book a new order for a company',
              parameters: {
                type: 'OBJECT',
                properties: {
                  companyId: {
                    type: 'STRING',
                    description: 'The ID of the company',
                  },
                  item: {
                    type: 'STRING',
                    description: 'The item name or description',
                  },
                  quantity: {
                    type: 'INTEGER',
                    description: 'The quantity of items',
                  },
                },
                required: ['companyId'],
              },
            },
            {
              name: 'trace_order',
              description: 'Check the status of an order by its ID',
              parameters: {
                type: 'OBJECT',
                properties: {
                  orderId: {
                    type: 'STRING',
                    description: 'The 6-character order ID',
                  },
                },
                required: ['orderId'],
              },
            },
            {
              name: 'check_vacancies',
              description: 'Check job vacancies for a specific position in a company',
              parameters: {
                type: 'OBJECT',
                properties: {
                  companyId: {
                    type: 'STRING',
                    description: 'The ID of the company',
                  },
                  position: {
                    type: 'STRING',
                    description: 'The position or job title to search for (optional)',
                  },
                },
                required: ['companyId'],
              },
            },
            {
              name: 'book_appointment',
              description: 'Book an appointment with a doctor, CEO, executive, or any other person',
              parameters: {
                type: 'OBJECT',
                properties: {
                  entityId: {
                    type: 'STRING',
                    description: 'The ID of the company or hospital',
                  },
                  type: {
                    type: 'STRING',
                    description: 'Type of appointment: doctor, ceo, executive, general, etc.',
                  },
                  personName: {
                    type: 'STRING',
                    description: 'Name of the person (doctor name, CEO, etc.)',
                  },
                  date: {
                    type: 'STRING',
                    description: 'Date in YYYY-MM-DD format',
                  },
                  time: {
                    type: 'STRING',
                    description: 'Time in HH:MM format (e.g., 10:00, 14:30)',
                  },
                  userInfo: {
                    type: 'OBJECT',
                    description: 'User information (name, phone, email)',
                  },
                },
                required: ['entityId', 'type', 'date', 'time'],
              },
            },
            {
              name: 'collect_feedback',
              description: 'Collect feedback from users with rating and comments',
              parameters: {
                type: 'OBJECT',
                properties: {
                  entityId: {
                    type: 'STRING',
                    description: 'The ID of the company or hospital',
                  },
                  rating: {
                    type: 'INTEGER',
                    description: 'Rating from 1 to 5',
                  },
                  comment: {
                    type: 'STRING',
                    description: 'Feedback comment or text',
                  },
                  category: {
                    type: 'STRING',
                    description: 'Category: service, product, appointment, general, etc.',
                  },
                },
                required: ['entityId'],
              },
            },
            {
              name: 'get_available_slots',
              description: 'Get available appointment time slots for a specific date',
              parameters: {
                type: 'OBJECT',
                properties: {
                  entityId: {
                    type: 'STRING',
                    description: 'The ID of the company or hospital',
                  },
                  date: {
                    type: 'STRING',
                    description: 'Date in YYYY-MM-DD format (optional, defaults to today)',
                  },
                  type: {
                    type: 'STRING',
                    description: 'Type of appointment (optional)',
                  },
                },
                required: ['entityId'],
              },
            },
            {
              name: 'query_entity_database',
              description: 'Query any entity database for general information',
              parameters: {
                type: 'OBJECT',
                properties: {
                  entityId: {
                    type: 'STRING',
                    description: 'The ID of the company or hospital',
                  },
                  query: {
                    type: 'STRING',
                    description: 'Query type: vacancies, appointments, doctors, feedback, info',
                  },
                },
                required: ['entityId'],
              },
            },
          ],
        },
      ],
    });

    const result = await chat.sendMessage(prompt);
    const response = await result.response;

    // Handle function calls
    if (response.functionCalls && response.functionCalls.length > 0) {
      const functionResults = [];
      
      for (const funcCall of response.functionCalls) {
        const { name, args } = funcCall;
        let result;

        // Get companyId from entityId if needed (for compatibility)
        if (!args.companyId && args.entityId) {
          args.companyId = args.entityId;
        }
        if (!args.entityId && args.companyId) {
          args.entityId = args.companyId;
        }

        // Use current company context if entityId/companyId not provided
        if (!args.entityId && !args.companyId && companyContext?.id) {
          args.entityId = companyContext.id;
          args.companyId = companyContext.id;
        }

        switch (name) {
          case 'get_company_directory':
            result = tools.get_company_directory();
            break;
          case 'get_company_insights':
            result = tools.get_company_insights(args.companyId);
            break;
          case 'book_order':
            result = tools.book_order(args);
            break;
          case 'trace_order':
            result = tools.trace_order(args.orderId);
            break;
          case 'check_vacancies':
            result = tools.check_vacancies(args);
            break;
          case 'book_appointment':
            result = tools.book_appointment(args);
            break;
          case 'collect_feedback':
            result = tools.collect_feedback(args);
            break;
          case 'get_available_slots':
            result = tools.get_available_slots(args);
            break;
          case 'query_entity_database':
            result = tools.query_entity_database(args);
            break;
          default:
            result = { error: `Unknown function: ${name}` };
        }

        functionResults.push({
          functionResponse: {
            name,
            response: result,
          },
        });
      }

      // Send function results back to model
      const followUp = await chat.sendMessage(functionResults);
      const followUpResponse = await followUp.response;
      return followUpResponse.text();
    }

    return response.text();
  } catch (error) {
    console.error('Error chatting with Gemini:', error);
    throw error;
  }
};

// Check if Gemini is initialized
export const isGeminiInitialized = () => {
  return model !== null;
};

// Get the model instance (for direct use if needed)
export const getGeminiModel = () => {
  return model;
};