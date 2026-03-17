# KeyCove Starter (MERN Auth Base)

This is a beginner-friendly starter for your KeyCove project.

It includes:
- Home page
- Sign Up page
- Login page
- Tenant Dashboard placeholder
- Manager Dashboard placeholder
- Express backend
- MongoDB connection setup
- Basic auth routes scaffold

## Project Structure

- `client` -> React + Vite frontend
- `server` -> Node + Express backend

## 1) Run the backend

```bash
cd server
npm install
cp .env.example .env
npm run dev
```

Backend runs on `http://localhost:5000`

## 2) Run the frontend

Open a second terminal:

```bash
cd client
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`

## 3) Test routes

- `GET /api/test`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

## Notes

- This is a starter base for your first feature.
- Dashboards are placeholders.
- After login, the frontend redirects based on role.
- To fully save and read users, connect your MongoDB Atlas URI in `server/.env`.


## Where signup information is stored
When a user signs up, the backend saves the data in MongoDB inside the `users` collection.

Saved fields:
- `name`
- `email`
- `password` (hashed, not plain text)
- `role`
- timestamps like `createdAt` and `updatedAt`

You can see the saved users in MongoDB Atlas:
1. Open your Atlas project
2. Open your cluster
3. Click **Browse Collections**
4. Open your database
5. Open the **users** collection

That is where you will see the user's name, email, role, and other saved info.


## Important MongoDB note

If you see `Operation `users.findOne()` buffering timed out after 10000ms`, your backend is running but MongoDB is not connected.

Make sure `server/.env` exists and includes a valid Atlas URI:

```env
PORT=5000
MONGODB_URI=your_real_mongodb_connection_string
JWT_SECRET=supersecretkey
CLIENT_URL=http://localhost:5173
```


## Pre-filled Atlas connection

This zip already includes `server/.env` and `server/.env.example` with this Atlas setup:
- database user: `inteserwahidzarif`
- database password: `zarifneloykazi`
- database name: `keycove`

If Atlas still refuses the connection, make sure:
1. the Atlas database user really exists with that exact username and password
2. your current IP address is added in Atlas Network Access
3. you restart the backend after changing anything
