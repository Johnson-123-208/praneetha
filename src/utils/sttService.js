/**
 * Professional STT Service - EXCLUSIVE DEEPGRAM NOVA-3
 * Forces high-accuracy transcription for Telugu, Hindi, and English.
 */

class STTService {
    constructor() {
        this.deepgramApiKey = localStorage.getItem('deepgram_api_key') || import.meta.env.VITE_DEEPGRAM_API_KEY;
        this.activeProvider = "DEEPGRAM";

        if (!this.deepgramApiKey) {
            console.error("❌ DEEPGRAM API KEY MISSING!");
        }
    }

    async transcribe(audioBlob, languageCode = 'te') {
        if (!this.deepgramApiKey) throw new Error("STT Error: No Key.");

        const lang = languageCode.split('-')[0];

        try {
            // MATCHING DIAGNOSTIC TOOL CONFIG EXACTLY
            const params = new URLSearchParams({
                model: 'nova-3',
                language: lang === 'en' ? 'en-IN' : lang, // Better locale mapping
                smart_format: 'true',
                punctuate: 'true',
                interaction_type: 'voicemail' // Helps with short utterances
            });

            const url = `https://api.deepgram.com/v1/listen?${params.toString()}`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${this.deepgramApiKey}`,
                },
                body: audioBlob
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`❌ Deepgram API Error (${response.status}):`, errorText);
                throw new Error(`Deepgram API ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            const transcript = data.results?.channels[0]?.alternatives[0]?.transcript;

            if (!transcript) {
                console.warn("⚠️ Deepgram returned empty transcript. Possible silence or noise issues.");
            }

            return transcript || "";
        } catch (error) {
            console.error("❌ STT Failure:", error.message);
            throw error;
        }
    }

    setApiKey(key) {
        this.deepgramApiKey = key;
        localStorage.setItem('deepgram_api_key', key);
    }
}

export const sttService = new STTService();
