from flask import Flask, render_template, request, redirect, url_for, flash, session, send_from_directory, jsonify, send_file
from flask_login import LoginManager, login_user, login_required, current_user, logout_user
from app_and_db import app, db
from models import User, Image, Archive, create_user, get_user_by_email
from other import send_email
import random
import zipfile
import shutil
from werkzeug.utils import secure_filename
from PIL import Image as PILImage
import subprocess
import os
import cv2
import numpy as np
import matplotlib.image as mpimg
import logging
import sys
import uuid
import torch
from torchvision import transforms
import requests

from tracer_model import TracerModel


login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# ========================
# Основные маршруты
# ========================

@app.route('/')
def index():
    return render_template('index.html')


# Главная страница после входа в аккаунт
@app.route('/account')
@login_required
def account():
    return render_template('account.html')

# Здесь лежат архивы и обработанные фото
@app.route('/portfolio')
@login_required
def portfolio():
    images = Image.query.filter_by(user_id=current_user.id).all()
    archives = Archive.query.filter_by(user_id=current_user.id).all()
    return render_template('portfolio.html', images=images, archives=archives)

# Страница архиватора
@app.route('/archiver')
@login_required
def archiver():
    return render_template('archiver.html')

# Страница с музыкой
'''Раньше работало, сейчас нет, но это не столь важно и поправимо'''
@app.route('/music')
@login_required
def music():
    return render_template('music.html')

# Страница с фонами
'''Была идея, что после применения, фон будет меняться на всех страницах, но пока меняется только на странице background, но тоже не столь важно'''
@app.route('/background')
@login_required
def background():
    return render_template('background.html')

# Базова инструкция
@app.route('/instruction')
def instruction():
    return render_template('instruction.html')

# ========================
# Аутентификация
# ========================

# Регистрация пользователя
@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        name = request.form.get('name')
        email = request.form.get('email')
        password = request.form.get('password')
        repeat_password = request.form.get('repeat_password')

        if not all([name, email, password, repeat_password]):
            flash('Все поля должны быть заполнены.', 'error')
            return redirect(url_for('register'))

        if password != repeat_password:
            flash('Пароли не совпадают.', 'error')
            return redirect(url_for('register'))

        if get_user_by_email(email):
            flash('Пользователь с такой почтой уже существует.', 'error')
            return redirect(url_for('register'))

        session['user_info'] = {
            'name': name,
            'email': email,
            'password': password
        }
        session['verification_code'] = str(random.randint(1000, 9999))
        
        try:
            send_email(email, 'Код подтверждения', 
                      f'Ваш код подтверждения: {session["verification_code"]}')
            flash('Код подтверждения отправлен на вашу почту.', 'success')
            return redirect(url_for('confirm_email'))
        except Exception as e:
            flash(f'Ошибка отправки email: {str(e)}', 'error')
            return redirect(url_for('register'))

    return render_template('register.html')

# Приходит код на почту (возможно в спам)
@app.route('/confirm_email', methods=['GET', 'POST'])
def confirm_email():
    if 'user_info' not in session:
        flash('Сначала зарегистрируйтесь.', 'error')
        return redirect(url_for('register'))

    if request.method == 'POST':
        user_code = request.form.get('code')
        if user_code == session.get('verification_code'):
            user_info = session['user_info']
            create_user(user_info['name'], user_info['email'], user_info['password'])
            flash('Регистрация успешно завершена! Теперь вы можете войти.', 'success')
            session.pop('user_info', None)
            session.pop('verification_code', None)
            return redirect(url_for('login'))
        else:
            flash('Неверный код подтверждения.', 'error')
    
    return render_template('confirm_email.html')

# После подтверждения кода нужно снова ввести данные, но уже для входа
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        user = get_user_by_email(email)
        
        if user and user.check_password(password):
            login_user(user)
            flash('Вы успешно вошли в систему.', 'success')
            next_page = request.args.get('next') or url_for('account')
            return redirect(next_page)
        
        flash('Неверный email или пароль.', 'error')
    
    return render_template('login.html')

# Выход из аккаунта
@app.route('/logout')
@login_required
def logout():
    logout_user()
    flash('Вы вышли из системы.', 'info')
    return redirect(url_for('index'))

# =====================================
# МОМЕНТ с МОДЕЛЬЮ TRACER
# =====================================

# ЗАГРУЖАЕМ МОДЕЛЬ

# Пока закомментировала, чтобы сайт вообще открывался
# tracer = TracerModel("archive/data.pkl")

# Это просто страница с самой моделью, на которой будут обрабатываться фото
@app.route('/upload', methods=['GET'])
@login_required
def upload_page():
    return render_template('upload.html')

# ВОТ ЗДЕСЬ УЖЕ ОБРАБОТКА ФОТО МОДЕЛЬЮ
@app.route('/upload', methods=['POST'])
@login_required
def handle_upload():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'Файл не выбран'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'Имя файла пустое'}), 400

        temp_filename = f'temp_{uuid.uuid4().hex[:8]}.jpg'
        temp_path = os.path.join(app.config['UPLOAD_FOLDER'], temp_filename)
        file.save(temp_path)

        processed_image = tracer.process_image(temp_path)
        
        result_filename = f"res_{uuid.uuid4().hex[:8]}.jpg"
        result_path = os.path.join(app.config['UPLOAD_FOLDER'], result_filename)
        cv2.imwrite(result_path, processed_image)
        
        os.remove(temp_path)

        return jsonify({
            'success': True,
            'filename': result_filename
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# В папке uploads будут лежать обработанные фото
@app.route('/uploads/<filename>')
@login_required
def get_uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)


# ========================
# РАБОТА С АРХИВАМИ
# ========================

# Тут все нормально, все работает. Архивы сохраняются в: Профиль -> Архивы

@app.route('/upload_and_archive', methods=['POST'])
@login_required
def upload_and_archive():
    if 'file' not in request.files:
        return jsonify({'success': False, 'message': 'Файлы не выбраны'}), 400

    files = request.files.getlist('file')
    if not files or all(f.filename == '' for f in files):
        return jsonify({'success': False, 'message': 'Файлы не выбраны'}), 400

    archive_name = request.form.get('archive_name', 'archive').strip() or 'archive'
    save_option = request.form.get('save_option', 'device')

    temp_dir = os.path.join(app.config['UPLOAD_FOLDER'], 'temp')
    os.makedirs(temp_dir, exist_ok=True)

    try:
        saved_files = []
        for file in files:
            if file.filename:
                filename = secure_filename(file.filename)
                filepath = os.path.join(temp_dir, filename)
                file.save(filepath)
                saved_files.append(filename)

        # Тут создание архива
        archive_path = os.path.join(app.config['UPLOAD_FOLDER'], f'{archive_name}.zip')
        with zipfile.ZipFile(archive_path, 'w') as zipf:
            for filename in saved_files:
                filepath = os.path.join(temp_dir, filename)
                zipf.write(filepath, filename)

        # Тут сохранение в БД
        if save_option in ['profile', 'all']:
            new_archive = Archive(
                filename=f'{archive_name}.zip',
                user_id=current_user.id
            )
            db.session.add(new_archive)
            db.session.commit()

        if save_option in ['device', 'all']:
            return send_file(
                archive_path,
                as_attachment=True,
                download_name=f'{archive_name}.zip',
                mimetype='application/zip'
            )

        return jsonify({
            'success': True,
            'message': 'Файлы успешно заархивированы',
            'archive_name': f'{archive_name}.zip'
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Ошибка при создании архива: {str(e)}'
        }), 500
    finally:
        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir)

# Это удаление архива из Профиль -> Архивы
# Тоже все работает вроде
@app.route('/delete_archive/<int:archive_id>', methods=['POST'])
@login_required
def delete_archive(archive_id):
    archive = Archive.query.filter_by(id=archive_id, user_id=current_user.id).first()
    if not archive:
        return jsonify({'success': False, 'message': 'Архив не найден'}), 404
    
    try:
        # Удаление архива
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], archive.filename)
        if os.path.exists(filepath):
            os.remove(filepath)
        
        # Удаление из БД
        db.session.delete(archive)
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Архив удален'})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Ошибка удаления: {str(e)}'}), 500

# Уже забыла зачем это, кажется, для иконок
@app.route('/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static'), 
           'favicon.ico', mimetype='image/vnd.microsoft.icon')



if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(host='127.0.0.1', port=8000, debug=True)