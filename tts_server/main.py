from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import edge_tts
import asyncio
import io

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

# Language to Voice Mapping (Using high-quality neural voices)
# format: [Language] -> [Male Voice, Female Voice]
VOICE_MAP = {
    "English": ["en-US-GuyNeural", "en-US-AriaNeural"],
    "Hindi": ["hi-IN-MadhurNeural", "hi-IN-SwararaNeural"],
    "Telugu": ["te-IN-MohanNeural", "te-IN-ShrutiNeural"],
    "Tamil": ["ta-IN-ValluvarNeural", "ta-IN-PallaviNeural"],
    "Kannada": ["kn-IN-GaganNeural", "kn-IN-SapnaNeural"],
    "Marathi": ["mr-IN-ManoharNeural", "mr-IN-AarohiNeural"],
    "Malayalam": ["ml-IN-MidhunNeural", "ml-IN-SobhanaNeural"]
}

@app.post("/tts")
async def generate_tts(request: TTSRequest):
    print(f"--- New TTS Request ---")
    print(f"Text: {request.text[:50]}...")
    print(f"Language: {request.language}")
    print(f"Gender: {request.speaker_id}")
    
    try:
        # Get voice list for the language
        voices = VOICE_MAP.get(request.language, VOICE_MAP["English"])
        
        # Select gender (0 for Male, 1 for Female)
        voice = voices[1] if request.speaker_id.lower() == "female" else voices[0]
        print(f"Selected Voice: {voice}")
        
        # Generate speech
        communicate = edge_tts.Communicate(request.text, voice)
        
        audio_data = b""
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_data += chunk["data"]

        if not audio_data:
            print("Error: No audio data generated")
            raise HTTPException(status_code=500, detail="Audio generation failed")

        print(f"Success: Generated {len(audio_data)} bytes")
        return Response(content=audio_data, media_type="audio/mpeg")

    except Exception as e:
        print(f"Backend Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
