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
            this.stop(); // Clean up previous buffers

            // Robust language mapping
            const langMap = {
                'te': 'Telugu', 'te-in': 'Telugu',
                'hi': 'Hindi', 'hi-in': 'Hindi',
                'en': 'English', 'en-in': 'English', 'en-us': 'English',
                'ta': 'Tamil', 'ta-in': 'Tamil'
            };
            const inputLang = language.toLowerCase();
            const fullLanguage = langMap[inputLang] || (inputLang.charAt(0).toUpperCase() + inputLang.slice(1));

            // FORCE FEMALE Identity
            const speakerId = 'female';

            console.log(`📡 [TTS] Calling Server: ${this.API_URL} (${fullLanguage})`);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout for remote servers

            const response = await fetch(this.API_URL, {
                method: 'POST',
                mode: 'cors', // Explicitly allow cross-origin for production
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
                throw new Error(`TTS Server Error: ${response.status}`);
            }

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            this.currentAudio = new Audio(audioUrl);

            return new Promise((resolve, reject) => {
                this.currentAudio.onended = () => {
                    const url = this.currentAudio.src;
                    this.stop();
                    if (url.startsWith('blob:')) URL.revokeObjectURL(url);
                    resolve();
                };
                this.currentAudio.onerror = (e) => {
                    console.error('❌ TTS Playback Error:', e);
                    this.stop();
                    reject(e);
                };
                this.currentAudio.play().catch(reject);
            });
        } catch (error) {
            if (error.name !== 'AbortError' && this.API_URL) {
                console.warn('⚠️ TTS Server check failed, falling back to browser voices.');
            }
            throw error; // Triggers browser fallback in VoiceOverlay.jsx
        }
    },

    /**
     * Stops and completely clears current audio playback/memory
     */
    stop() {
        if (this.currentAudio) {
            try {
                this.currentAudio.pause();
                this.currentAudio.src = ""; // Force clear buffer
                this.currentAudio.load();
                if (this.currentAudio.srcObject) {
                    this.currentAudio.srcObject = null;
                }
            } catch (e) { }
            this.currentAudio = null;
        }
    }
};
