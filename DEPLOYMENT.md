
# Deploying UpRez to Vercel

UpRez is designed to be a "one-click" style deployment on Vercel. Follow these steps to provision the necessary infrastructure.

## 1. Create a Vercel Project

1. Import your `up-rez` repository into Vercel.
2. Set the **Root Directory** to `frontend` if your repository structure has the app in a subfolder, OR keep as root if you've flattened it. (Current structure: Root is the repository, app is in the `frontend` folder).
   *   *Recommended*: Set "Root Directory" to `frontend` in Vercel settings.

## 2. Provision Storage (Postgres)

UpRez uses **Vercel Postgres** (which is powered by **Neon**) to store properties, bookings, and generated offers.

1. In your Vercel Project Dashboard, go to the **Storage** tab.
2. Click **Create** and select **Postgres**.
   *   *Note*: We recommend Vercel Postgres for its "one-click" integration. If you prefer **Supabase**, you can use it by manually setting the `POSTGRES_URL` in Step 3.
3. Follow the steps to create a new database.
4. Once created, click **Connect** to automatically add the required environment variables (`POSTGRES_URL`, `POSTGRES_USER`, etc.) to your project.

## 3. Environment Variables

Go to **Settings > Environment Variables** and add the following:

| Variable | Description |
| :--- | :--- |
| `OPENAI_API_KEY` | Your OpenAI API Key (req. for copy & chat) |
| `NEXT_PUBLIC_USE_OPENAI` | Set to `true` |
| `SENDGRID_API_KEY` | Your SendGrid API Key |
| `SENDGRID_FROM_EMAIL` | The verified sender email in your SendGrid account |
| `CONTACT_EMAIL` | (Optional) Your email, to receive ALL demo emails |
| `NEXT_PUBLIC_FRONTEND_URL` | Your Vercel deployment URL (e.g., `https://up-rez.vercel.app`) |

## 4. Initialize the Database

Vercel Functions cannot run long-running seed scripts easily. Instead, UpRez includes a secure initialization endpoint.

1. Deploy your app.
2. Visit `https://your-app.vercel.app/api/demo/reset`.
3. This endpoint will:
   *   Create the necessary SQL tables.
   *   Seed the database with initial Property and Booking data.
   *   Return a JSON success message.

## 5. Testing the Flow

1. Go to `https://your-app.vercel.app/demo`.
2. Find a "Ready Booking" (e.g., Alice Johnson - Budget Guest).
3. Click **Run Logic**.
4. The system will generate an offer via OpenAI and send an email via SendGrid.
5. Check your `CONTACT_EMAIL` (or the guest's email if not set) for the offer link.
6. Open the link to see the dynamic landing page and test the **AI Concierge Chat**.

## Troubleshooting

*   **Database connection fails**: Ensure you clicked "Connect" in the Storage tab to link the DB to your environment.
*   **Emails not sending**: Verify your SendGrid Sender Identity is fully verified in the SendGrid dashboard.
*   **AI Chat is slow**: Using `gpt-4o-mini` is recommended for the fastest response times while maintaining high quality.
