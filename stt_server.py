from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import whisper
import os
import uvicorn
import tempfile

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load Whisper model (Base is good balance for Intel Iris Xe)
print("📥 Loading Whisper Base model...")
model = whisper.load_model("base", device="cpu")
print("✅ Whisper loaded")

@app.post("/stt")
async def transcribe(file: UploadFile = File(...)):
    try:
        # Save uploaded blob to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as temp_audio:
            content = await file.read()
            temp_audio.write(content)
            temp_path = temp_audio.name

        print(f"🎙️ Transcribing chunk ({len(content)} bytes)...")
        
        # Transcribe using Whisper
        result = model.transcribe(temp_path)
        
        # Cleanup
        os.remove(temp_path)
        
        text = result.get("text", "").strip()
        print(f"✅ Result: \"{text}\"")
        
        return {"text": text}
    except Exception as e:
        print(f"❌ STT Error: {e}")
        return {"error": str(e)}, 500

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
