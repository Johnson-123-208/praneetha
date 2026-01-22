from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import edge_tts
import asyncio
import io
import re

app = FastAPI(title="Edge TTS Multilingual Server")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TTSRequest(BaseModel):
    text: str
    language: str
    speaker_id: str = "female"  # male or female

# Language to Voice Mapping (Using Indian accent voices)
# format: [Language] -> [Male Voice, Female Voice]
VOICE_MAP = {
    "english": ["en-IN-PrabhatNeural", "en-IN-NeerjaNeural"],  # Indian English accent
    "hindi": ["hi-IN-MadhurNeural", "hi-IN-SwararaNeural"],
    "telugu": ["te-IN-MohanNeural", "te-IN-ShrutiNeural"],
    "tamil": ["ta-IN-ValluvarNeural", "ta-IN-PallaviNeural"],
    "kannada": ["kn-IN-GaganNeural", "kn-IN-SapnaNeural"],
    "marathi": ["mr-IN-ManoharNeural", "mr-IN-AarohiNeural"],
    "malayalam": ["ml-IN-MidhunNeural", "ml-IN-SobhanaNeural"]
}

# Language code mapping
LANG_CODE_MAP = {
    "en-US": "english",
    "en-IN": "english",
    "hi-IN": "hindi",
    "te-IN": "telugu",
    "ta-IN": "tamil",
    "kn-IN": "kannada",
    "mr-IN": "marathi",
    "ml-IN": "malayalam"
}

@app.post("/tts")
async def generate_tts(request: TTSRequest):
    print(f"\n--- New TTS Request ---")
    print(f"Received Language: {request.language}")
    print(f"Speaker: {request.speaker_id}")
    
    # Pre-clean text: Remove everything in parentheses (safety check)
    clean_text = re.sub(r'\(.*?\)', '', request.text).strip()
    print(f"Cleaned Text: {clean_text[:80]}...")
    
    if not clean_text:
        return Response(status_code=400, content="No text to speak after cleaning")

    try:
        # Normalize language input (handle both "English", "en-US", "en-IN", etc.)
        lang_input = request.language.lower().strip()
        
        # Check if it's a language code first
        if lang_input in LANG_CODE_MAP:
            lang_key = LANG_CODE_MAP[lang_input]
        else:
            # It's a language name
            lang_key = lang_input
        
        # Get voices for the language
        voices = VOICE_MAP.get(lang_key, VOICE_MAP["english"])
        
        # Select gender (0 for Male, 1 for Female)
        voice = voices[1] if request.speaker_id.lower() == "female" else voices[0]
        print(f"Selected Voice: {voice} (Language: {lang_key})")
        
        # Generate speech
        communicate = edge_tts.Communicate(clean_text, voice)
        
        audio_data = b""
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_data += chunk["data"]

        if not audio_data:
            print("❌ Error: No audio data generated")
            raise HTTPException(status_code=500, detail="Audio generation failed")

        print(f"✅ Success: Generated {len(audio_data)} bytes")
        return Response(content=audio_data, media_type="audio/mpeg")

    except Exception as e:
        print(f"❌ Backend Error: {str(e)}")
        # Fallback to Indian English voice
        try:
            print("⚠️ Attempting fallback to Indian English voice...")
            communicate = edge_tts.Communicate(clean_text, "en-IN-NeerjaNeural")
            audio_data = b""
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    audio_data += chunk["data"]
            print("✅ Fallback successful")
            return Response(content=audio_data, media_type="audio/mpeg")
        except Exception as fallback_error:
            print(f"❌ Fallback failed: {str(fallback_error)}")
            raise HTTPException(status_code=500, detail=f"TTS Failed: {str(e)}")

@app.get("/health")
async def health_check():
    return {"status": "healthy", "supported_languages": list(VOICE_MAP.keys())}

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting TTS Server with Indian accent voices...")
    print(f"📋 Supported languages: {', '.join(VOICE_MAP.keys())}")
    uvicorn.run(app, host="0.0.0.0", port=8000)
