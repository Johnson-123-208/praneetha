import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, MicOff, Phone, PhoneOff } from 'lucide-react';
import { chatWithGroq } from '../utils/groq';

const VoiceOverlay = ({ isOpen, onClose, selectedCompany, selectedLanguage }) => {
  const [callState, setCallState] = useState('idle'); // idle, ringing, connected, ended
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [messages, setMessages] = useState([]);
  const [isMuted, setIsMuted] = useState(false);

  const recognitionRef = useRef(null);
  const synthesisRef = useRef(null);
  const ringingAudioRef = useRef(null);

  // Determine agent gender based on language voice
  const agentGender = selectedLanguage?.voice?.includes('Female') || selectedLanguage?.voice?.includes('female') ? 'female' : 'male';
  const agentAvatar = agentGender === 'female' ? '/Female.png' : '/Male.png';

  // Initialize speech recognition
  useEffect(() => {
    if (!isOpen) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = selectedLanguage?.code || 'en-US';

      recognitionRef.current.onresult = (event) => {
        const current = event.resultIndex;
        const transcriptText = event.results[current][0].transcript;

        if (event.results[current].isFinal) {
          setTranscript(transcriptText);
          handleUserMessage(transcriptText);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          alert('Microphone permission denied. Please allow microphone access.');
        }
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isOpen, selectedLanguage]);

  // Handle call initiation
  useEffect(() => {
    if (isOpen && callState === 'idle') {
      initiateCall();
    }
  }, [isOpen]);

  const initiateCall = async () => {
    setCallState('ringing');

    // Play ringing sound
    ringingAudioRef.current = new Audio('/ringtone-027-376908.mp3');
    ringingAudioRef.current.loop = false;
    ringingAudioRef.current.play().catch(err => console.error('Audio play error:', err));

    // Request microphone permission
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (error) {
      console.error('Microphone permission error:', error);
      alert('Microphone access is required for voice calls.');
      onClose();
      return;
    }

    // Connect after 4-5 seconds
    setTimeout(() => {
      if (ringingAudioRef.current) {
        ringingAudioRef.current.pause();
        ringingAudioRef.current = null;
      }
      setCallState('connected');
      startConversation();
    }, 4500);
  };

  const startConversation = () => {
    const greeting = `Hello! I'm your AI assistant from ${selectedCompany?.name || 'our company'}. How can I help you today?`;

    addMessage('agent', greeting);
    speak(greeting);

    // Start listening
    if (recognitionRef.current && !isMuted) {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleUserMessage = async (message) => {
    if (!message.trim()) return;

    addMessage('user', message);
    setIsListening(false);
    setTranscript('');

    // Get AI response
    try {
      // Format conversation history for Groq API
      const formattedHistory = messages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        text: msg.text
      }));

      // Call Groq with proper parameters and strict length limit
      const response = await chatWithGroq(
        `${message}\n\nIMPORTANT: Respond in MAXIMUM 2 short sentences. Be concise and direct.`,  // Force short responses
        formattedHistory,  // Conversation history
        selectedCompany  // Company context
      );

      // Truncate response if still too long (safety measure)
      const truncatedResponse = response.length > 200
        ? response.substring(0, 200).trim() + '...'
        : response;

      addMessage('agent', truncatedResponse);
      speak(truncatedResponse);
    } catch (error) {
      console.error('Error getting AI response:', error);
      const errorMsg = "I apologize, I'm having trouble. Please try again.";
      addMessage('agent', errorMsg);
      speak(errorMsg);
    }
  };

  const addMessage = (sender, text) => {
    setMessages(prev => [...prev, { sender, text, timestamp: new Date() }]);
  };

  const speak = (text) => {
    if ('speechSynthesis' in window) {
      // Stop listening while agent speaks to prevent feedback
      if (recognitionRef.current && isListening) {
        try {
          recognitionRef.current.stop();
          setIsListening(false);
        } catch (e) {
          console.log('Recognition already stopped');
        }
      }

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = selectedLanguage?.code || 'en-US';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      // Try to find the selected voice
      const voices = window.speechSynthesis.getVoices();
      const selectedVoice = voices.find(v => v.name === selectedLanguage?.voice);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
        setIsListening(false); // Ensure listening is off
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        // Resume listening after speaking (with delay to avoid picking up tail end of speech)
        if (callState === 'connected' && !isMuted && recognitionRef.current) {
          setTimeout(() => {
            try {
              recognitionRef.current.start();
              setIsListening(true);
            } catch (e) {
              console.log('Recognition restart error:', e);
            }
          }, 800); // Increased delay to prevent feedback
        }
      };

      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        setIsSpeaking(false);
        // Try to resume listening even on error
        if (callState === 'connected' && !isMuted && recognitionRef.current) {
          setTimeout(() => {
            try {
              recognitionRef.current.start();
              setIsListening(true);
            } catch (e) {
              console.log('Recognition restart error:', e);
            }
          }, 500);
        }
      };

      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (!isMuted) {
      // Muting
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        setIsListening(false);
      }
    } else {
      // Unmuting
      if (recognitionRef.current && callState === 'connected') {
        recognitionRef.current.start();
        setIsListening(true);
      }
    }
  };

  const endCall = () => {
    setCallState('ended');
    setIsListening(false);
    setIsSpeaking(false);

    // Stop speech recognition immediately
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        recognitionRef.current.abort();
      } catch (e) {
        console.log('Recognition stop error:', e);
      }
    }

    // Stop ringing audio
    if (ringingAudioRef.current) {
      ringingAudioRef.current.pause();
      ringingAudioRef.current.currentTime = 0;
    }

    // Stop all speech synthesis immediately
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      // Force stop by calling multiple times (browser quirk)
      setTimeout(() => window.speechSynthesis.cancel(), 0);
      setTimeout(() => window.speechSynthesis.cancel(), 100);
    }

    // Close after showing "Call Ended" screen
    setTimeout(() => {
      onClose();
      // Final cleanup
      window.speechSynthesis.cancel();
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 bg-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Ringing Screen */}
        {callState === 'ringing' && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center bg-white"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <div className="relative">
              {/* Pulsing rings */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-64 h-64 rounded-full bg-gradient-to-r from-purple-primary/20 to-pink-primary/20 animate-pulse-ring"></div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center" style={{ animationDelay: '0.5s' }}>
                <div className="w-48 h-48 rounded-full bg-gradient-to-r from-blue-primary/20 to-green-primary/20 animate-pulse-ring"></div>
              </div>

              {/* Agent avatar */}
              <motion.div
                className="relative z-10 w-32 h-32 rounded-full overflow-hidden border-4 border-purple-primary shadow-premium-lg"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <img src={agentAvatar} alt="Agent" className="w-full h-full object-cover" />
              </motion.div>
            </div>

            <motion.div
              className="mt-8 text-center"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-4xl font-bold text-text-dark mb-2">Connecting...</h2>
              <p className="text-text-gray text-xl">{selectedCompany?.name}</p>
              <div className="flex items-center justify-center mt-6 space-x-2">
                <div className="w-3 h-3 bg-purple-primary rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                <div className="w-3 h-3 bg-pink-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-3 h-3 bg-blue-primary rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </motion.div>

            <motion.button
              onClick={endCall}
              className="mt-12 px-8 py-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-full flex items-center space-x-2 transition-all shadow-premium font-semibold"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <PhoneOff size={24} />
              <span>Cancel</span>
            </motion.button>
          </motion.div>
        )}

        {/* Connected Screen - Split View */}
        {callState === 'connected' && (
          <motion.div
            className="h-full flex bg-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {/* Left Side - Agent */}
            <div className="w-1/2 bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center p-8 relative border-r border-gray-200">
              {/* Agent Avatar with Animation */}
              <motion.div
                className={`relative w-64 h-64 rounded-full overflow-hidden border-4 ${isSpeaking ? 'border-green-500' : isListening ? 'border-blue-500' : 'border-gray-300'
                  } shadow-premium-lg ${isSpeaking ? 'animate-talking' : ''}`}
                animate={isSpeaking ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 0.8, repeat: isSpeaking ? Infinity : 0 }}
              >
                <img src={agentAvatar} alt="AI Agent" className="w-full h-full object-cover" />

                {/* Speaking indicator */}
                {isSpeaking && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-1">
                    <div className="w-2 h-8 bg-accent-success rounded-full animate-pulse" style={{ animationDelay: '0s' }}></div>
                    <div className="w-2 h-12 bg-accent-success rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-6 bg-accent-success rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-10 bg-accent-success rounded-full animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                  </div>
                )}
              </motion.div>

              {/* Agent Status */}
              <div className="mt-8 text-center">
                <h3 className="text-2xl font-bold text-text-primary mb-2">AI Assistant</h3>
                <p className="text-text-secondary">{selectedCompany?.name}</p>
                <div className="mt-4 flex items-center justify-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${isSpeaking ? 'bg-accent-success' : isListening ? 'bg-accent-blue' : 'bg-text-secondary'} animate-pulse`}></div>
                  <span className="text-sm text-text-secondary">
                    {isSpeaking ? 'Speaking...' : isListening ? 'Listening...' : 'Ready'}
                  </span>
                </div>
              </div>

              {/* Controls */}
              <div className="absolute bottom-8 flex space-x-4">
                <motion.button
                  onClick={toggleMute}
                  className={`p-4 rounded-full ${isMuted ? 'bg-red-500' : 'bg-white shadow-premium'} hover:opacity-90 transition-all text-text-dark`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                </motion.button>

                {/* Stop Speaking Button - Only show when agent is speaking */}
                {isSpeaking && (
                  <motion.button
                    onClick={() => {
                      // Stop speech immediately
                      window.speechSynthesis.cancel();
                      setIsSpeaking(false);
                      // Resume listening
                      if (!isMuted && recognitionRef.current) {
                        setTimeout(() => {
                          try {
                            recognitionRef.current.start();
                            setIsListening(true);
                          } catch (e) {
                            console.log('Recognition restart error:', e);
                          }
                        }, 300);
                      }
                    }}
                    className="p-4 rounded-full bg-orange-500 hover:bg-orange-600 transition-colors text-white shadow-premium"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    title="Stop Speaking"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="6" y="4" width="4" height="16"></rect>
                      <rect x="14" y="4" width="4" height="16"></rect>
                    </svg>
                  </motion.button>
                )}

                <motion.button
                  onClick={endCall}
                  className="p-4 rounded-full bg-red-500 hover:bg-red-600 transition-colors text-white shadow-premium"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title="End Call"
                >
                  <PhoneOff size={24} />
                </motion.button>
              </div>
            </div>

            {/* Right Side - Chat Flow */}
            <div className="w-1/2 bg-white flex flex-col">
              {/* Header */}
              <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-white">
                <div>
                  <h2 className="text-2xl font-bold text-text-dark">Conversation</h2>
                  <p className="text-sm text-text-gray">{selectedLanguage?.name || 'English'}</p>
                </div>
                <button
                  onClick={endCall}
                  className="text-text-gray hover:text-text-dark transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
                {messages.map((msg, index) => (
                  <motion.div
                    key={index}
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div
                      className={`max-w-[80%] p-4 rounded-2xl shadow-premium ${msg.sender === 'user'
                        ? 'bg-gradient-purple text-white'
                        : 'bg-white text-text-dark border border-gray-200'
                        }`}
                    >
                      <p className="text-sm">{msg.text}</p>
                      <span className={`text-xs mt-1 block ${msg.sender === 'user' ? 'text-white/80' : 'text-text-light'}`}>
                        {msg.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  </motion.div>
                ))}

                {/* Transcript preview */}
                {transcript && (
                  <motion.div
                    className="flex justify-end"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="max-w-[80%] p-4 rounded-2xl bg-blue-100 text-text-dark border border-blue-300">
                      <p className="text-sm italic">{transcript}</p>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Input indicator */}
              <div className="p-6 border-t border-gray-200 bg-white">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${isListening ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
                  <span className="text-sm text-text-gray font-medium">
                    {isListening ? 'Listening to your voice...' : isMuted ? 'Microphone muted' : 'Waiting...'}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Call Ended Screen */}
        {callState === 'ended' && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center bg-white"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
                <PhoneOff size={48} className="text-red-500" />
              </div>
              <h2 className="text-3xl font-bold text-text-dark mb-2">Call Ended</h2>
              <p className="text-text-gray">Thank you for using our service</p>
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default VoiceOverlay;