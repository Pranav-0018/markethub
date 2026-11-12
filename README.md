# MiniMart - Multi-Vendor E-Commerce Platform

A lightweight, beginner-friendly Multi-Vendor E-Commerce website built with **Node.js, Express.js, MongoDB (Mongoose)** and **Plain HTML5, CSS3, and Vanilla JavaScript**. Designed specifically to be clean, modular, and easy to explain in a college practical examination or viva.

---

## 🌟 Key Features

1. **Role-Based Access Control (RBAC):**
   - **Admin:** Approves/rejects seller accounts, manages categories, moderates products, and tracks platform financial reports.
   - **Seller:** Manages their own product catalog, manages stock quantities, uploads product images, views orders containing their items, and updates delivery tracking.
   - **Customer:** Browses/filters products, manages shopping cart, places multi-vendor orders, simulates instant test payments, tracks live delivery, and writes verified purchase reviews.

2. **Strict Multi-Vendor Commission Model (10% Platform Rule):**
   - Platform Commission = exactly **10%** of each line item's subtotal.
   - Seller Earnings = **90%** of their sold items.
   - One customer order can contain items from multiple sellers. Each seller sees **only** their items and earns solely from their products.

3. **Instant Mock Payment Gateway:**
   - A single-click `"Pay Now (Test)"` button simulates authorization, validates order integrity, and instantly marks orders as **PAID** without requiring third-party API credentials.

4. **Dual Image Handling:**
   - Upload images via Multer (automatically pushed to Cloudinary if keys are set).
   - If Cloudinary keys are omitted, safely falls back to local storage (`/uploads/`) or direct image web URLs.

---

## 🛠️ Tech Stack

- **Frontend:** Plain HTML5, CSS3 (Flexbox & Grid), Vanilla JavaScript (Native `fetch()` API, `localStorage`). **No React, Bootstrap, or build tools.**
- **Backend:** Node.js, Express.js (`express.static` serves the frontend folder).
- **Database:** MongoDB with Mongoose (Only 4 collections: `User`, `Category`, `Product`, `Order`).
- **Authentication:** JSON Web Tokens (JWT) & `bcryptjs` password hashing.
- **File Uploads:** `multer` & `cloudinary`.

---

## 📁 Project Directory Structure

```text
fsd/
├── .env.example            # Template for environment variables
├── .env                    # Active configuration (PORT, MONGO_URI, JWT_SECRET)
├── package.json            # Node.js dependencies & scripts
├── server.js               # Express application entry point
├── seed.js                 # Sample database seeder
├── middleware/
│   ├── auth.js             # JWT verification & role authorization
│   └── upload.js           # Multer file upload & Cloudinary fallback
├── models/
│   ├── User.js             # Customer, Seller, and Admin schemas
│   ├── Category.js         # Product categories
│   ├── Product.js          # Products, stock, and embedded reviews
│   └── Order.js            # Orders, multi-vendor line items, and commission
├── routes/
│   ├── auth.js             # /api/auth (register, login)
│   ├── public.js           # /api/products, /api/categories, /api/products/:id/reviews
│   ├── seller.js           # /api/seller (products, stock, orders, stats)
│   ├── admin.js            # /api/admin (users, sellers, categories, reports)
│   └── order.js            # /api/orders (create, mock pay, my-orders)
├── uploads/                # Local storage folder for uploaded images
└── frontend/
    ├── index.html          # Marketplace homepage with search & filters
    ├── product.html        # Product details, stock, seller info & reviews
    ├── login.html          # Authentication with quick-fill demo buttons
    ├── register.html       # Customer / Seller registration
    ├── cart.html           # Cart management & quantity adjustments
    ├── checkout.html       # Address form & instant test payment
    ├── my-orders.html      # Customer delivery tracker (Placed -> Shipped -> Delivered)
    ├── seller.html         # Seller analytics, product CRUD & order management
    ├── admin.html          # Admin dashboard, seller approvals & financial report
    ├── css/
    │   └── style.css       # Unified responsive stylesheet
    └── js/
        └── app.js          # Shared apiFetch(), auth, cart, and navbar helpers
```

---

## ⚡ Quick Start Guide

### Step 1: Install Dependencies
Open your terminal inside the project directory and run:
```bash
npm install
```

### Step 2: Configure Environment Variables
Ensure a `.env` file exists in the root folder (pre-configured by default):
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/multivendor
JWT_SECRET=supersecretkey_for_multivendor_jwt_auth_123

# Cloudinary keys are OPTIONAL. If empty, local upload / URL fallback is used.
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```
> **Tip:** If using MongoDB Atlas, replace `MONGO_URI` with your cloud connection string:  
> `mongodb+srv://<username>:<password>@cluster0.mongodb.net/multivendor?retryWrites=true&w=majority`

### Step 3: Seed Sample Data
Populate the database with demo accounts, categories, products, and sample orders:
```bash
npm run seed
```

### Step 4: Start the Server
```bash
npm start
```
Open your browser and navigate to: **`http://localhost:5000`**

---

## 🔑 Demo Login Accounts (For Viva & Evaluation)

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@shop.com` | `admin123` | Full platform control, approves sellers, views 10% commission reports |
| **Seller 1** | `seller.tech@shop.com` | `seller123` | *Apex Electronics & Gear* (Electronics, Sports & Fitness) |
| **Seller 2** | `seller.fashion@shop.com` | `seller123` | *Vogue Trendz & Beauty* (Fashion, Beauty & Personal Care) |
| **Seller 3** | `seller.grocery@shop.com` | `seller123` | *Organic Harvest Market* (Grocery & Superfoods) |
| **Seller 4** | `seller.books@shop.com` | `seller123` | *Horizon Books & Living* (Books & Stationery, Home & Living) |
| **Customer** | `user@shop.com` | `user123` | *Rahul Customer* (Can browse, purchase, review) |
| **Pending Seller** | `neha@greenery.com` | `seller123` | *Urban Bloom Nursery* (Use to test Admin approval workflow) |

> 💡 **Viva Tip:** On the `login.html` page, click any of the **Quick Fill Demo Accounts** buttons to populate credentials instantly with one click!

---

## 🧪 Evaluation & Final Checklist Verification

### 1. Seller Approval Flow:
1. Go to `register.html` and register a new account as **Seller** (e.g. Shop: *Delta Gadgets*).
2. Attempt to log in immediately &rarr; Notice the blocked message: *"Your seller account is pending admin approval"*.
3. Log in as **Admin** (`admin@shop.com` / `admin123`) &rarr; Navigate to the **Sellers & Approvals** tab.
4. Click **Approve**.
5. Log in as the newly approved seller &rarr; Access granted to `seller.html`.

### 2. Product & Stock Management:
1. Log in as a Seller &rarr; Click **+ Add New Product**.
2. Upload an image file or paste an image URL.
3. Use the inline **✏️ Edit Stock** button to update inventory in real-time.

### 3. Customer Purchase & Mock Payment:
1. Log in as Customer (`user@shop.com` / `user123`).
2. Filter products by category or price, click **Add to Cart**.
3. In `cart.html`, change quantity or proceed to `checkout.html`.
4. Enter shipping address and click **💳 Pay Now (Test)**.
5. The order is created, product inventory is decremented, and the order is marked as **PAID**.

### 4. Order Tracking & Delivery Status:
1. In `my-orders.html`, view the 3-step timeline: **Placed &rarr; Shipped &rarr; Delivered**.
2. Log in as the relevant Seller (`seller.tech@shop.com`) &rarr; Change delivery status from `Placed` to `Shipped`.
3. Refresh customer's `my-orders.html` &rarr; Progress tracker advances automatically.

### 5. Verified Customer Reviews:
1. On `product.html`, customers who purchased the item can submit 1 to 5 star ratings with comments.
2. Unverified buyers or users who have not bought the product are restricted from reviewing.

### 6. Admin 10% Commission & Reports:
1. Open `admin.html` &rarr; Click **Per-Seller Sales Report**.
2. Notice the mathematical breakdown:
   - Example: ₹10,000 item sale
   - Platform Commission (10%) = ₹1,000
   - Seller Net Payout (90%) = ₹9,000

---

## 🎓 College Viva Preparation Guide

### Q1: How does authentication and route protection work?
> **Answer:** We use JWT (JSON Web Tokens). When the user logs in via `/api/auth/login`, bcrypt verifies the hashed password. The server issues a signed JWT token containing the user's ID and role (`admin`, `seller`, `customer`). The frontend saves this in `localStorage`. For protected routes, `middleware/auth.js` verifies the token in the `Authorization: Bearer <token>` header and checks whether `req.user.role` is authorized.

### Q2: How is the multi-vendor commission calculated?
> **Answer:** The platform enforces a 10% commission rule. In `routes/order.js` and `routes/seller.js`, each line item total is calculated as `price * quantity`. Commission is `Math.round(lineTotal * 0.10)`. The seller's net earnings are `lineTotal - commission`. In multi-vendor orders, items are grouped per seller so each merchant sees only their products.

### Q3: Why use Vanilla JavaScript instead of React?
> **Answer:** Vanilla JS eliminates build-step dependencies (Webpack, Vite, Babel) and demonstrates core understanding of native DOM manipulation (`document.getElementById`, `innerHTML`), asynchronous JavaScript (`async/await`, `fetch()`), and browser storage (`localStorage`). Express serves the static frontend directly, enabling the entire full-stack project to run with a single command: `npm start`.

---

## 📜 License
Educational project developed for Academic Demonstration and College Viva. Free to use and customize.
