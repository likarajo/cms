"""Application Server Routes"""
from flask import Blueprint, json, render_template, request, make_response, current_app as app
import requests
from sqlalchemy import or_
from app import logging
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
                "url": rule.rule,
                "request_body": "",  # Placeholder for request body info
                "request_args": []   # Placeholder for request args info
            }
            # Try to retrieve docstring for the route
            view_func = app.view_functions.get(rule.endpoint)
            if view_func:
                docstring = view_func.__doc__
                if docstring:
                    route_info["doc_string"] = docstring.strip()
            
            routes.append(route_info)
    return render_template('index.html', routes=routes)


@messages.route("/messages", methods=["GET"])
def get_messages():
    """
    Fetches messages from the database with optional filtering by message ID, title, or tags.

    This route handles GET requests to fetch messages, allowing users to filter results by:
    - Message IDs (comma-separated)
    - Titles (comma-separated)
    - Tags (comma-separated)

    The function connects to the database, constructs a query with the appropriate filters based on the request parameters, 
    and returns the filtered messages in the response.

    Query Parameters:
    - id (optional): A comma-separated list of message IDs to filter by.
    - title (optional): A comma-separated list of titles to filter by.
    - tag (optional): A comma-separated list of tags to filter by.

    Returns:
    - JSON response with the list of messages in the "data" key if successful, or an error message if an exception occurs.

    HTTP Status Codes:
    - 200: If the messages are fetched successfully.
    - 500: If there is an error while fetching the messages.

    Logs:
    - Logs the URL of the request.
    - Logs the number of messages fetched successfully.
    - Logs any exceptions that occur during the process.

    Database:
    - Connects to the database using the URI from the app configuration.
    - Performs filtering based on the request parameters (id, title, tags).

    Example:
    GET /messages?id=1,2&title=Hello,World&tag=urgent,important

    Returns a JSON response with the filtered messages based on the specified IDs, titles, and tags.

    Exceptions:
    - Any errors during database operations are caught and logged, with a 500 error returned to the user.

    Finally:
    - The database session is always closed, regardless of whether the operation was successful or an error occurred.
    """
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
    """
    Adds a new message to the database with optional thumbnail, video, and tags.

    This route handles POST requests to create a new message, validating the provided data 
    and ensuring that required fields (title and description) are included. It also checks 
    for duplicate titles and validates thumbnail and video URLs, ensuring that they meet 
    specified format and size constraints. Additionally, the message can be associated with 
    tags, which are either matched to existing tags in the database or created as new.

    Request Body (JSON):
    - title (required): The title of the message.
    - description (required): The description of the message.
    - thumbnail (optional): A URL to the thumbnail image for the message.
    - video (optional): A URL to the video associated with the message.
    - tags (optional): A list of tags associated with the message.
    - gen_transcript (optional): A boolean indicating whether a transcript should be generated for the video.

    Returns:
    - 201: If the message is added successfully.
    - 400: If required fields are missing, if the title already exists, or if thumbnail/video validation fails.
    - 500: If there is an error during the process.

    Logs:
    - Logs the URL of the request and any relevant validation or error messages.
    - Logs a successful message addition with the message title.
    - Logs any exceptions that occur during the process.

    Database:
    - Checks if a message with the same title already exists.
    - Validates the thumbnail and video URLs, ensuring they meet format and size requirements.
    - Validates and associates tags with the message, creating new tags if necessary.

    Example:
    POST /messages
    {
        "title": "New Message",
        "description": "This is a new message.",
        "thumbnail": "http://example.com/thumbnail.jpg",
        "video": "http://example.com/video.mp4",
        "tags": ["tag1", "tag2"],
        "gen_transcript": true
    }

    Returns a JSON response indicating success or failure.

    Exceptions:
    - If a title already exists, a 400 error is returned.
    - If any validation fails for thumbnail, video, or required fields, a 400 error is returned.
    - Any unexpected errors are caught, logged, and a 500 error is returned to the user.

    Finally:
    - The database session is always closed, regardless of whether the operation was successful or an error occurred.
    """

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
    """
    Updates an existing message in the database.

    This route handles PUT requests to update an existing message, identified by its ID. 
    The update can include changes to the message description, thumbnail, video, and tags. 
    It validates the inputs and performs the necessary checks for URL validity, format, 
    and size for the thumbnail and video. If the specified message ID is not found, 
    or if required fields are missing or invalid, appropriate error responses are returned.

    Request Body (JSON):
    - description (required): The new description of the message.
    - thumbnail (optional): The URL of the new thumbnail image.
    - video (optional): The URL of the new video associated with the message.
    - tags (optional): A list of tags to associate with the message.
    - gen_transcript (optional): A boolean indicating whether a transcript should be generated for the video.

    Query Parameters:
    - id (required): The ID of the message to be updated.

    Returns:
    - 200: If the message is updated successfully.
    - 400: If required fields are missing or if thumbnail/video validation fails.
    - 404: If the message with the specified ID is not found.
    - 500: If there is an error during the process.

    Logs:
    - Logs the URL of the request and any relevant validation or error messages.
    - Logs a successful message update with the message title.
    - Logs any exceptions that occur during the process.

    Database:
    - Fetches the message to be updated by ID.
    - Validates and updates the description, thumbnail, video, and tags based on the request data.
    - Updates the tags, creating new ones if necessary.

    Example:
    PUT /messages?id=123
    {
        "description": "Updated description.",
        "thumbnail": "http://example.com/new_thumbnail.jpg",
        "video": "http://example.com/new_video.mp4",
        "tags": ["tag1", "tag3"],
        "gen_transcript": true
    }

    Returns a JSON response indicating success or failure.

    Exceptions:
    - If the message ID is missing or invalid, a 400 error is returned.
    - If the message with the specified ID is not found, a 404 error is returned.
    - If validation fails for thumbnail, video, or required fields, a 400 error is returned.
    - Any unexpected errors are caught, logged, and a 500 error is returned to the user.

    Finally:
    - The database session is always closed, regardless of whether the operation was successful or an error occurred.
    """

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
    """
    Fetches tags from the database, with optional filters.

    This route handles GET requests to retrieve tags from the database, allowing filtering 
    by tag ID, name, or associated message titles. It supports filtering by multiple criteria 
    using query parameters. If no filters are provided, it returns all tags.

    Query Parameters:
    - id (optional): A comma-separated list of tag IDs to filter by.
    - name (optional): A comma-separated list of tag names to filter by.
    - message (optional): A comma-separated list of message titles to filter tags by.

    Returns:
    - 200: A list of tags that match the specified filters.
    - 500: If there is an error while fetching the tags.

    Logs:
    - Logs the URL of the request.
    - Logs a successful fetch with the number of tags returned.
    - Logs any exceptions that occur during the process.

    Database:
    - Filters tags based on the provided filters and returns distinct results.

    Example:
    GET /tags?id=1,2,name=tag1,tag2,message=message1, message2

    Returns a JSON response with a list of filtered tags.

    Exceptions:
    - Any errors that occur during the fetching of tags are logged and returned as a 500 error.
    """

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
    """
    Adds new tags to the database.

    This route handles POST requests to add new tags to the database. It checks whether 
    the tags already exist (case-insensitive) and only adds those that do not already exist. 
    The request body must contain a list of tag names.

    Request Body (JSON):
    - tags (required): A list of tag names to add to the database.

    Returns:
    - 201: If the tags are added successfully.
    - 400: If the provided data is invalid or the 'tags' field is not a list.
    - 500: If there is an error while adding the tags.

    Logs:
    - Logs the URL of the request.
    - Logs a successful tag addition with the list of added tags.
    - Logs any exceptions that occur during the process.

    Database:
    - Checks if each tag exists and adds only those that are not present.

    Example:
    POST /tags
    {
        "tags": ["tag1", "tag2"]
    }

    Returns a JSON response indicating success.

    Exceptions:
    - If the 'tags' field is not a list or is empty, a 400 error is returned.
    - Any errors that occur during the process are logged and returned as a 500 error.
    """

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
    """
    Assigns tags to messages by creating links between message IDs and tag IDs.

    This route handles POST requests to assign tags to multiple messages. It expects 
    a list of message IDs and a list of tag IDs in the request body, and it creates 
    associations between the provided messages and tags. It avoids duplicate associations 
    by checking for existing links before creating new ones.

    Request Body (JSON):
    - message_ids (required): A list of message IDs to which tags will be assigned.
    - tag_ids (required): A list of tag IDs to be assigned to the messages.

    Returns:
    - 201: If the message-tag associations are created successfully.
    - 400: If the 'message_ids' or 'tag_ids' are missing or empty.
    - 500: If there is an error while assigning the message tags.

    Logs:
    - Logs the URL of the request.
    - Logs the number of new message-tag associations created.
    - Logs any exceptions that occur during the process.

    Database:
    - Checks for existing message-tag associations and adds only those that are new.

    Example:
    POST /message_tags
    {
        "message_ids": [1, 2],
        "tag_ids": [1, 2]
    }

    Returns a JSON response indicating success.

    Exceptions:
    - If 'message_ids' or 'tag_ids' are missing or empty, a 400 error is returned.
    - Any errors during the process are logged and returned as a 500 error.
    """
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
