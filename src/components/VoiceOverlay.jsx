import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, MicOff, Phone, PhoneOff, Globe, User, MessageSquare, VolumeX } from 'lucide-react';
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
  const [convoPhase, setConvoPhase] = useState(user?.user_metadata?.full_name ? 'chatting' : 'intro');
  const [userName, setUserName] = useState(user?.user_metadata?.full_name || '');
  const [userEmail, setUserEmail] = useState(user?.email || '');
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
    userEmail,
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
      userEmail,
      selectedLanguage
    };
  }, [callState, isListening, isSpeaking, isMuted, isOpen, convoPhase, userName, userEmail, selectedLanguage]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, transcript]);

  // Determine agent gender and avatar based on company
  const agentGender = selectedCompany?.gender || (
    (selectedCompany?.industry === 'Healthcare' ||
      selectedCompany?.name?.toLowerCase().includes('hospital') ||
      selectedCompany?.name?.toLowerCase().includes('voxsphere'))
      ? 'female' : 'male'
  );
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
    const name = selectedCompany?.name?.toLowerCase() || '';
    const sMap = {
      'en-US': {
        hospital: "I can assist you with doctor availability, booking consultations or follow-up appointments, and providing department contact information.",
        restaurant: "I can help you with menu prices, checking veg or non-veg options, and booking a table for your visit.",
        ecommerce: "I can track your orders, check product stock, manage refunds, and handle support tickets.",
        tech_mahindra: "I can provide information about our business units, share the latest job openings, and tell you about our leadership team.",
        voxsphere: "I can explain our AI service catalog, provide pricing plan details, and schedule a demo slot for you.",
        agile_it: "I can help with cloud infrastructure queries, digital transformation services, and managed IT support.",
        default: "I'm here to assist you with all your queries today."
      },
      'en-IN': {
        hospital: "I can assist you with doctor availability, booking consultations or follow-up appointments, and providing department contact information.",
        restaurant: "I can help you with menu prices, checking veg or non-veg options, and booking a table for your visit.",
        ecommerce: "I can track your orders, check product stock, manage refunds, and handle support tickets.",
        tech_mahindra: "I can provide information about our business units, share the latest job openings, and tell you about our leadership team.",
        voxsphere: "I can explain our AI service catalog, provide pricing plan details, and schedule a demo slot for you.",
        agile_it: "I can help with cloud infrastructure queries, digital transformation services, and managed IT support.",
        default: "I'm here to assist you with all your queries today."
      },
      'te-IN': {
        hospital: "నేను డాక్టర్ల లభ్యత, కన్సల్టేషన్ లేదా ఫాలో-అప్ అపాయింట్‌మెంట్‌లను బుక్ చేయడం మరియు విభాగాల సమాచారాన్ని అందించడంలో మీకు సహాయపడగలను.",
        restaurant: "నేను మీకు మెనూ ధరలు, వెజ్ లేదా నాన్-వెజ్ ఆప్షన్‌లను తనిఖీ చేయడం మరియు టేబుల్ బుక్ చేయడంలో సహాయపడతాను.",
        ecommerce: "నేను మీ ఆర్డర్‌లను ట్రాక్ చేయగలను, స్టాక్ తనిఖీ చేయగలను, రీఫండ్‌లను నిర్వహించగలను మరియు సపోర్ట్ టిక్కెట్‌లను చూడగలను.",
        tech_mahindra: "నేను మా బిజినెస్ యూనిట్లు, తాజా ఉద్యోగ అవకాశాలు మరియు మా నాయకత్వ బృందం గురించి సమాచారాన్ని అందించగలను.",
        voxsphere: "నేను మా AI సేవల కేటలాగ్, ధరల ప్లాన్ వివరాలను వివరించగలను మరియు మీ కోసం డెమో స్లాట్‌ను షెడ్యూల్ చేయగలను.",
        agile_it: "నేను క్లౌడ్ ఇన్‌ఫ్రాస్ట్రక్చర్ ప్రశ్నలు, డిజిటల్ ట్రాన్స్‌ఫర్మేషన్ సేవలు మరియు మేనేజ్డ్ ఐటి సపోర్ట్‌లో సహాయపడగలను.",
        default: "నేను ఈరోజు మీ అన్ని ప్రశ్నలకు సహాయం చేయడానికి ఇక్కడ ఉన్నాను."
      },
      'hi-IN': {
        hospital: "मैं डॉक्टरों की उपलब्धता, परामर्श या फॉलो-अप अपॉइंटमेंट बुक करने और विभाग की संपर्क जानकारी प्रदान करने में आपकी सहायता कर सकता हूँ।",
        restaurant: "मैं मेनू की कीमतों, वेज या नॉन-वेज विकल्पों की जाँच करने और आपकी यात्रा के लिए टेबल बुक करने में आपकी मदद कर सकता हूँ।",
        ecommerce: "मैं आपके ऑर्डर ट्रैक कर सकता हूँ, स्टॉक की जाँच कर सकता हूँ, रिफंड प्रबंधित कर सकता हूँ और सपोर्ट टिकट संभाल सकता हूँ।",
        tech_mahindra: "मैं हमारी व्यावसायिक इकाइयों के बारे में जानकारी दे सकता हूँ, नवीनतम नौकरियों के अवसर साझा कर सकता हूँ और हमारी नेतृत्व टीम के बारे में बता सकता हूँ।",
        voxsphere: "मैं हमारे AI सेवा कैटलॉग को समझा सकता हूँ, मूल्य निर्धारण योजना का विवरण दे सकता हूँ और आपके लिए एक डेमो स्लॉट शेड्यूल कर सकता हूँ।",
        agile_it: "मैं क्लाउड इंफ्रास्ट्रक्चर प्रश्नों, डिजिटल परिवर्तन सेवाओं और प्रबंधित आईटी सहायता में मदद कर सकता हूँ।",
        default: "मैं आज आपके सभी सवालों के समाधान के लिए यहाँ हूँ।"
      }
    };

    const strings = sMap[langCode] || sMap['en-IN'];
    let compKey = 'default';

    if (name.includes('hospital') || name.includes('aarogya')) compKey = 'hospital';
    else if (name.includes('restaurant') || name.includes('garden')) compKey = 'restaurant';
    else if (name.includes('kart') || name.includes('commerce')) compKey = 'ecommerce';
    else if (name.includes('mahindra')) compKey = 'tech_mahindra';
    else if (name.includes('voxsphere')) compKey = 'voxsphere';
    else if (name.includes('agile')) compKey = 'agile_it';

    return strings[compKey];
  };

  const handleUserMessage = async (message) => {
    // ALWAYS use stateRef for logic inside async handlers to avoid stale closures
    const {
      convoPhase: curPhase,
      userName: curName,
      selectedLanguage: curLang,
      isSpeaking: curIsSpeaking
    } = stateRef.current;

    if (!message.trim() || curIsSpeaking || isProcessing) return;

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
      if (curPhase === 'onboarding') {
        let extractedName = 'Guest';
        const cleanMsg = message.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").trim();
        const nameMatch = cleanMsg.match(/(?:name is|i am|i'm|call me|this is|my name is) ([a-zA-Z]+)/i);

        if (nameMatch) {
          extractedName = nameMatch[1];
        } else {
          // Try to extract first word that's not a common word
          const words = cleanMsg.split(' ').filter(w => !['hi', 'hello', 'hey', 'my', 'name', 'is', 'the', 'a', 'an', 'yeah'].includes(w.toLowerCase()));
          if (words.length > 0) extractedName = words[0];
        }

        // Update name and transition phase
        setUserName(extractedName);
        setConvoPhase('chatting');

        // Update Ref immediately so following logic sees it
        stateRef.current.userName = extractedName;
        stateRef.current.convoPhase = 'chatting';

        // Greet in selected language with FULL service info
        let response = '';
        const serviceInfo = getServiceInfo(curLang.code);

        if (curLang.code === 'te-IN') {
          response = `నమస్కారం ${extractedName}! మిమ్మల్ని కలవడం సంతోషం. ${serviceInfo} నేను మీకు ఎలా సహాయం చేయగలను?`;
        } else if (curLang.code === 'hi-IN') {
          response = `नमस्ते ${extractedName}! आपसे मिलकर खुशी हुई। ${serviceInfo} मैं आपकी किस प्रकार सहायता कर सकता हूँ?`;
        } else {
          response = `Nice to meet you, ${extractedName}! ${serviceInfo} How can I assist you today?`;
        }

        addMessage('agent', response);
        await speak(response, curLang.code);
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
        stateRef.current.selectedLanguage = newLang; // Sync Ref

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
      if (curLang.code === 'te-IN') {
        languageInstruction = '\n\nCRITICAL: You MUST respond ONLY in Telugu language. Use Telugu script (తెలుగు). Do NOT use English words. Example: "నమస్కారం, నేను మీకు ఎలా సహాయం చేయగలను?"';
      } else if (curLang.code === 'hi-IN') {
        languageInstruction = '\n\nCRITICAL: You MUST respond ONLY in Hindi language. Use Devanagari script (हिंदी). Do NOT use English words. Example: "नमस्ते, मैं आपकी कैसे मदद कर सकता हूं?"';
      } else if (curLang.code === 'ta-IN') {
        languageInstruction = '\n\nCRITICAL: You MUST respond ONLY in Tamil language. Use Tamil script (தமிழ்). Do NOT use English words.';
      } else if (curLang.code === 'kn-IN') {
        languageInstruction = '\n\nCRITICAL: You MUST respond ONLY in Kannada language. Use Kannada script (ಕನ್ನಡ). Do NOT use English words.';
      } else if (curLang.code === 'mr-IN') {
        languageInstruction = '\n\nCRITICAL: You MUST respond ONLY in Marathi language. Use Devanagari script (मराठी). Do NOT use English words.';
      } else if (curLang.code === 'ml-IN') {
        languageInstruction = '\n\nCRITICAL: You MUST respond ONLY in Malayalam language. Use Malayalam script (മലയാളം). Do NOT use English words.';
      }

      const latestName = stateRef.current.userName || 'Guest';
      const systemPrompt = `You are Callix for ${selectedCompany?.name}.\n${specializedPrompt}\nUser: ${latestName}\nLanguage: ${curLang.name}${languageInstruction}\n\nHistory:\n${historyContext}`;

      const aiResponse = await chatWithGroq(
        `User Message: ${message}`,
        messages.map(m => ({ role: m.sender === 'user' ? 'user' : 'assistant', text: m.text })),
        { ...selectedCompany, userName: latestName, userEmail },
        systemPrompt
      );

      const cleanedResponse = aiResponse.replace(/\(Translation:.*?\)|Translation:.*?:|\(Note:.*?\)|System:.*?:|Internal:.*?:/gi, '').replace(/\(.*\)/g, '').trim();
      addMessage('agent', cleanedResponse);
      await speak(cleanedResponse, curLang.code);

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

  const stopAudio = () => {
    ttsService.stop();
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    // Restart listening if not muted
    setTimeout(() => {
      const { callState: curCallState, isMuted: curIsMuted, isOpen: curIsOpen } = stateRef.current;
      if (curCallState === 'connected' && !curIsMuted && curIsOpen) {
        try {
          if (recognitionRef.current) {
            recognitionRef.current.start();
            setIsListening(true);
          }
        } catch (e) {
          console.log('Restarting recognition from audio stop...');
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
    const serviceInfo = getServiceInfo(selectedLanguage.code);

    if (userName && userName !== 'Guest') {
      setConvoPhase('chatting');
      // Greet in selected language with name AND services
      if (selectedLanguage.code === 'te-IN') {
        introMsg = `నమస్కారం! నేను ${selectedCompany?.name} కోసం మీ AI అసిస్టెంట్ కాలిక్స్. మళ్లీ మిమ్మల్ని కలవడం సంతోషంగా ఉంది, ${userName}! ${serviceInfo} నేను మీకు ఎలా సహాయం చేయగలను?`;
      } else if (selectedLanguage.code === 'hi-IN') {
        introMsg = `नमस्ते! मैं ${selectedCompany?.name} के लिए आपका AI सहायक कैलिक्स हूं। आपको फिर से देखकर खुशी हुई, ${userName}! ${serviceInfo} मैं आपकी कैसे मदद कर सकता हूं?`;
      } else {
        introMsg = `Hi! I'm Callix, your AI assistant for ${selectedCompany?.name}. Great to see you again, ${userName}! ${serviceInfo} How can I assist you today?`;
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
    setMessages([]); // Clear history for next call
    if (recognitionRef.current) recognitionRef.current.abort();
    if (ringingAudioRef.current) ringingAudioRef.current.pause();
    window.speechSynthesis.cancel();
    ttsService.stop();

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
                <p className="text-blue-200 text-sm text-center mb-5">Choose your preferred language</p>

                <div className="flex justify-center flex-nowrap gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                  {[
                    { code: 'en-IN', name: 'English', locked: false },
                    { code: 'hi-IN', name: 'Hindi', locked: true },
                    { code: 'te-IN', name: 'Telugu', locked: true },
                    { code: 'ta-IN', name: 'Tamil', locked: true },
                    { code: 'kn-IN', name: 'Kannada', locked: true },
                    { code: 'mr-IN', name: 'Marathi', locked: true },
                    { code: 'ml-IN', name: 'Malayalam', locked: true },
                  ].map((lang) => (
                    <div key={lang.code} className="relative group">
                      <button
                        onClick={() => {
                          if (!lang.locked) {
                            setSelectedLanguage({ code: lang.code, name: lang.name });
                            stateRef.current.selectedLanguage = { code: lang.code, name: lang.name };
                            console.log(`🌐 Language selected: ${lang.name} (${lang.code})`);
                          }
                        }}
                        disabled={lang.locked}
                        className={`px-4 py-2 rounded-full border-2 transition-all duration-300 font-semibold text-sm flex items-center gap-2 ${lang.locked
                          ? 'border-white/20 bg-white/5 text-white/40 cursor-not-allowed'
                          : selectedLanguage.code === lang.code
                            ? 'border-blue-400 bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/50 hover:scale-110'
                            : 'border-white/30 bg-white/10 backdrop-blur-sm text-white hover:border-blue-300 hover:bg-white/20 hover:scale-110'
                          }`}
                      >
                        {lang.name}
                        {lang.locked && (
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>

                      {/* Tooltip */}
                      {lang.locked && (
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                          <div className="font-semibold mb-1">Coming Soon!</div>
                          <div className="text-slate-300">We're working on {lang.name} support</div>
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                            <div className="border-4 border-transparent border-t-slate-900"></div>
                          </div>
                        </div>
                      )}
                    </div>
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

              <div className="mt-8 text-center flex flex-col items-center">
                <h3 className="text-3xl font-black text-slate-900">Callix</h3>
                <p className="text-[#000080] font-black uppercase tracking-[0.3em] text-sm mt-1">{selectedCompany?.name}</p>

                {/* Real-time Indicator */}
                <div className={`mt-6 px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase flex items-center space-x-2 border transition-all duration-300 ${isSpeaking ? 'bg-green-100 text-green-700 border-green-200' : isListening ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isSpeaking ? 'bg-green-500' : isListening ? 'bg-blue-500' : 'bg-slate-400'}`}></div>
                  <span>{isSpeaking ? 'Agent Speaking' : isListening ? 'Listening' : 'Ready'}</span>
                </div>

                <div className="mt-8 flex items-center space-x-4">
                  <button onClick={toggleMute} title={isMuted ? "Unmute" : "Mute"} className={`p-4 rounded-full shadow-lg transition-all ${isMuted ? 'bg-red-500 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'}`}><Mic size={24} /></button>
                  {isSpeaking && (
                    <button onClick={stopAudio} title="Stop Audio" className="p-4 bg-orange-500 text-white rounded-full shadow-lg hover:bg-orange-600 transition-all transform hover:scale-110 animate-bounce">
                      <VolumeX size={24} />
                    </button>
                  )}
                  <button onClick={endCall} title="End Call" className="p-4 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 transition-all transform hover:scale-110"><PhoneOff size={24} /></button>
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