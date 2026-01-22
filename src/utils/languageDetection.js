// Language detection utilities

export const SUPPORTED_LANGUAGES = {
  ENGLISH: { code: 'en', name: 'English', flag: '🇬🇧' },
  HINDI: { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
  TELUGU: { code: 'te', name: 'Telugu', flag: '🇮🇳' },
  TAMIL: { code: 'ta', name: 'Tamil', flag: '🇮🇳' },
  KANNADA: { code: 'kn', name: 'Kannada', flag: '🇮🇳' },
  MALAYALAM: { code: 'ml', name: 'Malayalam', flag: '🇮🇳' },
  MARATHI: { code: 'mr', name: 'Marathi', flag: '🇮🇳' },
};

// Common words/phrases for each language
const LANGUAGE_KEYWORDS = {
  hi: ['नमस्ते', 'है', 'क्या', 'में', 'के', 'को', 'से', 'हैं', 'था', 'होगा'],
  te: ['నమస్కారం', 'ఉంది', 'ఏమి', 'లో', 'కి', 'నుండి', 'ఉన్నాయి', 'ఇలా', 'అవుతుంది'],
  ta: ['வணக்கம்', 'உள்ளது', 'என்ன', 'இல்', 'கு', 'இருந்து', 'உள்ளன', 'இவ்வாறு', 'ஆகும்'],
  kn: ['ನಮಸ್ಕಾರ', 'ಇದೆ', 'ಏನು', 'ಇಲ್ಲಿ', 'ಗೆ', 'ನಿಂದ', 'ಇವೆ', 'ಇದರಂತೆ', 'ಆಗುತ್ತದೆ'],
  ml: ['നമസ്കാരം', 'ഉണ്ട്', 'എന്ത്', 'ൽ', 'ക്', 'നിന്ന്', 'ഉണ്ട്', 'ഇതുപോലെ', 'ആകും'],
  mr: ['नमस्कार', 'आहे', 'काय', 'मध्ये', 'ला', 'पासून', 'आहेत', 'अशी', 'होईल'],
};

// Simple language detection based on text analysis
export const detectLanguage = (text) => {
  if (!text || text.trim().length === 0) {
    return SUPPORTED_LANGUAGES.ENGLISH;
  }

  const lowerText = text.toLowerCase();
  let scores = {};

  // Check for English (default)
  const englishPattern = /^[a-z\s.,!?;:'"()-]+$/i;
  if (englishPattern.test(text)) {
    scores.en = 1;
  }

  // Check for other languages using Unicode ranges and keywords
  for (const [langCode, keywords] of Object.entries(LANGUAGE_KEYWORDS)) {
    let score = 0;
    // Check for Devanagari script (Hindi, Marathi)
    if ((langCode === 'hi' || langCode === 'mr') && /[\u0900-\u097F]/.test(text)) {
      score += 10;
    }
    // Check for Telugu script
    if (langCode === 'te' && /[\u0C00-\u0C7F]/.test(text)) {
      score += 10;
    }
    // Check for Tamil script
    if (langCode === 'ta' && /[\u0B80-\u0BFF]/.test(text)) {
      score += 10;
    }
    // Check for Kannada script
    if (langCode === 'kn' && /[\u0C80-\u0CFF]/.test(text)) {
      score += 10;
    }
    // Check for Malayalam script
    if (langCode === 'ml' && /[\u0D00-\u0D7F]/.test(text)) {
      score += 10;
    }
    // Check for keywords
    keywords.forEach(keyword => {
      if (lowerText.includes(keyword.toLowerCase())) {
        score += 2;
      }
    });
    scores[langCode] = score;
  }

  // Find language with highest score
  const detectedLang = Object.entries(scores).reduce((a, b) => 
    scores[a[0]] > scores[b[0]] ? a : b
  )[0];

  // Default to English if no strong match
  if (scores[detectedLang] < 2) {
    return SUPPORTED_LANGUAGES.ENGLISH;
  }

  // Map to our supported languages
  const langMap = {
    en: SUPPORTED_LANGUAGES.ENGLISH,
    hi: SUPPORTED_LANGUAGES.HINDI,
    te: SUPPORTED_LANGUAGES.TELUGU,
    ta: SUPPORTED_LANGUAGES.TAMIL,
    kn: SUPPORTED_LANGUAGES.KANNADA,
    ml: SUPPORTED_LANGUAGES.MALAYALAM,
    mr: SUPPORTED_LANGUAGES.MARATHI,
  };

  return langMap[detectedLang] || SUPPORTED_LANGUAGES.ENGLISH;
};

export const getLanguageCode = (language) => {
  return language?.code || 'en';
};