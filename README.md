# Messages - Content Management System

## Environment

* Node 20.18.0
* Python 3.11.9
* Docker 27.5.1

## Local Server

1. Install front end dependencies

```
cd frontend
npm install
```

2. Install backend dependencies

```
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

3. Update Local SQLite DB (if not created)

```
cd backend
flask db init
flask db migrate
flask db upgrade
sqlite3 app.db ".tables"
```

4. Enable Video Transcription

Download the Automatic Speech Recognition Model (~ 4 minutes)
```
cd backend
curl -L https://alphacephei.com/vosk/models/vosk-model-en-us-0.22.zip -o app/toolkit/vosk-model.zip
unzip app/toolkit/vosk-model.zip -d app/toolkit/
```

5. Start the application containers

(~ 4 minutes)
```
docker compose up --build
```

Access the application

* Web UI: http://localhost:4000
* API Server: http://localhost:8000

---

## Video Transcription Models

Free and Open Source

| Library         | Speed      | Accuracy    | Offline? | Best for                         |
|---------------|------------|-------------|----------|----------------------------------|
| **Whisper**   | Slow       | Very High   | No       | High accuracy, multiple languages |
| **Vosk**      | Very Fast  | Moderate    | Yes      | Offline, super lightweight       |
| **Faster Whisper** | Fast  | Very High   | No       | Faster than Whisper, GPU support |

- **For best accuracy** → OpenAI Whisper  
- **For fastest & offline** → Vosk  
- **For balanced speed & accuracy** → Faster Whisper
