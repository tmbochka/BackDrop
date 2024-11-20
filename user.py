from flask_login import UserMixin
from werkzeug.security import check_password_hash, generate_password_hash
from BackDrop.app_and_db import db

class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(300), nullable=False)
    email = db.Column(db.String(300), nullable=False, unique=True)
    password_hash = db.Column(db.String(300), nullable=False)
    confirmation_code = db.Column(db.String(6), nullable=True)
    confirmed = db.Column(db.Boolean, default=False)

    def __init__(self, name, email, password_hash):
        self.name = name
        self.email = email
        self.password_hash = password_hash

    def __repr__(self):
        return '<User {}>'.format(self.name)

def create_user(name, email, password):
    new_user = User(name=name, email=email, password_hash=generate_password_hash(password))
    db.session.add(new_user)
    db.session.commit()

def get_user_by_email(email):
    return User.query.filter_by(email=email).first()

def check_password(user, password):
    return check_password_hash(user.password_hash, password)

def change_password(email, password):
    user = get_user_by_email(email)
    user.password_hash = generate_password_hash(password)
    db.session.commit()