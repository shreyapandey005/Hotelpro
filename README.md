# HotelPro

HotelPro is a MERN-style hotel room management and reservation project using React/Vite, Express, MongoDB/Mongoose, bcrypt, and JWT.

## Included
- Customer registration and login
- Room listing and admin room CRUD
- Booking form with server-side price calculation and overlap checks
- Customer My Bookings page with cancellation for pending/confirmed reservations
- Admin booking list and booking status updates
- Local MongoDB configuration template

## Requirements
- Node.js and npm
- MongoDB Community Server running locally

## Setup on Windows PowerShell

### 1. Configure backend
Open PowerShell in `HotelPro\backend` and run:

```powershell
Copy-Item .env.example .env
npm.cmd install
```

Open `backend/.env` and set `JWT_SECRET` to a long, random secret. Keep `.env` private and never upload it to GitHub.

Example:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/hotelpro
JWT_SECRET=replace_with_a_long_random_secret
```

### 2. Start backend
From `HotelPro\backend`:

```powershell
npm.cmd start
```

The server initializes three sample rooms only if the rooms collection is empty.

### 3. Start frontend
Open a second PowerShell window in `HotelPro\frontend`:

```powershell
npm.cmd install
npm.cmd run dev
```

Open the URL printed by Vite, usually `http://localhost:5173`.

## Admin account
If an admin account does not already exist, run this one-time command from `backend`:

```powershell
node createAdmin.js
```

Enter the email and a password of at least 12 characters when prompted. Keep this script private to your local project; never expose an admin-creation endpoint publicly.

## Routes
- `/` - hotel homepage and rooms
- `/login` - customer login and registration
- `/my-bookings` - logged-in customer's bookings
- `/admin` - room administration (admin role required by API)
- `/admin/bookings` - booking administration (admin role required by API)

## Important limitations
- Payment processing is not integrated. New bookings have payment status `pending`; do not claim a payment has been collected.
- The overlap check is an application-level check and is not a concurrency-safe inventory lock for high-traffic production use.
- Before public deployment, configure production secrets, HTTPS, restricted CORS, request rate limits, robust validation, backups, and production-grade booking concurrency controls.
