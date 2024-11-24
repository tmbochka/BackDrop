from flask import Flask, render_template, request, redirect, url_for, flash, session, send_from_directory, jsonify, send_file
from flask_login import LoginManager, login_user, login_required, current_user, logout_user
from app_and_db import app, db
from models import User, Image, Archive, create_user, get_user_by_email
from other import send_email
import random
import zipfile
import shutil
from werkzeug.utils import secure_filename
from rembg import remove
from PIL import Image as PILImage
import subprocess
import os
import torch
import torchvision.transforms as transforms
import cv2
import numpy as np
import pandas as pd
import torch.nn.functional as F


login_manager = LoginManager()
login_manager.init_app(app)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

if not os.path.exists('uploads'):
    os.makedirs('uploads')

@app.route('/')
def index():
    return render_template('index.html')
    
@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        name = request.form.get('name')
        email = request.form.get('email')
        password = request.form.get('password')
        repeat_password = request.form.get('repeat_password')

        if not (name and email and password and repeat_password):
            flash('Все поля должны быть заполнены.')
            return redirect(url_for('register'))

        if password != repeat_password:
            flash('Пароли не совпадают.')
            return redirect(url_for('register'))

        user = get_user_by_email(email)
        if user:
            flash('Пользователь с такой почтой уже существует.')
            return redirect(url_for('register'))

        session['info'] = [name, email, password]
        code = random.randint(1000, 9999)
        session['code'] = code
        send_email(email, 'Код подтверждения', f'Ваш код подтверждения: {code}')

        return redirect(url_for('confirm_email'))

    return render_template('register.html')

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
        return redirect(url_for('login'))

    return render_template('confirm_email.html')

@app.route('/account')
@login_required
def account():
    return render_template('account.html')

@app.route('/portfolio')
@login_required
def portfolio():
    images = Image.query.filter_by(user_id=current_user.id).all()
    archives = Archive.query.filter_by(user_id=current_user.id).all()
    return render_template('portfolio.html', images=images, archives=archives)

@app.route('/archiver')
@login_required
def archiver():
    return render_template('archiver.html')

@app.route('/section')
@login_required
def section():
    return render_template('section.html')

@app.route('/music')
@login_required
def music():
    return render_template('music.html')

@app.route('/background')
@login_required
def background():
    return render_template('background.html')

@app.route('/profile')
@login_required
def profile():
    archives = Archive.query.filter_by(user_id=current_user.id).all()
    return render_template('profile.html', archives=archives)

@app.route('/instruction')
def instruction():
    return render_template('instruction.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')

        user = get_user_by_email(email)
        if user and user.check_password(password):
            login_user(user)
            return redirect(url_for('account'))
        else:
            flash('Неверный email или пароль.')
            return redirect(url_for('login'))

    return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('index'))

@app.route('/download/<filename>')
@login_required
def download(filename):
    return send_from_directory('uploads', filename, as_attachment=True)

@app.route('/finish', methods=['POST'])
@login_required
def finish():
    archive_name = request.form.get('archive_name', 'processed_images.zip')
    shutil.make_archive(os.path.join('uploads', archive_name), 'zip', 'uploads')
    flash('Обработанные изображения сохранены в архив')
    return redirect(url_for('portfolio'))

@app.route('/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static'), 'favicon.ico', mimetype='image/vnd.microsoft.icon')

@app.route('/upload_and_archive', methods=['POST'])
@login_required
def upload_and_archive():
    if 'file' not in request.files:
        return jsonify({'success': False, 'message': 'Файлы не выбраны'}), 400

    files = request.files.getlist('file')
    if not files:
        return jsonify({'success': False, 'message': 'Файлы не выбраны'}), 400

    archive_name = request.form.get('archive_name', 'archive')
    save_option = request.form.get('save_option')

    temp_dir = os.path.join('uploads', 'temp')
    os.makedirs(temp_dir, exist_ok=True)

    for file in files:
        file_path = os.path.join(temp_dir, file.filename)
        file.save(file_path)

    archive_path = os.path.join('uploads', f'{archive_name}.zip')
    with zipfile.ZipFile(archive_path, 'w') as zipf:
        for root, dirs, files in os.walk(temp_dir):
            for file in files:
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, temp_dir)
                zipf.write(file_path, arcname)

    shutil.rmtree(temp_dir)

    if save_option in ['profile', 'all']:
        new_archive = Archive(filename=f'{archive_name}.zip', user_id=current_user.id)
        db.session.add(new_archive)
        db.session.commit()

    if save_option in ['device', 'all']:
        return send_file(archive_path, as_attachment=True, download_name=f'{archive_name}.zip')

    return jsonify({'success': True, 'message': 'Файлы успешно заархивированы'}), 200

@app.route('/upload', methods=['GET', 'POST'])
@login_required
def upload():
    if request.method == 'POST':
        file = request.files['file']
        if file:
            filename = secure_filename(file.filename)
            file_path = os.path.join('uploads', filename)
            file.save(file_path)
            new_image = Image(filename=filename, user_id=current_user.id)
            db.session.add(new_image)
            db.session.commit()
            return jsonify({'success': True, 'message': 'Файл успешно загружен', 'filename': filename})
        return jsonify({'success': False, 'message': 'Файл не выбран'}), 400
    return render_template('upload.html')


@app.route('/process_image_tracer', methods=['POST'])
@login_required
def process_image_tracer():
    pass

def post_processing(original_image, output_image, height, width, background='transparent', threshold=200):
    pass

@app.route('/save_to_account', methods=['POST'])
@login_required
def save_to_account():
    processed_filename = request.form.get('processed_filename')
    if not processed_filename:
        return jsonify({'success': False, 'message': 'Имя файла не указано'}), 400

    image_record = Image.query.filter_by(processed_filename=processed_filename, user_id=current_user.id).first()
    if image_record:
        flash('Изображение сохранено в аккаунт')
        return jsonify({'success': True, 'message': 'Изображение сохранено в аккаунт'})
    return jsonify({'success': False, 'message': 'Изображение не найдено'}), 404

@app.route('/delete_archive/<filename>', methods=['POST'])
@login_required
def delete_archive(filename):
    archive = Archive.query.filter_by(filename=filename, user_id=current_user.id).first()
    if archive:
        db.session.delete(archive)
        db.session.commit()
        os.remove(os.path.join('uploads', filename))
        return jsonify({'success': True, 'message': 'Архив успешно удален'})
    else:
        return jsonify({'success': False, 'message': 'Архив не найден'}), 404

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(host='127.0.0.1', port=8000, debug=True)