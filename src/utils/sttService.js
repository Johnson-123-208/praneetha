/**
 * Professional STT Service - AZURE AI SPEECH
 * Forces high-accuracy transcription for Telugu, Hindi, and English.
 */

class STTService {
    constructor() {
        this.azureKey = import.meta.env.VITE_AZURE_SPEECH_KEY || localStorage.getItem('azure_speech_key');
        this.azureRegion = import.meta.env.VITE_AZURE_SPEECH_REGION || 'centralindia';
    }

    async transcribe(audioBlob, languageCode = 'te-IN') {
        if (!this.azureKey) throw new Error("STT Error: Azure Key Missing.");

        // Azure handles specific language codes
        const lang = languageCode.includes('-') ? languageCode : (languageCode === 'te' ? 'te-IN' : languageCode === 'hi' ? 'hi-IN' : 'en-IN');

        try {
            // Azure STT REST API for short audio (max 60s)
            const url = `https://${this.azureRegion}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=${lang}&format=detailed`;

            console.log(`☁️ [Azure STT] Transcribing in: ${lang}`);

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Ocp-Apim-Subscription-Key': this.azureKey,
                    'Content-Type': audioBlob.type || 'audio/webm;codecs=opus',
                    'Accept': 'application/json'
                },
                body: audioBlob
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`❌ Azure STT API Error (${response.status}):`, errorText);
                throw new Error(`Azure STT API ${response.status}: ${errorText}`);
            }

            const data = await response.json();

            // Azure returns DisplayText or specialized NBest list in 'detailed' format
            let transcript = data.DisplayText || "";

            // If primary DisplayText is missing but we have NBest (common in detailed format)
            if (!transcript && data.NBest && data.NBest.length > 0) {
                transcript = data.NBest[0].Display || data.NBest[0].Lexical || "";
            }

            if (!transcript) {
                console.warn("⚠️ Azure STT returned empty transcript. Possible silence or noise issues.");
                console.log(`Recognition Status: ${data.RecognitionStatus || 'Unknown'}`);
                if (data.RecognitionStatus === 'InitialSilenceTimeout') {
                    console.log("ℹ️ No speech detected before timeout.");
                }
            }

            return transcript;
        } catch (error) {
            console.error("❌ Azure STT Failure:", error.message);
            throw error;
        }
    }

    setApiKey(key, region) {
        this.azureKey = key;
        this.azureRegion = region || this.azureRegion;
        localStorage.setItem('azure_speech_key', key);
        if (region) localStorage.setItem('azure_speech_region', region);
    }
}

export const sttService = new STTService();
