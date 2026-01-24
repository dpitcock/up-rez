import os
from typing import Optional

# Email provider configuration
EMAIL_PROVIDER = os.getenv("EMAIL_PROVIDER", "sendgrid").lower()

# SendGrid configuration
SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")
SENDGRID_FROM_EMAIL = os.getenv("SENDGRID_FROM_EMAIL", "noreply@uprez.com")
SENDGRID_FROM_NAME = os.getenv("SENDGRID_FROM_NAME", "UpRez Demo")

# Resend configuration (fallback)
RESEND_API_KEY = os.getenv("RESEND_API_KEY")

# Contact email for demo purposes
CONTACT_EMAIL = os.getenv("CONTACT_EMAIL")


def send_with_sendgrid(to_email: str, subject: str, html_content: str) -> bool:
    """Send email using SendGrid (recommended for demos - fast delivery)."""
    try:
        from sendgrid import SendGridAPIClient
        from sendgrid.helpers.mail import Mail, Email, To, Content, TrackingSettings, ClickTracking, OpenTracking
        
        if not SENDGRID_API_KEY:
            print("❌ SENDGRID_API_KEY not configured")
            return False
        
        # For demo purposes, override recipient if CONTACT_EMAIL is set
        recipient = CONTACT_EMAIL if CONTACT_EMAIL else to_email
        
        # Strip +alias from to_email for logging
        display_email = to_email
        if '+' in to_email and '@' in to_email:
            local, domain = to_email.split('@')
            if '+' in local:
                local = local.split('+')[0]
                display_email = f"{local}@{domain}"
        
        message = Mail(
            from_email=Email(SENDGRID_FROM_EMAIL, SENDGRID_FROM_NAME),
            to_emails=To(recipient),
            subject=subject,
            html_content=Content("text/html", html_content)
        )

        # Disable tracking to ensure raw URLs are sent (fixes issues with local/ngrok links)
        tracking_settings = TrackingSettings()
        tracking_settings.click_tracking = ClickTracking(False, False)
        tracking_settings.open_tracking = OpenTracking(False)
        message.tracking_settings = tracking_settings
        
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        response = sg.send(message)
        
        print(f"✅ Email sent via SendGrid to {recipient} (intended for: {display_email})")
        print(f"   Status: {response.status_code}")
        return True
        
    except Exception as e:
        print(f"❌ SendGrid error: {e}")
        return False


def send_with_resend(to_email: str, subject: str, html_content: str) -> bool:
    """Send email using Resend (slower delivery, sandbox restrictions)."""
    try:
        import resend
        
        if not RESEND_API_KEY:
            print("❌ RESEND_API_KEY not configured")
            return False
        
        resend.api_key = RESEND_API_KEY
        
        # Resend sandbox: must send FROM onboarding@resend.dev
        sender = "UpRez Demo <onboarding@resend.dev>"
        
        # Resend sandbox: can only send TO verified email
        # Hardwired for demo compliance
        recipient = "dpitcock.dev@gmail.com"
        
        # Strip +alias from to_email for logging
        display_email = to_email
        if '+' in to_email and '@' in to_email:
            local, domain = to_email.split('@')
            if '+' in local:
                local = local.split('+')[0]
                display_email = f"{local}@{domain}"
        
        params = {
            "from": sender,
            "to": [recipient],
            "subject": subject,
            "html": html_content,
        }
        
        r = resend.Emails.send(params)
        print(f"✅ Email sent via Resend to {recipient} (intended for: {display_email})")
        print(f"   Response: {r}")
        return True
        
    except Exception as e:
        print(f"❌ Resend error: {e}")
        return False


def send_test_email(to_email: str, subject: str, html_content: str) -> bool:
    """
    Send email using configured provider.
    
    Supports:
    - SendGrid (recommended for demos - fast, reliable)
    - Resend (fallback - slower, sandbox restrictions)
    
    Set EMAIL_PROVIDER environment variable to choose provider.
    """
    print(f"\n📧 Sending email via {EMAIL_PROVIDER.upper()}...")
    
    if EMAIL_PROVIDER == "sendgrid":
        return send_with_sendgrid(to_email, subject, html_content)
    elif EMAIL_PROVIDER == "resend":
        return send_with_resend(to_email, subject, html_content)
    else:
        print(f"❌ Unknown email provider: {EMAIL_PROVIDER}")
        print("   Valid options: sendgrid, resend")
        return False
