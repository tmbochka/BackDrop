from flask_sqlalchemy import SQLAlchemy
from flask import Flask


app = Flask(__name__)
app.secret_key = 'hello'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///BackDrop.db'
db = SQLAlchemy(app)