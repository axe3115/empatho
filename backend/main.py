from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import whisper
from transformers import pipeline
import os
import tempfile
from typing import List
import logging
from fastapi.staticfiles import StaticFiles

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Constants
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTENSIONS = {'.wav', '.mp3', '.m4a', '.ogg'}

# Enable CORS with more permissive configuration for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
    expose_headers=["*"],  # Expose all headers
    max_age=3600,  # Cache preflight requests for 1 hour
)

# Initialize models
logger.info("Loading Whisper model...")
whisper_model = whisper.load_model("base")
logger.info("Loading emotion classifier...")
emotion_classifier = pipeline("text-classification", model="nateraw/bert-base-uncased-emotion")

@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"Request: {request.method} {request.url}")
    try:
        response = await call_next(request)
        logger.info(f"Response: {response.status_code}")
        return response
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"}
        )

def validate_audio_file(file: UploadFile) -> None:
    # Check file extension
    ext = os.path.splitext(file.filename)[1].lower() if file.filename else ''
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File type not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )

@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "models": {
            "whisper": "base",
            "emotion_classifier": "nateraw/bert-base-uncased-emotion"
        }
    }

@app.post("/analyze-audio")
async def analyze_audio(file: UploadFile = File(...)):
    try:
        logger.info(f"Received audio file: {file.filename}")
        validate_audio_file(file)

        # Create a unique temp path manually (to avoid Windows locking issues)
        suffix = os.path.splitext(file.filename)[1]
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            temp_path = tmp.name
            content = await file.read()
            if len(content) > MAX_FILE_SIZE:
                raise HTTPException(
                    status_code=400,
                    detail=f"File too large. Maximum size allowed: {MAX_FILE_SIZE / 1024 / 1024:.2f} MB"
                )
            tmp.write(content)

        try:
            # Now file is closed — safe to use
            logger.info("Transcribing audio...")
            result = whisper_model.transcribe(temp_path)
            text = result["text"].strip()

            if not text:
                logger.warning("No speech detected in audio")
                return {
                    "transcription": "",
                    "emotion": {
                        "label": "neutral",
                        "score": 1.0
                    },
                    "warning": "No speech detected in the audio"
                }

            logger.info("Analyzing emotion...")
            emotion_result = emotion_classifier(text)[0]

            return {
                "transcription": text,
                "emotion": {
                    "label": emotion_result["label"],
                    "score": emotion_result["score"]
                }
            }
        finally:
            # Always delete the temp file
            if os.path.exists(temp_path):
                os.unlink(temp_path)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing audio: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error processing audio: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",  # Allow external connections
        port=8000,
        reload=True,  # Enable auto-reload for development
        log_level="info",
        timeout_keep_alive=120,  # Increase keep-alive timeout
        workers=1  # Use single worker for development
    ) 