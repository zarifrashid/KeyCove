# KeyCove Vercel Deployment Notes

## What changed

- Root `vercel.json` routes `/api/*` to the Express backend and all other routes to the Vite React build.
- `api/index.js` exports the Express app for Vercel Serverless Functions.
- `server/src/server.js` now exports the app and only calls `app.listen()` during local development.
- The frontend automatically uses `/api` in production when `VITE_API_URL` is not provided.
- Auth cookies use secure production settings on Vercel.
- Local disk image uploads remain supported locally. On Vercel, uploads fall back to storing data URLs because serverless file storage is temporary.

## Required Vercel environment variables

Set these in the Vercel project settings:

```env
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=replace_with_a_long_random_secret
CLIENT_URL=https://your-vercel-project.vercel.app
EMAIL_VERIFICATION_REQUIRED=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_email_app_password
SMTP_FROM=KeyCove <your_email@gmail.com>
```

For Gmail, use an App Password instead of your normal Gmail password.

## Local development

Backend:

```bash
cd server
npm install
npm run dev
```

Frontend:

```bash
cd client
npm install
npm run dev
```

## Seed the 20 new Dhaka properties

After the backend is running and MongoDB is connected, call either:

```bash
curl -X POST http://localhost:5000/api/seed/dhaka-properties
```

or, after Vercel deployment:

```bash
curl -X POST https://your-vercel-project.vercel.app/api/seed/dhaka-properties
```

The seeder is idempotent. Running it again updates the same 20 seeded listings instead of creating duplicates.
