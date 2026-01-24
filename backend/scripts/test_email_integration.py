
import os
import sys
from pathlib import Path

# Add /app to sys.path so we can import 'services'
# This script is in /app/scripts/
app_dir = Path(__file__).parent.parent
sys.path.append(str(app_dir))

try:
    from services.email_service import send_test_email
except ImportError as e:
    print(f"Error importing email_service: {e}")
    # Print sys.path for debugging
    print(f"sys.path: {sys.path}")
    sys.exit(1)

def main():
    # Hardcoded for demo testing
    contact_email = "dpitcock.dev@gmail.com"
    
    print(f"Attempting to send test email to {contact_email}...")
    
    subject = "UpRez Integration Test (Docker)"
    html_content = """
    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
        <h1 style="color: #4F46E5;">Integration Test Successful</h1>
        <p>This email confirms that your backend Docker container can successfully send emails via Resend.</p>
        <p><b>Recipient:</b> %s</p>
        <hr>
        <p><small>Sent from UpRez Backend Container</small></p>
    </div>
    """ % contact_email

    success = send_test_email(contact_email, subject, html_content)
    
    if success:
        print("\n✅ Email sent successfully!")
        print(f"Check your inbox at {contact_email}")
    else:
        print("\n❌ Failed to send email.")
        print("Check backend logs for details.")

if __name__ == "__main__":
    main()
