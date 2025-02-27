"""Application Server Routes"""
from flask import Blueprint, json, render_template, request, make_response
import requests
from sqlalchemy import or_
from app import app, logging
from app.utils import create_db_session, transcribe_video
from app.models import Message, Tag, message_tags
from urllib.parse import urlparse


main = Blueprint("main", __name__)
messages = Blueprint("messages", __name__)

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

        # Filter messages by ids if provided
        ids = request.args.get("id")
        if ids:
            id_list = [id for id in ids.split(",")]
            qry = qry.filter(Message.id.in_(id_list))

        # Filter messages by titles if provided
        titles = request.args.get("title")
        if titles:
            title_list = [title for title in titles.split(",")]
            qry = qry.filter(Message.title.in_(title_list))

        # Filter messages by tags if provided
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
            else:
                thumbnail = None
        
        video = data.get('video', None)
        transcript = None
        if video:
            # Validate if the video is a valid URL
            parsed_url = urlparse(video)
            if all([parsed_url.scheme, parsed_url.netloc]):
                # Download the video from the URL
                response = requests.head(video)
                if response.status_code != 200:
                    return make_response({"msg": "Failed to fetch video from URL"}, 400)
                # Precautionary server-side validation for thumbnail image
                video_format = response.headers.get('Content-Type')
                if not video_format or video_format not in app.config.get('ALLOWED_VIDEO_FORMATS'):
                    return make_response({"msg": f"Only {app.config.get('ALLOWED_VIDEO_FORMATS')} formats are allowed."}, 400)
                if data.get('gen_transcript', False):
                    transcript = transcribe_video(video)

        tags = data.get('tags', [])

        new_message = Message(
            title=title, 
            description=description
        )
        if thumbnail:
            new_message.thumbnail = thumbnail
        if video:
            new_message.video = video
            new_message.transcript = transcript
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
        db_session.rollback()
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
        if message.description != description:
            message.description = description

        thumbnail = data.get('thumbnail', None)
        if thumbnail:
            if message.thumbnail != thumbnail:
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
        else:
            message.thumbnail = None

        video = data.get('video', None)
        if video:
            if message.video != video:
                # Validate if the video is a valid URL
                parsed_url = urlparse(video)
                if all([parsed_url.scheme, parsed_url.netloc]):
                    # Download the video from the URL
                    response = requests.head(video)
                    if response.status_code != 200:
                        return make_response({"msg": "Failed to fetch video from URL"}, 400)
                    # Precautionary server-side validation for thumbnail image
                    video_format = response.headers.get('Content-Type')
                    if not video_format or video_format not in app.config.get('ALLOWED_VIDEO_FORMATS'):
                        return make_response({"msg": f"Only {app.config.get('ALLOWED_VIDEO_FORMATS')} formats are allowed."}, 400)
                    message.video = video
                    if data.get('gen_transcript', False):
                        message.transcript = transcribe_video(video)
                else:
                    message.video = None
                    message.transcript = None
        else:
            message.video = None
            message.transcript = None

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
        db_session.rollback()
        return make_response({"msg": "Error updating message"}, 500)
    finally:
        if db_session:
            db_session.close()


@messages.route("/tags", methods=["GET"])
def get_tags():
    try:
        logging.info(request.url)

        db_session = create_db_session(app.config.get('SQLALCHEMY_DATABASE_URI'))
        qry = db_session.query(Tag)

        # Filter tags by id if provided
        ids = request.args.get("id")
        if ids:
            id_list = [id for id in ids.split(",")]
            qry = qry.filter(Tag.id.in_(id_list))

        # Filter tags by name if provided
        names = request.args.get("name")
        if names:
            name_list = [name.strip() for name in names.split(",")]
            qry = qry.filter(Tag.name.in_(name_list))

        # Filter tags by message title if provided
        message_titles = request.args.get("message")
        if message_titles:
            message_title_list = [title.strip() for title in message_titles.split(",")]
            title_filters = [Message.name.ilike(f"%{title}%") for title in message_title_list]
            qry = qry.join(message_tags).join(Message).filter(or_(*title_filters))

        result = qry.distinct().all()
        data = [record.to_dict() for record in result]
        logging.info(f"Tags fetched successfully: {len(data)}")
        return make_response({"data": data}, 200)
    except Exception as e:
        logging.exception(f"Error fetching tags: {str(e)}")
        return make_response({"msg": "Error fetching tags"}, 500)
    finally:
        if db_session:
            db_session.close()


@messages.route("/tags", methods=["POST"])
def add_tag():
    try:
        data = json.loads(request.data)
        tags = data.get("tags", [])

        if not tags or not isinstance(tags, list):
            return make_response({"msg": "A list of tags is required"}, 400)

        db_session = create_db_session(app.config.get('SQLALCHEMY_DATABASE_URI'))

        for name in tags:
            name = name.strip()
            # Check if tag already exists (case-insensitive check)
            existing_tag = db_session.query(Tag).filter(Tag.name == name).first()
            if not existing_tag:
                new_tag = Tag(name=name)
                db_session.add(new_tag)

        db_session.commit()

        logging.info(f"Tags added successfully: {tags}")
        return make_response({"msg": f"Tags added successfully: {tags}"}, 201)
    except Exception as e:
        logging.exception(f"Error adding tags: {str(e)}")
        db_session.rollback()
        return make_response({"msg": "Error adding tags"}, 500)
    finally:
        if db_session:
            db_session.close()


@messages.route("/message_tags", methods=["POST"])
def add_message_tags():
    try:
        logging.info(request.url)

        data = json.loads(request.data) # deserialize
        logging.info(data)

        message_ids = data.get("message_ids", [])
        if not message_ids:
            return make_response({"msg": "message_ids is required and cannot be empty"}, 400)
        
        tag_ids = data.get("tag_ids", [])
        if not tag_ids:
            return make_response({"msg": "tag_ids is required and cannot be empty"}, 400)
        
        db_session = create_db_session(app.config.get('SQLALCHEMY_DATABASE_URI'))

        # Track how many new links were added
        new_mappings_count = 0

        for message_id in message_ids:
            for tag_id in tag_ids:
                # Check if the mapping already exists
                exists = db_session.query(message_tags).filter_by(message_id=message_id, tag_id=tag_id).first()
                if not exists:
                    db_session.execute(message_tags.insert().values(message_id=message_id, tag_id=tag_id))
                    new_mappings_count += 1
        
        db_session.commit()

        logging.info(f"Message Tags assigned successfully: {new_mappings_count}")
        return make_response({"msg": f"Message Tags assigned successfully: {new_mappings_count}"}, 201)

    except Exception as e:
        logging.exception(f"Error assigning message tags: {str(e)}")
        return make_response({"msg": "Error assigning message tags"}, 500)
    finally:
        if db_session:
            db_session.close()
