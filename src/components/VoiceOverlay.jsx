import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, MicOff, Volume2, VolumeX, User, Bot } from 'lucide-react';
import { chatWithGroq, isGroqInitialized, initializeGroq } from '../utils/groq.js';
import { detectLanguage, SUPPORTED_LANGUAGES, getLanguageCode } from '../utils/languageDetection.js';
import { AudioProcessor } from '../utils/audio.js';
import { database } from '../utils/database.js';

const VoiceOverlay = ({ isOpen, onClose, selectedCompany = null }) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcription, setTranscription] = useState([]);
  const [currentLanguage, setCurrentLanguage] = useState(SUPPORTED_LANGUAGES.ENGLISH);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [error, setError] = useState(null);

  const audioProcessorRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const recognitionRef = useRef(null);
  const volumeIntervalRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // Initialize Groq API if not already done
      const apiKey = import.meta.env.VITE_GROQ_API_KEY || '';
      if (apiKey && !isGroqInitialized()) {
        initializeGroq(apiKey);
      }

      // Initialize audio processor
      audioProcessorRef.current = new AudioProcessor();
      audioProcessorRef.current.initialize();

      // Initialize Web Speech API for real-time transcription
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US,hi-IN,te-IN,ta-IN,kn-IN,ml-IN,mr-IN';

        recognitionRef.current.onresult = (event) => {
          let finalTranscript = '';
          let interimTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' ';
            } else {
              interimTranscript += transcript;
            }
          }

          if (finalTranscript) {
            handleUserSpeech(finalTranscript.trim());
          }
        };

        recognitionRef.current.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setError(`Speech recognition error: ${event.error}`);
        };
      }

      // Start with English greeting
      const welcomeMessage = selectedCompany
        ? `Hello! I'm your AI calling agent for ${selectedCompany.name}. How can I assist you today?`
        : 'Hello! I\'m your AI calling agent. How can I assist you today?';

      setTranscription([{
        role: 'agent',
        text: welcomeMessage,
        timestamp: new Date().toISOString(),
      }]);

      // Speak welcome message (if TTS available)
      speakText(welcomeMessage);
    }

    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (volumeIntervalRef.current) {
        clearInterval(volumeIntervalRef.current);
      }
    };
  }, [isOpen, selectedCompany]);

  const handleUserSpeech = async (text) => {
    if (!text || isProcessing) return;

    // Detect language
    const detectedLang = detectLanguage(text);
    setCurrentLanguage(detectedLang);

    // Add user message to transcription
    const userMessage = {
      role: 'user',
      text,
      timestamp: new Date().toISOString(),
      language: detectedLang.name,
    };

    setTranscription(prev => [...prev, userMessage]);
    setConversationHistory(prev => [...prev, { role: 'user', text }]);

    setIsProcessing(true);
    setError(null);

    try {
      // Get company context if available
      const companyContext = selectedCompany
        ? database.getCompany(selectedCompany.id)
        : null;

      // Call Groq API
      const response = await chatWithGroq(text, conversationHistory, companyContext);

      // Add agent response
      const agentMessage = {
        role: 'agent',
        text: response,
        timestamp: new Date().toISOString(),
        language: currentLanguage.name,
      };

      setTranscription(prev => [...prev, agentMessage]);
      setConversationHistory(prev => [...prev, { role: 'model', text: response }]);

      // Speak response
      await speakText(response);

      // Check if order was booked (parse response for order ID)
      const orderMatch = response.match(/order\s+([A-Z0-9]{6})/i);
      if (orderMatch) {
        console.log('Order detected:', orderMatch[1]);
      }

    } catch (err) {
      console.error('Error processing speech:', err);
      setError(err.message || 'Failed to process your request. Please try again.');

      const errorMessage = {
        role: 'agent',
        text: 'I apologize, but I encountered an error. Please try again or check your API key.',
        timestamp: new Date().toISOString(),
      };
      setTranscription(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const speakText = async (text) => {
    // Use Web Speech API for TTS
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);

      // Set voice properties based on current language
      const langCode = getLanguageCode(currentLanguage);
      utterance.lang = `${langCode}-IN`;
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.volume = 1;

      // Find appropriate voice
      const voices = speechSynthesis.getVoices();
      const voice = voices.find(v => v.lang.startsWith(langCode)) || voices[0];
      if (voice) utterance.voice = voice;

      utterance.onend = () => {
        // Continue listening after speaking
        if (isListening && recognitionRef.current) {
          try {
            recognitionRef.current.start();
          } catch (e) {
            console.log('Recognition already started');
          }
        }
      };

      speechSynthesis.speak(utterance);

      // Monitor volume during speech (simulate RMS)
      simulateVolumeLevel();
    }
  };

  const simulateVolumeLevel = () => {
    if (volumeIntervalRef.current) {
      clearInterval(volumeIntervalRef.current);
    }

    let level = 0.3;
    const interval = setInterval(() => {
      level = Math.max(0.1, level + (Math.random() - 0.5) * 0.2);
      setVolumeLevel(Math.min(1, Math.max(0, level)));
    }, 100);

    volumeIntervalRef.current = interval;

    setTimeout(() => {
      clearInterval(interval);
      setVolumeLevel(0.1);
    }, 2000);
  };

  const startListening = async () => {
    try {
      setIsListening(true);
      setError(null);

      // Start speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }

      // Start microphone for volume visualization
      try {
        const stream = await audioProcessorRef.current.getUserMedia();
        mediaStreamRef.current = stream;

        // Monitor audio volume
        const audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const checkVolume = () => {
          if (!isListening) return;
          analyser.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setVolumeLevel(Math.min(1, average / 255));
          requestAnimationFrame(checkVolume);
        };

        checkVolume();
      } catch (micError) {
        console.warn('Microphone access not available:', micError);
      }

    } catch (err) {
      console.error('Error starting listening:', err);
      setError('Failed to access microphone. Please check permissions.');
      setIsListening(false);
    }
  };

  const stopListening = () => {
    setIsListening(false);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (volumeIntervalRef.current) {
      clearInterval(volumeIntervalRef.current);
    }
    setVolumeLevel(0.1);
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="glass-strong rounded-2xl p-6 md:p-8 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-electric-cyan/20 flex items-center justify-center">
                  <Bot className="text-electric-cyan" size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Voice Interaction</h2>
                  {selectedCompany && (
                    <p className="text-sm text-white/60">{selectedCompany.name}</p>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white/60 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
              >
                <X size={24} />
              </button>
            </div>

            {/* Language Status */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center space-x-2 px-3 py-1 rounded-full glass border border-white/10">
                <span className="text-2xl">{currentLanguage.flag}</span>
                <span className="text-sm font-medium text-white/80">
                  {currentLanguage.name}
                </span>
              </div>
              {error && (
                <div className="text-sm text-vibrant-magenta bg-vibrant-magenta/20 px-3 py-1 rounded-full">
                  {error}
                </div>
              )}
            </div>

            {/* Visualizer */}
            <div className="mb-6 flex items-center justify-center">
              <motion.div
                className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-electric-cyan/30 flex items-center justify-center relative"
                animate={{
                  scale: 1 + volumeLevel * 0.3,
                  boxShadow: [
                    `0 0 ${20 + volumeLevel * 30}px rgba(112, 214, 255, ${0.3 + volumeLevel * 0.5})`,
                  ],
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              >
                {isListening || isProcessing ? (
                  <Volume2 className="text-electric-cyan" size={48} />
                ) : (
                  <VolumeX className="text-white/40" size={48} />
                )}
              </motion.div>
            </div>

            {/* Transcription */}
            <div className="flex-1 overflow-y-auto mb-6 space-y-4 glass rounded-lg p-4 min-h-[200px] max-h-[300px]">
              {transcription.length === 0 ? (
                <p className="text-white/40 text-center py-8">
                  Start speaking to begin the conversation...
                </p>
              ) : (
                transcription.map((item, index) => (
                  <motion.div
                    key={index}
                    className={`flex items-start space-x-3 ${item.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                      }`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${item.role === 'user'
                          ? 'bg-electric-cyan/20'
                          : 'bg-vibrant-magenta/20'
                        }`}
                    >
                      {item.role === 'user' ? (
                        <User className="text-electric-cyan" size={16} />
                      ) : (
                        <Bot className="text-vibrant-magenta" size={16} />
                      )}
                    </div>
                    <div
                      className={`flex-1 rounded-lg p-3 ${item.role === 'user'
                          ? 'bg-electric-cyan/10 text-right'
                          : 'bg-white/5 text-left'
                        }`}
                    >
                      <p className="text-white/90 text-sm">{item.text}</p>
                      <p className="text-white/40 text-xs mt-1">
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center space-x-4">
              <motion.button
                onClick={toggleListening}
                disabled={isProcessing}
                className={`w-16 h-16 rounded-full flex items-center justify-center font-bold transition-all ${isListening
                    ? 'bg-vibrant-magenta glow-magenta text-white'
                    : 'glass border border-white/20 text-white/60 hover:border-electric-cyan'
                  }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                animate={{
                  scale: isListening ? [1, 1.1, 1] : 1,
                }}
                transition={{
                  scale: {
                    duration: 1.5,
                    repeat: isListening ? Infinity : 0,
                  },
                }}
              >
                {isListening ? <Mic size={24} /> : <MicOff size={24} />}
              </motion.button>
            </div>

            {isProcessing && (
              <p className="text-center text-white/60 text-sm mt-4">
                Processing your request...
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default VoiceOverlay;