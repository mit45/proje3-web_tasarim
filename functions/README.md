Firebase Function: order notification (SendGrid)

This folder contains an example Firebase Function that sends an email to the admin when a new order document is created in Firestore.

Setup
1. Install dependencies inside `functions/`:

   ```bash
   cd functions
   npm install
   ```

2. Configure SendGrid API key and admin email. You can set them as environment variables or Firebase functions config:

   - Using environment variables (local testing):
     ```bash
     export SENDGRID_API_KEY="SG.xxxxx"
     export ADMIN_EMAIL="umittopuzg@gmail.com"
     ```

   - Using Firebase functions config (recommended for deployment):
     ```bash
     firebase functions:config:set sendgrid.key="SG.xxxxx" site.admin_email="umittopuzg@gmail.com"
     ```

3. Deploy (requires Firebase CLI):

   ```bash
   firebase deploy --only functions
   ```

Notes
- The function expects Firestore collections `orders`, `projects`, and `users` to exist (it will still work if `projects`/`users` docs are missing).
- The sender (`from`) in SendGrid must be a verified sender for your SendGrid account. Currently the example uses the admin email as `from` — change it to a verified sender if needed.
- The function updates the `orders/{orderId}` document with `notified: true` and `notifiedAt` timestamp when the email is successfully sent.

Security
- Do NOT commit real API keys to source control. Use `firebase functions:config:set` or your deployment environment variables.
