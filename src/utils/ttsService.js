/**
 * Service to interact with the self-hosted XTTS v2 Backend
 */
export const ttsService = {
    // Update this to your local server IP/Port
    API_URL: 'http://localhost:8000/tts',
    currentAudio: null,

    /**
     * Generates and plays audio for the given text
     * @param {string} text 
     * @param {string} language - English, Hindi, Telugu, etc.
     * @param {string} gender - male or female
     */
    async speak(text, language, gender = 'female') {
        try {
            this.stop(); // Stop any previous audio

            console.log(`🎤 TTS Request: Language="${language}", Gender="${gender}", Text="${text.substring(0, 50)}..."`);

            const response = await fetch(this.API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text,
                    language,
                    speaker_id: gender.toLowerCase()
                })
            });

            if (!response.ok) {
                throw new Error(`TTS Server responded with ${response.status}`);
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
                    this.currentAudio = null;
                    reject(e);
                };
                this.currentAudio.play().catch(reject);
            });
        } catch (error) {
            console.error('XTTS Error:', error);
            throw error; // Let the caller handle fallback
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
