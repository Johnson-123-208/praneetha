/**
 * Service to interact with the self-hosted XTTS v2 Backend
 */
export const ttsService = {
    // Update this to your local server IP/Port
    API_URL: import.meta.env.VITE_TTS_URL || (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:8000/tts' : null),
    currentAudio: null,

    /**
     * Generates and plays audio for the given text
     * @param {string} text 
     * @param {string} language - English, Hindi, Telugu, etc.
     * @param {string} gender - male or female
     */
    async speak(text, language, gender = 'female') {
        if (!text) return;
        if (!this.API_URL) throw new Error("No TTS Server");

        try {
            this.stop(); // Stop any previous audio

            // Comprehensive language mapping for different backend expectations
            const langMap = {
                'te': 'Telugu', 'te-IN': 'Telugu',
                'hi': 'Hindi', 'hi-IN': 'Hindi',
                'en': 'English', 'en-IN': 'English', 'en-US': 'English'
            };
            const fullLanguage = langMap[language] || language;

            // FORCE FEMALE - Never let a male ID through
            const speakerId = 'female';

            console.log(`📡 [TTS Server Request] Lang: ${fullLanguage}, Speaker: ${speakerId}, Text: "${text.substring(0, 30)}..."`);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 seconds timeout

            const response = await fetch(this.API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                signal: controller.signal,
                body: JSON.stringify({
                    text,
                    language: fullLanguage,
                    speaker_id: speakerId
                })
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`Server status ${response.status}`);
            }

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            this.currentAudio = new Audio(audioUrl);

            return new Promise((resolve, reject) => {
                this.currentAudio.onended = () => {
                    URL.revokeObjectURL(audioUrl);
                    this.currentAudio = null;
                    resolve();
                };
                this.currentAudio.onerror = (e) => {
                    console.error('Audio Playback Error:', e);
                    this.currentAudio = null;
                    reject(e);
                };
                this.currentAudio.play().catch(reject);
            });
        } catch (error) {
            // Silently swallow connection errors if server is down (normal for standalone mode)
            if (error.name !== 'AbortError') {
                console.log('💡 [TTS] Local Pro Server not detected. Using high-quality Browser Voice.');
            }
            throw error; // Fallback to Browser TTS in VoiceOverlay.jsx
        }
    },

    /**
     * Stops current audio playback
     */
    stop() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            this.currentAudio = null;
        }
    }
};
