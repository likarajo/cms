"""Application Server Models"""
from app import db
from sqlalchemy import Text, Column, Integer, String


class Message(db.Model):
    id = Column(Integer, primary_key=True)
    title = Column(String(80), unique=True, nullable=False)
    content = Column(Text, nullable=False)

    def __init__(self, title, content):
        self.title = title
        self.content = content

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'content': self.content,
        }

    def __repr__(self):
        return f"<Message {self.title}>"
