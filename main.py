from flask import Flask, render_template, request, redirect, url_for, flash, session
from flask_login import LoginManager, login_user, login_required, current_user, logout_user
from BackDrop.app_and_db import app, db
from models import User, create_user, get_user_by_email
from other import send_email
import random

login_manager = LoginManager()
login_manager.init_app(app)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/register', methods=['POST'])
def register():
    name = request.form.get('name')
    email = request.form.get('email')
    password = request.form.get('password')
    repeat_password = request.form.get('repeat_password')

    if not (name and email and password and repeat_password):
        flash('Все поля должны быть заполнены.')
        return redirect(url_for('index'))

    if password != repeat_password:
        flash('Пароли не совпадают.')
        return redirect(url_for('index'))

    user = get_user_by_email(email)
    if user:
        flash('Пользователь с такой почтой уже существует.')
        return redirect(url_for('index'))

    session['info'] = [name, email, password]
    code = random.randint(1000, 9999)
    session['code'] = code
    send_email(email, 'Код подтверждения', f'Ваш код подтверждения: {code}')

    return redirect(url_for('confirm_email'))

@app.route('/confirm_email', methods=['GET', 'POST'])
def confirm_email():
    if request.method == 'POST':
        code_sent = session.get('code')
        code = request.form.get('code')

        if str(code_sent) != str(code):
            flash('Неверный код.')
            return redirect(url_for('confirm_email'))

        info = session.get('info')
        create_user(info[0], info[1], info[2])
        flash('Регистрация успешна!')
        return redirect(url_for('index'))

    return render_template('confirm_email.html')

@app.route('/login', methods=['POST'])
def login():
    email = request.form.get('email')
    password = request.form.get('password')

    user = get_user_by_email(email)
    if user and user.check_password(password):
        login_user(user)
        return redirect(url_for('index'))
    else:
        flash('Неверный email или пароль.')
        return redirect(url_for('index'))

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('index'))

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(host='127.0.0.1', port=8008, debug=True)