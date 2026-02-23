// Local AI system that works without API key
// Uses database queries and pattern matching to answer questions

import { database } from './database.js';
import { detectLanguage } from './languageDetection.js';

// Knowledge base patterns for general questions
const KNOWLEDGE_BASE = {
  'what is': {
    'artificial intelligence': 'Artificial Intelligence (AI) is a branch of computer science that aims to create intelligent machines capable of performing tasks that typically require human intelligence, such as learning, reasoning, and problem-solving.',
    'machine learning': 'Machine Learning is a subset of AI that enables systems to learn and improve from experience without being explicitly programmed. It uses algorithms to identify patterns in data.',
    'deep learning': 'Deep Learning is a subset of machine learning that uses neural networks with multiple layers to analyze data and make decisions.',
    'blockchain': 'Blockchain is a distributed ledger technology that maintains a continuously growing list of records (blocks) that are linked and secured using cryptography.',
    'quantum computing': 'Quantum Computing uses quantum mechanical phenomena like superposition and entanglement to perform computations that would be infeasible for classical computers.',
  },
  'how does': {
    'ai work': 'AI works by processing large amounts of data, identifying patterns, and making decisions or predictions based on those patterns using algorithms and models.',
    'machine learning work': 'Machine Learning works by training algorithms on data to identify patterns and make predictions. The system improves its performance over time as it processes more data.',
  },
  'explain': {
    'ai': 'Artificial Intelligence enables computers to perform tasks that typically require human intelligence, such as understanding natural language, recognizing images, and making decisions.',
    'machine learning': 'Machine Learning allows systems to automatically learn and improve from experience without explicit programming by identifying patterns in data.',
  },
};

// Extract information from database based on query
const queryDatabase = async (entityId, question) => {
  const entity = await database.getCompany(entityId);
  if (!entity) return null;

  const lowerQuestion = question.toLowerCase();

  // Check vacancies - we'll just return a general info since we haven't mapped vacancies to supabase yet
  if (lowerQuestion.includes('vacanc') || lowerQuestion.includes('position') || lowerQuestion.includes('job') || lowerQuestion.includes('opening')) {
    return `Please check our official website for the latest job openings at ${entity.name}.`;
  }

  // Check doctors (for hospitals)
  if (lowerQuestion.includes('doctor') || lowerQuestion.includes('physician') || lowerQuestion.includes('specialist')) {
    const doctors = await database.getDoctors(entityId);
    if (doctors.length === 0) {
      return `Currently, we have several doctors at ${entity.name} including specialists in Cardiology and Pediatrics. Would you like to schedule an appointment?`;
    }

    const specialization = extractSpecialization(lowerQuestion);
    const filtered = specialization ? doctors.filter(d =>
      d.specialization?.toLowerCase().includes(specialization) ||
      d.name?.toLowerCase().includes(specialization)
    ) : doctors;

    const list = filtered.map(d => `- ${d.name} (${d.specialization})`).join('\n');
    return `We have ${filtered.length} doctor(s) available:\n${list}`;
  }

  // Check appointments
  if (lowerQuestion.includes('appointment') || lowerQuestion.includes('schedule') || lowerQuestion.includes('booking')) {
    const appointments = await database.getAppointments(entityId);
    const scheduled = appointments.filter(a => a.status === 'scheduled');
    return `${entity.name} has ${scheduled.length} scheduled appointment(s) in our system.`;
  }

  // Entity information
  if (lowerQuestion.includes('about') || lowerQuestion.includes('information') || lowerQuestion.includes('tell me')) {
    return `${entity.name} is a ${entity.industry} company. ${entity.contextSummary || entity.nlpContext || 'More information available in our database.'}`;
  }

  return null;
};

// Extract position from question
const extractPosition = (question) => {
  const positions = ['engineer', 'manager', 'developer', 'specialist', 'executive', 'support', 'marketing', 'sales', 'product'];
  for (const pos of positions) {
    if (question.includes(pos)) return pos;
  }
  return null;
};

// Extract specialization from question
const extractSpecialization = (question) => {
  const specializations = ['cardiology', 'pediatrics', 'dermatology', 'orthopedic', 'gynecology', 'neurology', 'oncology'];
  for (const spec of specializations) {
    if (question.includes(spec)) return spec;
  }
  return null;
};

// Answer general questions using knowledge base
const answerGeneralQuestion = (question) => {
  const lowerQuestion = question.toLowerCase().trim();

  // Search in knowledge base
  for (const [prefix, topics] of Object.entries(KNOWLEDGE_BASE)) {
    if (lowerQuestion.startsWith(prefix)) {
      for (const [topic, answer] of Object.entries(topics)) {
        if (lowerQuestion.includes(topic)) {
          return answer;
        }
      }
    }
  }

  // Pattern-based answers
  if (lowerQuestion.includes('hello') || lowerQuestion.includes('hi') || lowerQuestion.includes('namaste')) {
    return 'Hello! I\'m your AI calling agent. How can I assist you today?';
  }

  if (lowerQuestion.includes('how are you')) {
    return 'I\'m doing great, thank you for asking! How can I help you today?';
  }

  if (lowerQuestion.includes('what can you do') || lowerQuestion.includes('what do you do')) {
    return 'I can help you with:\n- Answering general questions\n- Checking job vacancies\n- Booking appointments\n- Collecting feedback\n- Querying company/hospital databases\n- Providing information about various topics';
  }

  if (lowerQuestion.includes('thank')) {
    return 'You\'re welcome! Is there anything else I can help you with?';
  }

  // Default response for unknown questions
  return 'I understand your question. Let me check the database for more specific information, or please provide more details about what you need.';
};

// Main function to process questions
export const processQuestionLocally = async (question, entityId = null, conversationHistory = []) => {
  // First, try to answer from entity database if entityId is provided
  if (entityId) {
    const dbAnswer = await queryDatabase(entityId, question);
    if (dbAnswer) {
      return dbAnswer;
    }
  }

  // Try general knowledge base
  const generalAnswer = answerGeneralQuestion(question);
  if (generalAnswer && !generalAnswer.includes('check the database')) {
    return generalAnswer;
  }

  // Fallback: use entity context if available
  if (entityId) {
    const entity = await database.getCompany(entityId);
    if (entity) {
      const context = entity.contextSummary || entity.nlpContext || '';
      if (context) {
        return `Based on ${entity.name}'s information: ${context}. Could you please provide more specific details about your question?`;
      }
    }
  }

  // Final fallback
  return 'I\'m here to help! Could you please rephrase your question or provide more details? I can help with:\n- General questions\n- Checking vacancies\n- Booking appointments\n- Company/hospital information\n- And much more!';
};

// Check if action is requested
export const detectAction = (question) => {
  const lowerQuestion = question.toLowerCase();

  // Booking actions
  if (lowerQuestion.includes('book') || lowerQuestion.includes('schedule') || lowerQuestion.includes('appointment')) {
    return 'book_appointment';
  }

  // Vacancy checking
  if (lowerQuestion.includes('vacanc') || lowerQuestion.includes('position') || lowerQuestion.includes('job')) {
    return 'check_vacancies';
  }

  // Feedback
  if (lowerQuestion.includes('feedback') || lowerQuestion.includes('rating') || lowerQuestion.includes('review')) {
    return 'collect_feedback';
  }

  // Query
  if (lowerQuestion.includes('check') || lowerQuestion.includes('show') || lowerQuestion.includes('list') || lowerQuestion.includes('tell me')) {
    return 'query';
  }

  return 'question';
};

// Extract appointment details from question
export const extractAppointmentDetails = (question) => {
  const lowerQuestion = question.toLowerCase();

  // Extract date
  const datePatterns = [
    /(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
    /(\d{1,2}(?:st|nd|rd|th)?\s+(?:january|february|march|april|may|june|july|august|september|october|november|december))/i,
    /((?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2})/i,
    /(\d{4}-\d{2}-\d{2})/,
    /(\d{1,2}\/\d{1,2}\/\d{4})/,
  ];

  let date = null;
  for (const pattern of datePatterns) {
    const match = question.match(pattern);
    if (match) {
      const matchLower = match[0].toLowerCase();
      if (matchLower === 'today' || matchLower === 'tonight') {
        date = new Date().toISOString().split('T')[0];
      } else if (matchLower === 'tomorrow') {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        date = tomorrow.toISOString().split('T')[0];
      } else if (['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].includes(matchLower)) {
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const targetDay = days.indexOf(matchLower);
        const today = new Date();
        const currentDay = today.getDay();
        let diff = targetDay - currentDay;
        if (diff <= 0) diff += 7; // Next occurrence of that day
        today.setDate(today.getDate() + diff);
        date = today.toISOString().split('T')[0];
      } else {
        date = match[0];
      }
      break;
    }
  }

  // Extract time
  const timePattern = /(\d{1,2}):?(\d{2})?\s*(am|pm|AM|PM)?/i;
  const timeMatch = question.match(timePattern);
  let time = null;
  if (timeMatch) {
    let hours = parseInt(timeMatch[1]);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
    const period = timeMatch[3]?.toLowerCase();

    if (period === 'pm' && hours !== 12) hours += 12;
    if (period === 'am' && hours === 12) hours = 0;

    time = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  // Extract person type
  let type = 'general';
  if (lowerQuestion.includes('doctor') || lowerQuestion.includes('dr.')) {
    type = 'doctor';
  } else if (lowerQuestion.includes('ceo')) {
    type = 'ceo';
  } else if (lowerQuestion.includes('executive')) {
    type = 'executive';
  }

  // Extract person name
  let personName = null;
  const namePattern = /(?:dr\.|doctor|with)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i;
  const nameMatch = question.match(namePattern);
  if (nameMatch) {
    personName = nameMatch[1];
  }

  // Extract people count (for table bookings)
  let peopleCount = null;
  const countPattern = /(\d+)\s*(?:people|members|guests|persons|covers)/i;
  const countMatch = question.match(countPattern);
  if (countMatch) {
    peopleCount = parseInt(countMatch[1]);
  }

  return { date, time, type, personName, peopleCount };
};

// Extract feedback details
export const extractFeedbackDetails = (question) => {
  const lowerQuestion = question.toLowerCase();

  // Extract rating (look for standalone numbers 1-5 or explicit star ratings)
  const ratingMatch = lowerQuestion.match(/([1-5])\s*(?:star|rating|points|out of 5)?/i) ||
    lowerQuestion.match(/(?:rating|rate|star|score)\s*([1-5])/i);

  const rating = ratingMatch ? parseInt(ratingMatch[1]) : 5; // Default to 5 if ambiguous but context is feedback

  // Extract comment (everything else)
  let comment = question.replace(/(?:rating|rate|star|score)\s*[1-5]/i, '')
    .replace(/[1-5]\s*(?:star|rating|points|out of 5)/i, '')
    .trim();

  if (!comment || comment.length < 2) {
    comment = "Excellent service!"; // Default comment if user only gave a number
  }

  return { rating, comment };
};

export { queryDatabase, answerGeneralQuestion };