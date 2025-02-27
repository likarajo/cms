"""Application Server"""
import logging
import sys
from flask_migrate import Migrate
from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from .config import Config


db = SQLAlchemy()
migrate = Migrate()
logging.basicConfig(
    level=logging.INFO, 
    format="%(levelname)s - %(filename)s - %(funcName)s - line %(lineno)d - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)

def create_app(config_type="default"):
    app = Flask(__name__)
    app.config.from_object(Config)
    
    CORS(app)
    
    db.init_app(app)
    migrate.init_app(app, db)

    with app.app_context():
        from app import models # Import models

        from app.routes import main, messages # Import routes and register blueprints
        app.register_blueprint(main)
        app.register_blueprint(messages)

    if config_type == "test":
        @app.after_request
        def add_test_headers(response):
            response.headers['X-Test-Env'] = '1'
            return response

    return app
