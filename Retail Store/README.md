# Retail Store Replenishment & Demand Planning System

A lightweight, clean, and interactive **Retail Inventory Replenishment & Demand Forecasting Dashboard** built using pure **HTML5, CSS3, and Vanilla JavaScript** (no external framework build steps, 100% offline-ready).

---

## 📌 Project Overview

In retail supply chains and supermarket operations, two critical challenges are:
1. **Stockouts**: Running out of fast-moving products leads to lost sales and dissatisfied customers.
2. **Overstocking**: Holding excessive inventory ties up working capital and increases holding / obsolescence costs.

This project implements an automated **Continuous Review Inventory Replenishment System** with **Demand Planning & Forecasting**. It monitors real-time inventory levels against dynamic mathematical thresholds (**Reorder Point - ROP**) and calculates optimal order batches using the **Economic Order Quantity (EOQ)** model.

---

## 🚀 Key Features

1. **Real-time Inventory Monitoring**:
   - Tracks SKU code, product name, category, current stock, average daily demand, supplier lead time, and safety stock.
   - Real-time stock status pills:
     - 🟢 **Healthy Stock**: Current Stock > ROP
     - 🟠 **Reorder Required**: Current Stock ≤ ROP
     - 🔴 **Stockout / Critical**: Current Stock = 0
2. **Automated Replenishment**:
   - **One-Click Auto-Replenish**: Automatically identifies all products at or below their Reorder Point and generates Purchase Orders (POs) based on their Economic Order Quantity (EOQ).
   - **Manual Restock**: Allows creating tailored replenishment orders for specific items.
3. **Demand Planning & Forecasting**:
   - Computes rolling **7-Day Simple Moving Average (SMA)** daily consumption from historical sales.
   - **Scenario Planner / What-If Multiplier**: Simulates promotional sales surges (+50% festive season, +150% flash sale) or sluggish demand (-50%).
   - Interactive trend line chart comparing historical actual sales against forecasted demand.
   - *Offline-First Architecture*: Uses Chart.js when online, with an automated fallback to pure HTML5 Canvas when offline.
4. **Purchase Order Lifecycle**:
   - Tracks issued POs, supplier lead times, estimated costs, and order statuses.
   - **"Receive Delivery" Simulation**: Simulates the physical arrival of vendor goods, automatically adding units to warehouse stock.
5. **Interactive Day-by-Day Sales Simulator**:
   - Simulates customer purchases across all SKUs, depleting inventory and recording historical demand trends.
6. **Data Persistence & Export**:
   - Saves inventory and purchase orders directly in browser `localStorage`.
   - **Export CSV**: Generates an inventory stock report for spreadsheet analysis.
   - **Reset Demo Data**: Easily restores sample supermarket catalog items anytime.

---

## 📐 Mathematical Formulas Implemented

### 1. Reorder Point (ROP)
Determines **WHEN** an order should be placed to prevent stockouts before the supplier delivers.
```
ROP = (Average Daily Demand × Lead Time) + Safety Stock
```
- **Example**:
  - Daily Demand = 12 units/day
  - Supplier Lead Time = 2 days
  - Safety Stock = 8 units
  - `ROP = (12 × 2) + 8 = 32 units`
  - *When stock drops to 32 or fewer units, a replenishment order is triggered.*

---

### 2. Economic Order Quantity (EOQ)
Determines **HOW MUCH** to order to minimize the sum of ordering costs and holding costs.
```
EOQ = √ [ (2 × D × S) / H ]
```
Where:
- **D** = Annual Demand = `Daily Demand × 365`
- **S** = Fixed Order Cost per order ($25.00)
- **H** = Annual Holding Cost per unit = `Unit Price × 20%`
- **Formula Rationale**: Balances placing frequent small orders (high ordering costs) versus infrequent giant orders (high holding and storage costs).

---

### 3. Safety Stock (SS)
A protective cushion to absorb demand spikes or unexpected supplier delivery delays:
```
Safety Stock = (Max Daily Demand × Max Lead Time) - (Avg Daily Demand × Avg Lead Time)
```

---

### 4. Simple Moving Average Demand Forecast (SMA)
Predicts expected daily demand for the upcoming week based on the past $N$ days of sales:
```
Forecast Demand (t+1) = (Sales Day 1 + Sales Day 2 + ... + Sales Day N) / N
```

---

## 📂 Project Structure

```
Retail Store/
├── login.html       # Dedicated authentication portal with 1-click quick demo login
├── login.js         # Authentication logic, credential validation & session storage
├── index.html       # Main replenishment dashboard layout, tabs, modals, tables
├── style.css        # Clean, modern responsive CSS (flexbox, CSS grid, variables)
├── app.js           # Inventory calculations (ROP, EOQ, SMA), events, LocalStorage
└── README.md        # Project documentation and Viva preparation guide
```

---

## 🔐 Demo Login Credentials

The login portal supports pre-configured retail accounts or one-click demo login buttons:

| Role | Username | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **Store Operations Manager** | `admin` | `admin123` | Full Inventory, Restock & PO Management |
| **Demand Planning Specialist** | `planner` | `plan123` | Demand Forecast & Scenario Adjustment |
| **Supply Chain Analyst** | `analyst` | `analyst123` | Supply Chain Formulas & Stock Analytics |

> *Tip for Evaluation*: You can click the **"⚡ Quick Demo Login"** buttons on the login card to log in instantly with 1 click without typing!

---

## 💻 How to Run the Project

1. **No Installation Required**: No Node.js, npm, or complex build setup needed.
2. Simply navigate to the project directory and **double-click `login.html`** or **`index.html`** in any web browser.
3. If not logged in, the system will automatically direct you to `login.html`.

---

## 🎯 Step-by-Step Live Demo Script (For Presenting to your Teacher)

When presenting this project to your sir or evaluator, follow this flow:

1. **Start at the Login Page (`login.html`)**:
   - Show the clean login card. Point out the password visibility toggle (👁️) and role selector.
   - Click the **"👨‍💼 Store Manager"** quick login button to log in instantly.
   - Explain how user state is preserved in browser `sessionStorage` and displayed in the header.

2. **Show the Dashboard Overview**:
   - Point out the 4 KPI cards at the top: *Total Active SKUs*, *Reorder Required*, *Stockout Items*, and *Total Inventory Value*.
   - Point out the logged-in user profile avatar and name in the top right.

3. **Simulate Retail Sales (Depletion)**:
   - Click the **"⚡ Simulate Day Sales"** button in the top bar.
   - Show how the stock counts drop and a toast notification confirms daily sales.
   - Point out that items like *Whole Wheat Bread* or *Organic Milk* fall below their Reorder Point, turning amber/red.

4. **Demonstrate Automated Replenishment**:
   - Click **"✨ Auto-Generate Replenishment"**.
   - Show that the system automatically identifies items under ROP and calculates optimal replenishment batches using the **EOQ formula**.
   - Switch to the **"🚚 Purchase Orders"** tab to view the generated POs.
   - Click **"📥 Receive Delivery"** on a PO to show stock being restocked into active inventory.

5. **Show Demand Forecasting & What-If Analysis**:
   - Switch to the **"📈 Demand Forecasting & Planning"** tab.
   - Select a product like *Organic Whole Milk 1L*.
   - Explain the 7-day Moving Average forecast.
   - Move the **"Demand Growth / Surge Factor"** slider to 1.5x (simulating a festive sale) and show how the projected weekly demand dynamically recalibrates.

6. **Demonstrate Logout**:
   - Click the **"Logout"** button in the header.
   - Show that the session is cleared and redirects back to `login.html`.

---

## 🎓 Viva / Oral Exam Questions & Answers (For Sir's Questions)

### Q1: Why did you choose HTML, CSS, and Vanilla JavaScript for this project?
> **Answer**: "Sir, I used pure HTML5, CSS, and Vanilla JavaScript to keep the architecture clean, lightweight, and completely transparent without depending on heavy third-party frameworks. It runs directly in any modern browser without build steps, uses semantic DOM manipulation, and persists data reliably using the browser's native `localStorage` API."

### Q2: What is the difference between Periodic Review and Continuous Review replenishment?
> **Answer**: "In a **Periodic Review** system, stock is checked only at fixed intervals (e.g., every Monday). In a **Continuous Review** system (which this project implements), stock levels are continuously tracked after every transaction. As soon as the stock drops to or below the calculated **Reorder Point (ROP)**, a replenishment order is triggered immediately, significantly reducing stockout risks."

### Q3: Why is Safety Stock added to Lead Time Demand in the ROP formula?
> **Answer**: "Lead Time Demand represents average expected sales during the supplier delivery window. However, customer demand is stochastic (fluctuating) and suppliers can face delivery delays. Safety stock acts as a statistical buffer so the store does not run out of stock during sudden demand surges."

### Q4: What are the two opposing costs in the Economic Order Quantity (EOQ) model?
> **Answer**: 
> 1. **Ordering Cost**: Fixed costs per order (processing, logistics, delivery, inspection). Smaller, more frequent orders increase annual ordering costs.
> 2. **Holding / Carrying Cost**: Costs of warehousing, capital lock-in, spoilage, and insurance. Larger orders increase holding costs.
> - **EOQ** is the exact mathematical minimum point where the sum of these two curves is minimized: `EOQ = √[(2 × D × S) / H]`.

### Q5: How is Demand Forecasting calculated in this software?
> **Answer**: "We implemented a rolling **7-day Simple Moving Average (SMA)** on past daily sales data. This smoothes out single-day anomalies and identifies the baseline daily run-rate. We also added a **Scenario Multiplier** to let store managers plan for promotional spikes or seasonal slowdowns."

### Q6: What happens when an order is marked as 'Received'?
> **Answer**: "When a vendor delivery arrives and the user clicks 'Receive Delivery', the JavaScript event handler retrieves the corresponding PO by its ID, changes its status to 'Received', adds the received quantity directly into the SKU's `currentStock`, recalculates total inventory valuation, and updates the UI."

### Q7: How is user login and session tracking handled without a backend database?
> **Answer**: "The authentication system validates user credentials against an authorized list of roles and accounts directly in `login.js`. Upon successful verification, an active session object containing the user's role and display name is stored in browser `sessionStorage` (or `localStorage` if 'Remember me' is selected). In `index.html`, a security guard check (`checkAuthUser()`) verifies the presence of this session on initial load; if absent, it gracefully redirects to `login.html`. When the user clicks 'Logout', the session data is cleared."

---

## 📝 Technologies Used
- **HTML5**: Semantic tags, accessible forms, modal dialogs.
- **CSS3**: Flexbox, CSS Grid, Custom Properties (`:root`), smooth animations.
- **JavaScript (ES6+)**: Array methods (`filter`, `map`, `reduce`), event delegation, DOM manipulation, JSON serialization with LocalStorage.
- **Visualization**: Dual-mode charting (Chart.js via CDN + pure offline HTML5 Canvas fallback).
