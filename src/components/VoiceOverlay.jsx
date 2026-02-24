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
  console.log("📟 VoiceOverlay V3 - Fallback Fix Active");
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

  // Helper to get name from user object or email
  const getNameFromUser = (u) => {
    if (!u) return '';
    if (u.user_metadata?.full_name) return u.user_metadata.full_name;
    if (u.email) {
      // Extract part before @, replace dots/underscores with space, and capitalize words
      const namePart = u.email.split('@')[0];
      return namePart
        .split(/[._]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
    return '';
  };

  // Advanced conversation state
  const [convoPhase, setConvoPhase] = useState(getNameFromUser(user) ? 'chatting' : 'intro');
  const [userName, setUserName] = useState(getNameFromUser(user));
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
  const speechDetectedRef = useRef(false);
  const silenceTimerRef = useRef(null);

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
      const derivedName = getNameFromUser(user);
      setUserName(derivedName);
      setUserEmail(user.email || '');
      if (derivedName) setConvoPhase('chatting');
    }
  }, [user]);

  // Pro STT Logic (MediaRecorder + Azure AI Speech) - STOP-WAIT-RESTART PATTERN
  const startProSTT = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true // Enabled for better sensitivity on mobile/remote
        }
      });

      const mimeType = MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')
        ? 'audio/ogg;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio';

      console.log(`🎙️ Using Audio Format: ${mimeType}`);

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
        const hadSpeech = speechDetectedRef.current;

        audioChunksRef.current = []; // Clear immediately
        speechDetectedRef.current = false; // Reset for next session

        const { selectedLanguage: curLang, isSpeaking, isMuted, callState, isOpen } = stateRef.current;

        // Skip if no speech detected or too small or call ended
        if (!hadSpeech || audioBlob.size < 2000 || isMuted || isSpeaking || callState !== 'connected' || !isOpen) {
          if (hadSpeech && audioBlob.size < 2000) console.log("🤏 Audio too short, skipping.");
          setIsProcessing(false);
          return;
        }

        console.log(`🎙️ Sending Speech Chunk (${audioBlob.size} bytes) to Cloud STT...`);
        setIsProcessing(true);
        try {
          setIsTranscribing(true);
          let text = await sttService.transcribe(audioBlob, curLang.code);
          console.log(`🎤 STT Result: "${text}"`);

          setIsTranscribing(false);

          if (text && text.trim().length > 1) {
            await handleUserMessage(text, true);
          } else {
            setIsProcessing(false);
          }
        } catch (e) {
          console.error('❌ STT Pipeline failed:', e);
        } finally {
          setIsTranscribing(false);
          setIsProcessing(false);

          // Restart recording if we're still in a state to listen
          const { isSpeaking: finalIsSpeaking, isMuted: finalIsMuted, callState: finalCallState, isOpen: finalIsOpen } = stateRef.current;
          if (finalCallState === 'connected' && finalIsOpen && !finalIsSpeaking && !finalIsMuted) {
            if (mediaRecorderRef.current?.state === 'inactive') {
              mediaRecorderRef.current.start();
              setIsListening(true);
            }
          }
        }
      };

      // Setup Web Audio API for volume detection
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

      // SAFETY ROTATION: Only used as a hard limit for very long monologues
      restartFlushRef.current = () => {
        if (flushIntervalRef.current) clearInterval(flushIntervalRef.current);
        flushIntervalRef.current = setInterval(() => {
          const { isSpeaking, isMuted, callState, isOpen } = stateRef.current;
          if (mediaRecorderRef.current?.state === 'recording' && !isSpeaking && !isMuted && callState === 'connected' && isOpen) {
            // Only rotate if we've actually been talking for a long time
            if (speechDetectedRef.current) {
              console.log("⏹️ Hard-limit rotation (20s monologue)...");
              mediaRecorderRef.current.stop();
            }
          }
        }, 20000);
      };

      mediaRecorder.start();
      restartFlushRef.current();
      setIsListening(true);
      console.log("⏺️ STT Listener Active");

      const checkVolume = () => {
        const { isOpen: curIsOpen, callState: curCallState, isSpeaking: curIsSpeaking } = stateRef.current;
        if (!curIsOpen || curCallState !== 'connected' || !analyserRef.current) return;

        if (mediaRecorder.state === 'recording' && !curIsSpeaking) {
          const currentAnalyser = analyserRef.current;
          const currentDataArray = dataArrayRef.current;
          if (currentAnalyser && currentDataArray) {
            currentAnalyser.getByteFrequencyData(currentDataArray);
            const volume = currentDataArray.reduce((num, i) => num + i) / currentDataArray.length;
            setPulseScale(1 + (volume / 255) * 0.4);

            const isTalking = volume > 15;
            setIsUserTalking(isTalking);

            if (isTalking) {
              speechDetectedRef.current = true;
              // Clear silence timer if user starts talking again
              if (silenceTimerRef.current) {
                clearTimeout(silenceTimerRef.current);
                silenceTimerRef.current = null;
              }
            } else if (speechDetectedRef.current) {
              // User was talking but stopped. Start 1.5s silence timer to cut the chunk.
              if (!silenceTimerRef.current) {
                silenceTimerRef.current = setTimeout(() => {
                  console.log("🤫 Silence detected. Processing...");
                  if (mediaRecorderRef.current?.state === 'recording') {
                    mediaRecorderRef.current.stop();
                  }
                  silenceTimerRef.current = null;
                }, 700);
              }
            }
          }
        }
        requestAnimationFrame(checkVolume);
      };
      requestAnimationFrame(checkVolume);

      sttCleanupRef.current = () => {
        try {
          if (flushIntervalRef.current) clearInterval(flushIntervalRef.current);
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
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
      console.log(`🚀 [STT] Activating Azure AI Speech for ${selectedLanguage.name}...`);
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
      'en-IN': {
        hospital: "I'm here to help with your appointments and doctor details.",
        restaurant: "I can help with our menu, specials, and table bookings.",
        ecommerce: "I can assist with product pricing and order tracking.",
        tech_mahindra: "I can guide you through our open roles and interviews.",
        voxsphere: "I can walk you through our AI solutions and book a demo.",
        agile_it: "I'm here to help with career queries and technical interviews.",
        default: "I'm here to assist you today."
      },
      'te-IN': {
        hospital: "నేను మీ డాక్టర్ అపాయింట్‌మెంట్‌లు మరియు విచారణలో సహాయపడగలను.",
        restaurant: "నేను మా రుచికరమైన మెనూ మరియు టేబుల్ బుకింగ్‌లలో మీకు సహాయం చేస్తాను.",
        ecommerce: "నేను మీకు కావలసిన ప్రోడక్ట్స్ ధరలు మరియు ఆర్డర్లను ట్రాక్ చేయడంలో సహాయపడతాను.",
        tech_mahindra: "నేను మా వద్ద ఉన్న ఉద్యోగ అవకాశాలు మరియు ఇంటర్వ్యూలలో మీకు సహాయపడగలను.",
        voxsphere: "నేను మా AI సర్వీసెస్ మరియు డెమో బుకింగ్‌లలో మీకు సహాయం చేస్తాను.",
        agile_it: "నేను మీ టెక్నికల్ ఇంటర్వ్యూలు మరియు కెరీర్ ప్రశ్నలకు సహాయం చేయగలను.",
        default: "నేను ఈరోజు మీకు సహాయం చేయడానికి ఇక్కడ ఉన్నాను."
      },
      'hi-IN': {
        hospital: "मैं आपके डॉक्टर अपॉइंटमेंट और पूछताछ में आपकी मदद कर सकता हूँ।",
        restaurant: "मैं हमारे मेनू और टेबल बुकिंग में आपकी मदद कर सकता हूँ।",
        ecommerce: "मैं उत्पादों की कीमत और ऑर्डर ट्रैक करने में आपकी मदद कर सकता हूँ।",
        tech_mahindra: "मैं नौकरियों के अवसर और इंटरव्यू में आपकी मदद कर सकता हूँ।",
        voxsphere: "मैं हमारी एआई सेवाओं और डेमो बुक करने में आपकी मदद कर सकता हूँ।",
        agile_it: "मैं आपकी तकनीकी इंटरव्यू और करियर के सवालों में मदद कर सकता हूँ।",
        default: "मैं आज आपकी मदद करने के लिए यहाँ हूँ।"
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
            const capWords = words.filter(w => w[0] === w[0].toUpperCase() && /[a-zA-Z]/.test(w[0]) && w.length > 1);
            if (capWords.length > 0) {
              extractedName = capWords[capWords.length - 1];
            } else {
              extractedName = words[words.length - 1]; // Fallback to last word (Great for Telugu)
            }
          }
        }

        // Update name and transition phase
        setUserName(extractedName);
        setConvoPhase('chatting');
        stateRef.current.userName = extractedName;
        stateRef.current.convoPhase = 'chatting';

        // Greet in selected language with FULL service info
        let response = '';
        const serviceInfo = getServiceInfo(curLang.code);

        if (curLang.code === 'te-IN') {
          response = `నమస్కారం ${extractedName}! మా ${selectedCompany?.name} కు స్వాగతం. ${serviceInfo} నేను మీకు ఎలా సహాయం చేయగలను?`;
        } else if (curLang.code === 'hi-IN') {
          response = `नमस्ते ${extractedName}! ${selectedCompany?.name} में आपका स्वागत है। ${serviceInfo} मैं आपकी किस प्रकार सहायता कर सकता हूँ?`;
        } else {
          response = `Hello ${extractedName}! Welcome to ${selectedCompany?.name}. ${serviceInfo} How can I help you?`;
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

      let companyDesc = "Standard business operations";
      if (industry.includes('health')) companyDesc = "We are a multi-speciality hospital providing 24/7 care and advanced diagnostics.";
      else if (industry.includes('restaur')) companyDesc = "We are a premium fine dine restaurant specializing in North Indian and Multi-cuisine delicacies.";
      else if (industry.includes('commerce')) companyDesc = "We are an electronics mega-store providing fast delivery and the best gadget deals.";
      else if (industry.includes('tech')) companyDesc = "We are a global IT solutions provider specializing in digital transformation and career growth.";

      if (industry.includes('health') || compName.includes('hospital') || compName.includes('aarogya')) specializedPrompt = HospitalPrompt;
      else if (industry.includes('restaur') || compName.includes('garden')) specializedPrompt = RestaurantPrompt;
      else if (industry.includes('commerce') || compName.includes('kart')) specializedPrompt = ECommercePrompt;
      else if (industry.includes('business') || industry.includes('tech')) specializedPrompt = BusinessPrompt;
      // Strong language enforcement
      let languageInstruction = '';
      if (curLang.code === 'te-IN') {
        languageInstruction = '\n\nCRITICAL: Respond in Telugu script (తెలుగు). Use a warm, natural conversational tone. Use common English loanwords (like "Table", "Booking", "Confirm", "Doctor", "Menu") in Telugu script if they are clearer than formal Telugu words.';
      } else if (curLang.code === 'hi-IN') {
        languageInstruction = '\n\nCRITICAL: Respond in Hindi script (हिंदी). Use a warm, natural conversational tone. Use common English loanwords (like "Table", "Booking", "Confirm", "Doctor", "Menu") in Hindi script if they are clearer than formal Hindi words.';
      } else if (curLang.code === 'ta-IN') {
        languageInstruction = '\n\nCRITICAL: You MUST respond ONLY in Tamil language. Use Tamil script (தமிழ்). Do NOT use English words.';
      } else if (curLang.code === 'kn-IN') {
        languageInstruction = '\n\nCRITICAL: You MUST respond ONLY in Kannada language. Use Kannada script (ಕನ್ನಡ). Do NOT use English words.';
      } else if (curLang.code === 'mr-IN') {
        languageInstruction = '\n\nCRITICAL: You MUST respond ONLY in Marathi language. Use Devanagari script (मराठी). Do NOT use English words.';
      } else if (curLang.code === 'ml-IN') {
        languageInstruction = '\n\nCRITICAL: You MUST respond ONLY in Malayalam language. Use Malayalam script (മലയാളം). Do NOT use English words.';
      } else {
        languageInstruction = '\n\nCRITICAL: You MUST respond ONLY in English language. Use normal English script. Do NOT use any other language or script.';
      }

      const latestName = stateRef.current.userName || 'Guest';

      const systemPrompt = `
IDENTITY: You are Callix for ${selectedCompany?.name}.
${specializedPrompt}
BUSINESS DATA (Use THESE FACTS only):
${selectedCompany?.nlp_context || 'Standard business operations'}

USER CONTEXT: Name is ${latestName}.
COMPANY DESCRIPTION: ${companyDesc}
LANGUAGE: Response MUST be in ${curLang.name} using ${curLang.name} script.

STRICT CONVERSATIONAL FLOW & RULES:
1. GREETING TURN: In your VERY FIRST response (Turn 1), you MUST greet the user by name, welcome them, and ask how to help.
2. NO REPETITION: Do NOT repeat greetings or the user's name in subsequent turns.
3. BREVITY: Keep responses extremely concise (1-2 sentences).
4. ACTION CONFIRMATION: Once an action is done (booking/order), confirm natively. Example (Telugu): "మీ కోసం [Action] పూర్తి చేశాను. మీకు ఇంకేమైనా సహాయం కావాలా?"
5. DATES: For relative dates like "tomorrow", "today", or "day after tomorrow", always use those LITERAL words in the command (e.g., [BOOK_TABLE for 2 on tomorrow at 4pm]).
6. CLOSING FLOW: If user says "No" or "Nothing", say: "సరే అండీ. వెళ్లే ముందు నా సర్వీస్‌కు 1 నుండి 5 వరకు రేటింగ్ ఇస్తారా?" (Rating ask).
7. EXIT: Once they give a rating, say: "ధన్యవాదాలు! సెలవు!" (Goodbye) and output [HANG_UP] on a new line.
8. NO ENGLISH FRAGMENTS: Never output fragments like "for 4 on tomorrow". Use purely native sentences.

${languageInstruction}
`;

      const rawResponse = await chatWithGroq(
        `User Message: ${message}`,
        currentMessages.map(m => ({ role: m.sender === 'user' ? 'user' : 'assistant', text: m.text })),
        {
          ...selectedCompany,
          userName: latestName,
          userEmail,
          sessionId,
          currLangCode: curLang.code,
          currLangName: curLang.name
        },
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

        // Helper to resolve relative dates to absolute YYYY-MM-DD
        const resolveDate = (dateStr) => {
          const lower = dateStr.toLowerCase();
          const now = new Date();

          if (lower.includes('tomorrow')) {
            const tomorrow = new Date(now);
            tomorrow.setDate(now.getDate() + 1);
            return tomorrow.toISOString().split('T')[0];
          }
          if (lower.includes('today')) {
            return now.toISOString().split('T')[0];
          }
          if (lower.includes('day after tomorrow')) {
            const dat = new Date(now);
            dat.setDate(now.getDate() + 2);
            return dat.toISOString().split('T')[0];
          }

          // If it's already a date or something else, return as is (but try to clean)
          return dateStr;
        };

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
            const rawDate = appointmentMatch[2].trim();
            const dateStr = resolveDate(rawDate);
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
            const rawDate = tableMatch[2].trim();
            const dateStr = resolveDate(rawDate);
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

      // await processCommands(rawResponse); // REMOVED: Redundant with chatWithGroq tool calling

      setIsThinking(false);

      // 2. Clean response for Display & TTS using common utility
      const getProcMsg = (lang) => {
        if (lang.includes('te')) return "సరే, మీ వివరాలను సేవ్ చేస్తున్నాను, దయచేసి ఒక క్షణం ఆగండి...";
        if (lang.includes('hi')) return "ठीक है, मैं आपकी जानकारी सहेज रहा हूँ, कृपया एक क्षण प्रतीक्षा करें...";
        return "One moment, I am saving those details for you...";
      };

      const finalDisplay = cleanInternalCommands(rawResponse) || getProcMsg(curLang.code);
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

      let errorMsg = "I'm sorry, I missed that. Could you repeat it?";

      // Specific handling for Groq Limit Reached
      if (error.message.includes('429')) {
        const lang = selectedLanguage.code;
        if (lang === 'te-IN') {
          errorMsg = "క్షమించండి, నా రోజువారీ పరిమితి ముగిసింది. దయచేసి సెట్టింగ్స్‌లో కొత్త API కీని ఉపయోగించండి.";
        } else if (lang === 'hi-IN') {
          errorMsg = "क्षमा करें, मेरी दैनिक सीमा समाप्त हो गई है। कृपया सेटिंग्स में एक नई API कुंजी का उपयोग करें।";
        } else {
          errorMsg = "I'm sorry, the AI limit has been reached for today. Please update the API key in settings to continue.";
        }
      }

      addMessage('agent', errorMsg);
      await speak(errorMsg, selectedLanguage.code);
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
          const voices = window.speechSynthesis.getVoices();
          const getBestVoice = () => {
            if (voices.length === 0) return null;

            const target = targetLangCode.toLowerCase();
            const isMale = (v) => /male|guy|man|boy|mohan|kannan|ravi|david|mark|deepak|stefan/i.test(v.name.toLowerCase());
            const isFemale = (v) => !isMale(v);

            let chosen = null;

            // 1. HARD-LOCK FOR TELUGU
            if (target.includes('te')) {
              // Priority 1: Female Telugu
              chosen = voices.find(v =>
                (v.lang.toLowerCase().includes('te') || v.name.toLowerCase().includes('telugu')) && isFemale(v)
              );

              // Priority 2: Any Telugu (including Mohan if that's all there is)
              if (!chosen) {
                chosen = voices.find(v => v.lang.toLowerCase().includes('te') || v.name.toLowerCase().includes('telugu'));
              }

              // Priority 3: Female Hindi (Polyglot Fallback)
              if (!chosen || (chosen && isMale(chosen))) {
                const femaleHindi = voices.find(v => (v.lang.toLowerCase().includes('hi') || v.name.toLowerCase().includes('hindi')) && isFemale(v));
                if (femaleHindi) {
                  console.log("🇮🇳 [Gender-Fix] Preferring Female Hindi over Male Telugu for identity compatibility.");
                  chosen = femaleHindi;
                }
              }
            }
            // 2. HARD-LOCK FOR HINDI
            else if (target.includes('hi')) {
              chosen = voices.find(v => (v.lang.toLowerCase().includes('hi') || v.name.toLowerCase().includes('hindi')) && isFemale(v)) ||
                voices.find(v => v.lang.toLowerCase().includes('hi') || v.name.toLowerCase().includes('hindi'));
            }
            // 3. HARD-LOCK FOR ENGLISH (INDIA)
            else {
              chosen = voices.find(v => (v.lang.toLowerCase().includes('en-in') || v.name.toLowerCase().includes('india')) && isFemale(v)) ||
                voices.find(v => v.lang.toLowerCase().includes('en-in') || v.name.toLowerCase().includes('india')) ||
                voices.find(v => v.lang.toLowerCase().includes('en') && isFemale(v)) ||
                voices[0];
            }

            return chosen || voices[0];
          };

          window.speechSynthesis.cancel();
          setTimeout(() => {
            const voice = getBestVoice();
            if (voice || voices.length > 0) {
              const selectedVoice = voice || voices[0];
              console.log(`🔊 [Selection] Locked onto: ${selectedVoice.name} (${selectedVoice.lang}) for ${targetLangCode}`);
              const utterance = new SpeechSynthesisUtterance(text);
              utterance.voice = selectedVoice;
              utterance.lang = selectedVoice.lang;
              utterance.pitch = 1.1;
              utterance.rate = 1.0;
              utterance.onend = finishSpeech;
              utterance.onerror = (e) => {
                console.error("🔥 Browser TTS Error:", e);
                finishSpeech();
              };
              window.speechSynthesis.speak(utterance);
            } else {
              console.warn("⚠️ No suitable voice found for", targetLangCode);
              finishSpeech();
            }
          }, 100);
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
    const nextPhase = stateRef.current.userName ? 'chatting' : 'onboarding';
    setConvoPhase(nextPhase);
    stateRef.current.convoPhase = nextPhase;

    // Start listening immediately - user speaks first
    setTimeout(() => {
      if (mediaRecorderRef.current?.state === 'inactive') {
        mediaRecorderRef.current.start();
        setIsListening(true);
      }
    }, 500);
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
            <div className="md:w-1/2 flex flex-col items-center justify-center p-4 md:p-8 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200 relative shrink-0">
              <div className="relative">
                {/* Decorative Capsule Background */}
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
                  className={`w-32 h-32 md:w-56 md:h-56 aspect-square rounded-full overflow-hidden border-[4px] md:border-[6px] transition-all duration-500 flex items-center justify-center p-1.5 bg-white ${isSpeaking ? 'border-green-400' : isListening ? 'border-blue-600' : 'border-slate-100'
                    }`}
                >
                  <img src={agentAvatar} className="w-full h-full object-cover rounded-full shadow-inner" alt="Callix Agent" />
                </motion.div>
              </div>

              <div className="mt-4 md:mt-10 text-center flex flex-col items-center">
                <h3 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight">Callix</h3>
                <p className="text-blue-700 font-extrabold uppercase tracking-[0.2em] md:tracking-[0.4em] text-[8px] md:text-[10px] mt-2 bg-blue-50 px-4 py-1 rounded-full border border-blue-100">
                  {selectedCompany?.name || 'VIRTUAL ASSISTANT'}
                </p>

                {/* Real-time Indicator & Waveform */}
                <div className="flex flex-col items-center gap-2 md:gap-4 mt-4 md:mt-6">
                  {isListening && !isSpeaking && (
                    <div className="flex items-center gap-1 h-6 md:h-8">
                      {[1, 2, 3, 4, 5].map(i => (
                        <motion.div
                          key={i}
                          animate={{ height: [4, Math.random() * 16 + 4, 4] }}
                          transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                          className="w-1 bg-blue-500 rounded-full"
                        />
                      ))}
                    </div>
                  )}

                  <div className="flex flex-col items-center gap-1">
                    <div className="flex flex-col items-center gap-2">
                      <div className={`px-3 py-1 md:px-4 md:py-1.5 rounded-full text-[8px] md:text-[10px] font-black tracking-widest uppercase flex items-center space-x-2 border transition-all duration-300 ${isSpeaking ? 'bg-green-100 text-green-700 border-green-200' : isThinking ? 'bg-purple-100 text-purple-700 border-purple-200' : isTranscribing ? 'bg-orange-100 text-orange-700 border-orange-200' : isListening ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`} style={{ transform: `scale(${isListening && !isSpeaking ? pulseScale : 1})` }}>
                        <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isSpeaking ? 'bg-green-500' : isThinking ? 'bg-purple-500' : isTranscribing ? 'bg-orange-500' : isListening ? 'bg-blue-500' : 'bg-slate-400'}`}></div>
                        <span>{isSpeaking ? 'Speaking' : isThinking ? 'Thinking' : isTranscribing ? 'Transcribing' : isListening ? 'Listening' : 'Ready'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 md:mt-8 flex items-center space-x-3 md:space-x-4">
                  <button onClick={toggleMute} className={`p-3 md:p-4 rounded-full shadow-lg transition-all ${isMuted ? 'bg-red-500 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'}`}>
                    {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                  </button>
                  {isSpeaking && (
                    <button onClick={stopAudio} className="p-3 md:p-4 bg-orange-500 text-white rounded-full shadow-lg hover:bg-orange-600 animate-bounce">
                      <VolumeX size={20} />
                    </button>
                  )}
                  <button onClick={endCall} className="p-3 md:p-4 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 transform hover:scale-110"><PhoneOff size={20} /></button>
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