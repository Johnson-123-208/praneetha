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
  const [selectedLanguage, setSelectedLanguage] = useState({ code: 'en-US', name: 'English' });

  const recognitionRef = useRef(null);
  const synthesisRef = useRef(null);
  const ringingAudioRef = useRef(null);
  const chatEndRef = useRef(null);

  const languageLookup = {
    'en-US': 'English',
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
    userName
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
      userName
    };
  }, [callState, isListening, isSpeaking, isMuted, isOpen, convoPhase, userName]);

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

    const timer = setTimeout(() => {
      if (ringingAudioRef.current) {
        ringingAudioRef.current.pause();
      }

      setCallState('connected');

      // CALLIX INTRODUCTION LOGIC
      let introMsg = "";
      if (userName && userName !== 'Guest') {
        setConvoPhase('chatting');
        introMsg = `Hi! I'm Callix, your AI assistant for ${selectedCompany?.name}. Great to see you again, ${userName}! How can I assist you today?`;
      } else {
        setConvoPhase('onboarding');
        introMsg = `Hello! I'm Callix, your AI assistant from ${selectedCompany?.name}. To get started, may I know your name and your preferred language?`;
      }

      addMessage('agent', introMsg);
      speak(introMsg);
    }, 1500);

    return () => {
      clearTimeout(timer);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (ringingAudioRef.current) {
        ringingAudioRef.current.pause();
      }
      window.speechSynthesis.cancel();
    };
  }, [isOpen]);

  const getServiceInfo = (langCode = 'en-US') => {
    const name = selectedCompany?.name || 'Aarogya';
    const sMap = {
      'en-US': {
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
      }
    };

    const strings = sMap[langCode] || sMap['en-US'];
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

        if (similarity(message, lastAgentMsg.text) > 0.6) { // Lowered threshold slightly to catch more echoes
          console.log("Echo detected, ignoring message.");
          setIsProcessing(false);
          return;
        }
      }

      // Phase 1: Name Extraction
      // Phase 1: Onboarding (Name & Language)
      if (convoPhase === 'onboarding') {
        const lowerMsg = message.toLowerCase();
        let newLang = { code: 'en-US', name: 'English' };
        if (lowerMsg.includes('hindi') || lowerMsg.includes('हिंदी')) newLang = { code: 'hi-IN', name: 'Hindi' };
        else if (lowerMsg.includes('telugu') || lowerMsg.includes('తెలుగు')) newLang = { code: 'te-IN', name: 'Telugu' };
        else if (lowerMsg.includes('tamil') || lowerMsg.includes('தமிழ்')) newLang = { code: 'ta-IN', name: 'Tamil' };
        else if (lowerMsg.includes('kannada') || lowerMsg.includes('ಕನ್ನಡ')) newLang = { code: 'kn-IN', name: 'Kannada' };
        else if (lowerMsg.includes('marathi') || lowerMsg.includes('मराठी')) newLang = { code: 'mr-IN', name: 'Marathi' };

        setSelectedLanguage(newLang);

        // Improved Name Extraction
        let extractedName = 'Guest';
        const cleanMsg = message.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").trim();
        const nameMatch = cleanMsg.match(/(?:name is|i am|i'm|call me|this is) ([a-zA-Z]+)/i);

        if (nameMatch) {
          extractedName = nameMatch[1];
        } else {
          const words = cleanMsg.split(' ').filter(w => !['telugu', 'hindi', 'english', 'tamil', 'language', 'continue', 'want', 'with', 'and', 'my', 'name', 'is', 'hi', 'hello', 'prefer'].includes(w.toLowerCase()));
          if (words.length > 0) extractedName = words[0];
        }

        setConvoPhase('chatting');

        const response = newLang.code === 'en-US'
          ? `Nice to meet you, ${extractedName}! ${getServiceInfo('en-US')}`
          : newLang.code === 'te-IN'
            ? `${extractedName}, మిమ్మల్ని కలవడం సంతోషం! ${getServiceInfo('te-IN')}`
            : newLang.code === 'hi-IN'
              ? `${extractedName}, आपसे मिलकर खुशी हुई! ${getServiceInfo('hi-IN')}`
              : `Nice to meet you ${extractedName}! I will now proceed in ${newLang.name}. ${getServiceInfo('en-US')}`;

        addMessage('agent', response);
        await speak(response, newLang.code);
        setIsProcessing(false);
        return;
      }

      // Phase 2: Main Flow
      try {
        // Select specialized prompt based on industry
        let specializedPrompt = DefaultPrompt;
        const industry = selectedCompany?.industry?.toLowerCase() || '';
        const compName = selectedCompany?.name?.toLowerCase() || '';

        if (industry.includes('health') || compName.includes('hospital') || compName.includes('aarogya')) {
          specializedPrompt = HospitalPrompt;
        } else if (industry.includes('restaur') || compName.includes('garden') || compName.includes('food')) {
          specializedPrompt = RestaurantPrompt;
        } else if (industry.includes('commerce') || compName.includes('kart') || compName.includes('store')) {
          specializedPrompt = ECommercePrompt;
        }

        const systemPrompt = `You are Callix, the high-performance AI voice assistant for ${selectedCompany?.name}.
      
      ${specializedPrompt}
      
      USER PROFILE:
      - Name: ${userName || 'Unknown'}
      - Preferred Language: ${selectedLanguage.name} (Responde ONLY in this language!)
      
      CONVERSATION RULES:
      - CONTEXT IS EVERYTHING: Look at the History below.
      - Snappy responses: Max 20 words for smooth voice interaction.
      - Directness: Answer concisely. If you don't know something about the company, say you will check with the team.
      
      CURRENT CONTEXT (HISTORY):
      ${historyContext}`;

        const aiResponse = await chatWithGroq(
          `User Message: ${message}`,
          messages.map(m => ({ role: m.sender === 'user' ? 'user' : 'assistant', text: m.text })),
          selectedCompany,
          systemPrompt
        );

        // Clean up response
        const cleanedResponse = aiResponse.replace(/\(Note:.*?\)|System:.*?:|Internal:.*?:/gi, '').trim();

        addMessage('agent', cleanedResponse);
        await speak(cleanedResponse, selectedLanguage.code);
      } catch (error) {
        console.error('Groq Error:', error);
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
      // Determine language name for backend (English, Hindi, Telugu, etc.)
      const targetLangCode = languageCode || selectedLanguage.code;
      const targetLang = languageLookup[targetLangCode] || 'English';

      // IMPORTANT: Set speaking state BEFORE starting
      setIsSpeaking(true);

      // Safety: stop record before speak
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
          setIsListening(false);
        } catch (e) { }
      }

      // Try High-Quality Self-Hosted Edge-TTS First
      try {
        console.log(`Attempting TTS for ${targetLang}...`);
        await ttsService.speak(text, targetLang, agentGender);
        onSpeechEnd();
        return;
      } catch (error) {
        console.warn('Neural TTS Backend issue. Falling back to browser voice...', error);
      }

      // Fallback: Web Speech API (Basic)
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = languageCode || selectedLanguage.code;
      utterance.rate = 1.0;
      utterance.pitch = agentGender === 'female' ? 1.05 : 0.95;

      // Voice Selection with Gender AND Language Matching
      const voices = window.speechSynthesis.getVoices();
      const langPrefix = utterance.lang.split('-')[0];

      // Wider search for regional voices
      let selectedVoice = voices.find(v =>
        v.lang.startsWith(langPrefix) &&
        (agentGender === 'female'
          ? /female|woman|samantha|zira|victoria|google us english|moira|hi-IN-Female|te-IN-Female/i.test(v.name) || v.name.includes("తెలుగు") || v.name.includes("हिन्दी")
          : /male|man|david|daniel|google uk english male|alex|hi-IN-Male|te-IN-Male/i.test(v.name))
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

          {/* Connection Phase */}
          {callState === 'ringing' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="relative mb-12">
                <div className="absolute inset-0 flex items-center justify-center"><div className="w-64 h-64 rounded-full bg-blue-100/50 animate-pulse"></div></div>
                <div className="relative z-10 w-32 h-32 rounded-full overflow-hidden border-4 border-[#000080] shadow-xl">
                  <img src={agentAvatar} className="w-full h-full object-cover" />
                </div>
              </div>
              <h2 className="text-4xl font-black text-slate-800">Callix Connecting...</h2>
              <p className="text-slate-500 mt-2 font-bold uppercase tracking-widest">{selectedCompany?.name}</p>
              <button onClick={endCall} className="mt-12 p-6 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-all"><PhoneOff size={32} /></button>
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