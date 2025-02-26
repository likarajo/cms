"""Application Server Models"""
from app import db
from sqlalchemy import ForeignKey, Table, Text, Column, Integer, String
from sqlalchemy.orm import relationship


# Association table for many-to-many relationship
message_tags = Table('message_tags', db.Model.metadata,
    Column('message_id', Integer, ForeignKey('message.id'), primary_key=True),
    Column('tag_id', Integer, ForeignKey('tag.id'), primary_key=True)
)


class Tag(db.Model):
    id = Column(Integer, primary_key=True)
    name = Column(String(80), unique=True, nullable=False)
    messages = relationship('Message', secondary=message_tags, back_populates='tags')

    def __init__(self, name):
        self.name = name

    def __repr__(self):
        return f"<Tag {self.name}>"


class Message(db.Model):
    id = Column(Integer, primary_key=True)
    title = Column(String(80), unique=True, nullable=False)
    description = Column(Text, nullable=False)
    thumbnail = Column(Text, nullable=True) # image URL
    tags = relationship('Tag', secondary=message_tags, back_populates='messages')

    def __init__(self, title, description, thumbnail=None, tags=None):
        self.title = title
        self.description = description
        self.thumbnail = thumbnail
        if tags:
            self.tags = [
                Tag.query.filter_by(name=tag.strip()).first() # Retrieve
                or Tag(name=tag.strip()) # OR Create New
            for tag in tags.split(",")]

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'thumbnail': self.thumbnail,
            'tags': [tag.name for tag in self.tags]
        }

    def __repr__(self):
        return f"<Message {self.title}>"
