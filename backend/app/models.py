"""Application Server Models"""
from app import db
from sqlalchemy import Text, Column, Integer, String, BLOB


class Message(db.Model):
    id = Column(Integer, primary_key=True)
    title = Column(String(80), unique=True, nullable=False)
    content = Column(Text, nullable=False)
    thumbnail = Column(BLOB, nullable=True)

    def __init__(self, title, content, thumbnail=None):
        self.title = title
        self.content = content
        if thumbnail:
            self.thumbnail = thumbnail

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'content': self.content,
            'thumbnail': self.thumbnail if self.thumbnail else None
        }

    def __repr__(self):
        return f"<Message {self.title}>"
