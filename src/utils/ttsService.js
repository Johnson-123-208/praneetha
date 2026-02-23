/**
 * CLEAN TTS SERVICE - AZURE ONLY
 */

export const ttsService = {
    AZURE_KEY: import.meta.env.VITE_AZURE_SPEECH_KEY,
    AZURE_REGION: import.meta.env.VITE_AZURE_SPEECH_REGION || 'centralindia',
    currentAudio: null,

    async speak(text, language) {
        if (!text) return;
        if (!this.AZURE_KEY) throw new Error("Azure Speech Key missing in .env");

        return await this.speakAzure(text, language);
    },

    async speakAzure(text, language) {
        // XML Escape helper
        const escapeXml = (unsafe) => {
            return unsafe.replace(/[<>&"']/g, (c) => {
                switch (c) {
                    case '<': return '&lt;';
                    case '>': return '&gt;';
                    case '&': return '&amp;';
                    case '"': return '&quot;';
                    case "'": return '&apos;';
                    default: return c;
                }
            });
        };

        const voiceMap = {
            'te-IN': 'te-IN-ShrutiNeural',
            'hi-IN': 'hi-IN-SwaraNeural',
            'en-IN': 'en-IN-NeerjaNeural',
            'en-US': 'en-US-EmmaNeural'
        };

        // Normalize language code
        const langCode = language.includes('-') ? language : (language === 'te' ? 'te-IN' : language === 'hi' ? 'hi-IN' : 'en-IN');
        const voiceName = voiceMap[langCode] || voiceMap['en-IN'];

        const url = `https://${this.AZURE_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`;
        const safeText = escapeXml(text);

        const ssml = `
            <speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='${langCode}'>
                <voice name='${voiceName}'>
                    <prosody rate="1.0" pitch="0%" volume="100">
                        ${safeText}
                    </prosody>
                </voice>
            </speak>
        `.trim();

        console.log(`🔊 [TTS] Azure Neural: ${voiceName}`);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Ocp-Apim-Subscription-Key': this.AZURE_KEY,
                'Content-Type': 'application/ssml+xml',
                'X-Microsoft-OutputFormat': 'audio-24khz-160kbitrate-mono-mp3',
                'User-Agent': 'CallixAI'
            },
            body: ssml
        });

        if (!response.ok) throw new Error(`Azure TTS Error: ${response.status}`);

        const blob = await response.blob();
        return this.playBlob(blob);
    },

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
