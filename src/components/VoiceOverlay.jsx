import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, MicOff, Phone, PhoneOff, Globe, User, MessageSquare, VolumeX } from 'lucide-react';
import { chatWithGroq, transcribeAudio, isGroqInitialized, cleanInternalCommands } from '../utils/groq.js';
import { detectLanguage } from '../utils/languageDetection';
import { crmIntegration } from '../utils/crmIntegration';
import { ttsService } from '../utils/ttsService';
import { sttService } from '../utils/sttService';
import { HospitalPrompt, RestaurantPrompt, ECommercePrompt, BusinessPrompt, DefaultPrompt } from '../prompts/agentPrompts';

const VoiceOverlay = ({ isOpen, onClose, selectedCompany, user }) => {
  const [callState, setCallState] = useState('idle'); // idle, ringing, connected, ended
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [messages, setMessages] = useState([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [pulseScale, setPulseScale] = useState(1);
  const [isUserTalking, setIsUserTalking] = useState(false);

  // Advanced conversation state
  const [convoPhase, setConvoPhase] = useState(user?.user_metadata?.full_name ? 'chatting' : 'intro');
  const [userName, setUserName] = useState(user?.user_metadata?.full_name || '');
  const [userEmail, setUserEmail] = useState(user?.email || '');
  const [sessionId] = useState(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [selectedLanguage, setSelectedLanguage] = useState({ code: 'en-IN', name: 'English' });
  const [useProSTT, setUseProSTT] = useState(true); // Default to Pro STT for better results

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const ringingAudioRef = useRef(null);
  const chatEndRef = useRef(null);
  const sttCleanupRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const flushIntervalRef = useRef(null);
  const restartFlushRef = useRef(null);

  const languageLookup = {
    'en-IN': 'en-IN',
    'hi-IN': 'hi-IN',
    'te-IN': 'te-IN'
  };

  const languageNameMap = {
    'en': 'English', 'en-IN': 'English',
    'hi': 'Hindi', 'hi-IN': 'Hindi',
    'te': 'Telugu', 'te-IN': 'Telugu',
    'ta': '', 'ta-IN': 'Tamil',
    'kn': 'Kannada', 'kn-IN': 'Kannada'
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
    selectedLanguage,
    messages
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
      selectedLanguage,
      messages
    };
  }, [callState, isListening, isSpeaking, isMuted, isOpen, convoPhase, userName, userEmail, selectedLanguage, messages]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, transcript]);

  // Determine agent gender and avatar - LOCKED TO FEMALE
  const agentGender = 'female';
  const agentAvatar = '/Female.png';

  // Pre-load voices for browser TTS Fallback
  const [availableVoices, setAvailableVoices] = useState([]);

  useEffect(() => {
    const loadVoices = () => {
      setAvailableVoices(window.speechSynthesis.getVoices());
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  // Sync with user prop if logged in
  useEffect(() => {
    if (user) {
      setUserName(user.user_metadata?.full_name || '');
      setUserEmail(user.email || '');
    }
  }, [user]);

  // Pro STT Logic (MediaRecorder + Deepgram Nova-3) - STOP-WAIT-RESTART PATTERN
  const startProSTT = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true // Enabled for better sensitivity on mobile/remote
        }
      });

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        audioChunksRef.current = []; // Clear immediately to start fresh

        const { selectedLanguage: curLang, isSpeaking, isMuted, callState, isOpen, useProSTT: curUseProSTT } = stateRef.current;

        // Lowered threshold to 1000 bytes to capture EVEN tiny words (like names) instantly
        if (audioBlob.size > 1000 && !isSpeaking && !isMuted) {
          console.log(`🎙️ Sending COMPLETE WebM to DEEPGRAM: ${audioBlob.size} bytes`);
          setIsProcessing(true);
          try {
            console.log("📡 Transcribing with Deepgram...");
            setIsTranscribing(true);
            const text = await sttService.transcribe(audioBlob, curLang.code);
            console.log(`🎤 Deepgram Response: "${text}" (Bytes: ${audioBlob.size})`);
            setIsTranscribing(false);

            if (text && text.trim().length > 1) {
              console.log("✅ Final STT Output:", text);
              await handleUserMessage(text, true);
            } else {
              if (audioBlob.size > 2000) {
                // Quietly ignore silence
              }
              setIsProcessing(false);
            }
          } catch (e) {
            console.error('❌ STT Pipeline failed:', e);
          } finally {
            setIsTranscribing(false);
            setIsProcessing(false);
          }
        }

        // restart logic - REMOVED TO PREVENT RACE CONDITIONS
        // Restarting is now ONLY handled in the speak() finish function.
      };

      // Setup Web Audio API for volume detection (Visual Pulse)
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }

      const audioContext = audioContextRef.current;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      dataArrayRef.current = dataArray;

      // SMART FLUSH: 12-second chunks to allow long responses while remaining responsive
      restartFlushRef.current = () => {
        if (flushIntervalRef.current) clearInterval(flushIntervalRef.current);
        flushIntervalRef.current = setInterval(() => {
          const { isSpeaking, isMuted, callState, isOpen } = stateRef.current;
          if (mediaRecorderRef.current?.state === 'recording' && !isSpeaking && !isMuted && callState === 'connected' && isOpen) {
            console.log("⏹️ Mid-call recording rotation (12s)...");
            mediaRecorderRef.current.stop();
          }
        }, 12000);
      };

      mediaRecorder.start();
      restartFlushRef.current();
      setIsListening(true);
      console.log("⏺️ STT Recording Started");

      const checkVolume = () => {
        const { isOpen: curIsOpen, callState: curCallState } = stateRef.current;
        if (!curIsOpen || curCallState !== 'connected' || !analyserRef.current) return;

        if (mediaRecorder.state === 'recording') {
          const currentAnalyser = analyserRef.current;
          const currentDataArray = dataArrayRef.current;
          if (currentAnalyser && currentDataArray) {
            currentAnalyser.getByteFrequencyData(currentDataArray);
            const volume = currentDataArray.reduce((num, i) => num + i) / currentDataArray.length;
            setPulseScale(1 + (volume / 255) * 0.4);
            setIsUserTalking(volume > 10); // Standard threshold to avoid room noise interference

            // Debug volume trace
            if (volume > 5 && Math.random() < 0.05) {
              console.log(`🎙️ Mic Volume Trace: ${volume.toFixed(2)}`);
            }
          }
        }
        requestAnimationFrame(checkVolume);
      };
      requestAnimationFrame(checkVolume);

      sttCleanupRef.current = () => {
        try {
          if (flushIntervalRef.current) clearInterval(flushIntervalRef.current);
          if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
            audioContextRef.current = null;
          }
          analyserRef.current = null;
          stream.getTracks().forEach(track => track.stop());
        } catch (e) { }
      };

    } catch (e) {
      console.error('Failed to start Pro STT:', e);
      setUseProSTT(false);
    }
  };

  useEffect(() => {
    // Cleanup old STT before starting new one
    if (sttCleanupRef.current) {
      sttCleanupRef.current();
      sttCleanupRef.current = null;
    }

    if (callState === 'connected' && isOpen) {
      console.log(`🚀 [STT] Activating Deepgram Nova-3 for ${selectedLanguage.name}...`);
      startProSTT();
    }

    return () => {
      if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
      if (sttCleanupRef.current) {
        sttCleanupRef.current();
        sttCleanupRef.current = null;
      }
    };
  }, [selectedLanguage.code, callState, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    // Prime the voices list (some browsers load them async)
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
    }

    // Play ringing sound
    setCallState('ringing');

    // AUTO-SELECT Telugu for Indian companies to prevent transliteration issues
    const compName = selectedCompany?.name?.toLowerCase() || '';
    if (compName.includes('aarogya') || compName.includes('spice')) {
      setSelectedLanguage({ code: 'te-IN', name: 'Telugu' });
      stateRef.current.selectedLanguage = { code: 'te-IN', name: 'Telugu' };
      console.log("🇮🇳 Indian Company detected: Defaulting to Telugu (Native Script).");
    }

    ringingAudioRef.current = new Audio('/ringtone-027-376908.mp3');
    ringingAudioRef.current.loop = true;
    ringingAudioRef.current.play().catch(e => console.log('Audio play failed:', e));

    // Don't auto-connect - wait for user to select language and click continue

    return () => {
      if (ringingAudioRef.current) {
        ringingAudioRef.current.pause();
      }
      window.speechSynthesis.cancel();
    };
  }, [isOpen]);


  const getServiceInfo = (langCode = 'en-IN') => {
    const name = selectedCompany?.name?.toLowerCase() || '';
    const sMap = {
      'en-US': {
        hospital: "I can help you explore our registry of 15+ doctors, check their consultation fees, specialty availability (Cardiology to Pediatrics), and book appointments instantly.",
        restaurant: "I can present our full continental and Indian menu, provide budget-friendly recommendations for groups or couples, and reserve your table instantly.",
        ecommerce: "I can provide updated pricing for the latest iPhone, MacBook, and Sony devices, book your orders directly, and track your shipment status.",
        tech_mahindra: "I can guide you through our 12+ open roles (like React Dev or ML Engineer), explain our remote-first culture and 4-day work week, and schedule your interview.",
        voxsphere: "I can guide you through our open roles, work culture, and help you schedule a recruitment interview.",
        agile_it: "I can help with career queries, role descriptions, culture insights, and direct interview scheduling.",
        default: "I'm here to assist you with all your professional queries today."
      },
      'en-IN': {
        hospital: "I can help you explore our registry of 15+ doctors, check their consultation fees, specialty availability (Cardiology to Pediatrics), and book appointments instantly.",
        restaurant: "I can present our full continental and Indian menu, provide budget-friendly recommendations for groups or couples, and reserve your table instantly.",
        ecommerce: "I can provide updated pricing for the latest iPhone, MacBook, and Sony devices, book your orders directly, and track your shipment status.",
        tech_mahindra: "I can guide you through our 12+ open roles (like React Dev or ML Engineer), explain our remote-first culture and 4-day work week, and schedule your interview.",
        voxsphere: "I can guide you through our open roles, work culture, and help you schedule a recruitment interview.",
        agile_it: "I can help with career queries, role descriptions, culture insights, and direct interview scheduling.",
        default: "I'm here to assist you with all your professional queries today."
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

  const handleUserMessage = async (message, fromSTT = false) => {
    // ALWAYS use stateRef for logic inside async handlers to avoid stale closures
    const {
      convoPhase: curPhase,
      userName: curName,
      selectedLanguage: curLang,
      isSpeaking: curIsSpeaking
    } = stateRef.current;

    if (!message.trim() || curIsSpeaking || (isProcessing && !fromSTT)) return;

    if (!fromSTT) setIsProcessing(true); // Only set if not already set by STT
    setIsThinking(true);

    try {
      addMessage('user', message);
      setIsListening(false);
      setTranscript('');

      // Prevent Loop: If message is too similar to last agent message, ignore (echo protection)
      const curMessages = stateRef.current.messages;
      const lastAgentMsg = curMessages.filter(m => m.sender === 'agent').pop();
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

        if (similarity(message, lastAgentMsg.text) > 0.95) { // Ultra-tight threshold to prevent false positives
          console.log(`🚫 Echo or duplicate detected (Similarity: ${similarity(message, lastAgentMsg.text)}), ignoring.`);
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
          // Robust extraction for Indian names and simple responses
          // Filter out stop words and common phrases in English, Telugu, and Hindi
          const ignoreList = [
            'hi', 'hello', 'hey', 'my', 'name', 'is', 'the', 'a', 'an', 'yeah', 'yes', 'i', 'am', 'im',
            'నమస్కారం', 'పేరు', 'నా', 'నాకు', 'నేను', 'నా పేరు', 'naa', 'na', 'naperu',
            'नमस्ते', 'नाम', 'मेरा', 'मै', 'हूँ', 'mera', 'naam'
          ];

          // Split by space and remove punctuation from each word for cleaner filtering
          const words = cleanMsg.split(/\s+/).filter(w => {
            const lowW = w.toLowerCase().replace(/[^a-zA-Z0-9\u0C00-\u0C7F\u0900-\u097F]/g, '');
            return lowW.length > 0 && !ignoreList.includes(lowW);
          });

          if (words.length > 0) {
            // Usually the last word in "My name is X" or "Naa peru X" is the name.
            // But if it's just "Johnson", it's the first word.
            // Priority: Last word that starts with a Capital letter (English) 
            // OR simply the LAST word (for Telugu/Native script)
            const capWords = words.filter(w => w[0] === w[0].toUpperCase() && /[a-zA-Z]/.test(w[0]) && w.length > 1);
            if (capWords.length > 0) {
              extractedName = capWords[capWords.length - 1];
            } else if (words.length > 0) {
              extractedName = words[words.length - 1]; // Fallback to last word (Great for Telugu)
            }
          }
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
        try {
          await speak(response, curLang.code);
        } finally {
          setIsProcessing(false);
        }
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
            : `ठीक है! मैं हिंदी में जारी रखूंगा।`;

        addMessage('agent', response);
        await speak(response, newLang.code);
        setIsProcessing(false);
        return;
      }

      // Phase 2: Main AI Flow
      const currentMessages = stateRef.current.messages;
      const historyContext = currentMessages.slice(-10).map(msg => `${msg.sender.toUpperCase()}: ${msg.text}`).join('\n');

      let specializedPrompt = DefaultPrompt;
      const industry = selectedCompany?.industry?.toLowerCase() || '';
      const compName = selectedCompany?.name?.toLowerCase() || '';

      if (industry.includes('health') || compName.includes('hospital') || compName.includes('aarogya')) specializedPrompt = HospitalPrompt;
      else if (industry.includes('restaur') || compName.includes('garden')) specializedPrompt = RestaurantPrompt;
      else if (industry.includes('commerce') || compName.includes('kart')) specializedPrompt = ECommercePrompt;
      else if (industry.includes('business') || industry.includes('tech')) specializedPrompt = BusinessPrompt;
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

      const systemPrompt = `
IDENTITY: You are Callix for ${selectedCompany?.name}.
${specializedPrompt}
BUSINESS DATA (Use these facts to answer user queries):
${selectedCompany?.nlp_context || 'Standard business operations'}

USER CONTEXT: Name is ${latestName}.
LANGUAGE: Response MUST be in ${curLang.name} using ${curLang.name} script.

STRICT CONVERSATIONAL RULES:
1. Be Warm & Human: Use phrases like "Certainly," "I'd be happy to," or "Got it!" (translated naturally).
2. Complete Sentences: NEVER respond with just a few words or fragments. Use full, polite sentences.
3. No English: Use 100% native script for ${curLang.name}.
4. Commands: If you use a command (like BOOK_APPOINTMENT), place it at the very END on a new line.

${languageInstruction}

Example of a good response:
"నమస్కారం ${latestName}! డాక్టర్ శర్మతో మీ అపాయింట్‌మెంట్ రేపు ఉదయం 10 గంటలకు ఖరారు చేయబడింది. నేను దీన్ని మీ కోసం రిజిస్టర్ చేస్తున్నాను.
BOOK_APPOINTMENT for Dr. Sharma on Tomorrow at 10:00 AM"
`;

      const rawResponse = await chatWithGroq(
        `User Message: ${message}`,
        currentMessages.map(m => ({ role: m.sender === 'user' ? 'user' : 'assistant', text: m.text })),
        { ...selectedCompany, userName: latestName, userEmail, sessionId },
        systemPrompt
      );

      console.log(`🤖 Raw LLM Response: "${rawResponse}"`);

      // 1. Process System Commands (Side Effects)
      const processCommands = async (text) => {
        const appointmentMatch = text.match(/BOOK_APPOINTMENT for (.*?) on (.*?) at ([^\n.\r]*)/i);
        const tableMatch = text.match(/BOOK_TABLE for (.*?) on (.*?) at ([^\n.\r]*)/i);
        const orderMatch = text.match(/BOOK_ORDER (.*)/i);
        const ratingMatch = text.match(/COLLECT_RATING (\d+)/i);

        const currentCompanyId = selectedCompany?._id || selectedCompany?.id || 'manual';
        const industry = selectedCompany?.industry?.toLowerCase() || '';

        const commonData = {
          entity_id: currentCompanyId,
          entity_name: selectedCompany?.name,
          user_email: userEmail,
          user_info: { name: latestName, session: sessionId }
        };

        try {
          if (appointmentMatch) {
            console.log("📅 Syncing Appointment to Database...");
            const personName = appointmentMatch[1].trim();
            const dateStr = appointmentMatch[2].trim();
            const timeStr = appointmentMatch[3].trim();

            await crmIntegration.syncAppointment({
              ...commonData,
              type: industry.includes('health') || industry.includes('hosp') ? 'doctor' : 'interview',
              person_name: personName,
              date: dateStr,
              time: timeStr,
              status: 'scheduled'
            });
            console.log(`✅ Appointment Saved: ${personName} on ${dateStr} at ${timeStr}`);
          }

          if (tableMatch) {
            console.log("🍽️ Syncing Table Booking to Database...");
            const peopleCount = tableMatch[1].trim();
            const dateStr = tableMatch[2].trim();
            const timeStr = tableMatch[3].trim();

            await crmIntegration.syncAppointment({
              ...commonData,
              type: 'table',
              person_name: `Table for ${peopleCount} (${latestName})`,
              date: dateStr,
              time: timeStr,
              status: 'scheduled',
              user_info: { ...commonData.user_info, party_size: peopleCount }
            });
            console.log(`✅ Table Booking Saved: ${peopleCount} people on ${dateStr} at ${timeStr}`);
          }

          if (orderMatch) {
            const itemName = orderMatch[1].trim();
            console.log("🛍️ Syncing Order to Database...");
            await crmIntegration.syncOrder({
              id: `ORD-${Date.now()}`,
              company_id: currentCompanyId,
              item: itemName,
              quantity: 1,
              status: 'completed',
              total_price: 999, // Suggested default/mock price
              customer_name: latestName,
              user_email: userEmail
            });
            console.log(`✅ Order Saved: ${itemName}`);
          }

          if (ratingMatch) {
            const rating = parseInt(ratingMatch[1]);
            console.log("⭐ Syncing Rating to Database...");
            await crmIntegration.syncFeedback({
              ...commonData,
              status: 'completed',
              rating: rating,
              comment: cleanInternalCommands(text) // Save CLEANED comment
            });
            console.log(`✅ Feedback Saved: ${rating} stars`);
          }
        } catch (cmdErr) {
          console.warn("❌ CRM Sync Failed:", cmdErr);
        }
      };

      await processCommands(rawResponse);

      setIsThinking(false);

      // 2. Clean response for Display & TTS using common utility
      const finalDisplay = cleanInternalCommands(rawResponse) || (curLang.code === 'te' ? "సరే, నేను దాన్ని ప్రాసెస్ చేస్తున్నాను." : "Okay, processing that...");
      addMessage('agent', finalDisplay);

      const shouldTerminate = rawResponse.toUpperCase().includes('HANG_UP');

      // Speak the cleaned response
      await speak(finalDisplay, curLang.code, shouldTerminate);

      // Auto-hangup if keyword was present
      if (shouldTerminate) {
        console.log("🏁 Termination keyword detected. Ending call...");
        // Call endCall directly instead of setTimeout to avoid race conditions with STT restart
        endCall();
      }

    } catch (error) {
      console.error('Message Handling Error:', error);
      const err = "I'm sorry, I missed that. Could you repeat it?";
      addMessage('agent', err);
      await speak(err);
    } finally {
      setIsProcessing(false);
      setIsThinking(false);
    }
  };

  const addMessage = (sender, text) => {
    setMessages(prev => [...prev, { sender, text, timestamp: new Date() }]);
  };

  const speak = (text, languageCode, shouldTerminate = false) => {
    return new Promise((resolve) => {
      // Determine language mapping for consistency
      const targetLangCode = languageCode || selectedLanguage.code;
      const ttsLang = languageLookup[targetLangCode] || 'en';
      const languageFullName = languageNameMap[targetLangCode] || 'English';

      console.log(`🗣️ Speak: Code="${targetLangCode}" (mapped to ${ttsLang}), Language="${languageFullName}", Gender="${agentGender}"`);

      setIsSpeaking(true);

      // Stop recording IMMEDIATELY to prevent echo or delay
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
        setIsListening(false);
      }

      const finishSpeech = () => {
        setIsSpeaking(false);
        resolve(); // Resolve promise when speech ends

        // Restart recording ONLY if call is still active AND not terminating
        const { callState: curCallState, isMuted: curIsMuted, isOpen: curIsOpen } = stateRef.current;
        if (curCallState === 'connected' && !curIsMuted && curIsOpen && !shouldTerminate) {
          // Restart Pro STT if needed
          if (mediaRecorderRef.current?.state === 'inactive') {
            mediaRecorderRef.current.start();
            if (restartFlushRef.current) restartFlushRef.current(); // Reset the 12s timer
            setIsListening(true);
          }
        }
      };

      const hasTelugu = /[\u0C00-\u0C7F]/.test(text);
      console.log(`🗣️ Pro TTS Request: Lang="${ttsLang}", Native Script: ${hasTelugu}, Text: "${text.substring(0, 40)}..."`);

      // Force Single Female Voice
      const femaleSpeaker = 'female';

      // Try Self-Hosted Pro TTS Server First
      ttsService.speak(text, ttsLang, femaleSpeaker)
        .then(() => {
          finishSpeech();
        })
        .catch(() => {
          // Fallback: Web Speech API
          const getBestVoice = () => {
            const voices = window.speechSynthesis.getVoices();
            if (voices.length === 0) return null;

            const langPrefix = targetLangCode.split('-')[0];

            // 1. EXTENDED BLACKLIST for Male voices - explicitly blocking 'Mohan' and others
            const isMale = (v) => {
              const n = v.name.toLowerCase();
              return /male|guy|man|boy|david|mark|ravi|stefan|pavel|deepak|george|paul|richard|thomas|james|robert|marcus|frank|markus|peter|michael|stefen|herman|mohan|kannan|hemant|madhur|prabhat|kiran|rajesh|suresh|abhishek/i.test(n);
            };

            // 2. WHITELIST: High-quality female voices for identity consistency
            const femaleKeywords = ['heera', 'neerja', 'shruti', 'kalpana', 'vani', 'sangeeta', 'swara', 'swarata', 'ananya', 'aarti', 'priya', 'female', 'woman', 'zira', 'samantha', 'google hindi', 'google telugu', 'telugu', 'hindi', 'india', 'natural', 'online'];

            const isFemale = (v) => {
              const n = v.name.toLowerCase();
              if (isMale(v)) return false;
              // If it's in our known female keywords, it's definitely female
              if (femaleKeywords.some(key => n.includes(key))) return true;
              // Otherwise, only accept if it doesn't sound male and isn't a known male name (Safety Valve)
              return !/male|guy|man|boy|pavel|mohan|kannan/i.test(n);
            };

            const allFemale = voices.filter(v => isFemale(v));
            if (allFemale.length === 0) return voices[0];

            // 3. SELECTION LOGIC
            const preferred = ['heera', 'neerja', 'shruti', 'vani'];
            let chosen = null;

            const isMatch = (v) => {
              const vLang = v.lang.toLowerCase().replace('_', '-');
              const vName = v.name.toLowerCase();
              if (vLang.includes(langPrefix)) return true;
              if (langPrefix === 'te' && (vLang.includes('te') || vName.includes('telugu'))) return true;
              return false;
            };

            // A. TRY NATIVE FEMALE FIRST (Find ANY female voice matching the selected language)
            chosen = allFemale.find(v => isMatch(v));

            // B. PROXIMITY CHECK: If multiple native voices, prioritize high-quality ones (Online/Natural)
            if (chosen) {
              const highQualityNative = allFemale.find(v => isMatch(v) && (v.name.includes('Natural') || v.name.includes('Online') || v.name.includes('Google')));
              if (highQualityNative) chosen = highQualityNative;
            }

            // C. MASTER IDENTITY FAILOVER
            if (!chosen) {
              // 1. Check for ANY voice containing "Telugu" in the name (Resort to name-search)
              const nameMatch = voices.find(v => v.name.toLowerCase().includes('telugu') || v.name.includes('తెలుగు'));
              if (nameMatch) {
                console.log("🔍 Found Telugu voice by name-search fallback:", nameMatch.name);
                chosen = nameMatch;
              }

              if (!chosen) {
                const nativeFallback = voices.find(v => isMatch(v));
                if (nativeFallback) {
                  console.log(`ℹ️ Found Native ${targetLangCode} voice (ignoring gender filter).`);
                  chosen = nativeFallback;
                } else {
                  console.log(`ℹ️ No native ${targetLangCode} voice found. Available:`, Array.from(new Set(voices.map(v => v.lang))));
                  // Final identity fallback (Heera/Neerja)
                  for (const key of preferred) {
                    chosen = allFemale.find(v => v.name.toLowerCase().includes(key) && v.lang.includes('IN'));
                    if (chosen) break;
                  }
                }
              }
            }

            return chosen || allFemale[0];
          };

          window.speechSynthesis.cancel();
          setTimeout(() => {
            const voice = getBestVoice();
            const allVoices = window.speechSynthesis.getVoices();

            if (allVoices.length > 0) {
              console.log(`🌐 Total Voices Found: ${allVoices.length}`);
              if (voice) {
                console.log(`🔊 [Selection] Chosen Voice: ${voice.name} (${voice.lang}) for ${targetLangCode}`);
              }
            }
            if (!voice) {
              console.warn("⚠️ No suitable voice found for", targetLangCode);
              finishSpeech();
              return;
            }

            console.log(`🔊 [Browser TTS] Using Voice: ${voice.name} (${voice.lang})`);

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.voice = voice;
            // CRITICAL: Force utterance lang to voice lang to prevent system defaults
            utterance.lang = voice.lang;
            utterance.pitch = 1.1;
            utterance.rate = 1.0;
            utterance.onend = finishSpeech;
            utterance.onerror = (e) => {
              console.error("🔥 Browser TTS Error:", e);
              finishSpeech();
            };

            window.speechSynthesis.speak(utterance);
          }, 50);
        });
    });
  };

  const onSpeechEnd = () => {
    // This is now handled inside the speak promise finishSpeech
  };

  const stopAudio = () => {
    ttsService.stop();
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    // Restart listening if not muted
    setTimeout(() => {
      const { callState: curCallState, isMuted: curIsMuted, isOpen: curIsOpen } = stateRef.current;
      if (curCallState === 'connected' && !curIsMuted && curIsOpen) {
        if (mediaRecorderRef.current?.state === 'inactive') {
          mediaRecorderRef.current.start();
          setIsListening(true);
        }
      }
    }, 400);
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);

    if (nextMuted) {
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      setIsListening(false);
    } else {
      if (callState === 'connected' && mediaRecorderRef.current?.state === 'inactive') {
        mediaRecorderRef.current.start();
        setIsListening(true);
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
        introMsg = `నమస్కారం! నేను ${selectedCompany?.name} కోసం మీ AI అసిస్టెంట్ కేలిక్స్. మళ్లీ మిమ్మల్ని కలవడం సంతోషంగా ఉంది, ${userName}! ${serviceInfo} నేను మీకు ఎలా సహాయం చేయగలను?`;
      } else if (selectedLanguage.code === 'hi-IN') {
        introMsg = `नमस्ते! मैं ${selectedCompany?.name} के लिए आपका AI सहायक सेलिक्स हूं। आपको फिर से देखकर खुशी हुई, ${userName}! ${serviceInfo} मैं आपकी कैसे मदद कर सकता हूं?`;
      } else {
        introMsg = `Hi! I'm Callix, your AI assistant for ${selectedCompany?.name}. Great to see you again, ${userName}! ${serviceInfo} How can I assist you today?`;
      }
    } else {
      setConvoPhase('onboarding');
      // Greet in selected language and ask for name only
      if (selectedLanguage.code === 'te-IN') {
        introMsg = `నమస్కారం! నేను ${selectedCompany?.name} కోసం మీ AI అసిస్టెంట్ కేలిక్స్. మీ పేరు ఏమిటి?`;
      } else if (selectedLanguage.code === 'hi-IN') {
        introMsg = `नमस्ते! मैं ${selectedCompany?.name} के लिए आपका AI सहायक सेलिक्स हूं। आपका नाम क्या है?`;
      } else {
        introMsg = `Hello! I'm Callix, your AI assistant from ${selectedCompany?.name}. May I know your name?`;
      }
    }

    addMessage('agent', introMsg);

    // Ensure voices are loaded before speaking to prevent default male voice greeting
    const startSpeaking = () => {
      speak(introMsg, selectedLanguage.code);
    };

    if (availableVoices.length === 0) {
      window.speechSynthesis.getVoices();
      setTimeout(startSpeaking, 500);
    } else {
      startSpeaking();
    }
  };

  const endCall = () => {
    setCallState('ended');
    setIsListening(false);
    setIsSpeaking(false);
    setMessages([]); // Clear history for next call
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (ringingAudioRef.current) ringingAudioRef.current.pause();
    window.speechSynthesis.cancel();
    ttsService.stop();

    // RESET ALL STATES FOR NEXT CALL
    setTimeout(() => {
      setMessages([]);
      setUserName(user?.user_metadata?.full_name || '');
      setConvoPhase('intro');
      setTranscript('');
      setSelectedLanguage({ code: 'en-IN', name: 'English' });
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
                    { code: 'hi-IN', name: 'Hindi', locked: false },
                    { code: 'te-IN', name: 'Telugu', locked: false },
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
              <div className="relative">
                {/* Decorative Capsule Background - adjusted for smaller size */}
                <div className="absolute inset-0 -m-4 bg-gradient-to-b from-slate-100/50 to-white/30 rounded-[80px] blur-xl -z-10 border border-slate-200/50"></div>

                <motion.div
                  animate={{
                    scale: isSpeaking ? [1, 1.03, 1] : 1,
                    boxShadow: isSpeaking
                      ? ["0 15px 35px rgba(74, 222, 128, 0.2)", "0 25px 50px rgba(74, 222, 128, 0.4)", "0 15px 35px rgba(74, 222, 128, 0.2)"]
                      : isListening
                        ? "0 15px 35px rgba(59, 130, 246, 0.2)"
                        : "0 15px 35px rgba(0, 0, 0, 0.1)"
                  }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className={`w-48 h-48 md:w-56 md:h-56 aspect-square rounded-full overflow-hidden border-[6px] transition-all duration-500 flex items-center justify-center p-1.5 bg-white ${isSpeaking ? 'border-green-400' : isListening ? 'border-blue-600' : 'border-slate-100'
                    }`}
                >
                  <img src={agentAvatar} className="w-full h-full object-cover rounded-full shadow-inner" alt="Callix Agent" />
                </motion.div>
              </div>

              <div className="mt-10 text-center flex flex-col items-center">
                <h3 className="text-4xl font-black text-slate-900 tracking-tight">Callix</h3>
                <p className="text-blue-700 font-extrabold uppercase tracking-[0.4em] text-[10px] mt-2 bg-blue-50 px-4 py-1 rounded-full border border-blue-100">
                  {selectedCompany?.name || 'VIRTUAL ASSISTANT'}
                </p>

                {/* Real-time Indicator & Waveform */}
                <div className="flex flex-col items-center gap-4 mt-6">
                  {/* <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 rounded-full border border-green-500/20">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">Deepgram 100% Native Active</span>
                  </div> */}

                  {isListening && !isSpeaking && (
                    <div className="flex items-center gap-1 h-8">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                        <motion.div
                          key={i}
                          animate={{ height: [8, Math.random() * 24 + 8, 8] }}
                          transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                          className="w-1 bg-blue-500 rounded-full"
                        />
                      ))}
                    </div>
                  )}

                  <div className="flex flex-col items-center gap-1">
                    <div className="flex flex-col items-center gap-2">
                      <div className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase flex items-center space-x-2 border transition-all duration-300 ${isSpeaking ? 'bg-green-100 text-green-700 border-green-200' : isThinking ? 'bg-purple-100 text-purple-700 border-purple-200' : isTranscribing ? 'bg-orange-100 text-orange-700 border-orange-200' : isListening ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`} style={{ transform: `scale(${isListening && !isSpeaking ? pulseScale : 1})` }}>
                        <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isSpeaking ? 'bg-green-500' : isThinking ? 'bg-purple-500' : isTranscribing ? 'bg-orange-500' : isListening ? 'bg-blue-500' : 'bg-slate-400'}`}></div>
                        <span>{isSpeaking ? 'Agent Speaking' : isThinking ? 'AI Thinking...' : isTranscribing ? 'Transcribing...' : isListening ? 'Listening' : 'Ready'}</span>
                      </div>
                      {isUserTalking && !isSpeaking && (
                        <span className="text-[10px] font-bold text-blue-500 animate-bounce">⚡ You are speaking...</span>
                      )}
                    </div>
                    {/* {useProSTT && (
                      <span className="text-[8px] text-blue-400 font-bold uppercase tracking-widest">✨ Pro AI STT Active (Deepgram)</span>
                    )} */}
                  </div>
                </div>

                <div className="mt-8 flex items-center space-x-4">
                  <button onClick={toggleMute} title={isMuted ? "Unmute" : "Mute"} className={`p-4 rounded-full shadow-lg transition-all ${isMuted ? 'bg-red-500 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'}`}>
                    {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                  </button>
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