# SendGrid Migration Guide

## Why Switch to SendGrid?

**Resend Issues:**
- ⏱️ Slow delivery: 5+ minutes to inbox
- 🔒 Sandbox restrictions: Can only send to verified email
- 🚫 Must use `onboarding@resend.dev` as sender

**SendGrid Benefits:**
- ⚡ Fast delivery: 1-2 seconds to inbox
- ✅ Custom sender addresses
- 🎯 Perfect for live demos

## Migration Steps

### 1. Get SendGrid API Key

1. Sign up at https://sendgrid.com/
2. Navigate to **Settings** → **API Keys**
3. Click **Create API Key**
4. Name it "UpRez Demo"
5. Select **Restricted Access** → Enable **Mail Send** permission
6. Copy the API key (starts with `SG.`)

### 2. Verify Sender Email

**Option A: Single Sender Verification (Fastest)**
1. Go to **Settings** → **Sender Authentication**
2. Click **Verify a Single Sender**
3. Enter your email address (e.g., `dpitcock.dev@gmail.com`)
4. Fill out the form and submit
5. Check your email and click the verification link
6. Use this email as `SENDGRID_FROM_EMAIL`

**Option B: Domain Authentication (Production)**
1. Go to **Settings** → **Sender Authentication**
2. Click **Authenticate Your Domain**
3. Follow DNS setup instructions for your domain
4. Use any email at your domain as `SENDGRID_FROM_EMAIL`

### 3. Update Environment Variables

Edit your `.env.local`:

```bash
# Email Configuration
EMAIL_PROVIDER=sendgrid

# SendGrid Configuration
SENDGRID_API_KEY=SG.your-actual-key-here
SENDGRID_FROM_EMAIL=dpitcock.dev@gmail.com  # Your verified sender
SENDGRID_FROM_NAME=UpRez Demo
CONTACT_EMAIL=dpitcock.dev@gmail.com  # Where demo emails go

# Remove or comment out Resend
# RESEND_API_KEY=re_...
```

### 4. Rebuild Docker Container

```bash
docker-compose down
docker-compose up --build
```

The backend will automatically install the SendGrid SDK from `requirements.txt`.

### 5. Test Email Integration

Run the test script:

```bash
docker exec -e SENDGRID_API_KEY=SG.your-key \
            -e SENDGRID_FROM_EMAIL=your-verified-email@example.com \
            -e EMAIL_PROVIDER=sendgrid \
            up-rez-backend-1 python3 scripts/test_email_integration.py
```

Expected output:
```
📧 Sending email via SENDGRID...
✅ Email sent via SendGrid to dpitcock.dev@gmail.com
   Status: 202
```

Check your inbox - the email should arrive within 1-2 seconds!

### 6. Trigger Demo Offer

1. Navigate to http://localhost:3030/demo
2. Click **Trigger Cron Offer** for any booking
3. Check Docker logs: `docker logs up-rez-backend-1 --tail 50`
4. Verify email arrives quickly

## Troubleshooting

### "API key is invalid"
- Double-check your `SENDGRID_API_KEY` in `.env.local`
- Ensure the API key has "Mail Send" permission

### "The from address does not match a verified Sender Identity"
- Verify your sender email in SendGrid dashboard
- Make sure `SENDGRID_FROM_EMAIL` matches exactly

### Email not arriving
- Check spam folder
- Verify `CONTACT_EMAIL` is correct
- Check SendGrid Activity Feed in dashboard

### Still using Resend
- Ensure `EMAIL_PROVIDER=sendgrid` in `.env.local`
- Restart Docker containers after changing env vars

## Switching Back to Resend

If you need to switch back:

```bash
# In .env.local
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_your-key-here
```

Then rebuild:
```bash
docker-compose down && docker-compose up --build
```

## Production Deployment

For Vercel deployment, add these environment variables:

```
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.your-key-here
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME=UpRez
CONTACT_EMAIL=your-email@example.com
```

## Support

- SendGrid Docs: https://docs.sendgrid.com/
- SendGrid Support: https://support.sendgrid.com/
