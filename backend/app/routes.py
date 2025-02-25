"""Application Server Routes"""
import logging
from flask import Blueprint, render_template, request, make_response
from app import app, db
from app.utils import create_db_session
from app.models import Message


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
def create_message():
    try:
        data = request.json
        db_session = create_db_session(app.config.get('SQLALCHEMY_DATABASE_URI'))
        new_message = Message(
            title=data["title"], 
            content=data["content"]
        )
        db.session.add(new_message)
        db.session.commit()
        logging.info(f"Message added successfully: {new_message.title}")
        return make_response({"msg": f"Message added successfully: {new_message.title}"}, 201)
    except Exception as e:
        logging.exception(f"Error adding message: {str(e)}")
        return make_response({"msg": "Error adding message"}, 500)
    finally:
        if db_session:
            db_session.close()
