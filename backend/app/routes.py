"""Application Server Routes"""
import logging
import sys
from flask import Blueprint, json, render_template, request, make_response
import requests
from sqlalchemy import func, or_
from app import app, db
from app.utils import create_db_session
from app.models import Message, Tag, message_tags
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

        tags = request.args.get("tag")
        if tags:
            tag_list = [tag.strip() for tag in tags.split(",")]
            qry = qry.join(message_tags).join(Tag).filter(Tag.name.in_(tag_list))
        
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

        data = json.loads(request.data) # deserialize
        logging.info(data)
        
        title = data.get('title') 
        if not title:
            return make_response({"msg": "Title is required"}, 400)
        
        description = data.get('description')
        if not description:
            return make_response({"msg": "Description is required"}, 400)
        
        db_session = create_db_session(app.config.get('SQLALCHEMY_DATABASE_URI'))
        
        # Check if title already exists
        existing_message = db_session.query(Message).filter_by(title=title).first()
        if existing_message:
            return make_response({"msg": "A message with this title already exists"}, 400)
        
        thumbnail = data.get('thumbnail', None)
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
                
        tags = data.get('tags', [])

        new_message = Message(
            title=title, 
            description=description
        )
        if thumbnail:
            new_message.thumbnail = thumbnail
        if tags:
            tags_list = []
            for tag in tags:
                tag = tag.strip()
                existing_tag = db_session.query(Tag).filter_by(name=tag).first()
                if existing_tag:
                    tags_list.append(existing_tag)
                else:
                    new_tag = Tag(name=tag)
                    db_session.add(new_tag)
                    tags_list.append(new_tag)
            new_message.tags = tags_list

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

        data = json.loads(request.data) # deserialize
        logging.info(data)

        id = request.args.get('id')
        if not id:
            return make_response({"msg": "Id is required"}, 400)
        
        db_session = create_db_session(app.config.get('SQLALCHEMY_DATABASE_URI'))

        message = db_session.query(Message).filter_by(id=id).first()
        if not message:
            return make_response({"msg": "Message not found"}, 404)
        
        description = data.get('description')
        if not description:
            return make_response({"msg": "Description is required"}, 400)
        message.description = description

        thumbnail = data.get('thumbnail', None)
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

        tags = data.get('tags', [])
        if tags:
            tags_list = []
            for tag in tags:
                tag = tag.strip()
                existing_tag = db_session.query(Tag).filter_by(name=tag).first()
                if existing_tag:
                    tags_list.append(existing_tag)
                else:
                    new_tag = Tag(name=tag)
                    db_session.add(new_tag)
                    tags_list.append(new_tag)
            message.tags = tags_list
        
        db_session.commit()
        
        logging.info(f"Message updated successfully: {message.title}")
        return make_response({"msg": f"Message updated successfully: {message.title}"}, 200)
    except Exception as e:
        logging.exception(f"Error updating message: {str(e)}")
        return make_response({"msg": "Error updating message"}, 500)
    finally:
        if db_session:
            db_session.close()
