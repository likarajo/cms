"""Application Server Routes"""
from flask import Blueprint, render_template, request, make_response
from app import app, db
from .models import Message


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
    messages = Message.query.all()
    data = [{"id": message.id, "title": message.title, "content": message.content} for message in messages]
    return make_response({data: data}, 200)

@messages.route("/messages", methods=["POST"])
def create_message():
    data = request.json
    new_message = Message(title=data["title"], content=data["content"])
    db.session.add(new_message)
    db.session.commit()
    return make_response({"message": f"Message added successfully: {new_message.title}"}, 201)
