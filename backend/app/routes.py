"""Application Server Routes"""
import logging
import sys
from flask import Blueprint, render_template, request, make_response
import requests
from app import app, db
from app.utils import create_db_session
from app.models import Message
from urllib.parse import urlparse


main = Blueprint("main", __name__)
messages = Blueprint("messages", __name__)

logging.basicConfig(
    level=logging.INFO, 
    format="%(levelname)s - %(filename)s - %(funcName)s - line %(lineno)d - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)

@main.route("/")
def home():
    routes = []
    for rule in app.url_map.iter_rules():
        if(rule.endpoint != "static"):
            methods = list(rule.methods - set(['HEAD', 'OPTIONS']))
            route_info = {
                "endpoint": rule.endpoint,
                "methods": methods,
                "url": rule.rule
            }
            routes.append(route_info)
    return render_template('index.html', routes=routes)


@messages.route("/messages", methods=["GET"])
def get_messages():
    try:
        logging.info(request.url)

        db_session = create_db_session(app.config.get('SQLALCHEMY_DATABASE_URI'))
        qry = db_session.query(Message)
        result = qry.all()
        data = [record.to_dict() for record in result]
        logging.info(f"Messages fetched successfully: {len(data)}")
        return make_response({"data": data}, 200)
    except Exception as e:
        logging.exception(f"Error fetching messages: {str(e)}")
        return make_response({"msg": "Error fetching messages"}, 500)
    finally:
        if db_session:
            db_session.close()


@messages.route("/messages", methods=["POST"])
def add_message():
    try:
        logging.info(request.url)
        logging.info(request.form)
        
        title = request.form.get('title')
        description = request.form.get('description')
        thumbnail = request.form.get('thumbnail')
        tags = request.form.get('tags') 

        if not title or not description:
            return make_response({"msg": "Title and description are required"}, 400)
        
        if thumbnail:
            # Download the image from the URL
            response = requests.get(thumbnail, stream=True)
            if response.status_code != 200:
                return make_response({"msg": "Failed to fetch thumbnail image from URL"}, 400)
            # Precautionary server-side validation for thumbnail image
            image_format = response.headers.get('Content-Type')
            if image_format not in app.config.get('ALLOWED_IMAGE_FORMATS'):
                return make_response({"msg": f"Only {app.config.get('ALLOWED_IMAGE_FORMATS')} formats are allowed."}, 400)
            image_size = len(response.content)
            if image_size > int(app.config.get('MAX_IMAGE_SIZE_MB')) * 1024 * 1024: # Convert MB to bytes
                return make_response({"msg": f"Image size must be less than {app.config.get('MAX_IMAGE_SIZE_MB')} MB."}, 400)

        db_session = create_db_session(app.config.get('SQLALCHEMY_DATABASE_URI'))
        new_message = Message(
            title=title, 
            description=description
        )
        if thumbnail:
            new_message.thumbnail = thumbnail
        if tags:
            new_message.tags = ','.join(tag.strip() for tag in tags.split(','))
        
        db_session.add(new_message)
        db_session.commit()
        
        logging.info(f"Message added successfully: {new_message.title}")
        return make_response({"msg": f"Message added successfully: {new_message.title}"}, 201)
    except Exception as e:
        logging.exception(f"Error adding message: {str(e)}")
        return make_response({"msg": "Error adding message"}, 500)
    finally:
        if db_session:
            db_session.close()

@messages.route("/messages", methods=["PUT"])
def update_message():
    try:
        logging.info(request.url)
        logging.info(request.form)

        id = request.args.get('id')
        if not id:
            return make_response({"msg": "Id is required"}, 400)
        
        db_session = create_db_session(app.config.get('SQLALCHEMY_DATABASE_URI'))

        message = db_session.query(Message).filter_by(id=id).first()
        if not message:
            return make_response({"msg": "Message not found"}, 404)
        
        description = request.form.get('description')
        if not description:
            return make_response({"msg": "Description is required"}, 400)
        message.description = description

        thumbnail = request.form.get('thumbnail', None)
        if thumbnail:
            # Validate if the thumbnail is a valid URL
            parsed_url = urlparse(thumbnail)
            if all([parsed_url.scheme, parsed_url.netloc]):
                # Download the image from the URL
                response = requests.get(thumbnail, stream=True)
                if response.status_code != 200:
                    return make_response({"msg": "Failed to fetch thumbnail image from URL"}, 400)
                # Precautionary server-side validation for thumbnail image
                image_format = response.headers.get('Content-Type')
                if image_format not in app.config.get('ALLOWED_IMAGE_FORMATS'):
                    return make_response({"msg": f"Only {app.config.get('ALLOWED_IMAGE_FORMATS')} formats are allowed."}, 400)
                image_size = len(response.content)
                if image_size > int(app.config.get('MAX_IMAGE_SIZE_MB')) * 1024 * 1024: # Convert MB to bytes
                    return make_response({"msg": f"Image size must be less than {app.config.get('MAX_IMAGE_SIZE_MB')} MB."}, 400)
                message.thumbnail = thumbnail
        else:
            message.thumbnail = None

        tags = request.form.get('tags')
        if tags:
            message.tags = ','.join(tag.strip() for tag in tags.split(','))
        else:
            message.tags = None
        
        db_session.commit()
        
        logging.info(f"Message updated successfully: {message.title}")
        return make_response({"msg": f"Message updated successfully: {message.title}"}, 200)
    except Exception as e:
        logging.exception(f"Error updating message: {str(e)}")
        return make_response({"msg": "Error updating message"}, 500)
    finally:
        if db_session:
            db_session.close()
