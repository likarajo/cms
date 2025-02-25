from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker


def create_db_session(uri):
    """Create DB Session
    Args:
        uri (str): SQLAlchemy URI
    Returns:
        Session: DB Session
    """
    engine = create_engine(uri, pool_pre_ping=True, pool_recycle=280)
    Session = sessionmaker(bind=engine, autocommit=False) #pylint:disable=invalid-name
    return Session()
