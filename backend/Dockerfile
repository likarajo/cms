FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y libatomic1 ffmpeg && rm -rf /var/lib/apt/lists/*
RUN pip install --upgrade pip setuptools wheel

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 8000
CMD ["flask", "run", "--host=0.0.0.0", "--port=8000", "--reload"]
