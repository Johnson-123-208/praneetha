from fastapi import FastAPI, Response
from pydantic import BaseModel
from TTS.api import TTS
import torch
import io
import uvicorn
import soundfile as sf
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Enable CORS for browser access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize TTS model on CPU (better for Intel Iris Xe)
print("📥 Loading XTTS v2 model... (this may take a few minutes on first run)")
device = "cpu"
try:
    # Use the multilingual XTTS v2 model
    tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2").to(device)
    print("✅ Model loaded successfully on CPU")
except Exception as e:
    print(f"❌ Error loading model: {e}")

class TTSRequest(BaseModel):
    text: str
    language: str
    speaker_id: str = "female_b"

@app.post("/tts")
async def speak(req: TTSRequest):
    try:
        print(f"🗣️ Synthesizing: {req.text[:50]}... in {req.language}")
        
        # Mapping for XTTS language codes
        lang_map = {
            'en-in': 'en', 'en-us': 'en', 'en': 'en',
            'hi-in': 'hi', 'hi': 'hi',
            'te-in': 'te', 'te': 'te'
        }
        target_lang = lang_map.get(req.language.toLowerCase(), 'en') if hasattr(req.language, 'toLowerCase') else lang_map.get(req.language.lower(), 'en')

        # Generate audio
        wav = tts.tts(
            text=req.text, 
            speaker=req.speaker_id, 
            language=target_lang
        )
        
        # Convert to WAV bytes
        out = io.BytesIO()
        sf.write(out, wav, 24000, format='wav')
        
        return Response(content=out.getvalue(), media_type="audio/wav")
    except Exception as e:
        print(f"❌ TTS Error: {e}")
        return Response(status_code=500, content=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
