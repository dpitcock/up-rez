
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Add backend to path to import services
backend_path = Path(__file__).parent.parent / "backend"
sys.path.append(str(backend_path))

# Load env
project_root = Path(__file__).parent.parent
load_dotenv(project_root / ".env.local")
load_dotenv()

try:
    from services.email_service import send_test_email
except ImportError as e:
    print(f"Error importing email_service: {e}")
    sys.exit(1)

def main():
    contact_email = os.getenv("CONTACT_EMAIL")
    if not contact_email:
        print("Error: CONTACT_EMAIL not found in environment.")
        return

    print(f"Attempting to send test email to {contact_email}...")
    
    subject = "UpRez Integration Test"
    html_content = """
    <div style="font-family: sans-serif; padding: 20px;">
        <h1>Integration Test Successful</h1>
        <p>This is a test email from the UpRez backend script.</p>
        <p>If you are seeing this, your Resend configuration is working correctly.</p>
        <hr>
        <p><b>Timestamp:</b> %s</p>
    </div>
    """ % os.getenv("req_time", "Now")

    success = send_test_email(contact_email, subject, html_content)
    
    if success:
        print("\n✅ Email sent successfully!")
        print(f"Check your inbox at {contact_email}")
    else:
        print("\n❌ Failed to send email.")
        print("Check backend logs or API keys.")

if __name__ == "__main__":
    main()
