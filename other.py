from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.header import Header
import smtplib

def send_email(email, subject, text):
    msg = MIMEMultipart()
    msg['From'] = 'julialatypova52@gmail.com'
    msg['To'] = email
    msg['Subject'] = Header(subject, 'utf-8')

    msg.attach(MIMEText(text, 'plain', 'utf-8'))

    smtp_server = smtplib.SMTP('smtp.gmail.com', 587)
    smtp_server.starttls()
    smtp_server.login('julialatypova52@gmail.com', 'bsad yusg mcue hxou')

    try:
        smtp_server.sendmail('julialatypova52@gmail.com', email, msg.as_string())
    except smtplib.SMTPException as e:
        print(f'Ошибка при отправке письма: {e}')
    finally:
        smtp_server.quit()