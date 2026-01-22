import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, MicOff, Phone, PhoneOff, Globe, User, MessageSquare } from 'lucide-react';
import { chatWithGroq } from '../utils/groq';
import { detectLanguage } from '../utils/languageDetection';
import { crmIntegration } from '../utils/crmIntegration';
import { ttsService } from '../utils/ttsService';
import { HospitalPrompt, RestaurantPrompt, ECommercePrompt, DefaultPrompt } from '../prompts/agentPrompts';

const VoiceOverlay = ({ isOpen, onClose, selectedCompany, user }) => {
  const [callState, setCallState] = useState('idle'); // idle, ringing, connected, ended
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [messages, setMessages] = useState([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Advanced conversation state
  const [convoPhase, setConvoPhase] = useState('intro'); // intro, name_collected, chatting
  const [userName, setUserName] = useState(user?.user_metadata?.full_name || '');
  const [sessionId] = useState(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [selectedLanguage, setSelectedLanguage] = useState({ code: 'en-IN', name: 'English' });

  const recognitionRef = useRef(null);
  const synthesisRef = useRef(null);
  const ringingAudioRef = useRef(null);
  const chatEndRef = useRef(null);

  const languageLookup = {
    'en-US': 'English',
    'en-IN': 'English',
    'hi-IN': 'Hindi',
    'te-IN': 'Telugu',
    'ta-IN': 'Tamil',
    'kn-IN': 'Kannada',
    'mr-IN': 'Marathi',
    'ml-IN': 'Malayalam'
  };

  // Refs for state to avoid stale closures in event listeners
  const stateRef = useRef({
    callState,
    isListening,
    isSpeaking,
    isMuted,
    isOpen,
    convoPhase,
    userName,
    selectedLanguage
  });

  // Sync refs with state
  useEffect(() => {
    stateRef.current = {
      callState,
      isListening,
      isSpeaking,
      isMuted,
      isOpen,
      convoPhase,
      userName,
      selectedLanguage
    };
  }, [callState, isListening, isSpeaking, isMuted, isOpen, convoPhase, userName, selectedLanguage]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, transcript]);

  // Determine agent gender and avatar based on company
  const agentGender = selectedCompany?.industry === 'Healthcare' ||
    selectedCompany?.name?.toLowerCase().includes('apollo') ||
    selectedCompany?.name?.toLowerCase().includes('hospital')
    ? 'female' : 'male';
  const agentAvatar = agentGender === 'female' ? '/Female.png' : '/Male.png';

  // Speech Recognition Initialization
  const initRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = selectedLanguage.code;

      recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript) {
          handleUserMessage(finalTranscript);
        } else {
          setTranscript(interimTranscript);
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          alert('Microphone access is required for the AI call.');
        }
      };

      recognition.onend = () => {
        // Automatically restart if not speaking and not muted
        const { callState: curCallState, isSpeaking: curIsSpeaking, isMuted: curIsMuted, isOpen: curIsOpen } = stateRef.current;
        if (curCallState === 'connected' && !curIsSpeaking && !curIsMuted && curIsOpen) {
          try {
            recognition.start();
            setIsListening(true);
          } catch (e) {
            console.log('Recognition restart failed or already running');
          }
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current = recognition;
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    initRecognition();

    // Play ringing sound
    setCallState('ringing');
    ringingAudioRef.current = new Audio('/ringtone-027-376908.mp3');
    ringingAudioRef.current.loop = true;
    ringingAudioRef.current.play().catch(e => console.log('Audio play failed:', e));

    // Don't auto-connect - wait for user to select language and click continue

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (ringingAudioRef.current) {
        ringingAudioRef.current.pause();
      }
      window.speechSynthesis.cancel();
    };
  }, [isOpen]);

  // Dynamic Language Change Handler - Restart Recognition with New Language
  useEffect(() => {
    if (!isOpen || callState !== 'connected') return;

    console.log(`🌐 Language changed to: ${selectedLanguage.name} (${selectedLanguage.code})`);

    // Stop current recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        setIsListening(false);
      } catch (e) {
        console.log('Recognition stop failed:', e);
      }
    }

    // Reinitialize with new language
    initRecognition();

    // Restart recognition if not speaking and not muted
    setTimeout(() => {
      const { isSpeaking: curIsSpeaking, isMuted: curIsMuted } = stateRef.current;
      if (!curIsSpeaking && !curIsMuted && recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsListening(true);
          console.log(`✅ Recognition restarted in ${selectedLanguage.name}`);
        } catch (e) {
          console.log('Recognition restart failed:', e);
        }
      }
    }, 500);
  }, [selectedLanguage.code]);

  const getServiceInfo = (langCode = 'en-IN') => {
    const name = selectedCompany?.name || 'Aarogya';
    const sMap = {
      'en-US': {
        hospital: "I can help with doctor availability, booking appointments (Consultations, Follow-ups, Checkups), or department info.",
        restaurant: "I can help with menu prices, veg/non-veg options, and table bookings.",
        ecommerce: "I can track orders, check stock, or manage refunds and support.",
        default: "I'm here to assist with your queries today."
      },
      'en-IN': {
        hospital: "I can help with doctor availability, booking appointments (Consultations, Follow-ups, Checkups), or department info.",
        restaurant: "I can help with menu prices, veg/non-veg options, and table bookings.",
        ecommerce: "I can track orders, check stock, or manage refunds and support.",
        default: "I'm here to assist with your queries today."
      },
      'te-IN': {
        hospital: "నేను డాక్టర్ల లభ్యత, అపాయింట్‌మెంట్ బుకింగ్ (సంప్రదింపులు, అనుసరణలు) మరియు విభాగ సమాచారంలో సహాయపడగలను.",
        restaurant: "నేను మెనూ ధరలు మరియు టేబుల్ బుకింగ్‌లలో సహాయపడతాను.",
        ecommerce: "నేను ఆర్డర్‌లను ట్రాక్ చేయగలను మరియు ఫిర్యాదులను పరిష్కరించగలను.",
        default: "నేను ఈరోజు మీ ప్రశ్నలకు సహాయం చేయడానికి ఇక్కడ ఉన్నాను."
      },
      'hi-IN': {
        hospital: "मैं डॉक्टरों की उपलब्धता, अपॉइंटमेंट बुकिंग (परामर्श, अनुवर्ती) और विभाग की जानकारी में मदद कर सकता हूँ।",
        restaurant: "मैं मेनू कीमतों और टेबल बुकिंग में आपकी सहायता कर सकता हूँ।",
        ecommerce: "मैं ऑर्डर ट्रैक कर सकता हूँ और रिफंड में मदद कर सकता हूँ।",
        default: "मैं आज आपके सवालों के लिए यहाँ हूँ।"
      },
      'ta-IN': {
        hospital: "நான் மருத்துவர் கிடைக்கும் தன்மை, சந்திப்பு முன்பதிவு மற்றும் துறை தகவல்களில் உதவ முடியும்.",
        restaurant: "நான் மெனு விலைகள் மற்றும் மேசை முன்பதிவுகளில் உதவ முடியும்.",
        ecommerce: "நான் ஆர்டர்களை கண்காணிக்கவும், பங்கு சரிபார்க்கவும் உதவ முடியும்.",
        default: "இன்று உங்கள் கேள்விகளுக்கு உதவ நான் இங்கே இருக்கிறேன்."
      },
      'kn-IN': {
        hospital: "ನಾನು ವೈದ್ಯರ ಲಭ್ಯತೆ, ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಬುಕಿಂಗ್ ಮತ್ತು ವಿಭಾಗ ಮಾಹಿತಿಯಲ್ಲಿ ಸಹಾಯ ಮಾಡಬಲ್ಲೆ.",
        restaurant: "ನಾನು ಮೆನು ಬೆಲೆಗಳು ಮತ್ತು ಟೇಬಲ್ ಬುಕಿಂಗ್‌ಗಳಲ್ಲಿ ಸಹಾಯ ಮಾಡಬಲ್ಲೆ.",
        ecommerce: "ನಾನು ಆರ್ಡರ್‌ಗಳನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಬಲ್ಲೆ ಮತ್ತು ಬೆಂಬಲದಲ್ಲಿ ಸಹಾಯ ಮಾಡಬಲ್ಲೆ.",
        default: "ಇಂದು ನಿಮ್ಮ ಪ್ರಶ್ನೆಗಳಿಗೆ ಸಹಾಯ ಮಾಡಲು ನಾನು ಇಲ್ಲಿದ್ದೇನೆ."
      },
      'mr-IN': {
        hospital: "मी डॉक्टरांची उपलब्धता, अपॉइंटमेंट बुकिंग आणि विभाग माहितीमध्ये मदत करू शकतो.",
        restaurant: "मी मेनू किंमती आणि टेबल बुकिंगमध्ये मदत करू शकतो.",
        ecommerce: "मी ऑर्डर ट्रॅक करू शकतो आणि समर्थनामध्ये मदत करू शकतो.",
        default: "आज तुमच्या प्रश्नांसाठी मदत करण्यासाठी मी येथे आहे."
      },
      'ml-IN': {
        hospital: "ഞാൻ ഡോക്ടർ ലഭ്യത, അപ്പോയിന്റ്മെന്റ് ബുക്കിംഗ്, വകുപ്പ് വിവരങ്ങളിൽ സഹായിക്കാം.",
        restaurant: "ഞാൻ മെനു വിലകളിലും ടേബിൾ ബുക്കിംഗുകളിലും സഹായിക്കാം.",
        ecommerce: "ഞാൻ ഓർഡറുകൾ ട്രാക്ക് ചെയ്യാനും പിന്തുണയിൽ സഹായിക്കാനും കഴിയും.",
        default: "ഇന്ന് നിങ്ങളുടെ ചോദ്യങ്ങൾക്ക് സഹായിക്കാൻ ഞാൻ ഇവിടെയുണ്ട്."
      }
    };

    const strings = sMap[langCode] || sMap['en-IN'];
    const compKey = name.toLowerCase().includes('hospital') || name.toLowerCase().includes('aarogya') ? 'hospital' :
      name.toLowerCase().includes('restaurant') || name.toLowerCase().includes('garden') ? 'restaurant' :
        name.toLowerCase().includes('kart') || name.toLowerCase().includes('commerce') ? 'ecommerce' : 'default';

    return strings[compKey];
  };

  const handleUserMessage = async (message) => {
    if (!message.trim() || stateRef.current.isSpeaking || isProcessing) return;

    setIsProcessing(true);
    try {
      addMessage('user', message);
      setIsListening(false);
      setTranscript('');

      // Prevent Loop: If message is too similar to last agent message, ignore (echo protection)
      const lastAgentMsg = messages.filter(m => m.sender === 'agent').pop();
      if (lastAgentMsg) {
        const similarity = (s1, s2) => {
          const longer = s1.length > s2.length ? s1 : s2;
          const shorter = s1.length > s2.length ? s2 : s1;
          if (longer.length === 0) return 1.0;
          return (longer.length - editDistance(longer, shorter)) / parseFloat(longer.length);
        };

        const editDistance = (s1, s2) => {
          s1 = s1.toLowerCase(); s2 = s2.toLowerCase();
          let costs = new Array();
          for (let i = 0; i <= s1.length; i++) {
            let lastValue = i;
            for (let j = 0; j <= s2.length; j++) {
              if (i === 0) costs[j] = j;
              else {
                if (j > 0) {
                  let newValue = costs[j - 1];
                  if (s1.charAt(i - 1) !== s2.charAt(j - 1)) newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                  costs[j - 1] = lastValue;
                  lastValue = newValue;
                }
              }
            }
            if (i > 0) costs[s2.length] = lastValue;
          }
          return costs[s2.length];
        };

        if (similarity(message, lastAgentMsg.text) > 0.6) {
          console.log("Echo detected, ignoring message.");
          setIsProcessing(false);
          return;
        }
      }

      // Phase 1: Onboarding - Only extract name (language already selected)
      if (convoPhase === 'onboarding') {
        let extractedName = 'Guest';
        const cleanMsg = message.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").trim();
        const nameMatch = cleanMsg.match(/(?:name is|i am|i'm|call me|this is|my name is) ([a-zA-Z]+)/i);

        if (nameMatch) {
          extractedName = nameMatch[1];
        } else {
          // Try to extract first word that's not a common word
          const words = cleanMsg.split(' ').filter(w => !['hi', 'hello', 'hey', 'my', 'name', 'is', 'the', 'a', 'an'].includes(w.toLowerCase()));
          if (words.length > 0) extractedName = words[0];
        }

        setUserName(extractedName);
        setConvoPhase('chatting');

        // Greet in selected language with service info
        let response = '';
        if (selectedLanguage.code === 'te-IN') {
          response = `${extractedName}, మిమ్మల్ని కలవడం సంతోషం! ${getServiceInfo('te-IN')}`;
        } else if (selectedLanguage.code === 'hi-IN') {
          response = `${extractedName}, आपसे मिलकर खुशी हुई! ${getServiceInfo('hi-IN')}`;
        } else if (selectedLanguage.code === 'ta-IN') {
          response = `${extractedName}, உங்களைச் சந்தித்ததில் மகிழ்ச்சி! ${getServiceInfo('ta-IN')}`;
        } else if (selectedLanguage.code === 'kn-IN') {
          response = `${extractedName}, ನಿಮ್ಮನ್ನು ಭೇಟಿಯಾಗಲು ಸಂತೋಷವಾಗಿದೆ! ${getServiceInfo('kn-IN')}`;
        } else if (selectedLanguage.code === 'mr-IN') {
          response = `${extractedName}, तुम्हाला भेटून आनंद झाला! ${getServiceInfo('mr-IN')}`;
        } else if (selectedLanguage.code === 'ml-IN') {
          response = `${extractedName}, നിങ്ങളെ കാണാൻ സന്തോഷം! ${getServiceInfo('ml-IN')}`;
        } else {
          response = `Nice to meet you, ${extractedName}! ${getServiceInfo('en-IN')}`;
        }

        addMessage('agent', response);
        await speak(response, selectedLanguage.code);
        setIsProcessing(false);
        return;
      }

      // Check for language change request in chatting phase
      const lowerMsg = message.toLowerCase();
      let languageChangeDetected = false;
      let newLang = null;

      if (lowerMsg.includes('switch to') || lowerMsg.includes('change to') || lowerMsg.includes('change language')) {
        if (lowerMsg.includes('hindi') || lowerMsg.includes('हिंदी')) {
          newLang = { code: 'hi-IN', name: 'Hindi' };
          languageChangeDetected = true;
        } else if (lowerMsg.includes('telugu') || lowerMsg.includes('తెలుగు')) {
          newLang = { code: 'te-IN', name: 'Telugu' };
          languageChangeDetected = true;
        } else if (lowerMsg.includes('tamil') || lowerMsg.includes('தமிழ்')) {
          newLang = { code: 'ta-IN', name: 'Tamil' };
          languageChangeDetected = true;
        } else if (lowerMsg.includes('kannada') || lowerMsg.includes('ಕನ್ನಡ')) {
          newLang = { code: 'kn-IN', name: 'Kannada' };
          languageChangeDetected = true;
        } else if (lowerMsg.includes('marathi') || lowerMsg.includes('मराठी')) {
          newLang = { code: 'mr-IN', name: 'Marathi' };
          languageChangeDetected = true;
        } else if (lowerMsg.includes('malayalam') || lowerMsg.includes('മലയാളം')) {
          newLang = { code: 'ml-IN', name: 'Malayalam' };
          languageChangeDetected = true;
        } else if (lowerMsg.includes('english')) {
          newLang = { code: 'en-IN', name: 'English' };
          languageChangeDetected = true;
        }
      }

      if (languageChangeDetected && newLang) {
        console.log(`🔄 Language change requested: ${newLang.name}`);
        setSelectedLanguage(newLang);

        // CRITICAL: Update stateRef immediately
        stateRef.current.selectedLanguage = newLang;

        const response = newLang.code === 'en-IN'
          ? `Sure! I'll continue in English.`
          : newLang.code === 'te-IN'
            ? `సరే! నేను తెలుగులో కొనసాగిస్తాను.`
            : newLang.code === 'hi-IN'
              ? `ठीक है! मैं हिंदी में जारी रखूंगा।`
              : newLang.code === 'ta-IN'
                ? `சரி! நான் தமிழில் தொடர்வேன்.`
                : newLang.code === 'kn-IN'
                  ? `ಸರಿ! ನಾನು ಕನ್ನಡದಲ್ಲಿ ಮುಂದುವರಿಸುತ್ತೇನೆ.`
                  : newLang.code === 'mr-IN'
                    ? `ठीक आहे! मी मराठीत सुरू ठेवतो.`
                    : `Sure! I'll continue in ${newLang.name}.`;

        addMessage('agent', response);
        await speak(response, newLang.code);
        setIsProcessing(false);
        return;
      }

      // Phase 2: Main AI Flow
      const historyContext = messages.slice(-10).map(msg => `${msg.sender.toUpperCase()}: ${msg.text}`).join('\n');

      let specializedPrompt = DefaultPrompt;
      const industry = selectedCompany?.industry?.toLowerCase() || '';
      const compName = selectedCompany?.name?.toLowerCase() || '';

      if (industry.includes('health') || compName.includes('hospital') || compName.includes('aarogya')) specializedPrompt = HospitalPrompt;
      else if (industry.includes('restaur') || compName.includes('garden')) specializedPrompt = RestaurantPrompt;
      else if (industry.includes('commerce') || compName.includes('kart')) specializedPrompt = ECommercePrompt;

      // Strong language enforcement
      let languageInstruction = '';
      if (selectedLanguage.code === 'te-IN') {
        languageInstruction = '\n\nCRITICAL: You MUST respond ONLY in Telugu language. Use Telugu script (తెలుగు). Do NOT use English words. Example: "నమస్కారం, నేను మీకు ఎలా సహాయం చేయగలను?"';
      } else if (selectedLanguage.code === 'hi-IN') {
        languageInstruction = '\n\nCRITICAL: You MUST respond ONLY in Hindi language. Use Devanagari script (हिंदी). Do NOT use English words. Example: "नमस्ते, मैं आपकी कैसे मदद कर सकता हूं?"';
      } else if (selectedLanguage.code === 'ta-IN') {
        languageInstruction = '\n\nCRITICAL: You MUST respond ONLY in Tamil language. Use Tamil script (தமிழ்). Do NOT use English words.';
      } else if (selectedLanguage.code === 'kn-IN') {
        languageInstruction = '\n\nCRITICAL: You MUST respond ONLY in Kannada language. Use Kannada script (ಕನ್ನಡ). Do NOT use English words.';
      } else if (selectedLanguage.code === 'mr-IN') {
        languageInstruction = '\n\nCRITICAL: You MUST respond ONLY in Marathi language. Use Devanagari script (मराठी). Do NOT use English words.';
      } else if (selectedLanguage.code === 'ml-IN') {
        languageInstruction = '\n\nCRITICAL: You MUST respond ONLY in Malayalam language. Use Malayalam script (മലയാളം). Do NOT use English words.';
      }

      const systemPrompt = `You are Callix for ${selectedCompany?.name}.\n${specializedPrompt}\nUser: ${userName}\nLanguage: ${selectedLanguage.name}${languageInstruction}\n\nHistory:\n${historyContext}`;

      const aiResponse = await chatWithGroq(
        `User Message: ${message}`,
        messages.map(m => ({ role: m.sender === 'user' ? 'user' : 'assistant', text: m.text })),
        selectedCompany,
        systemPrompt
      );

      const cleanedResponse = aiResponse.replace(/\(Translation:.*?\)|Translation:.*?:|\(Note:.*?\)|System:.*?:|Internal:.*?:/gi, '').replace(/\(.*\)/g, '').trim();
      addMessage('agent', cleanedResponse);
      await speak(cleanedResponse, selectedLanguage.code);

    } catch (error) {
      console.error('Message Handling Error:', error);
      const err = "I'm sorry, I missed that. Could you repeat it?";
      addMessage('agent', err);
      await speak(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const addMessage = (sender, text) => {
    setMessages(prev => [...prev, { sender, text, timestamp: new Date() }]);
  };

  const speak = async (text, languageCode) => {
    // Determine language name for backend (lowercase: english, hindi, telugu, etc.)
    const targetLangCode = languageCode || selectedLanguage.code;
    const languageName = languageLookup[targetLangCode] || 'English';
    const targetLang = languageName.toLowerCase(); // Backend expects lowercase

    console.log(`🗣️ Speak: Code="${targetLangCode}", Language="${targetLang}", Gender="${agentGender}"`);

    // Set speaking state BEFORE starting
    setIsSpeaking(true);

    // Stop recording before speaking
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        setIsListening(false);
      } catch (e) { }
    }

    // Try Self-Hosted Edge-TTS First
    try {
      await ttsService.speak(text, targetLang, agentGender);
      onSpeechEnd();
      return;
    } catch (error) {
      console.warn('⚠️ TTS Backend failed, using browser fallback...', error);
    }

    // Fallback: Web Speech API
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = targetLangCode;
    utterance.rate = 1.0;
    utterance.pitch = agentGender === 'female' ? 1.05 : 0.95;

    // Voice Selection
    const voices = window.speechSynthesis.getVoices();
    const langPrefix = targetLangCode.split('-')[0];

    let selectedVoice = voices.find(v =>
      v.lang.startsWith(langPrefix) &&
      (agentGender === 'female'
        ? /female|woman|samantha|zira|neerja|swarata|shruti/i.test(v.name)
        : /male|man|david|prabhat|madhur|mohan/i.test(v.name))
    );

    if (!selectedVoice) {
      selectedVoice = voices.find(v => v.lang.startsWith(langPrefix));
    }

    if (!selectedVoice && voices.length > 0) {
      selectedVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];
    }

    if (selectedVoice) utterance.voice = selectedVoice;

    utterance.onend = onSpeechEnd;
    window.speechSynthesis.speak(utterance);
  };

  const onSpeechEnd = () => {
    setIsSpeaking(false);
    // RELIABLE RESTART
    setTimeout(() => {
      const { callState: curCallState, isMuted: curIsMuted, isOpen: curIsOpen } = stateRef.current;
      if (curCallState === 'connected' && !curIsMuted && curIsOpen) {
        try {
          if (recognitionRef.current) {
            recognitionRef.current.start();
            setIsListening(true);
          }
        } catch (e) {
          console.log('Restarting recognition from speech end...');
        }
      }
    }, 400);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (!isMuted) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
    } else {
      if (recognitionRef.current && callState === 'connected') {
        try { recognitionRef.current.start(); setIsListening(true); } catch (e) { }
      }
    }
  };

  const handleStartCall = () => {
    // Stop ringing
    if (ringingAudioRef.current) {
      ringingAudioRef.current.pause();
    }

    setCallState('connected');

    // CALLIX INTRODUCTION LOGIC - Language already selected
    let introMsg = "";
    if (userName && userName !== 'Guest') {
      setConvoPhase('chatting');
      // Greet in selected language
      if (selectedLanguage.code === 'te-IN') {
        introMsg = `నమస్కారం! నేను ${selectedCompany?.name} కోసం మీ AI అసిస్టెంట్ కాలిక్స్. మళ్లీ మిమ్మల్ని కలవడం సంతోషంగా ఉంది, ${userName}! నేను మీకు ఎలా సహాయం చేయగలను?`;
      } else if (selectedLanguage.code === 'hi-IN') {
        introMsg = `नमस्ते! मैं ${selectedCompany?.name} के लिए आपका AI सहायक कैलिक्स हूं। आपको फिर से देखकर खुशी हुई, ${userName}! मैं आपकी कैसे मदद कर सकता हूं?`;
      } else {
        introMsg = `Hi! I'm Callix, your AI assistant for ${selectedCompany?.name}. Great to see you again, ${userName}! How can I assist you today?`;
      }
    } else {
      setConvoPhase('onboarding');
      // Greet in selected language and ask for name only
      if (selectedLanguage.code === 'te-IN') {
        introMsg = `నమస్కారం! నేను ${selectedCompany?.name} కోసం మీ AI అసిస్టెంట్ కాలిక్స్. మీ పేరు ఏమిటి?`;
      } else if (selectedLanguage.code === 'hi-IN') {
        introMsg = `नमस्ते! मैं ${selectedCompany?.name} के लिए आपका AI सहायक कैलिक्स हूं। आपका नाम क्या है?`;
      } else {
        introMsg = `Hello! I'm Callix, your AI assistant from ${selectedCompany?.name}. May I know your name?`;
      }
    }

    addMessage('agent', introMsg);
    speak(introMsg);
  };

  const endCall = () => {
    setCallState('ended');
    setIsListening(false);
    setIsSpeaking(false);
    if (recognitionRef.current) recognitionRef.current.abort();
    if (ringingAudioRef.current) ringingAudioRef.current.pause();
    window.speechSynthesis.cancel();

    // RESET ALL STATES FOR NEXT CALL
    setTimeout(() => {
      setMessages([]);
      setUserName(user?.user_metadata?.full_name || '');
      setConvoPhase('intro');
      setTranscript('');
      setSelectedLanguage({ code: 'en-US', name: 'English' });
      onClose();
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-50 bg-white" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

        {/* Language Selection Phase */}
        {callState === 'ringing' && (
          <div className="absolute inset-0 overflow-hidden">
            {/* Video Background */}
            <video
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            >
              <source src="/callbg.mp4" type="video/mp4" />
            </video>

            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900/60 to-blue-900/60"></div>

            {/* Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center overflow-y-auto py-4">
              {/* Animated Agent Avatar */}
              <div className="relative mb-6 w-48 h-48 mx-auto">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-48 rounded-full bg-blue-200/30 animate-ping"></div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-40 h-40 rounded-full bg-blue-300/40 animate-pulse"></div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#000080] shadow-2xl">
                    <img src={agentAvatar} className="w-full h-full object-cover" alt="Agent" />
                  </div>
                </div>
              </div>

              <h2 className="text-3xl font-black text-white mb-1">Callix Connecting...</h2>
              <p className="text-blue-300 font-bold uppercase tracking-widest text-xs mb-6">{selectedCompany?.name}</p>

              <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 w-full max-w-4xl mx-4">
                <h3 className="text-xl font-black text-white mb-2 text-center">Select Your Language</h3>
                <p className="text-blue-200 text-sm text-center mb-3">Choose your preferred language</p>

                {/* STT Notice */}
                <div className="bg-blue-500/20 border border-blue-400/30 rounded-xl p-3 mb-5">
                  <p className="text-blue-100 text-xs text-center leading-relaxed">
                    <span className="font-semibold">ℹ️ Note:</span> We're actively working on improving Speech-to-Text accuracy for Indian languages.
                    The AI will understand and respond in your selected language.
                  </p>
                </div>

                <div className="flex flex-wrap justify-center gap-3 mb-5">
                  {[
                    { code: 'en-IN', name: 'English' },
                    { code: 'hi-IN', name: 'Hindi' },
                    { code: 'te-IN', name: 'Telugu' },
                    { code: 'ta-IN', name: 'Tamil' },
                    { code: 'kn-IN', name: 'Kannada' },
                    { code: 'mr-IN', name: 'Marathi' },
                    { code: 'ml-IN', name: 'Malayalam' },
                  ].map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setSelectedLanguage({ code: lang.code, name: lang.name });
                        stateRef.current.selectedLanguage = { code: lang.code, name: lang.name };
                        console.log(`🌐 Language selected: ${lang.name} (${lang.code})`);
                      }}
                      className={`px-7 py-2.5 rounded-full border-2 transition-all duration-300 hover:scale-110 font-semibold text-sm ${selectedLanguage.code === lang.code
                        ? 'border-blue-400 bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/50'
                        : 'border-white/30 bg-white/10 backdrop-blur-sm text-white hover:border-blue-300 hover:bg-white/20'
                        }`}
                    >
                      {lang.name}
                    </button>
                  ))}
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-center gap-4">

                    {/* Continue Button */}
                    <button
                      onClick={handleStartCall}
                      className="px-8 py-3 bg-[#000080] text-white rounded-full font-bold text-lg shadow-lg hover:bg-blue-700 transition-all transform hover:scale-105"
                    >
                      Continue Call
                    </button>

                    {/* Hangup Button */}
                    <button
                      onClick={endCall}
                      className="p-3 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-all transform hover:scale-110"
                    >
                      <PhoneOff size={20} />
                    </button>
                  </div>
                </div>



              </div>
            </div>
          </div>
        )}

        {/* Live Call Interface */}
        {callState === 'connected' && (
          <div className="h-full flex flex-col md:flex-row bg-white">
            {/* Left: Visual Agent */}
            <div className="md:w-1/2 flex flex-col items-center justify-center p-8 bg-slate-50 border-r border-slate-200 relative">
              <motion.div
                animate={{ scale: isSpeaking ? [1, 1.02, 1] : 1 }}
                transition={{ duration: 0.5, repeat: isSpeaking ? Infinity : 0 }}
                className={`w-64 h-64 md:w-80 md:h-80 rounded-full overflow-hidden border-[12px] transition-all duration-500 shadow-2xl ${isSpeaking ? 'border-green-400' : isListening ? 'border-[#000080]' : 'border-slate-200'}`}
              >
                <img src={agentAvatar} className="w-full h-full object-cover" />
              </motion.div>

              <div className="mt-10 text-center">
                <h3 className="text-3xl font-black text-slate-900">Callix</h3>
                <p className="text-[#000080] font-black uppercase tracking-[0.3em] text-sm mt-1">{selectedCompany?.name}</p>

                <div className="mt-8 flex items-center space-x-6">
                  <button onClick={toggleMute} className={`p-5 rounded-full shadow-lg transition-all ${isMuted ? 'bg-red-500 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'}`}><Mic size={28} /></button>
                  <button onClick={endCall} className="p-5 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 transition-all transform hover:scale-110"><PhoneOff size={28} /></button>
                </div>
              </div>

              {/* Real-time Indicator Bottom */}
              <div className="absolute bottom-10 left-0 right-0 flex justify-center">
                <div className={`px-6 py-2 rounded-full text-xs font-black tracking-widest uppercase flex items-center space-x-2 ${isSpeaking ? 'bg-green-100 text-green-700' : isListening ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                  <div className={`w-2 h-2 rounded-full animate-pulse ${isSpeaking ? 'bg-green-500' : isListening ? 'bg-blue-500' : 'bg-slate-400'}`}></div>
                  <span>{isSpeaking ? 'Agent Speaking' : isListening ? 'Listening' : 'Ready'}</span>
                </div>
              </div>
            </div>

            {/* Right: Message Stream */}
            <div className="md:w-1/2 flex flex-col h-full bg-white">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="font-black text-slate-900">Conversation Stream</h4>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Active Session</p>
                </div>
                <MessageSquare className="text-slate-200" size={24} />
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
                {messages.map((m, i) => (
                  <motion.div initial={{ opacity: 0, x: m.sender === 'user' ? 20 : -20 }} animate={{ opacity: 1, x: 0 }} key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm border ${m.sender === 'user' ? 'bg-[#000080] text-white border-[#000080]' : 'bg-white text-slate-800 border-slate-200'}`}>
                      <p className="text-sm font-medium leading-relaxed">{m.text}</p>
                      <p className={`text-[10px] mt-2 font-bold uppercase opacity-50 ${m.sender === 'user' ? 'text-white' : 'text-slate-400'}`}>{m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </motion.div>
                ))}

                {transcript && (
                  <div className="flex justify-end">
                    <div className="bg-slate-200/50 p-4 rounded-2xl text-slate-500 text-sm font-bold italic animate-pulse">
                      {transcript}...
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="p-6 bg-white border-t border-slate-100">
                <div className="flex items-center space-x-3 text-slate-400">
                  <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-blue-500 animate-ping' : 'bg-slate-300'}`}></div>
                  <span className="text-xs font-black uppercase tracking-widest">{isListening ? 'Voice capture active' : 'Waiting for system'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* End Screen */}
        {callState === 'ended' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white">
            <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-6"><PhoneOff size={48} className="text-red-500" /></div>
            <h2 className="text-3xl font-black text-slate-900">Call Ended</h2>
            <p className="text-slate-500 font-bold mt-2">Thank you for speaking with Callix.</p>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default VoiceOverlay;