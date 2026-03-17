# KeyCove - Feature 1: Interactive Map-Based Property Discovery

This version keeps the existing MERN authentication flow and adds the first major product feature:

- interactive Dhaka property discovery on a Bangladesh-focused map
- marker-based browsing
- result cards beside the map
- search by area name
- current location button
- reset map button
- property details page
- backend property API
- one-click Dhaka seed data population with 30 demo properties

## Project structure

- `client/` - React + Vite frontend
- `server/` - Express + MongoDB backend

## Environment setup

Create `server/.env` using your MongoDB Atlas connection string.

Example:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string_here
JWT_SECRET=your_secret_key_here
CLIENT_URL=http://localhost:5173
```

Optional frontend env:

```env
VITE_API_URL=http://localhost:5000/api
```

## Install and run

### Backend

```bash
cd server
npm install
npm run dev
```

### Frontend

```bash
cd client
npm install
npm run dev
```

## Seed the Dhaka property data

After both frontend and backend are running:

1. Open the app in the browser.
2. On the home page, click **Populate Dhaka Seed Data**.
3. This creates:
   - 30 Dhaka properties
   - a demo manager account

Demo manager created by seed:

- email: `manager@keycove.demo`
- password: `manager123`

## Main routes

- `/` - interactive map discovery page
- `/login` - login page
- `/signup` - register page
- `/dashboard` - starter dashboard
- `/properties/:id` - property details page

## API routes added

- `GET /api/properties/map`
- `GET /api/properties/stats`
- `GET /api/properties/:id`
- `POST /api/seed/dhaka-properties`

## Notes

- The map uses OpenStreetMap tiles through Leaflet, so no Mapbox token is needed.
- Dhaka areas included in the seed: Dhanmondi, Gulshan, Banani, Uttara, Mirpur, Bashundhara.
- Existing authentication flow is preserved.
