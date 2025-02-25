"""Application Server Models"""
from app import db
from sqlalchemy import Text, Column, Integer, String


class Message(db.Model):
    id = Column(Integer, primary_key=True)
    title = Column(String(80), unique=True, nullable=False)
    content = Column(Text, nullable=False)

    def __repr__(self):
        return f"<Message {self.title}>"
