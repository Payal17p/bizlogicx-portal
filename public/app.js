// ═══════════════════════════════════════════════════════════════════════════
// BIZ LOGICX PORTAL - COMPLETE APPLICATION (v3.0)
// ═══════════════════════════════════════════════════════════════════════════

let currentUser = null;
let currentTab = 'dashboard';
let allShipments = [];
let editingShipmentId = null;

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
        <h2>Shipment Management Portal</h2>
        <p class="subtitle">Professional Logistics Platform</p>
        
        <div class="tab-buttons">
          <button class="tab-btn active" onclick="switchAuthTab('login', this)">Login</button>
          <button class="tab-btn" onclick="switchAuthTab('register', this)">Register</button>
        </div>

        <div id="authMessage" class="auth-message" style="display: none;"></div>

        <form id="loginForm" style="display: block;">
          <div class="form-group">
            <label>Username or Email</label>
            <input type="text" name="username" required>
          </div>
          <div class="form-group">
            <label>Password</label>
            <input type="password" name="password" required>
          </div>
          <button type="submit" class="submit-btn">Login</button>
          <button type="button" class="forgot-link" onclick="switchAuthTab('forgot')">Forgot password?</button>
        </form>

        <form id="registerForm" style="display: none;">
          <div class="form-group">
            <label>Full Name</label>
            <input type="text" name="fullName" required>
          </div>
          <div class="form-group">
            <label>Email</label>
            <input type="email" name="email" required>
          </div>
          <div class="form-group">
            <label>Username</label>
            <input type="text" name="username" required>
          </div>
          <div class="form-group">
            <label>Password</label>
            <input type="password" name="password" required>
          </div>
          <div class="form-group">
            <label>Mobile Number</label>
            <input type="tel" name="phone" inputmode="tel" pattern="\+?[0-9]{10,15}" placeholder="9876543210" required>
          </div>
          <button type="submit" class="submit-btn">Create Account</button>
          <button type="button" class="auth-secondary-link" onclick="switchAuthTab('login')">Already registered? Login</button>
        </form>

        <form id="forgotForm" style="display: none;">
          <div class="form-group">
            <label>Enter Your Email</label>
            <input type="email" name="email" required>
          </div>
          <button type="submit" class="submit-btn">Send Reset Link</button>
          <button type="button" class="auth-secondary-link" onclick="switchAuthTab('login')">Back to Login</button>
          <div id="resetStatus" style="margin-top: 15px;"></div>
          <div id="resetPasswordForm" style="display: none; margin-top: 15px;">
            <div class="form-group">
              <label>Reset Token</label>
              <input type="text" id="resetToken" required>
            </div>
            <div class="form-group">
              <label>New Password</label>
              <input type="password" id="newPassword" required>
            </div>
            <button type="button" onclick="submitResetPassword()" class="submit-btn">Reset Password</button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  document.getElementById('registerForm').addEventListener('submit', handleRegister);
  document.getElementById('forgotForm').addEventListener('submit', handleForgotPassword);

  const resetToken = new URLSearchParams(window.location.search).get('resetToken');
  if (resetToken) {
    switchAuthTab('forgot');
    document.getElementById('resetToken').value = resetToken;
    document.getElementById('resetPasswordForm').style.display = 'block';
    showAuthMessage('Enter your new password to reset your account.', 'success');
  }
}

function switchAuthTab(tab, button) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('#loginForm, #registerForm, #forgotForm').forEach(f => f.style.display = 'none');
  document.getElementById('authMessage').style.display = 'none';
  const resetStatus = document.getElementById('resetStatus');
  if (resetStatus) resetStatus.innerHTML = '';
  
  const activeButton = button || document.querySelector(`.tab-btn[onclick*="${tab}"]`);
  if (activeButton) activeButton.classList.add('active');
  if (tab === 'login') {
    document.getElementById('loginForm').style.display = 'block';
  } else if (tab === 'register') {
    document.getElementById('registerForm').style.display = 'block';
  } else {
    document.getElementById('forgotForm').style.display = 'block';
  }
}

function showAuthMessage(message, type = 'error') {
  const msgDiv = document.getElementById('authMessage');
  msgDiv.textContent = message;
  msgDiv.className = `auth-message ${type}`;
  msgDiv.style.display = 'block';
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
    
    const result = await res.json();
    if (res.ok) {
      currentUser = result.user;
      showMainApp();
    } else {
      showAuthMessage(result.message || 'Login failed', 'error');
    }
  } catch (error) {
    showAuthMessage('Login failed. Please try again.', 'error');
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
    
    const result = await res.json();
    if (res.ok) {
      form.reset();
      switchAuthTab('login');
      showAuthMessage(result.message || 'Registration successful. Please login to continue.', 'success');
    } else {
      showAuthMessage(result.message || 'Registration failed', 'error');
    }
  } catch (error) {
    showAuthMessage('Registration failed. Please try again.', 'error');
  }
}

async function handleForgotPassword(e) {
  e.preventDefault();
  const email = e.target.email.value;
  
  try {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    
    const result = await res.json();
    if (res.ok) {
      const whatsappButton = result.whatsappLink
        ? `<a class="whatsapp-reset-btn" href="${result.whatsappLink}" target="_blank" rel="noopener"><i class="fab fa-whatsapp"></i> Open WhatsApp Reset Link</a>`
        : '';
      document.getElementById('resetStatus').innerHTML = `
        <div class="success-msg reset-box">
          <div>${result.message || 'Reset link generated.'}</div>
          ${whatsappButton}
          ${result.resetLink ? `<a class="reset-copy-link" href="${result.resetLink}">Open reset page</a>` : ''}
        </div>
      `;
      document.getElementById('resetToken').value = result.token || '';
      document.getElementById('resetPasswordForm').style.display = result.token ? 'block' : 'none';
      if (result.whatsappLink) {
        window.open(result.whatsappLink, '_blank', 'noopener');
      }
      return;
      document.getElementById('resetStatus').innerHTML = `
        <div class="success-msg" style="color: #10b981; padding: 10px; background: #f0fdf4; border-radius: 6px; margin-top: 10px;">
        ✓ Reset token: ${result.token}
        </div>
      `;
      document.getElementById('resetToken').value = result.token || '';
      document.getElementById('resetPasswordForm').style.display = 'block';
    } else {
      document.getElementById('resetStatus').innerHTML = `
        <div class="error-msg" style="color: #ef4444; padding: 10px; background: #fef2f2; border-radius: 6px; margin-top: 10px;">
        ✗ ${result.message}
        </div>
      `;
    }
  } catch (error) {
    document.getElementById('resetStatus').innerHTML = `
      <div class="error-msg" style="color: #ef4444; padding: 10px; background: #fef2f2; border-radius: 6px; margin-top: 10px;">
      ✗ Request failed
      </div>
    `;
  }
}

async function submitResetPassword() {
  const resetToken = document.getElementById('resetToken').value;
  const newPassword = document.getElementById('newPassword').value;
  
  if (!resetToken || !newPassword) {
    showAuthMessage('Token and password required', 'error');
    return;
  }
  
  try {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resetToken, newPassword })
    });
    
    const result = await res.json();
    if (res.ok) {
      showAuthMessage('Password reset successful! You can now login.', 'success');
      window.history.replaceState({}, document.title, window.location.pathname);
      setTimeout(() => switchAuthTab('login'), 2000);
    } else {
      document.getElementById('resetStatus').innerHTML = `
        <div class="error-msg" style="color: #ef4444; padding: 10px; background: #fef2f2; border-radius: 6px; margin-top: 10px;">
        ✗ ${result.message}
        </div>
      `;
    }
  } catch (error) {
    document.getElementById('resetStatus').innerHTML = `
      <div class="error-msg" style="color: #ef4444; padding: 10px; background: #fef2f2; border-radius: 6px; margin-top: 10px;">
      ✗ Reset failed
      </div>
    `;
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
          <li><a class="nav-item active" data-tab="dashboard" onclick="switchTab('dashboard', this)"><i class="fas fa-chart-line"></i> Dashboard</a></li>
          <li><a class="nav-item" data-tab="shipment" onclick="switchTab('shipment', this)"><i class="fas fa-plus-circle"></i> New Shipment</a></li>
          <li><a class="nav-item" data-tab="logs" onclick="switchTab('logs', this)"><i class="fas fa-list"></i> Shipment Logs</a></li>
          <li><a class="nav-item" data-tab="settings" onclick="switchTab('settings', this)"><i class="fas fa-cog"></i> Settings</a></li>
        </ul>
      </aside>

      <div class="main-content">
        <header class="header">
          <h1 id="pageTitle">Dashboard</h1>
              <div class="header-right">
                <div class="top-info">
                  <div class="current-date">${new Date().toLocaleDateString()}</div>
                  <button class="assistant-btn" onclick="openAssistant()">AI Assistant</button>
                </div>
                <div class="user-menu">
                  <button class="user-pill">${currentUser.username}</button>
                  <button class="logout-btn" onclick="logout()">Logout</button>
                </div>
              </div>
        </header>

        <div class="content" id="mainContent"></div>
      </div>
    </div>
  `;

  loadShipments();
  switchTab('dashboard');
}

// ─────────────────────────────── AI ASSISTANT ───────────────────────────────
function openAssistant() {
  // ensure modal exists
  if (!document.getElementById('assistantModal')) {
    const modal = document.createElement('div');
    modal.id = 'assistantModal';
    modal.className = 'assistant-modal';
    modal.innerHTML = `
      <div class="assistant-dialog">
        <button class="assistant-close" onclick="closeAssistant()">✕</button>
        <div class="assistant-body">
          <div id="assistantGreeting" class="assistant-greeting">Hello — I am your AI Assistant.</div>
          <div id="assistantQuestion" class="assistant-question">What is my name?</div>
          <input id="assistantNameInput" class="assistant-input" placeholder="Type your name here" />
          <div class="assistant-actions">
            <button class="btn btn-primary" onclick="saveAssistantName()">Save</button>
            <button class="btn btn-secondary" onclick="closeAssistant()">Close</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  const stored = localStorage.getItem('blx_assistant_name');
  if (stored) {
    document.getElementById('assistantGreeting').textContent = `Hello, ${stored}! How can I help?`;
    document.getElementById('assistantQuestion').style.display = 'none';
    document.getElementById('assistantNameInput').style.display = 'none';
    document.querySelector('#assistantModal .assistant-actions .btn-secondary').textContent = 'Close';
  } else {
    document.getElementById('assistantGreeting').textContent = 'Hello — I am your AI Assistant.';
    document.getElementById('assistantQuestion').style.display = 'block';
    document.getElementById('assistantNameInput').style.display = 'block';
    document.getElementById('assistantNameInput').value = '';
    document.querySelector('#assistantModal .assistant-actions .btn-secondary').textContent = 'Close';
  }

  document.getElementById('assistantModal').classList.add('open');
}

function closeAssistant() {
  const m = document.getElementById('assistantModal');
  if (m) m.classList.remove('open');
}

function saveAssistantName() {
  const val = document.getElementById('assistantNameInput').value.trim();
  if (!val) return alert('Please enter a name');
  localStorage.setItem('blx_assistant_name', val);
  document.getElementById('assistantGreeting').textContent = `Hello, ${val}! How can I help?`;
  document.getElementById('assistantQuestion').style.display = 'none';
  document.getElementById('assistantNameInput').style.display = 'none';
}

function switchTab(tab, navItem) {
  currentTab = tab;
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const activeItem = navItem || document.querySelector(`.nav-item[data-tab="${tab}"]`);
  if (activeItem) activeItem.classList.add('active');
  
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
  const mainContent = document.getElementById('mainContent');

  try {
    const res = await fetch('/api/dashboard', { credentials: 'include' });
    const data = await res.json();
    const dashboard = data.dashboard || {};

    mainContent.innerHTML = `
      <div class="dashboard-simple">
        <div class="welcome-card">
          <div>
            <p class="eyebrow">Welcome back</p>
            <h2>${currentUser?.fullName || 'User'}</h2>
            <p>${currentUser?.username || 'user'} • ${currentUser?.email || 'No email on file'}</p>
          </div>
          <div class="dashboard-actions">
            <button class="btn btn-primary" onclick="switchTab('shipment')">Add Shipment</button>
            <button class="btn btn-secondary" onclick="logout()">Logout</button>
          </div>
        </div>

        <div class="info-grid">
          <div class="info-card">
            <h3>Your Profile</h3>
            <ul>
              <li><strong>Name:</strong> ${currentUser?.fullName || 'N/A'}</li>
              <li><strong>Username:</strong> ${currentUser?.username || 'N/A'}</li>
              <li><strong>Email:</strong> ${currentUser?.email || 'N/A'}</li>
              <li><strong>Mobile:</strong> ${currentUser?.phone || 'N/A'}</li>
            </ul>
          </div>

          <div class="info-card">
            <h3>Quick Summary</h3>
            <ul>
              <li><strong>Total Shipments:</strong> ${dashboard.totalShipments || 0}</li>
              <li><strong>Air Freight:</strong> ${dashboard.airFreight || 0}</li>
              <li><strong>Ocean Freight:</strong> ${dashboard.oceanFreight || 0}</li>
              <li><strong>Exports:</strong> ${dashboard.exports || 0}</li>
            </ul>
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    mainContent.innerHTML = '<p class="error">Unable to load dashboard</p>';
  }
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

function getRowValue(row, selector) {
  return row.querySelector(selector)?.value || '';
}

function updateSummary() {
  const form = document.getElementById('shipmentForm');
  let totalRevenue = 0;
  let totalCost = 0;

  // Calculate revenue
  document.querySelectorAll('#revenueContainer .package-item').forEach((row) => {
    const qty = parseFloat(getRowValue(row, 'input[name^="rev_qty_"]')) || 0;
    const rate = parseFloat(getRowValue(row, 'input[name^="rev_rate_"]')) || 0;
    totalRevenue += qty * rate;
  });

  // Calculate costs
  document.querySelectorAll('#purchaseContainer .package-item').forEach((row) => {
    const qty = parseFloat(getRowValue(row, 'input[name^="purch_qty_"]')) || 0;
    const rate = parseFloat(getRowValue(row, 'input[name^="purch_rate_"]')) || 0;
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
  document.querySelectorAll('#packagesContainer .package-item').forEach((row) => {
    const type = getRowValue(row, 'input[name^="pkg_type_"]');
    if (type) {
      packages.push({
        type,
        weight: parseFloat(getRowValue(row, 'input[name^="pkg_weight_"]')) || 0,
        length: parseFloat(getRowValue(row, 'input[name^="pkg_length_"]')) || 0,
        width: parseFloat(getRowValue(row, 'input[name^="pkg_width_"]')) || 0,
        height: parseFloat(getRowValue(row, 'input[name^="pkg_height_"]')) || 0,
        description: getRowValue(row, 'input[name^="pkg_desc_"]')
      });
    }
  });

  // Collect revenue
  const revenueHeads = [];
  document.querySelectorAll('#revenueContainer .package-item').forEach((row) => {
    const category = getRowValue(row, 'input[name^="rev_cat_"]');
    if (category) {
      const qty = parseFloat(getRowValue(row, 'input[name^="rev_qty_"]')) || 0;
      const rate = parseFloat(getRowValue(row, 'input[name^="rev_rate_"]')) || 0;
      revenueHeads.push({
        category,
        head: getRowValue(row, 'input[name^="rev_head_"]'),
        quantity: qty,
        rate,
        currency: getRowValue(row, 'select[name^="rev_curr_"]'),
        amount: qty * rate
      });
    }
  });

  // Collect purchases
  const purchaseItems = [];
  document.querySelectorAll('#purchaseContainer .package-item').forEach((row) => {
    const vendor = getRowValue(row, 'input[name^="purch_vendor_"]');
    if (vendor) {
      const qty = parseFloat(getRowValue(row, 'input[name^="purch_qty_"]')) || 0;
      const rate = parseFloat(getRowValue(row, 'input[name^="purch_rate_"]')) || 0;
      purchaseItems.push({
        vendor,
        description: getRowValue(row, 'input[name^="purch_desc_"]'),
        quantity: qty,
        rate,
        currency: getRowValue(row, 'select[name^="purch_curr_"]'),
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
            <th>Expense</th>
            <th>Profit/Loss</th>
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
              <td><span class="badge badge-${s.transportMode}">${s.transportMode?.toUpperCase()}</span></td>
              <td>₹${(s.totalRevenue || 0).toLocaleString('en-IN')}</td>
              <td>₹${(s.totalCost || 0).toLocaleString('en-IN')}</td>
              <td style="color: ${(s.profit || 0) >= 0 ? '#10b981' : '#ef4444'}; font-weight: 600;">₹${(s.profit || 0).toLocaleString('en-IN')}</td>
              <td>${(s.marginPercent || 0).toFixed(2)}%</td>
              <td>
                <div class="actions" style="display: flex; gap: 5px;">
                  <button class="btn btn-sm btn-secondary" onclick="editShipment('${s._id}')">✏ Edit</button>
                  <button class="btn btn-sm btn-primary" onclick="downloadShipment('${s._id}')">⬇ Download</button>
                  <button class="btn btn-sm btn-danger" onclick="deleteShipment('${s._id}')">🗑 Delete</button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

async function deleteShipment(shipmentId) {
  if (confirm('Are you sure you want to delete this shipment?')) {
    try {
      const res = await fetch(`/api/shipments/${shipmentId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        await loadShipments();
        renderLogs();
        alert('Shipment deleted successfully');
      }
    } catch (error) {
      alert('Error deleting shipment');
    }
  }
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
