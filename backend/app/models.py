"""Application Server Models"""
from app import db
from sqlalchemy import Text, Column, Integer, String, BLOB


class Message(db.Model):
    id = Column(Integer, primary_key=True)
    title = Column(String(80), unique=True, nullable=False)
    description = Column(Text, nullable=False)
    thumbnail = Column(Text, nullable=True) # image URL
    tags = Column(Text, nullable=True) # comma-separated string

    def __init__(self, title, description, thumbnail=None, tags=None):
        self.title = title
        self.description = description
        self.thumbnail = thumbnail
        self.tags = tags

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'thumbnail': self.thumbnail,
            'tags': self.tags
        }

    def __repr__(self):
        return f"<Message {self.title}>"
