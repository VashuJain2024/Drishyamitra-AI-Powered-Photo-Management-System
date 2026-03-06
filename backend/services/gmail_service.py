import os
import smtplib
import mimetypes
import logging
from email.mime.application import MIMEApplication
from email.mime.image import MIMEImage
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from flask import current_app
logger = logging.getLogger(__name__)
class GmailService:
    """Gmail service for sending emails via SMTP using App Passwords"""
    def __init__(self):
        self.email_user = os.environ.get("EMAIL_USER")
        self.email_password = os.environ.get("EMAIL_PASSWORD")
        self.smtp_server = "smtp.gmail.com"
        self.smtp_port = 465 
    def send_email(self, to, subject, body, attachment_path=None):
        """Compose and send a MIME message via SMTP"""
        if not self.email_user or not self.email_password:
            logger.error("Email credentials missing in environment.")
            return False, "Email configuration missing. Please set EMAIL_USER and EMAIL_PASSWORD in .env"
        try:
            message = MIMEMultipart()
            message['From'] = self.email_user
            message['To'] = to
            message['Subject'] = subject
            message.attach(MIMEText(body, 'plain'))
            if attachment_path:
                paths = attachment_path if isinstance(attachment_path, list) else [attachment_path]
                total_size = 0
                for path in paths:
                    if not os.path.exists(path):
                        continue
                    file_size = os.path.getsize(path)
                    total_size += file_size
                    if total_size > 22 * 1024 * 1024: 
                        return False, f"Total attachments size exceeds 22MB limit. (Photo: {os.path.basename(path)})"
                    content_type, encoding = mimetypes.guess_type(path)
                    if content_type is None or encoding is not None:
                        content_type = 'application/octet-stream'
                    main_type, sub_type = content_type.split('/', 1)
                    with open(path, 'rb') as f:
                        file_data = f.read()
                    if main_type == 'image':
                        part = MIMEImage(file_data, _subtype=sub_type)
                    else:
                        part = MIMEApplication(file_data, _subtype=sub_type)
                    part.add_header('Content-Disposition', 'attachment', filename=os.path.basename(path))
                    message.attach(part)
            with smtplib.SMTP_SSL(self.smtp_server, self.smtp_port) as server:
                server.login(self.email_user, self.email_password)
                server.send_message(message)
            logger.info(f"Email sent successfully via SMTP to {to}")
            return True, "Email sent successfully"
        except Exception as e:
            logger.error(f"SMTP Error: {e}")
            return False, f"Failed to send email: {str(e)}"