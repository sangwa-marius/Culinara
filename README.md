# 🍽️ Culinara

**The refined operating system for restaurant management** — combining food ordering, kitchen management, table management, and analytics in one platform.

## Quick Start

### 1. Install dependencies
```bash
npm run install:all
```

### 2. Configure environment
```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your values

cp frontend/.env.example frontend/.env
# Edit frontend/.env with your Google Client ID
```

### 3. Seed the database
```bash
cd backend && npm run seed
```

### 4. Start development
```bash
# Terminal 1 — Backend
npm run dev:backend

# Terminal 2 — Frontend
npm run dev:frontend
```

Open http://localhost:5173

## Demo Accounts

| Role              | Email                    | Password     |
|-------------------|--------------------------|--------------|
| Admin             | admin@culinara.com       | admin1234    |
| Restaurant Owner  | owner@culinara.com       | owner1234    |
| Customer          | customer@culinara.com    | customer1234 |
| Driver            | driver@culinara.com      | driver1234   |

## Features

### Customer
- Browse restaurants with advanced filters
- Browse menus and add to cart
- Place orders with delivery tracking
- Google Sign-In
- Order history and ratings

### Restaurant Owner Dashboard
- **Dashboard** — Real-time orders, revenue stats
- **Orders** — Full order management with status updates
- **Menus** — Add/edit/remove menu items with images
- **Menu Collections** — Seasonal menu management (Spring/Summer/Autumn/Winter)
- **Tables** — Dine-in table management with status (Available/Occupied/Reserved/Cleaning)
- **Kitchen Display** — Real-time KDS with Kanban columns (New → In Progress → Ready)
- **Analytics** — Revenue charts and top dishes
- **Settings** — Restaurant profile, hours, delivery config

### Admin Portal
- Platform overview with 30-min live orders
- Restaurant approvals
- User management
- Broadcast notifications

### Driver
- Available order requests
- Accept and deliver orders
- Delivery history

## New vs FoodHub

| Feature              | FoodHub | Culinara |
|---------------------|---------|----------|
| Table Management    | ❌      | ✅       |
| Kitchen Display (KDS)| ❌     | ✅       |
| Menu Collections    | ❌      | ✅       |
| Subscriptions/Pricing| ❌     | ✅       |
| Sidebar Navigation  | ❌      | ✅       |
| Split-screen Auth   | ❌      | ✅       |
| Playfair Display font| ❌     | ✅       |
| Warm cream theme    | ❌      | ✅       |

## Tech Stack

**Backend:** Node.js, Express, MongoDB/Mongoose, Socket.io, JWT, Google Auth Library

**Frontend:** React 18, Vite, Tailwind CSS, React Router, Recharts, Socket.io Client
