import os
import wave
from flask import json
import requests
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import ffmpeg
from vosk import Model, KaldiRecognizer
from app import logging


def create_db_session(uri):
    """Create DB Session
    Args:
        uri (str): SQLAlchemy URI
    Returns:
        Session: DB Session
    """
    engine = create_engine(uri, pool_pre_ping=True, pool_recycle=280)
    Session = sessionmaker(bind=engine, autocommit=False) #pylint:disable=invalid-name
    return Session()

def transcribe_video(video_url):
    """Transcribes a video file to text using Vosk"""

    video_file = os.path.join(os.getcwd(), "app/toolkit/temp_video.mp4")
    audio_file = os.path.join(os.getcwd(), "app/toolkit/temp_audio.wav")
    model_file = os.path.join(os.getcwd(), "app/toolkit/vosk-model-en-us-0.22")

    try:
        # Download the video
        logging.info("Downloading video to transcribe...")
        video_response = requests.get(video_url, stream=True)
        if video_response.status_code != 200:
            raise Exception("Failed to download the video file")
        
        # Save the video content to temporary file
        logging.info("Creating temporary video file...")
        with open(video_file, "wb") as f:
            for chunk in video_response.iter_content(chunk_size=1024):
                if chunk:
                    f.write(chunk)

        # Extract audio from the video (converts to WAV format)
        logging.info("Extracting audio from the video file...")
        ffmpeg.input(video_file).output(audio_file, format='wav', ac=1, ar='16000').run()

        # Load Vosk model and perform transcription
        logging.info("Generating transcript from the audio file...")
        model = Model(model_file)
        wf = wave.open(audio_file, "rb")
        rec = KaldiRecognizer(model, wf.getframerate())
        
        transcript = ""
        while True:
            data = wf.readframes(4000)
            if len(data) == 0:
                break
            if rec.AcceptWaveform(data):
                result = json.loads(rec.Result())
                transcript += result["text"] + " "

        return transcript.strip()
    
    except Exception as e:
        logging.exception(f"Error transcribing video: {e}")
        return "Transcription not available"

    finally:
        # Cleanup temporary files
        if os.path.exists(video_file):
            os.remove(video_file)
        if os.path.exists(audio_file):
            os.remove(audio_file)
        logging.info("Temporary files removed.")
