"""Application Server Configurations"""
import os


basedir = os.path.abspath(os.path.dirname(__file__))

class Config:
    SQLALCHEMY_DATABASE_URI = f"sqlite:///{os.path.join(basedir, '../app.db')}"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = os.getenv("SECRET_KEY", "secret")
    MAX_IMAGE_SIZE_MB = os.getenv("VITE_MAX_IMAGE_SIZE_MB", 5)
    ALLOWED_IMAGE_FORMATS = os.getenv("VITE_ALLOWED_IMAGE_FORMATS").split(",")
