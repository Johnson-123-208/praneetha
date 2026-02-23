/**
 * CLEAN STT SERVICE - DEEPGRAM ONLY
 */

class STTService {
    constructor() {
        this.deepgramKey = import.meta.env.VITE_DEEPGRAM_API_KEY;
    }

    async transcribe(audioBlob, languageCode = 'te-IN') {
        if (!this.deepgramKey) throw new Error("Deepgram API Key missing in .env");

        // Convert language codes for Deepgram (e.g., 'te-IN' -> 'te')
        const lang = languageCode.split('-')[0];
        const url = `https://api.deepgram.com/v1/listen?model=nova-3&language=${lang}&smart_format=true&punctuate=true`;

        console.log(`🎙️ [STT] Deepgram Nova-3: ${lang}`);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Token ${this.deepgramKey}`,
                'Content-Type': 'audio/webm;codecs=opus'
            },
            body: audioBlob
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(`Deepgram Error: ${err.err_msg || response.statusText}`);
        }

        const data = await response.json();
        const transcript = data.results?.channels[0]?.alternatives[0]?.transcript;

        if (transcript) {
            console.log(`✅ [STT] Result: "${transcript}"`);
            return transcript;
        }

        return "";
    }
}

export const sttService = new STTService();
