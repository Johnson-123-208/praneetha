/**
 * Unified TTS Service - Supports Azure AI (Primary), XTTS v2 (Local), and Browser Fallbacks
 */
export const ttsService = {
    // Configuration
    AZURE_KEY: import.meta.env.VITE_AZURE_SPEECH_KEY,
    AZURE_REGION: import.meta.env.VITE_AZURE_SPEECH_REGION || 'centralindia',
    XTTS_URL: import.meta.env.VITE_TTS_URL || (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:8000/tts' : null),

    currentAudio: null,

    /**
     * Professional Voice Synthesis using Azure, XTTS, or Browser Fallback
     */
    async speak(text, language, gender = 'female') {
        if (!text) return;

        // 1. TRY AZURE AI SPEECH (Professional Cloud Quality)
        if (this.AZURE_KEY) {
            try {
                return await this.speakAzure(text, language);
            } catch (e) {
                console.warn("⚠️ Azure TTS failed, searching for fallbacks...");
            }
        }

        // 2. TRY XTTS v2 (Local AI Server)
        if (this.XTTS_URL) {
            try {
                return await this.speakXTTS(text, language);
            } catch (e) {
                console.warn("⚠️ XTTS Server failed or missing.");
            }
        }

        // 3. IF ALL AI FAILS: Throw to trigger Browser Fallback in VoiceOverlay.jsx
        throw new Error("Cloud/Local AI TTS unavailable. Using browser fallback.");
    },

    /**
     * Azure Neural Voice Logic
     */
    async speakAzure(text, language) {
        const voiceMap = {
            'te-IN': 'te-IN-ShrutiNeural',
            'te': 'te-IN-ShrutiNeural',
            'hi-IN': 'hi-IN-SwaraNeural',
            'hi': 'hi-IN-SwaraNeural',
            'en-IN': 'en-IN-NeerjaNeural',
            'en-US': 'en-US-AvaNeural',
            'en': 'en-IN-NeerjaNeural'
        };

        const voiceName = voiceMap[language] || voiceMap['en-IN'];
        const langCode = language.includes('-') ? language : (language === 'te' ? 'te-IN' : language === 'hi' ? 'hi-IN' : 'en-IN');

        const url = `https://${this.AZURE_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`;

        const ssml = `<speak version='1.0' xml:lang='${langCode}'><voice xml:lang='${langCode}' xml:gender='Female' name='${voiceName}'>${text}</voice></speak>`;

        console.log(`☁️ [Azure TTS] Requesting: ${voiceName}`);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Ocp-Apim-Subscription-Key': this.AZURE_KEY,
                'Content-Type': 'application/ssml+xml',
                'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
                'User-Agent': 'CallixAI'
            },
            body: ssml
        });

        if (!response.ok) throw new Error(`Azure Error: ${response.status}`);

        const blob = await response.blob();
        return this.playBlob(blob);
    },

    /**
     * Local XTTS Backend Logic
     */
    async speakXTTS(text, language) {
        const langMap = { 'te-in': 'te', 'hi-in': 'hi', 'en-in': 'en' };
        const xttsLang = langMap[language.toLowerCase()] || 'en';

        console.log(`🏠 [XTTS] Calling Local Server: ${this.XTTS_URL}`);

        const response = await fetch(this.XTTS_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true'
            },
            body: JSON.stringify({ text, language: xttsLang, speaker_id: 'female' })
        });

        if (!response.ok) throw new Error("XTTS Offline");

        const blob = await response.blob();
        return this.playBlob(blob);
    },

    /**
     * Internal Audio Player
     */
    playBlob(blob) {
        this.stop();
        const url = URL.createObjectURL(blob);
        this.currentAudio = new Audio(url);

        return new Promise((resolve, reject) => {
            this.currentAudio.onended = () => {
                URL.revokeObjectURL(url);
                this.stop();
                resolve();
            };
            this.currentAudio.onerror = reject;
            this.currentAudio.play().catch(reject);
        });
    },

    stop() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio = null;
        }
    }
};

