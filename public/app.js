// ═══════════════════════════════════════════════════════════════════════════
// BIZ LOGICX PORTAL - COMPLETE APPLICATION
// ═══════════════════════════════════════════════════════════════════════════

let currentUser = null;
let currentTab = 'dashboard';
let allShipments = [];

// ─────────────────────────────── INIT ───────────────────────────────

window.addEventListener('DOMContentLoaded', () => {
  checkAuth();
});

// ─────────────────────────────── AUTH ───────────────────────────────

async function checkAuth() {
  try {
    const res = await fetch('/api/auth/me', { credentials: 'include' });
    if (res.ok) {
      currentUser = (await res.json()).user;
      showMainApp();
    } else {
      showLoginScreen();
    }
  } catch (error) {
    showLoginScreen();
  }
}

function showLoginScreen() {
  document.getElementById('app').innerHTML = `
    <div class="login-container">
      <div class="login-card">
        <div class="logo" style="justify-content: center; margin-bottom: 30px;">
          <i class="fas fa-cube"></i>
          <span>Biz LogicX</span>
        </div>
        <h2>Shipment Management</h2>
        
        <div class="tab-buttons">
          <button class="tab-btn active" onclick="switchAuthTab('login')">Login</button>
          <button class="tab-btn" onclick="switchAuthTab('register')">Register</button>
        </div>

        <form id="loginForm" style="display: block;">
          <div class="form-group">
            <label>Username</label>
            <input type="text" name="username" required>
          </div>
          <div class="form-group">
            <label>Password</label>
            <input type="password" name="password" required>
          </div>
          <button type="submit" class="submit-btn">Login</button>
        </form>

        <form id="registerForm" style="display: none;">
          <div class="form-group">
            <label>Full Name</label>
            <input type="text" name="fullName" required>
          </div>
          <div class="form-group">
            <label>Email</label>
            <input type="email" name="email">
          </div>
          <div class="form-group">
            <label>Username</label>
            <input type="text" name="username" required>
          </div>
          <div class="form-group">
            <label>Password</label>
            <input type="password" name="password" required>
          </div>
          <button type="submit" class="submit-btn">Create Account</button>
        </form>
      </div>
    </div>
  `;

  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  document.getElementById('registerForm').addEventListener('submit', handleRegister);
}

function switchAuthTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('form').forEach(f => f.style.display = 'none');
  
  event.target.classList.add('active');
  if (tab === 'login') {
    document.getElementById('loginForm').style.display = 'block';
  } else {
    document.getElementById('registerForm').style.display = 'block';
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const form = e.target;
  const data = Object.fromEntries(new FormData(form));
  
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    });
    
    if (res.ok) {
      currentUser = (await res.json()).user;
      showMainApp();
    } else {
      alert('Invalid credentials');
    }
  } catch (error) {
    alert('Login failed');
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const form = e.target;
  const data = Object.fromEntries(new FormData(form));
  
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    });
    
    if (res.ok) {
      currentUser = (await res.json()).user;
      showMainApp();
    } else {
      const err = await res.json();
      alert(err.message || 'Registration failed');
    }
  } catch (error) {
    alert('Registration failed');
  }
}

async function logout() {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
  currentUser = null;
  showLoginScreen();
}

// ─────────────────────────────── MAIN APP ───────────────────────────────

function showMainApp() {
  document.getElementById('app').innerHTML = `
    <div class="page">
      <aside class="sidebar">
        <div class="logo">
          <i class="fas fa-cube"></i>
          <span>Biz LogicX</span>
        </div>
        <ul class="nav">
          <li><a class="nav-item active" onclick="switchTab('dashboard')"><i class="fas fa-chart-line"></i> Dashboard</a></li>
          <li><a class="nav-item" onclick="switchTab('shipment')"><i class="fas fa-plus-circle"></i> New Shipment</a></li>
          <li><a class="nav-item" onclick="switchTab('logs')"><i class="fas fa-list"></i> Shipment Logs</a></li>
          <li><a class="nav-item" onclick="switchTab('settings')"><i class="fas fa-cog"></i> Settings</a></li>
        </ul>
      </aside>

      <div class="main-content">
        <header class="header">
          <h1 id="pageTitle">Dashboard</h1>
          <div class="user-menu">
            <span class="user-pill">${currentUser.fullName}</span>
            <button class="logout-btn" onclick="logout()">Logout</button>
          </div>
        </header>

        <div class="content" id="mainContent"></div>
      </div>
    </div>
  `;

  loadShipments();
  switchTab('dashboard');
}

function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  event.target.closest('a').classList.add('active');
  
  const titles = {
    dashboard: 'Executive Dashboard',
    shipment: 'New Shipment Log',
    logs: 'Shipment Ledger',
    settings: 'System Configuration'
  };
  
  document.getElementById('pageTitle').textContent = titles[tab] || tab;
  
  if (tab === 'dashboard') renderDashboard();
  else if (tab === 'shipment') renderShipmentForm();
  else if (tab === 'logs') renderLogs();
  else if (tab === 'settings') renderSettings();
}

// ─────────────────────────────── DASHBOARD ───────────────────────────────

async function renderDashboard() {
  const content = document.getElementById('mainContent');
  const stats = {
    totalShipments: allShipments.length,
    airFreight: allShipments.filter(s => s.transportMode === 'air').length,
    oceanFreight: allShipments.filter(s => s.transportMode === 'sea').length,
    exports: allShipments.filter(s => s.direction === 'export').length,
    totalRevenue: allShipments.reduce((sum, s) => sum + (s.totalRevenue || 0), 0),
    totalCost: allShipments.reduce((sum, s) => sum + (s.totalCost || 0), 0),
    totalProfit: allShipments.reduce((sum, s) => sum + (s.profit || 0), 0)
  };

  content.innerHTML = `
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-icon"><i class="fas fa-boxes"></i></div>
        <div class="kpi-content">
          <h3>Total Shipments</h3>
          <p>${stats.totalShipments}</p>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon"><i class="fas fa-plane"></i></div>
        <div class="kpi-content">
          <h3>Air Freight</h3>
          <p>${stats.airFreight}</p>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon"><i class="fas fa-ship"></i></div>
        <div class="kpi-content">
          <h3>Ocean Freight</h3>
          <p>${stats.oceanFreight}</p>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon"><i class="fas fa-arrow-right"></i></div>
        <div class="kpi-content">
          <h3>Exports</h3>
          <p>${stats.exports}</p>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon" style="color: #10b981;"><i class="fas fa-chart-pie"></i></div>
        <div class="kpi-content">
          <h3>Total Revenue</h3>
          <p>₹${stats.totalRevenue.toLocaleString('en-IN')}</p>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon" style="color: #ef4444;"><i class="fas fa-dollar-sign"></i></div>
        <div class="kpi-content">
          <h3>Total Cost</h3>
          <p>₹${stats.totalCost.toLocaleString('en-IN')}</p>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon" style="color: #f59e0b;"><i class="fas fa-chart-line"></i></div>
        <div class="kpi-content">
          <h3>Total Profit</h3>
          <p>₹${stats.totalProfit.toLocaleString('en-IN')}</p>
        </div>
      </div>
    </div>

    <div class="section-card">
      <div class="section-title"><i class="fas fa-history"></i> Recent Shipments</div>
      <table class="table">
        <thead>
          <tr>
            <th>Shipment ID</th>
            <th>Shipper</th>
            <th>Consignee</th>
            <th>Date</th>
            <th>Mode</th>
            <th>Revenue</th>
            <th>Profit</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${allShipments.slice(0, 10).map(s => `
            <tr>
              <td><strong>${s.shipmentId}</strong></td>
              <td>${s.shipperName || '-'}</td>
              <td>${s.consignee || '-'}</td>
              <td>${s.bookingDate || '-'}</td>
              <td><span class="badge ${s.transportMode}">${s.transportMode.toUpperCase()}</span></td>
              <td>₹${(s.totalRevenue || 0).toLocaleString('en-IN')}</td>
              <td style="color: ${(s.profit || 0) >= 0 ? '#10b981' : '#ef4444'}; font-weight: 600;">₹${(s.profit || 0).toLocaleString('en-IN')}</td>
              <td><button class="btn btn-sm btn-secondary" onclick="editShipment('${s._id}')">View</button></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// ─────────────────────────────── SHIPMENT FORM ───────────────────────────────

function renderShipmentForm() {
  const content = document.getElementById('mainContent');
  content.innerHTML = `
    <form id="shipmentForm" class="section-card" style="max-width: 1200px;">
      
      <!-- BOOKING DETAILS -->
      <div class="form-section">
        <div class="form-section-title"><i class="fas fa-calendar"></i> Booking Details</div>
        <div class="form-row">
          <div class="form-group">
            <label>Booking Date *</label>
            <input type="date" name="bookingDate" required>
          </div>
          <div class="form-group">
            <label>Direction *</label>
            <select name="direction" required>
              <option value="export">Export</option>
              <option value="import">Import</option>
            </select>
          </div>
          <div class="form-group">
            <label>Transport Mode *</label>
            <select name="transportMode" required>
              <option value="air">Air</option>
              <option value="sea">Sea</option>
            </select>
          </div>
        </div>
      </div>

      <!-- ORIGIN & DESTINATION -->
      <div class="form-section">
        <div class="form-section-title"><i class="fas fa-map"></i> Origin & Destination</div>
        <div class="form-row">
          <div class="form-group">
            <label>Origin Country</label>
            <input type="text" name="originCountry" value="India">
          </div>
          <div class="form-group">
            <label>Origin Port/Hub</label>
            <input type="text" name="originPort" placeholder="e.g., Nhava Sheva">
          </div>
          <div class="form-group">
            <label>Destination Country</label>
            <input type="text" name="destCountry" placeholder="e.g., USA">
          </div>
          <div class="form-group">
            <label>Destination Port/Hub</label>
            <input type="text" name="destPort" placeholder="e.g., New York">
          </div>
        </div>
      </div>

      <!-- CLIENT DETAILS -->
      <div class="form-section">
        <div class="form-section-title"><i class="fas fa-user"></i> Client & Billing Details</div>
        <div class="form-row">
          <div class="form-group">
            <label>Bill To</label>
            <input type="text" name="billTo" placeholder="Shipper/Consignee">
          </div>
          <div class="form-group">
            <label>Shipper Name *</label>
            <input type="text" name="shipperName" required>
          </div>
          <div class="form-group">
            <label>Consignee *</label>
            <input type="text" name="consignee" required>
          </div>
        </div>
      </div>

      <!-- CARGO DETAILS -->
      <div class="form-section">
        <div class="form-section-title"><i class="fas fa-box"></i> Cargo Details</div>
        <div class="form-row">
          <div class="form-group">
            <label>Nature of Shipment</label>
            <select name="nature">
              <option value="Commercial">Commercial</option>
              <option value="Sample">Sample</option>
              <option value="Documents">Documents Only</option>
            </select>
          </div>
          <div class="form-group">
            <label>Carrier *</label>
            <input type="text" name="carrier" value="UPS" required>
          </div>
          <div class="form-group">
            <label>Service</label>
            <input type="text" name="service" value="Express">
          </div>
        </div>
      </div>

      <!-- WAYBILL NUMBERS -->
      <div class="form-section">
        <div class="form-section-title"><i class="fas fa-barcode"></i> Waybill Numbers</div>
        <div class="form-row">
          <div class="form-group">
            <label>HAWB</label>
            <input type="text" name="hawb">
          </div>
          <div class="form-group">
            <label>MAWB</label>
            <input type="text" name="mawb">
          </div>
        </div>
      </div>

      <!-- INVOICE DETAILS -->
      <div class="form-section">
        <div class="form-section-title"><i class="fas fa-receipt"></i> Invoice Details</div>
        <div class="form-row">
          <div class="form-group">
            <label>Invoice No</label>
            <input type="text" name="invoiceNo">
          </div>
          <div class="form-group">
            <label>Invoice Date</label>
            <input type="date" name="invoiceDate">
          </div>
          <div class="form-group">
            <label>Invoice Total Value</label>
            <input type="number" name="invoiceTotalValue" step="0.01">
          </div>
          <div class="form-group">
            <label>Currency</label>
            <select name="invoiceCurrency">
              <option value="INR">INR</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
        </div>
      </div>

      <!-- PACKAGES -->
      <div class="form-section">
        <div class="form-section-title"><i class="fas fa-cubes"></i> Packages</div>
        <div class="packages-container" id="packagesContainer"></div>
        <button type="button" class="add-btn" onclick="addPackage()"><i class="fas fa-plus"></i> Add Package</button>
      </div>

      <!-- REVENUE HEADS -->
      <div class="form-section">
        <div class="form-section-title"><i class="fas fa-money-bill-wave"></i> Revenue Heads (Sales)</div>
        <div id="revenueContainer"></div>
        <button type="button" class="add-btn" onclick="addRevenue()"><i class="fas fa-plus"></i> Add Revenue Head</button>
      </div>

      <!-- PURCHASE ITEMS -->
      <div class="form-section">
        <div class="form-section-title"><i class="fas fa-shopping-cart"></i> Purchase Items (Costs)</div>
        <div id="purchaseContainer"></div>
        <button type="button" class="add-btn" onclick="addPurchaseItem()"><i class="fas fa-plus"></i> Add Purchase Item</button>
      </div>

      <!-- REMARKS -->
      <div class="form-section">
        <div class="form-group">
          <label>Remarks</label>
          <textarea name="remarks" style="width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 6px; font-family: inherit; min-height: 80px;"></textarea>
        </div>
      </div>

      <!-- SUMMARY -->
      <div class="revenue-summary" id="summary" style="display: none;">
        <div class="summary-row">
          <span class="label">Total Revenue:</span>
          <span class="value" id="summaryRevenue">₹0</span>
        </div>
        <div class="summary-row">
          <span class="label">Total Cost:</span>
          <span class="value" id="summaryCost">₹0</span>
        </div>
        <div class="summary-row">
          <span class="label">Profit:</span>
          <span class="value" id="summaryProfit">₹0</span>
        </div>
        <div class="summary-row summary-total">
          <span class="label">Margin %:</span>
          <span class="value" id="summaryMargin">0%</span>
        </div>
      </div>

      <div style="display: flex; gap: 10px; margin-top: 30px;">
        <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Save Shipment</button>
        <button type="button" class="btn btn-secondary" onclick="clearForm()"><i class="fas fa-redo"></i> Clear</button>
      </div>
    </form>
  `;

  // Initialize form
  addPackage();
  addRevenue();
  addPurchaseItem();

  document.getElementById('shipmentForm').addEventListener('submit', saveShipment);
  document.getElementById('shipmentForm').addEventListener('input', updateSummary);
}

function addPackage() {
  const container = document.getElementById('packagesContainer');
  const idx = container.children.length;
  const row = document.createElement('div');
  row.className = 'package-item';
  row.innerHTML = `
    <input type="text" placeholder="Type (Box/Pallet)" name="pkg_type_${idx}">
    <input type="number" placeholder="Weight (kg)" name="pkg_weight_${idx}" step="0.01">
    <input type="number" placeholder="Length" name="pkg_length_${idx}" step="0.01">
    <input type="number" placeholder="Width" name="pkg_width_${idx}" step="0.01">
    <input type="number" placeholder="Height" name="pkg_height_${idx}" step="0.01">
    <input type="text" placeholder="Description" name="pkg_desc_${idx}">
    <button type="button" class="btn-delete" onclick="this.parentElement.remove()">Delete</button>
  `;
  container.appendChild(row);
}

function addRevenue() {
  const container = document.getElementById('revenueContainer');
  const idx = container.children.length;
  const row = document.createElement('div');
  row.className = 'package-item';
  row.innerHTML = `
    <input type="text" placeholder="Category" name="rev_cat_${idx}">
    <input type="text" placeholder="Head" name="rev_head_${idx}">
    <input type="number" placeholder="Qty" name="rev_qty_${idx}" step="0.01">
    <input type="number" placeholder="Rate" name="rev_rate_${idx}" step="0.01">
    <select name="rev_curr_${idx}">
      <option value="INR">INR</option>
      <option value="USD">USD</option>
      <option value="EUR">EUR</option>
    </select>
    <button type="button" class="btn-delete" onclick="this.parentElement.remove()">Delete</button>
  `;
  container.appendChild(row);
}

function addPurchaseItem() {
  const container = document.getElementById('purchaseContainer');
  const idx = container.children.length;
  const row = document.createElement('div');
  row.className = 'package-item';
  row.innerHTML = `
    <input type="text" placeholder="Vendor" name="purch_vendor_${idx}">
    <input type="text" placeholder="Description" name="purch_desc_${idx}">
    <input type="number" placeholder="Qty" name="purch_qty_${idx}" step="0.01">
    <input type="number" placeholder="Rate" name="purch_rate_${idx}" step="0.01">
    <select name="purch_curr_${idx}">
      <option value="INR">INR</option>
      <option value="USD">USD</option>
      <option value="EUR">EUR</option>
    </select>
    <button type="button" class="btn-delete" onclick="this.parentElement.remove()">Delete</button>
  `;
  container.appendChild(row);
}

function updateSummary() {
  const form = document.getElementById('shipmentForm');
  let totalRevenue = 0;
  let totalCost = 0;

  // Calculate revenue
  const revRows = document.querySelectorAll('#revenueContainer .package-item');
  revRows.forEach((row, idx) => {
    const qty = parseFloat(row.querySelector(`[name="rev_qty_${idx}"]`).value) || 0;
    const rate = parseFloat(row.querySelector(`[name="rev_rate_${idx}"]`).value) || 0;
    totalRevenue += qty * rate;
  });

  // Calculate costs
  const purchRows = document.querySelectorAll('#purchaseContainer .package-item');
  purchRows.forEach((row, idx) => {
    const qty = parseFloat(row.querySelector(`[name="purch_qty_${idx}"]`).value) || 0;
    const rate = parseFloat(row.querySelector(`[name="purch_rate_${idx}"]`).value) || 0;
    totalCost += qty * rate;
  });

  const profit = totalRevenue - totalCost;
  const margin = totalRevenue > 0 ? ((profit / totalRevenue) * 100).toFixed(2) : 0;

  document.getElementById('summary').style.display = 'block';
  document.getElementById('summaryRevenue').textContent = `₹${totalRevenue.toLocaleString('en-IN')}`;
  document.getElementById('summaryCost').textContent = `₹${totalCost.toLocaleString('en-IN')}`;
  document.getElementById('summaryProfit').textContent = `₹${profit.toLocaleString('en-IN')}`;
  document.getElementById('summaryMargin').textContent = `${margin}%`;
}

async function saveShipment(e) {
  e.preventDefault();
  const form = e.target;

  // Collect packages
  const packages = [];
  document.querySelectorAll('#packagesContainer .package-item').forEach((row, idx) => {
    const type = row.querySelector(`[name="pkg_type_${idx}"]`).value;
    if (type) {
      packages.push({
        type,
        weight: parseFloat(row.querySelector(`[name="pkg_weight_${idx}"]`).value) || 0,
        length: parseFloat(row.querySelector(`[name="pkg_length_${idx}"]`).value) || 0,
        width: parseFloat(row.querySelector(`[name="pkg_width_${idx}"]`).value) || 0,
        height: parseFloat(row.querySelector(`[name="pkg_height_${idx}"]`).value) || 0,
        description: row.querySelector(`[name="pkg_desc_${idx}"]`).value
      });
    }
  });

  // Collect revenue
  const revenueHeads = [];
  document.querySelectorAll('#revenueContainer .package-item').forEach((row, idx) => {
    const category = row.querySelector(`[name="rev_cat_${idx}"]`).value;
    if (category) {
      const qty = parseFloat(row.querySelector(`[name="rev_qty_${idx}"]`).value) || 0;
      const rate = parseFloat(row.querySelector(`[name="rev_rate_${idx}"]`).value) || 0;
      revenueHeads.push({
        category,
        head: row.querySelector(`[name="rev_head_${idx}"]`).value,
        quantity: qty,
        rate,
        currency: row.querySelector(`[name="rev_curr_${idx}"]`).value,
        amount: qty * rate
      });
    }
  });

  // Collect purchases
  const purchaseItems = [];
  document.querySelectorAll('#purchaseContainer .package-item').forEach((row, idx) => {
    const vendor = row.querySelector(`[name="purch_vendor_${idx}"]`).value;
    if (vendor) {
      const qty = parseFloat(row.querySelector(`[name="purch_qty_${idx}"]`).value) || 0;
      const rate = parseFloat(row.querySelector(`[name="purch_rate_${idx}"]`).value) || 0;
      purchaseItems.push({
        vendor,
        description: row.querySelector(`[name="purch_desc_${idx}"]`).value,
        quantity: qty,
        rate,
        currency: row.querySelector(`[name="purch_curr_${idx}"]`).value,
        amount: qty * rate
      });
    }
  });

  const formData = Object.fromEntries(new FormData(form).entries());
  formData.packages = packages;
  formData.revenueHeads = revenueHeads;
  formData.purchaseItems = purchaseItems;

  try {
    const res = await fetch('/api/shipments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(formData)
    });

    if (res.ok) {
      alert('✓ Shipment saved successfully');
      clearForm();
      await loadShipments();
      switchTab('logs');
    } else {
      alert('Failed to save shipment');
    }
  } catch (error) {
    alert('Error saving shipment');
  }
}

function clearForm() {
  document.getElementById('shipmentForm').reset();
  document.getElementById('packagesContainer').innerHTML = '';
  document.getElementById('revenueContainer').innerHTML = '';
  document.getElementById('purchaseContainer').innerHTML = '';
  addPackage();
  addRevenue();
  addPurchaseItem();
  document.getElementById('summary').style.display = 'none';
}

// ─────────────────────────────── SHIPMENT LOGS ───────────────────────────────

function renderLogs() {
  const content = document.getElementById('mainContent');
  content.innerHTML = `
    <div class="section-card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <div class="section-title" style="margin: 0; flex: 1;"><i class="fas fa-list"></i> All Shipments</div>
        <button class="btn btn-primary btn-sm" onclick="exportAllCSV()"><i class="fas fa-download"></i> Export CSV</button>
      </div>
      
      <table class="table">
        <thead>
          <tr>
            <th>Shipment ID</th>
            <th>Shipper</th>
            <th>Consignee</th>
            <th>Date</th>
            <th>Mode</th>
            <th>Revenue</th>
            <th>Cost</th>
            <th>Profit</th>
            <th>Margin %</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${allShipments.map(s => `
            <tr>
              <td><strong>${s.shipmentId}</strong></td>
              <td>${s.shipperName || '-'}</td>
              <td>${s.consignee || '-'}</td>
              <td>${s.bookingDate || '-'}</td>
              <td><span class="badge ${s.transportMode}">${s.transportMode?.toUpperCase()}</span></td>
              <td>₹${(s.totalRevenue || 0).toLocaleString('en-IN')}</td>
              <td>₹${(s.totalCost || 0).toLocaleString('en-IN')}</td>
              <td style="color: ${(s.profit || 0) >= 0 ? '#10b981' : '#ef4444'}; font-weight: 600;">₹${(s.profit || 0).toLocaleString('en-IN')}</td>
              <td>${(s.marginPercent || 0).toFixed(2)}%</td>
              <td>
                <div class="actions">
                  <button class="btn btn-sm btn-secondary" onclick="editShipment('${s._id}')">Edit</button>
                  <button class="btn btn-sm btn-primary" onclick="downloadShipment('${s._id}')">Download</button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

async function editShipment(id) {
  try {
    const res = await fetch(`/api/shipments/${id}`, { credentials: 'include' });
    if (res.ok) {
      const { shipment } = await res.json();
      console.log('Shipment:', shipment);
      alert('Edit feature coming soon');
    }
  } catch (error) {
    alert('Error loading shipment');
  }
}

async function downloadShipment(id) {
  window.location.href = `/api/shipments/${id}/download`;
}

function exportAllCSV() {
  let csv = 'Biz LogicX - All Shipments\n\n';
  csv += 'Shipment ID,Shipper,Consignee,Date,Mode,Revenue,Cost,Profit,Margin %\n';
  
  allShipments.forEach(s => {
    csv += `${s.shipmentId},"${s.shipperName}","${s.consignee}",${s.bookingDate},${s.transportMode},${s.totalRevenue},${s.totalCost},${s.profit},${s.marginPercent}\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'shipments-export.csv';
  a.click();
  window.URL.revokeObjectURL(url);
}

// ─────────────────────────────── SETTINGS ───────────────────────────────

function renderSettings() {
  const content = document.getElementById('mainContent');
  content.innerHTML = `
    <div class="section-card">
      <div class="section-title"><i class="fas fa-sliders-h"></i> System Configuration</div>
      
      <div style="padding: 20px 0; border-bottom: 1px solid #e2e8f0;">
        <h3 style="margin-top: 0;">User Profile</h3>
        <p><strong>Username:</strong> ${currentUser.username}</p>
        <p><strong>Name:</strong> ${currentUser.fullName}</p>
        <p><strong>Email:</strong> ${currentUser.email || 'Not set'}</p>
      </div>

      <div style="padding: 20px 0; border-bottom: 1px solid #e2e8f0;">
        <h3 style="margin-top: 0;">Portal Information</h3>
        <p><strong>Company:</strong> Biz LogicX</p>
        <p><strong>Version:</strong> 2.0.0</p>
        <p><strong>Database:</strong> MongoDB</p>
      </div>

      <div style="padding: 20px 0;">
        <h3 style="margin-top: 0;">Actions</h3>
        <button class="btn btn-danger" onclick="if(confirm('Are you sure?')) clearAllData()">Clear All Shipment Data</button>
      </div>
    </div>
  `;
}

async function clearAllData() {
  try {
    const res = await fetch('/api/shipments', { credentials: 'include' });
    const { shipments } = await res.json();
    
    for (const s of shipments) {
      await fetch(`/api/shipments/${s._id}`, { method: 'DELETE', credentials: 'include' });
    }
    
    alert('All data cleared');
    await loadShipments();
    switchTab('dashboard');
  } catch (error) {
    alert('Error clearing data');
  }
}

// ─────────────────────────────── LOAD DATA ───────────────────────────────

async function loadShipments() {
  try {
    const res = await fetch('/api/shipments', { credentials: 'include' });
    if (res.ok) {
      const { shipments } = await res.json();
      allShipments = shipments || [];
    }
  } catch (error) {
    console.error(error);
  }
}
