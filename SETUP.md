# Biz LogicX Portal - Setup & Deployment Guide v3.0

## 🎯 System Overview

**Biz LogicX Portal** is a professional shipment management system with:
- ✅ User authentication (login, register, forgot password, password reset)
- ✅ Executive dashboard with KPIs
- ✅ Complete shipment CRUD operations
- ✅ Real-time financial calculations (Revenue, Expense, Profit, Margin %)
- ✅ Dynamic form sections (packages, revenue heads, purchase items)
- ✅ CSV export (individual & bulk)
- ✅ MongoDB database integration
- ✅ Responsive design

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js v16+ installed
- Git installed
- Windows/Mac/Linux

### Step 1: Clone Repository
```bash
git clone https://github.com/Payal17p/bizlogicx-portal.git
cd bizlogicx-portal
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Run Server
```bash
node server.js
```

Output should show:
```
✓ Using in-memory MongoDB for local development
✓ Connected to MongoDB
🚀 Biz LogicX Portal running on http://localhost:3000
```

### Step 4: Open in Browser
- Navigate to `http://localhost:3000`
- Register a new account or login

---

## 🔐 Authentication Features

### 1. **User Registration**
- Full Name (required)
- Email (required)
- Username (required, unique)
- Password (required)
- Phone (optional)

### 2. **Login**
- Username & Password authentication
- JWT token stored in HTTP-only cookies
- 30-day token expiration

### 3. **Forgot Password**
- Enter email address
- Receive reset token (displayed in development)
- Enter token and new password
- Password updated successfully

### 4. **Password Reset**
- Tokens expire after 1 hour
- New password is securely hashed with bcryptjs

---

## 📊 Dashboard Features

### KPI Cards (Real-time)
| Card | Description |
|------|-------------|
| Total Shipments | Count of all shipments |
| Air Freight | Count of air mode shipments |
| Ocean Freight | Count of sea mode shipments |
| Exports | Count of export direction shipments |
| **Total Revenue** | Sum of all revenue (green) |
| **Total Expense** | Sum of all costs (red) |
| **Profit/Loss** | Revenue - Expense (green if profit, red if loss) |

### Recent Shipments Table
- Shows latest 10 shipments with financial data
- Color-coded profit/loss (green = profit, red = loss)
- Quick access to view, edit, download

---

## 📝 New Shipment Form

### Form Sections:

1. **Booking Details**
   - Booking Date (required)
   - Direction: Export/Import (required)
   - Transport Mode: Air/Sea (required)

2. **Origin & Destination**
   - Origin Country
   - Origin Port/Hub
   - Destination Country
   - Destination Port/Hub

3. **Client & Billing**
   - Bill To
   - Shipper Name (required)
   - Consignee (required)

4. **Cargo Details**
   - Nature of Shipment: Commercial/Sample/Documents Only
   - Carrier (required)
   - Service

5. **Waybill Numbers**
   - HAWB
   - MAWB

6. **Invoice Details**
   - Invoice Number
   - Invoice Date
   - Invoice Total Value
   - Currency: INR/USD/EUR

7. **Packages Section** (Dynamic)
   - Type, Weight, Length, Width, Height, Description
   - Add/Remove button for each package

8. **Revenue Heads** (Dynamic - Sales Items)
   - Category
   - Head Name
   - Quantity
   - Rate
   - Currency
   - **Calculates: Quantity × Rate = Amount**

9. **Purchase Items** (Dynamic - Costs/Expenses)
   - Vendor
   - Description
   - Quantity
   - Rate
   - Currency
   - **Calculates: Quantity × Rate = Amount**

10. **Remarks**
    - Additional notes

### Financial Summary (Auto-calculated)
```
Total Revenue = Sum of (Revenue Quantity × Rate)
Total Expense = Sum of (Purchase Quantity × Rate)
Profit = Total Revenue - Total Expense
Margin % = (Profit / Total Revenue) × 100
```

---

## 📋 Shipment Ledger (Logs)

View all shipments with:
- Shipment ID
- Shipper Name
- Consignee Name
- Booking Date
- Transport Mode (badge)
- Revenue (₹)
- Expense (₹)
- **Profit/Loss (color-coded)**
- Margin %
- Actions: Edit, Download CSV, Delete

### Export Options
- **Export All CSV**: Download complete shipment list
- **Download Individual**: Download single shipment as CSV

---

## 🔧 System Settings

- View user profile (username, name, email)
- Portal information (version, database type)
- Clear all shipments (with confirmation)

---

## 🗄️ Database

### Local Development (Default)
- **Type**: MongoDB In-Memory Server
- **Data Persistence**: Session only (resets when server restarts)
- **Use Case**: Development & testing

### Production (MongoDB Atlas)
- **Type**: MongoDB Atlas cluster
- **Data Persistence**: Permanent
- **Connection**: Via `MONGODB_URI` environment variable

---

## 🌐 MongoDB Atlas Setup (Production)

### Step 1: Create MongoDB Atlas Account
1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up for free account
3. Create a project

### Step 2: Create Cluster
1. Click "Create Cluster"
2. Select "M0 Sandbox" (free tier)
3. Choose region (India recommended: ap-south-1)
4. Create cluster (takes 5-10 minutes)

### Step 3: Create Database User
1. Go to "Database Access"
2. Click "Add New Database User"
3. Enter username (e.g., `bizlogicx`)
4. Generate secure password
5. Add user

### Step 4: Whitelist IP Address
1. Go to "Network Access"
2. Click "Add IP Address"
3. Choose "Allow Access from Anywhere" (0.0.0.0/0)
4. Confirm

### Step 5: Get Connection String
1. Go to "Clusters"
2. Click "Connect"
3. Choose "Connect your application"
4. Copy connection string
5. Format: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/bizlogicx?retryWrites=true&w=majority`

### Step 6: Create .env File
```bash
# In project root directory, create file named: .env
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/bizlogicx?retryWrites=true&w=majority
JWT_SECRET=change-this-to-a-long-random-string-in-production
PORT=3000
NODE_ENV=production
```

### Step 7: Restart Server
```bash
node server.js
```

Your data is now persistent in MongoDB Atlas!

---

## 🚀 Deploy to Render (Free Hosting)

### Step 1: Create Render Account
- Go to https://render.com
- Sign up with GitHub account

### Step 2: Connect GitHub Repository
1. Dashboard → "New +" → "Web Service"
2. Connect to GitHub repo: `bizlogicx-portal`
3. Select repo

### Step 3: Configure Deploy Settings
- **Name**: bizlogicx-portal
- **Environment**: Node
- **Build Command**: `npm install`
- **Start Command**: `node server.js`
- **Instance Type**: Free

### Step 4: Add Environment Variables
1. Click "Environment"
2. Add variables:
   - `MONGODB_URI`: (from MongoDB Atlas)
   - `JWT_SECRET`: (long random string)
   - `NODE_ENV`: production
   - `PORT`: 3000

### Step 5: Deploy
1. Click "Create Web Service"
2. Wait for deployment (2-3 minutes)
3. Get URL: `https://bizlogicx-portal.onrender.com`

### Step 6: Test
- Open URL in browser
- Login/Register
- Add test shipment
- Verify data persists

---

## 📱 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create new account |
| POST | `/api/auth/login` | Login user |
| POST | `/api/auth/logout` | Logout user |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/forgot-password` | Send password reset link |
| POST | `/api/auth/reset-password` | Reset password with token |

### Shipments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/shipments` | Get all user's shipments |
| POST | `/api/shipments` | Create new shipment |
| GET | `/api/shipments/:id` | Get single shipment |
| PUT | `/api/shipments/:id` | Update shipment |
| DELETE | `/api/shipments/:id` | Delete shipment |
| GET | `/api/shipments/:id/download` | Download as CSV |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Get dashboard stats |

---

## 🔒 Security Features

✅ Password hashing (bcryptjs with salt 10)
✅ JWT authentication (30-day expiration)
✅ HTTP-only cookies (prevents XSS)
✅ CORS enabled for cross-origin requests
✅ Password reset tokens with 1-hour expiration
✅ User data isolation (each user sees only their data)

---

## 📦 Project Structure

```
bizlogicx-portal/
├── server.js              # Express server + MongoDB + Auth
├── package.json           # Dependencies
├── .env.example          # Environment variables template
├── .gitignore            # Git ignore rules
├── public/
│   ├── index.html        # HTML shell
│   ├── app.js            # Frontend application
│   └── styles.css        # Styling
├── .git/                 # Git repository
└── node_modules/         # Dependencies (not committed)
```

---

## 🛠️ Troubleshooting

### Server won't start
```bash
# Check if port 3000 is in use
Get-Process node | Stop-Process -Force
node server.js
```

### MongoDB connection error
```
❌ "Cannot connect to MongoDB"
✅ Solution: Check MONGODB_URI in .env file
✅ Ensure IP whitelist is set to 0.0.0.0/0 in Atlas
```

### Login fails
```
❌ "Invalid credentials"
✅ Solution: Check username & password are correct
✅ Ensure user was registered first
```

### Data not saving
```
❌ "Local development doesn't persist data"
✅ Solution: Set MONGODB_URI to MongoDB Atlas connection string
```

---

## 📈 Next Steps

1. ✅ **Local Testing** - Test all features locally
2. ✅ **MongoDB Atlas** - Connect to production database
3. ✅ **Render Deployment** - Deploy to live URL
4. ✅ **Share URL** - Give users the deployed link
5. ✅ **Monitor** - Check server logs for errors

---

## 📞 Support

For issues or questions:
- Check GitHub issues: https://github.com/Payal17p/bizlogicx-portal/issues
- Review code comments in server.js and app.js

---

## 📝 Version History

- **v3.0** - Password recovery, delete shipment, better financial UI
- **v2.0** - Complete shipment management system
- **v1.0** - Initial setup

---

**Happy shipping! 🚀**
