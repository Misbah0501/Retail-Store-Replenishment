/**
 * ============================================================================
 * Retail Store Replenishment & Demand Planning System
 * File: app.js
 * Description: Core logic for inventory tracking, Reorder Point (ROP) calculation,
 *              Economic Order Quantity (EOQ), 7-day Moving Average demand
 *              forecasting, and Purchase Order management.
 * ============================================================================
 */

// Global Cost Assumptions for EOQ Calculation
const ORDER_FIXED_COST = 25.0; // S: Fixed administrative / logistics cost per purchase order ($ or ₹)
const HOLDING_COST_RATE = 0.20; // H: Annual inventory holding cost rate (20% of unit price)

// Sample Retail Inventory Data (Realistic grocery & retail supermarket items)
const DEFAULT_INVENTORY = [
    {
        id: "SKU-101",
        name: "Organic Whole Milk 1L",
        category: "Dairy & Bakery",
        unitPrice: 3.50,
        currentStock: 18,
        dailyDemand: 12,
        leadTimeDays: 2,
        safetyStock: 8,
        salesHistory: [14, 11, 13, 10, 15, 12, 11] // Past 7 days sales
    },
    {
        id: "SKU-102",
        name: "Basmati Rice 5kg",
        category: "Groceries",
        unitPrice: 14.20,
        currentStock: 45,
        dailyDemand: 6,
        leadTimeDays: 4,
        safetyStock: 10,
        salesHistory: [5, 7, 6, 8, 5, 6, 7]
    },
    {
        id: "SKU-103",
        name: "Cold-Pressed Olive Oil 500ml",
        category: "Groceries",
        unitPrice: 11.50,
        currentStock: 12,
        dailyDemand: 5,
        leadTimeDays: 3,
        safetyStock: 6,
        salesHistory: [4, 6, 5, 3, 7, 5, 4]
    },
    {
        id: "SKU-104",
        name: "Whole Wheat Bread 400g",
        category: "Dairy & Bakery",
        unitPrice: 2.40,
        currentStock: 6, // Low stock on purpose to trigger ROP alert
        dailyDemand: 15,
        leadTimeDays: 1,
        safetyStock: 10,
        salesHistory: [16, 14, 15, 17, 13, 15, 16]
    },
    {
        id: "SKU-105",
        name: "Arabica Coffee Beans 250g",
        category: "Beverages",
        unitPrice: 9.80,
        currentStock: 0, // Stockout sample
        dailyDemand: 4,
        leadTimeDays: 5,
        safetyStock: 5,
        salesHistory: [3, 4, 5, 4, 3, 5, 4]
    },
    {
        id: "SKU-106",
        name: "Natural Spring Water 1L (Pack of 6)",
        category: "Beverages",
        unitPrice: 5.20,
        currentStock: 55,
        dailyDemand: 8,
        leadTimeDays: 2,
        safetyStock: 8,
        salesHistory: [7, 9, 8, 10, 8, 7, 9]
    },
    {
        id: "SKU-107",
        name: "Antibacterial Hand Wash 500ml",
        category: "Personal Care",
        unitPrice: 4.80,
        currentStock: 22,
        dailyDemand: 5,
        leadTimeDays: 3,
        safetyStock: 6,
        salesHistory: [5, 4, 6, 5, 4, 7, 5]
    },
    {
        id: "SKU-108",
        name: "Dark Chocolate Almond Bar 100g",
        category: "Packaged Foods",
        unitPrice: 3.10,
        currentStock: 85,
        dailyDemand: 7,
        leadTimeDays: 3,
        safetyStock: 12,
        salesHistory: [8, 6, 7, 9, 8, 6, 7]
    }
];

const DEFAULT_ORDERS = [
    {
        id: "PO-2026-001",
        date: "2026-10-15",
        skuId: "SKU-105",
        productName: "Arabica Coffee Beans 250g",
        quantity: 35,
        estimatedCost: 343.00,
        leadDays: 5,
        status: "Pending"
    }
];

// App State
let inventory = [];
let purchaseOrders = [];
let forecastChartInstance = null;
let currentMultiplier = 1.0;

/**
 * ----------------------------------------------------------------------------
 * Authentication & Session Guard
 * ----------------------------------------------------------------------------
 */
function checkAuthUser() {
    const rawUser = sessionStorage.getItem("retail_current_user") || localStorage.getItem("retail_current_user");
    
    // If not logged in, redirect to login page
    if (!rawUser) {
        window.location.href = "login.html";
        return null;
    }

    try {
        const user = JSON.parse(rawUser);
        const nameEl = document.getElementById("user-display-name");
        const roleEl = document.getElementById("user-display-role");
        const avatarEl = document.getElementById("user-avatar");

        if (nameEl && user.displayName) nameEl.textContent = user.displayName;
        if (roleEl && user.role) roleEl.textContent = user.role;
        if (avatarEl && user.displayName) avatarEl.textContent = user.displayName.charAt(0).toUpperCase();

        return user;
    } catch (e) {
        console.error("Invalid session data:", e);
        window.location.href = "login.html";
        return null;
    }
}

// Initialize when script loads or DOM is ready
function startApplication() {
    const user = checkAuthUser();
    if (!user) return; // Prevent rendering if redirecting
    loadData();
    initEventListeners();
    renderAll();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startApplication);
} else {
    startApplication();
}

/**
 * ----------------------------------------------------------------------------
 * 1. Data Storage & Initialization (LocalStorage)
 * ----------------------------------------------------------------------------
 */
function loadData() {
    try {
        const savedInventory = localStorage.getItem("retail_inventory_data");
        const savedOrders = localStorage.getItem("retail_purchase_orders");

        if (savedInventory) {
            inventory = JSON.parse(savedInventory);
        } else {
            inventory = JSON.parse(JSON.stringify(DEFAULT_INVENTORY));
            saveInventory();
        }

        if (savedOrders) {
            purchaseOrders = JSON.parse(savedOrders);
        } else {
            purchaseOrders = JSON.parse(JSON.stringify(DEFAULT_ORDERS));
            saveOrders();
        }
    } catch (err) {
        console.error("Error reading localStorage, reverting to defaults:", err);
        inventory = JSON.parse(JSON.stringify(DEFAULT_INVENTORY));
        purchaseOrders = JSON.parse(JSON.stringify(DEFAULT_ORDERS));
    }
}

function saveInventory() {
    try {
        localStorage.setItem("retail_inventory_data", JSON.stringify(inventory));
    } catch (err) {
        console.error("Failed to save inventory:", err);
    }
}

function saveOrders() {
    try {
        localStorage.setItem("retail_purchase_orders", JSON.stringify(purchaseOrders));
    } catch (err) {
        console.error("Failed to save orders:", err);
    }
}

function resetAllData() {
    if (confirm("Are you sure you want to restore default sample inventory data?")) {
        inventory = JSON.parse(JSON.stringify(DEFAULT_INVENTORY));
        purchaseOrders = JSON.parse(JSON.stringify(DEFAULT_ORDERS));
        saveInventory();
        saveOrders();
        renderAll();
        showToast("Demo data successfully restored!");
    }
}

/**
 * ----------------------------------------------------------------------------
 * 2. Mathematical Calculations (ROP, EOQ, Moving Average)
 * ----------------------------------------------------------------------------
 */

/**
 * Reorder Point (ROP) = (Average Daily Demand * Lead Time Days) + Safety Stock
 */
function calculateROP(dailyDemand, leadTimeDays, safetyStock) {
    return Math.round((dailyDemand * leadTimeDays) + safetyStock);
}

/**
 * Economic Order Quantity (EOQ) = Sqrt((2 * D * S) / H)
 * D = Annual Demand = dailyDemand * 365
 * S = Fixed Order Cost
 * H = Holding Cost = unitPrice * HOLDING_COST_RATE
 */
function calculateEOQ(dailyDemand, unitPrice) {
    const annualDemand = dailyDemand * 365;
    const holdingCost = Math.max(0.5, unitPrice * HOLDING_COST_RATE);
    const eoqValue = Math.sqrt((2 * annualDemand * ORDER_FIXED_COST) / holdingCost);
    return Math.max(10, Math.round(eoqValue));
}

/**
 * Determine stock status: "Critical" (out of stock or <= 0), "Reorder" (<= ROP), "Healthy" (> ROP)
 */
function getStockStatus(currentStock, rop) {
    if (currentStock <= 0) {
        return { label: "Stockout / Critical", class: "badge-danger", code: "critical" };
    } else if (currentStock <= rop) {
        return { label: "Reorder Required", class: "badge-warning", code: "reorder" };
    } else {
        return { label: "Healthy Stock", class: "badge-success", code: "healthy" };
    }
}

/**
 * ----------------------------------------------------------------------------
 * 3. Rendering Functions
 * ----------------------------------------------------------------------------
 */
function renderAll() {
    renderKPIs();
    renderInventoryTable();
    populateSelectDropdowns();
    renderPurchaseOrders();
    updateForecastView();
}

/**
 * Render Dashboard KPI Metrics
 */
function renderKPIs() {
    const totalSkus = inventory.length;
    let reorderCount = 0;
    let stockoutCount = 0;
    let totalValuation = 0;

    inventory.forEach(item => {
        const rop = calculateROP(item.dailyDemand, item.leadTimeDays, item.safetyStock);
        if (item.currentStock <= 0) {
            stockoutCount++;
            reorderCount++;
        } else if (item.currentStock <= rop) {
            reorderCount++;
        }
        totalValuation += item.currentStock * item.unitPrice;
    });

    document.getElementById("kpi-total-skus").textContent = totalSkus;
    document.getElementById("kpi-reorder-count").textContent = reorderCount;
    document.getElementById("kpi-stockout-count").textContent = stockoutCount;
    document.getElementById("kpi-total-value").textContent = "$" + totalValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
    // Update pending PO badge
    const pendingOrders = purchaseOrders.filter(o => o.status === "Pending").length;
    const badgeEl = document.getElementById("po-badge-count");
    if (badgeEl) badgeEl.textContent = pendingOrders;
}

/**
 * Render Inventory Table with Filtering & Search
 */
function renderInventoryTable() {
    const tbody = document.getElementById("inventory-table-body");
    const searchEl = document.getElementById("inventory-search");
    const filterEl = document.getElementById("inventory-filter");
    
    const searchTerm = searchEl ? searchEl.value.toLowerCase().trim() : "";
    const filterStatus = filterEl ? filterEl.value : "all";

    tbody.innerHTML = "";

    const filteredItems = inventory.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm) || item.id.toLowerCase().includes(searchTerm);
        if (!matchesSearch) return false;

        const rop = calculateROP(item.dailyDemand, item.leadTimeDays, item.safetyStock);

        if (filterStatus === "all") return true;
        if (filterStatus === "reorder") return item.currentStock <= rop;
        if (filterStatus === "critical") return item.currentStock <= 0;
        if (filterStatus === "healthy") return item.currentStock > rop;

        return true;
    });

    if (filteredItems.length === 0) {
        tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; color: var(--text-muted); padding: 2rem;">No matching products found.</td></tr>`;
        return;
    }

    filteredItems.forEach(item => {
        const rop = calculateROP(item.dailyDemand, item.leadTimeDays, item.safetyStock);
        const eoq = calculateEOQ(item.dailyDemand, item.unitPrice);
        const status = getStockStatus(item.currentStock, rop);

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>
                <div class="sku-cell">
                    <span class="sku-title">${item.name}</span>
                    <span class="sku-code-tag">${item.id}</span>
                </div>
            </td>
            <td>${item.category}</td>
            <td><strong>${item.currentStock}</strong> units</td>
            <td>${item.dailyDemand} / day</td>
            <td>${item.leadTimeDays} days</td>
            <td>${item.safetyStock} units</td>
            <td><strong style="color: ${item.currentStock <= rop ? '#d97706' : 'inherit'};">${rop} units</strong></td>
            <td><strong>${eoq} units</strong></td>
            <td><span class="badge ${status.class}">${status.label}</span></td>
            <td>
                <div style="display: flex; gap: 0.35rem;">
                    <button class="btn btn-primary btn-sm btn-reorder-sku" data-id="${item.id}" title="Order replenishment stock">
                        Restock
                    </button>
                    <button class="btn btn-outline btn-sm btn-delete-sku" data-id="${item.id}" title="Delete SKU">
                        🗑️
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

/**
 * Populate Dropdowns for Modal & Forecast Selectors
 */
function populateSelectDropdowns() {
    const poSelect = document.getElementById("po-sku-select");
    const forecastSelect = document.getElementById("forecast-sku-select");

    if (!poSelect || !forecastSelect) return;

    const currentForecastSelected = forecastSelect.value;

    poSelect.innerHTML = "";
    forecastSelect.innerHTML = "";

    inventory.forEach(item => {
        const opt1 = document.createElement("option");
        opt1.value = item.id;
        opt1.textContent = `${item.id} - ${item.name} (Stock: ${item.currentStock})`;
        poSelect.appendChild(opt1);

        const opt2 = document.createElement("option");
        opt2.value = item.id;
        opt2.textContent = `${item.id} - ${item.name}`;
        forecastSelect.appendChild(opt2);
    });

    if (currentForecastSelected && inventory.some(i => i.id === currentForecastSelected)) {
        forecastSelect.value = currentForecastSelected;
    }
}

/**
 * Render Purchase Orders Table
 */
function renderPurchaseOrders() {
    const tbody = document.getElementById("po-table-body");
    if (!tbody) return;
    tbody.innerHTML = "";

    if (purchaseOrders.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 2rem; color: var(--text-muted);">No purchase orders generated yet.</td></tr>`;
        return;
    }

    // Sort newest first
    const sortedOrders = [...purchaseOrders].reverse();

    sortedOrders.forEach(po => {
        const isReceived = po.status === "Received";
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>${po.id}</strong></td>
            <td>${po.date}</td>
            <td>
                <strong>${po.productName}</strong><br>
                <span class="sku-code-tag">${po.skuId}</span>
            </td>
            <td><strong>${po.quantity}</strong> units</td>
            <td>$${po.estimatedCost.toFixed(2)}</td>
            <td>${po.leadDays} days</td>
            <td>
                <span class="badge ${isReceived ? 'badge-success' : 'badge-warning'}">
                    ${po.status}
                </span>
            </td>
            <td>
                ${!isReceived ? `
                    <button class="btn btn-success btn-sm btn-receive-po" data-poid="${po.id}">
                        📥 Receive Delivery
                    </button>
                ` : `<span style="color: var(--text-muted); font-size: 0.8rem;">Completed</span>`}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

/**
 * ----------------------------------------------------------------------------
 * 4. Demand Forecasting & Chart Visualization (Moving Average)
 * ----------------------------------------------------------------------------
 */
function updateForecastView() {
    const forecastSelect = document.getElementById("forecast-sku-select");
    if (!forecastSelect) return;

    const selectedSkuId = forecastSelect.value;
    const item = inventory.find(i => i.id === selectedSkuId) || inventory[0];
    if (!item) return;

    // Calculate 7-Day Moving Average daily demand
    const history = item.salesHistory && item.salesHistory.length > 0 
        ? item.salesHistory 
        : [item.dailyDemand, item.dailyDemand, item.dailyDemand, item.dailyDemand, item.dailyDemand, item.dailyDemand, item.dailyDemand];
        
    const past7Sum = history.slice(-7).reduce((acc, curr) => acc + curr, 0);
    const avgDailySales = (past7Sum / 7).toFixed(1);

    // Projected future 7-day demand with scenario multiplier
    const projectedDaily = parseFloat(avgDailySales) * currentMultiplier;
    const projectedWeeklyDemand = Math.round(projectedDaily * 7);

    // Suggested safety stock buffer
    const suggestedSafetyBuffer = Math.round(projectedDaily * item.leadTimeDays * 0.5);

    // Recommended replenishment target
    const targetStock = projectedWeeklyDemand + suggestedSafetyBuffer;
    const recommendedOrder = Math.max(0, targetStock - item.currentStock);

    // Update KPI insight boxes
    const avgDailyEl = document.getElementById("fc-avg-daily");
    const weeklyDemandEl = document.getElementById("fc-weekly-demand");
    const safetyBufferEl = document.getElementById("fc-safety-buffer");
    const recommendedOrderEl = document.getElementById("fc-recommended-order");

    if (avgDailyEl) avgDailyEl.textContent = `${avgDailySales} units/day`;
    if (weeklyDemandEl) weeklyDemandEl.textContent = `${projectedWeeklyDemand} units`;
    if (safetyBufferEl) safetyBufferEl.textContent = `${suggestedSafetyBuffer} units`;
    if (recommendedOrderEl) recommendedOrderEl.textContent = `${recommendedOrder} units`;

    // Render / Update Graph (Using Chart.js if loaded, or Pure Canvas Fallback if offline)
    renderForecastChart(item, history, projectedDaily);
}

/**
 * Render Forecast Chart with Chart.js OR Offline Canvas Fallback
 */
function renderForecastChart(item, history, projectedDaily) {
    const canvas = document.getElementById("demandChart");
    if (!canvas) return;

    const pastLabels = ["Day -6", "Day -5", "Day -4", "Day -3", "Day -2", "Day -1", "Today"];
    const futureLabels = ["Day +1", "Day +2", "Day +3", "Day +4", "Day +5", "Day +6", "Day +7"];
    const allLabels = [...pastLabels, ...futureLabels];

    const pastData = history.slice(-7);
    const futureData = Array(7).fill(Math.round(projectedDaily));

    // If Chart.js library is available from CDN
    if (typeof Chart !== "undefined") {
        const ctx = canvas.getContext("2d");
        const combinedActuals = [...pastData, null, null, null, null, null, null, null];
        const combinedForecast = [null, null, null, null, null, null, pastData[pastData.length - 1], ...futureData];

        if (forecastChartInstance) {
            forecastChartInstance.destroy();
        }

        try {
            forecastChartInstance = new Chart(ctx, {
                type: "line",
                data: {
                    labels: allLabels,
                    datasets: [
                        {
                            label: "Historical Actual Sales (Past 7 Days)",
                            data: combinedActuals,
                            borderColor: "#2563eb",
                            backgroundColor: "rgba(37, 99, 235, 0.15)",
                            borderWidth: 2.5,
                            fill: true,
                            tension: 0.3,
                            pointBackgroundColor: "#2563eb",
                            pointRadius: 4
                        },
                        {
                            label: `Forecasted Demand (${currentMultiplier}x Multiplier)`,
                            data: combinedForecast,
                            borderColor: "#10b981",
                            borderWidth: 2.5,
                            borderDash: [5, 5],
                            backgroundColor: "rgba(16, 185, 129, 0.1)",
                            fill: true,
                            tension: 0.2,
                            pointBackgroundColor: "#10b981",
                            pointRadius: 4
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `${context.dataset.label}: ${context.raw !== null ? context.raw + ' units' : 'N/A'}`;
                                }
                            }
                        },
                        legend: {
                            position: "top",
                            labels: {
                                font: { family: "'Plus Jakarta Sans', sans-serif", size: 12 }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: { display: true, text: "Sales Units" },
                            grid: { color: "#f1f5f9" }
                        },
                        x: {
                            grid: { display: false }
                        }
                    }
                }
            });
            return;
        } catch (e) {
            console.warn("Chart.js render error, falling back to pure canvas:", e);
        }
    }

    // PURE OFFLINE CANVAS FALLBACK (Guarantees it works in any offline classroom / exam)
    drawOfflineCanvasChart(canvas, pastLabels, pastData, futureLabels, futureData);
}

/**
 * Pure Native HTML5 Canvas Chart (Offline Fallback)
 */
function drawOfflineCanvasChart(canvas, pastLabels, pastData, futureLabels, futureData) {
    const ctx = canvas.getContext("2d");
    const width = canvas.parentElement.clientWidth || 800;
    const height = 280;
    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(0, 0, width, height);

    // Padding
    const padLeft = 50;
    const padRight = 30;
    const padTop = 30;
    const padBottom = 40;

    const chartW = width - padLeft - padRight;
    const chartH = height - padTop - padBottom;

    const allValues = [...pastData, ...futureData];
    const maxVal = Math.max(15, Math.max(...allValues) * 1.25);

    // Draw Background Grid
    ctx.strokeStyle = "#f1f5f9";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
        const y = padTop + (chartH / 4) * i;
        ctx.beginPath();
        ctx.moveTo(padLeft, y);
        ctx.lineTo(width - padRight, y);
        ctx.stroke();

        ctx.fillStyle = "#94a3b8";
        ctx.font = "11px sans-serif";
        ctx.fillText(Math.round(maxVal - (maxVal / 4) * i), 15, y + 4);
    }

    const totalPoints = 14;
    const stepX = chartW / (totalPoints - 1);

    // 1. Draw Past Actual Sales Line (Blue)
    ctx.beginPath();
    ctx.strokeStyle = "#2563eb";
    ctx.lineWidth = 3;
    for (let i = 0; i < 7; i++) {
        const x = padLeft + i * stepX;
        const y = padTop + chartH - (pastData[i] / maxVal) * chartH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Draw dots for past
    for (let i = 0; i < 7; i++) {
        const x = padLeft + i * stepX;
        const y = padTop + chartH - (pastData[i] / maxVal) * chartH;
        ctx.fillStyle = "#2563eb";
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
    }

    // 2. Draw Forecasted Demand Line (Green Dashed)
    ctx.beginPath();
    ctx.strokeStyle = "#10b981";
    ctx.lineWidth = 3;
    ctx.setLineDash([5, 5]);

    const startX = padLeft + 6 * stepX;
    const startY = padTop + chartH - (pastData[6] / maxVal) * chartH;
    ctx.moveTo(startX, startY);

    for (let i = 0; i < 7; i++) {
        const x = padLeft + (7 + i) * stepX;
        const y = padTop + chartH - (futureData[i] / maxVal) * chartH;
        ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]); // Reset dash

    // Draw dots for future
    for (let i = 0; i < 7; i++) {
        const x = padLeft + (7 + i) * stepX;
        const y = padTop + chartH - (futureData[i] / maxVal) * chartH;
        ctx.fillStyle = "#10b981";
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
    }

    // Legend
    ctx.fillStyle = "#2563eb";
    ctx.fillRect(width - 320, 10, 14, 10);
    ctx.fillStyle = "#334155";
    ctx.font = "12px sans-serif";
    ctx.fillText("Past Actuals", width - 300, 20);

    ctx.fillStyle = "#10b981";
    ctx.fillRect(width - 200, 10, 14, 10);
    ctx.fillStyle = "#334155";
    ctx.fillText(`Forecast (${currentMultiplier}x)`, width - 180, 20);
}

/**
 * ----------------------------------------------------------------------------
 * 5. Simulation & Replenishment Actions
 * ----------------------------------------------------------------------------
 */

/**
 * Simulate 1 Day of Retail Customer Sales
 * Random sales occur for every SKU, decreasing stock and appending to sales history.
 */
function simulateDaySales() {
    let stockoutWarnings = [];

    inventory.forEach(item => {
        // Daily sales fluctuation between 70% and 130% of daily demand
        const variance = 0.7 + (Math.random() * 0.6);
        const unitsSold = Math.min(item.currentStock, Math.max(1, Math.round(item.dailyDemand * variance)));

        item.currentStock -= unitsSold;
        if (!item.salesHistory) item.salesHistory = [];
        item.salesHistory.push(unitsSold);
        if (item.salesHistory.length > 30) item.salesHistory.shift();

        const rop = calculateROP(item.dailyDemand, item.leadTimeDays, item.safetyStock);
        if (item.currentStock <= rop) {
            stockoutWarnings.push(item.name);
        }
    });

    saveInventory();
    renderAll();

    if (stockoutWarnings.length > 0) {
        showToast(`⚡ Day simulated! ${stockoutWarnings.length} item(s) reached or fell below Reorder Point.`);
    } else {
        showToast("⚡ 1 Day of sales simulated across all retail SKUs!");
    }
}

/**
 * Auto-Generate Purchase Orders for all SKUs below their Reorder Point
 */
function autoReplenishAllLowStock() {
    let createdCount = 0;

    inventory.forEach(item => {
        const rop = calculateROP(item.dailyDemand, item.leadTimeDays, item.safetyStock);
        if (item.currentStock <= rop) {
            // Check if there is already a pending order for this SKU to prevent duplicate ordering
            const hasPending = purchaseOrders.some(po => po.skuId === item.id && po.status === "Pending");
            if (!hasPending) {
                const eoq = calculateEOQ(item.dailyDemand, item.unitPrice);
                // Order at least EOQ or enough to replenish deficit
                const orderQty = Math.max(eoq, (rop * 2) - item.currentStock);

                const newPO = {
                    id: `PO-${new Date().getFullYear()}-${String(purchaseOrders.length + 1).padStart(3, "0")}`,
                    date: new Date().toISOString().split("T")[0],
                    skuId: item.id,
                    productName: item.name,
                    quantity: orderQty,
                    estimatedCost: Math.round(orderQty * item.unitPrice * 100) / 100,
                    leadDays: item.leadTimeDays,
                    status: "Pending"
                };

                purchaseOrders.push(newPO);
                createdCount++;
            }
        }
    });

    if (createdCount > 0) {
        saveOrders();
        renderAll();
        showToast(`✅ Generated ${createdCount} replenishment purchase order(s)!`);
        switchTab("tab-orders");
    } else {
        showToast("ℹ️ No items currently require replenishment (or orders already pending).");
    }
}

/**
 * Mark a Purchase Order as Received and automatically add to Inventory Stock
 */
function receivePurchaseOrder(poId) {
    const po = purchaseOrders.find(o => o.id === poId);
    if (!po || po.status === "Received") return;

    const item = inventory.find(i => i.id === po.skuId);
    if (item) {
        item.currentStock += po.quantity;
        saveInventory();
    }

    po.status = "Received";
    saveOrders();
    renderAll();
    showToast(`📦 Received ${po.quantity} units of ${po.productName}! Stock updated.`);
}

/**
 * Open Replenishment Modal for a specific SKU
 */
function openRestockModalForSku(skuId) {
    const select = document.getElementById("po-sku-select");
    if (!select) return;
    select.value = skuId;
    updatePoModalSummary();
    openModal("modal-create-po");
}

function updatePoModalSummary() {
    const select = document.getElementById("po-sku-select");
    const summaryBox = document.getElementById("po-sku-summary");
    const qtyInput = document.getElementById("po-quantity");
    if (!select || !summaryBox || !qtyInput) return;

    const skuId = select.value;
    const item = inventory.find(i => i.id === skuId);
    if (!item) return;

    const rop = calculateROP(item.dailyDemand, item.leadTimeDays, item.safetyStock);
    const eoq = calculateEOQ(item.dailyDemand, item.unitPrice);

    summaryBox.innerHTML = `
        <strong>Stock Summary:</strong> Current Stock: <strong>${item.currentStock}</strong> | 
        Reorder Point (ROP): <strong>${rop}</strong> | 
        Recommended EOQ Batch: <strong>${eoq} units</strong>
    `;

    qtyInput.value = eoq;
}

/**
 * Delete a product SKU
 */
function deleteSku(skuId) {
    const item = inventory.find(i => i.id === skuId);
    if (!item) return;

    if (confirm(`Are you sure you want to delete SKU "${item.name}"?`)) {
        inventory = inventory.filter(i => i.id !== skuId);
        saveInventory();
        renderAll();
        showToast(`Deleted SKU: ${item.name}`);
    }
}

/**
 * Export Inventory to CSV (Useful business feature for presentation)
 */
function exportInventoryCSV() {
    let csv = "SKU,Product Name,Category,Unit Price,Current Stock,Daily Demand,Lead Time (Days),Safety Stock,ROP,EOQ\n";
    inventory.forEach(item => {
        const rop = calculateROP(item.dailyDemand, item.leadTimeDays, item.safetyStock);
        const eoq = calculateEOQ(item.dailyDemand, item.unitPrice);
        csv += `"${item.id}","${item.name}","${item.category}",${item.unitPrice},${item.currentStock},${item.dailyDemand},${item.leadTimeDays},${item.safetyStock},${rop},${eoq}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inventory_stock_report_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("📁 Inventory report exported as CSV!");
}

/**
 * ----------------------------------------------------------------------------
 * 6. UI Navigation, Modals & Event Listeners
 * ----------------------------------------------------------------------------
 */
function switchTab(targetTabId) {
    document.querySelectorAll(".tab-btn").forEach(btn => {
        const isTarget = btn.getAttribute("data-tab") === targetTabId;
        btn.classList.toggle("active", isTarget);
    });

    document.querySelectorAll(".tab-content").forEach(content => {
        const isTarget = content.id === targetTabId;
        content.classList.toggle("active", isTarget);
    });

    if (targetTabId === "tab-demand") {
        setTimeout(() => {
            updateForecastView();
        }, 50);
    }
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add("active");
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove("active");
}

function showToast(message) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => {
        toast.classList.remove("show");
    }, 3200);
}

function initEventListeners() {
    // Tab switching (using event delegation on tab container for robustness)
    const tabNav = document.querySelector(".tab-nav");
    if (tabNav) {
        tabNav.addEventListener("click", (e) => {
            const btn = e.target.closest(".tab-btn");
            if (btn) {
                const tabId = btn.getAttribute("data-tab");
                if (tabId) switchTab(tabId);
            }
        });
    }

    // Top Header Action Buttons
    const simBtn = document.getElementById("btn-simulate-day");
    if (simBtn) simBtn.addEventListener("click", simulateDaySales);

    const resetBtn = document.getElementById("btn-reset-data");
    if (resetBtn) resetBtn.addEventListener("click", resetAllData);

    const logoutBtn = document.getElementById("btn-logout");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            sessionStorage.removeItem("retail_current_user");
            localStorage.removeItem("retail_current_user");
            window.location.href = "login.html?logout=true";
        });
    }

    const openAddBtn = document.getElementById("btn-open-add-modal");
    if (openAddBtn) openAddBtn.addEventListener("click", () => openModal("modal-add-sku"));

    const autoReplenishBtn = document.getElementById("btn-auto-replenish-all");
    if (autoReplenishBtn) autoReplenishBtn.addEventListener("click", autoReplenishAllLowStock);

    const exportCsvBtn = document.getElementById("btn-export-csv");
    if (exportCsvBtn) exportCsvBtn.addEventListener("click", exportInventoryCSV);

    const manualPoBtn = document.getElementById("btn-create-manual-po");
    if (manualPoBtn) manualPoBtn.addEventListener("click", () => {
        updatePoModalSummary();
        openModal("modal-create-po");
    });

    // Inventory Table Search & Filter
    const searchInput = document.getElementById("inventory-search");
    if (searchInput) searchInput.addEventListener("input", renderInventoryTable);

    const filterSelect = document.getElementById("inventory-filter");
    if (filterSelect) filterSelect.addEventListener("change", renderInventoryTable);

    // Dynamic delegation for Inventory Table buttons (Restock & Delete)
    const invTableBody = document.getElementById("inventory-table-body");
    if (invTableBody) {
        invTableBody.addEventListener("click", (e) => {
            const restockBtn = e.target.closest(".btn-reorder-sku");
            if (restockBtn) {
                const skuId = restockBtn.getAttribute("data-id");
                openRestockModalForSku(skuId);
                return;
            }

            const deleteBtn = e.target.closest(".btn-delete-sku");
            if (deleteBtn) {
                const skuId = deleteBtn.getAttribute("data-id");
                deleteSku(skuId);
                return;
            }
        });
    }

    // PO Table Receive Delivery button
    const poTableBody = document.getElementById("po-table-body");
    if (poTableBody) {
        poTableBody.addEventListener("click", (e) => {
            const receiveBtn = e.target.closest(".btn-receive-po");
            if (receiveBtn) {
                const poId = receiveBtn.getAttribute("data-poid");
                receivePurchaseOrder(poId);
            }
        });
    }

    // Demand Forecast SKU Selector & Multiplier Slider
    const forecastSelect = document.getElementById("forecast-sku-select");
    if (forecastSelect) forecastSelect.addEventListener("change", updateForecastView);
    
    const slider = document.getElementById("demand-multiplier-slider");
    const multiplierDisplay = document.getElementById("multiplier-display");
    if (slider && multiplierDisplay) {
        slider.addEventListener("input", (e) => {
            currentMultiplier = parseFloat(e.target.value);
            let tag = "Normal";
            if (currentMultiplier > 1.0) tag = `+${Math.round((currentMultiplier - 1.0) * 100)}% Surge`;
            if (currentMultiplier < 1.0) tag = `-${Math.round((1.0 - currentMultiplier) * 100)}% Sluggish`;
            multiplierDisplay.textContent = `${currentMultiplier.toFixed(1)}x (${tag})`;
            updateForecastView();
        });
    }

    // Modal Close buttons
    document.querySelectorAll("[data-close]").forEach(btn => {
        btn.addEventListener("click", () => {
            const modalId = btn.getAttribute("data-close");
            closeModal(modalId);
        });
    });

    // Close modal when clicking outside dialog
    document.querySelectorAll(".modal").forEach(modal => {
        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                modal.classList.remove("active");
            }
        });
    });

    // Close modal on Escape key
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            document.querySelectorAll(".modal.active").forEach(m => m.classList.remove("active"));
        }
    });

    // SKU Selection change in PO Modal
    const poSkuSelect = document.getElementById("po-sku-select");
    if (poSkuSelect) poSkuSelect.addEventListener("change", updatePoModalSummary);

    // Form Submit: Add SKU
    const addSkuForm = document.getElementById("form-add-sku");
    if (addSkuForm) {
        addSkuForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const code = document.getElementById("sku-code").value.trim().toUpperCase();
            const name = document.getElementById("sku-name").value.trim();
            const category = document.getElementById("sku-category").value;
            const price = parseFloat(document.getElementById("sku-price").value);
            const stock = parseInt(document.getElementById("sku-stock").value, 10);
            const demand = parseInt(document.getElementById("sku-demand").value, 10);
            const lead = parseInt(document.getElementById("sku-leadtime").value, 10);
            const safety = parseInt(document.getElementById("sku-safetystock").value, 10);

            if (inventory.some(i => i.id === code)) {
                alert(`A product with SKU Code "${code}" already exists.`);
                return;
            }

            const newProduct = {
                id: code,
                name: name,
                category: category,
                unitPrice: price,
                currentStock: stock,
                dailyDemand: demand,
                leadTimeDays: lead,
                safetyStock: safety,
                salesHistory: [demand, demand, demand, demand, demand, demand, demand]
            };

            inventory.push(newProduct);
            saveInventory();
            renderAll();
            closeModal("modal-add-sku");
            addSkuForm.reset();
            showToast(`Added product "${name}" successfully!`);
        });
    }

    // Form Submit: Create Purchase Order
    const createPoForm = document.getElementById("form-create-po");
    if (createPoForm) {
        createPoForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const poSkuSelect = document.getElementById("po-sku-select");
            const qtyInput = document.getElementById("po-quantity");
            if (!poSkuSelect || !qtyInput) return;

            const skuId = poSkuSelect.value;
            const qty = parseInt(qtyInput.value, 10);
            const item = inventory.find(i => i.id === skuId);

            if (!item || isNaN(qty) || qty <= 0) return;

            const newPO = {
                id: `PO-${new Date().getFullYear()}-${String(purchaseOrders.length + 1).padStart(3, "0")}`,
                date: new Date().toISOString().split("T")[0],
                skuId: item.id,
                productName: item.name,
                quantity: qty,
                estimatedCost: Math.round(qty * item.unitPrice * 100) / 100,
                leadDays: item.leadTimeDays,
                status: "Pending"
            };

            purchaseOrders.push(newPO);
            saveOrders();
            renderAll();
            closeModal("modal-create-po");
            showToast(`Purchase Order ${newPO.id} created!`);
            switchTab("tab-orders");
        });
    }
}
