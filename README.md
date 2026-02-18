# ANTIGRAVITY - Cyberpunk Web3 Demo Prototype

A full-stack Next.js 14 application with a cyberpunk aesthetic featuring a complete payment-to-approval flow for a Web3 card marketplace.

## 🎨 Theme: BLACK & RED CYBER PROTOCOL

- **Primary Background**: #000000
- **Secondary**: #0f0f0f
- **Accent**: #ff0033
- **Glow**: #ff1a1a
- **Text**: White

### Design Features
- Hacker aesthetic with red neon glow borders
- Glitch text effects on headings
- Animated scan lines overlay
- Floating red particles background
- Cyber terminal fonts (Orbitron, Share Tech Mono)
- Smooth page transitions with Framer Motion
- Card hover glow effects

## 🚀 Tech Stack

### Frontend
- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Framer Motion** (animations)

### Backend
- **Node.js + Express**
- **TypeScript**
- **MongoDB + Mongoose**
- **CORS enabled**

### Note
- No real blockchain integration
- Crypto payment simulated
- Demo prototype only

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ installed
- npm or yarn
- **MongoDB** (Local or Atlas Cloud)

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup MongoDB

#### Option A: Local MongoDB
1. Install MongoDB Community Edition from [mongodb.com](https://www.mongodb.com/try/download/community)
2. Start MongoDB service:
   ```bash
   # Windows
   net start MongoDB
   
   # Mac/Linux
   sudo systemctl start mongod
   ```
3. MongoDB will run on `mongodb://localhost:27017`

#### Option B: MongoDB Atlas (Cloud - Recommended)
1. Create free account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster (Free tier available)
3. Create database user with username/password
4. Whitelist your IP address (or use `0.0.0.0/0` for development)
5. Get connection string (looks like):
   ```
   mongodb+srv://username:password@cluster.mongodb.net/antigravity
   ```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
# Copy from example
cp .env.example .env
```

Edit `.env` and add your MongoDB URI:

```env
# For Local MongoDB:
MONGODB_URI=mongodb://localhost:27017/antigravity

# OR for MongoDB Atlas:
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/antigravity?retryWrites=true&w=majority
```

### 4. Run the Backend Server

Open a terminal and run:

```bash
npm run server
```

The backend will start on `http://localhost:3001`

You should see:
```
🚀 ANTIGRAVITY Backend running on http://localhost:3001
📡 API endpoints ready
🔴 Cyber Protocol Active
```

### 3. Run the Frontend

Open a **second terminal** and run:

```bash
npm run dev
```

The frontend will start on `http://localhost:3000`

### 4. Access the Application

Open your browser and navigate to:
```
http://localhost:3000
```

You will be automatically redirected to `/access-protocol`

## 📡 API Endpoints

### Public Endpoints
- `POST /api/submit-payment` - Submit TRX ID
- `POST /api/signup` - Create user account
- `POST /api/login` - User authentication
- `GET /api/cards` - Get all cards
- `POST /api/purchase` - Purchase a card
- `GET /api/orders/:userId` - Get user orders

### Admin Endpoints
- `POST /api/admin/login` - Admin authentication
- `GET /api/admin/payments` - Get all payments
- `POST /api/admin/approve` - Approve user

## 🎮 Testing the Complete Flow

### 1. Submit Payment
1. Go to `http://localhost:3000`
2. Enter any TRX ID (e.g., `TRX_DEMO_12345`)
3. Click "VERIFY PAYMENT"

### 2. Create Account
1. Enter a Custom ID (e.g., `cyber_user_1`)
2. Enter a password (min 6 characters)
3. Click "CREATE ACCOUNT"

### 3. Login (Will Show Not Approved)
1. Enter your Custom ID
2. Enter your password
3. Click "ACCESS SYSTEM"
4. You'll see the red "ACCESS DENIED" screen

### 4. Admin Approval
1. Go to `http://localhost:3000/admin`
2. Login with:
   - Username: `admin`
   - Password: `admin123`
3. You'll see your pending payment
4. Click "APPROVE"

### 5. User Login (Now Approved)
1. Go back to `http://localhost:3000/login`
2. Login with your credentials
3. You'll now access the dashboard

### 6. Purchase Cards
1. Browse the marketplace
2. Click "BUY NOW" on any card
3. View your orders in "MY ORDERS" tab

## 📁 Project Structure

```
warzone/
├── app/
│   ├── access-protocol/     # Payment gateway page
│   ├── signup/              # User registration
│   ├── login/               # User login
│   ├── not-approved/        # Access denied page
│   ├── dashboard/           # User dashboard
│   │   ├── page.tsx         # Marketplace
│   │   ├── orders/          # Orders page
│   │   └── layout.tsx       # Dashboard layout
│   ├── admin/               # Admin section
│   │   ├── page.tsx         # Admin login
│   │   └── dashboard/       # Admin dashboard
│   ├── globals.css          # Cyberpunk theme styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Root redirect
├── server/
│   ├── index.ts             # Express backend server
│   ├── db.ts                # MongoDB connection
│   └── models.ts            # Mongoose schemas
├── types/
│   └── index.ts             # TypeScript interfaces
├── .env.example             # Environment variables template
├── package.json
└── README.md
```

## 🎨 Key Components & Styles

### CSS Classes
- `.glitch` - Glitch text effect
- `.neon-button` - Red neon glow button
- `.cyber-input` - Terminal-style input
- `.card-glow` - Animated card hover effect
- `.cyber-spinner` - Loading spinner
- `.terminal-text` - Terminal font with red glow
- `.bg-grid` - Cyber grid background

### Animations
- Floating particles background
- Scanline overlay effect
- Glitch text animations
- Neon glow pulse
- Card hover transformations
- Page transitions

## 🔒 Security Notes

**⚠️ THIS IS A DEMO PROTOTYPE ONLY**

- Passwords are stored in plain text (DO NOT use in production)
- No real payment validation
- TRX IDs are not verified externally
- Admin credentials are hardcoded
- No JWT or session management
- CORS is wide open
- MongoDB connection string in .env (keep secure)

For production use, implement:
- Password hashing (bcrypt)
- JWT authentication
- Real blockchain integration
- Environment variables security
- Input validation & sanitization
- Rate limiting
- HTTPS
- MongoDB Atlas with IP whitelisting
- Proper error handling

## 🎯 Mock Data

### Cards (6 total)
1. CYBER PROTOCOL ALPHA - 0.05 BTC
2. NEON GHOST ACCESS - 0.08 BTC
3. RED MATRIX KEY - 0.12 BTC
4. QUANTUM BREACH - 0.15 BTC
5. SHADOW NET PASS - 0.10 BTC
6. VOID WALKER TOKEN - 0.20 BTC

### Admin Credentials
- Username: `admin`
- Password: `admin123`

## 🐛 Troubleshooting

### Backend connection errors
- Ensure backend is running on port 3001
- Check terminal for error messages
- Verify no other service is using port 3001

### Frontend not loading
- Ensure frontend is running on port 3000
- Clear browser cache
- Check browser console for errors

### Payment not submitting
- Ensure backend is running
- Check Network tab in browser DevTools
- Verify CORS is enabled

## 📝 License

This is a demo prototype for educational purposes.

## 🎉 Features Checklist

- ✅ Payment gateway with QR code
- ✅ User signup with TRX ID linking
- ✅ Login with approval check
- ✅ Not approved warning screen
- ✅ Admin login & dashboard
- ✅ Admin approval system
- ✅ Card marketplace
- ✅ Purchase functionality
- ✅ Order history
- ✅ Cyberpunk animations
- ✅ Responsive design
- ✅ Loading states
- ✅ Error handling

---

**Built with ❤️ using Next.js 14 & TypeScript**

**ANTIGRAVITY PROTOCOL v1.0**
