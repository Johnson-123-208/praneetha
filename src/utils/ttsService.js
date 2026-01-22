/**
 * Service to interact with the self-hosted XTTS v2 Backend
 */
export const ttsService = {
    // Update this to your local server IP/Port
    API_URL: 'http://localhost:8000/tts',

    /**
     * Generates and plays audio for the given text
     * @param {string} text 
     * @param {string} language - English, Hindi, Telugu, etc.
     * @param {string} gender - male or female
     */
    async speak(text, language, gender = 'female') {
        try {
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
            const audio = new Audio(audioUrl);

            return new Promise((resolve, reject) => {
                audio.onended = () => {
                    URL.revokeObjectURL(audioUrl);
                    resolve();
                };
                audio.onerror = reject;
                audio.play().catch(reject);
            });
        } catch (error) {
            console.error('XTTS Error:', error);
            throw error; // Let the caller handle fallback
        }
    }
};
