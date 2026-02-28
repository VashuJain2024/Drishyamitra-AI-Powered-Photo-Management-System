import os
import pickle
import base64
import mimetypes
import logging
from email.mime.application import MIMEApplication
from email.mime.image import MIMEImage
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from flask import current_app
from config import Config

logger = logging.getLogger(__name__)

# If modifying these SCOPES, delete the file token.pickle.
SCOPES = ['https://www.googleapis.com/auth/gmail.send']

class GmailService:
    """Gmail API service for sending emails with attachments"""

    def __init__(self):
        self.credentials_path = Config.GMAIL_CREDENTIALS_PATH
        self.token_path = Config.GMAIL_TOKEN_PATH
        self.service = self._get_service()

    def _get_service(self):
        """Authenticate and return Gmail service"""
        creds = None
        # The file token.pickle stores the user's access and refresh tokens
        if os.path.exists(self.token_path):
            with open(self.token_path, 'rb') as token:
                try:
                    creds = pickle.load(token)
                except Exception as e:
                    logger.error(f"Error loading token: {e}")

        # If there are no (valid) credentials available, let the user log in.
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                try:
                    creds.refresh(Request())
                except Exception as e:
                    logger.error(f"Error refreshing token: {e}")
                    creds = None
            
            if not creds:
                if not os.path.exists(self.credentials_path):
                    logger.warning(f"Gmail credentials not found at {self.credentials_path}")
                    return None
                
                try:
                    flow = InstalledAppFlow.from_client_secrets_file(
                        self.credentials_path, SCOPES)
                    # This will open a browser window for authentication
                    creds = flow.run_local_server(port=0)
                except Exception as e:
                    logger.error(f"Error starting OAuth flow: {e}")
                    return None

            # Save the credentials for the next run
            with open(self.token_path, 'wb') as token:
                pickle.dump(creds, token)

        if creds:
            try:
                return build('gmail', 'v1', credentials=creds)
            except Exception as e:
                logger.error(f"Error building Gmail service: {e}")
        return None

    def send_email(self, to, subject, body, attachment_path=None):
        """Compose and send a MIME message via Gmail API"""
        if not self.service:
            logger.error("Gmail service not initialized.")
            return False, "Gmail API not authenticated."

        try:
            message = MIMEMultipart()
            message['to'] = to
            message['subject'] = subject
            
            msg_text = MIMEText(body)
            message.attach(msg_text)

            if attachment_path and os.path.exists(attachment_path):
                # Check file size (Gmail limit is ~25MB)
                file_size = os.path.getsize(attachment_path)
                if file_size > 20 * 1024 * 1024: # 20MB limit for safety
                    return False, "Attachment too large. Max size 20MB."

                content_type, encoding = mimetypes.guess_type(attachment_path)
                if content_type is None or encoding is not None:
                    content_type = 'application/octet-stream'
                
                main_type, sub_type = content_type.split('/', 1)
                
                with open(attachment_path, 'rb') as f:
                    file_data = f.read()

                if main_type == 'image':
                    part = MIMEImage(file_data, _subtype=sub_type)
                elif main_type == 'application':
                    part = MIMEApplication(file_data, _subtype=sub_type)
                else:
                    part = MIMEApplication(file_data, _subtype=sub_type)
                
                part.add_header('Content-Disposition', 'attachment', filename=os.path.basename(attachment_path))
                message.attach(part)

            # Encode the message and send
            raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode('utf-8')
            sent_message = self.service.users().messages().send(userId='me', body={'raw': raw_message}).execute()
            
            logger.info(f"Email sent successfully to {to}. Message ID: {sent_message['id']}")
            return True, sent_message['id']

        except Exception as e:
            logger.error(f"Error sending email: {e}")
            return False, str(e)
