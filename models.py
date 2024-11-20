from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from BackDrop.app_and_db import db

class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(300), nullable=False)
    email = db.Column(db.String(300), nullable=False, unique=True)
    password_hash = db.Column(db.String(300), nullable=False)

    def __init__(self, name, email, password_hash):
        self.name = name
        self.email = email
        self.password_hash = password_hash

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

def create_user(name, email, password):
    new_user = User(name=name, email=email, password_hash=generate_password_hash(password))
    db.session.add(new_user)
    db.session.commit()

def get_user_by_email(email):
    return User.query.filter_by(email=email).first()