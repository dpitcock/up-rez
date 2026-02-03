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
        if hasattr(e, 'body'):
            print(f"   Error Body: {e.body}")
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


def send_upgrade_confirmation_email(to_email: str, guest_name: str, new_prop_name: str, confirmation_num: str, total_paid: float) -> bool:
    """
    Send a rich HTML confirmation email for a completed upgrade.
    """
    subject = f"UPGRADE CONFIRMED: Your new stay at {new_prop_name}"
    
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <div style="background-color: #000; padding: 40px; text-align: center; border-radius: 20px 20px 0 0;">
            <h1 style="color: #fff; margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 2px;">Upgrade Secured</h1>
        </div>
        
        <div style="padding: 40px; border: 1px solid #eee; border-top: none; border-radius: 0 0 20px 20px;">
            <p style="font-size: 18px;">Hello {guest_name},</p>
            
            <p style="line-height: 1.6;">Congratulations! Your exclusive upgrade request has been finalized. Your upcoming stay has been elevated to a more premium experience.</p>
            
            <div style="background-color: #f9f9f9; padding: 25px; border-radius: 15px; margin: 30px 0;">
                <p style="margin: 0; font-size: 12px; color: #888; text-transform: uppercase; font-weight: bold; letter-spacing: 1px;">New Property</p>
                <p style="margin: 5px 0 20px 0; font-size: 20px; font-weight: 800;">{new_prop_name}</p>
                
                <p style="margin: 0; font-size: 12px; color: #888; text-transform: uppercase; font-weight: bold; letter-spacing: 1px;">Confirmation Number</p>
                <p style="margin: 5px 0 20px 0; font-size: 18px; font-family: monospace; color: #ea580c;">{confirmation_num}</p>
                
                <p style="margin: 0; font-size: 12px; color: #888; text-transform: uppercase; font-weight: bold; letter-spacing: 1px;">Total Confirmed Amount</p>
                <p style="margin: 5px 0 0 0; font-size: 18px; font-weight: bold;">€{total_paid:.2f}</p>
            </div>
            
            <p style="line-height: 1.6;">We are thrilled to host you in this upgraded unit. No further action is required on your part—simply arrive and enjoy your enhanced stay.</p>
            
            <p style="margin-top: 40px; font-weight: bold;">Safe travels,<br/>The Stays Management Team</p>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #888; font-size: 12px;">
            <p>Powered by UpRez Technologies</p>
        </div>
    </div>
    """
    
    return send_test_email(to_email, subject, html_content)


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
