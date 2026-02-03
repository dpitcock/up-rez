import os
from dotenv import load_dotenv
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email, To, Content

load_dotenv()

def test_sendgrid():
    api_key = os.getenv("SENDGRID_API_KEY")
    from_email = os.getenv("SENDGRID_FROM_EMAIL")
    to_email = os.getenv("CONTACT_EMAIL") or "dpitcock.dev@gmail.com"
    
    print(f"Testing SendGrid...")
    print(f"API Key: {api_key[:10]}...")
    print(f"From: {from_email}")
    print(f"To: {to_email}")
    
    message = Mail(
        from_email=Email(from_email, "UpRez Test"),
        to_emails=To(to_email),
        subject="UpRez SendGrid Connectivity Test",
        html_content=Content("text/html", "<strong>If you see this, SendGrid is working!</strong>")
    )
    
    try:
        sg = SendGridAPIClient(api_key)
        response = sg.send(message)
        print(f"Status Code: {response.status_code}")
        print(f"Response Body: {response.body}")
        print(f"Response Headers: {response.headers}")
        if response.status_code == 202:
            print("✅ Success! SendGrid accepted the message (Status 202).")
            print("Check your inbox (and spam folder) for 'UpRez SendGrid Connectivity Test'.")
        else:
            print(f"❓ Unexpected status code: {response.status_code}")
    except Exception as e:
        print(f"❌ SendGrid Test Failed: {e}")

if __name__ == "__main__":
    test_sendgrid()
