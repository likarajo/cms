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

4. Start the application containers

```
docker compose up --build
```

5. Access the application

* Web UI: http://localhost:4000
* API Server: http://localhost:8000
