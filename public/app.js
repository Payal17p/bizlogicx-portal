// ═══════════════════════════════════════════════════════════════════════════
// BIZ LOGICX PORTAL - COMPLETE APPLICATION (v3.0)
// ═══════════════════════════════════════════════════════════════════════════

let currentUser = null;
let currentTab = window.initialPage || 'dashboard';
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

async function switchTab(tab, navItem, options = {}) {
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
  
  if (tab === 'dashboard') {
    await loadShipments();
    renderDashboard();
  } else if (tab === 'shipment') {
    if (!options.keepEdit) {
      editingShipmentId = null;
    }
    renderShipmentForm();
  } else if (tab === 'logs') {
    await loadShipments();
    renderLogs();
  } else if (tab === 'settings') renderSettings();
}

// ─────────────────────────────── DASHBOARD ───────────────────────────────

async function renderDashboard() {
  const mainContent = document.getElementById('mainContent');

  try {
    const res = await fetch('/api/dashboard', { credentials: 'include' });
    const data = await res.json();
    const dashboard = data.dashboard || {};
    mainContent.innerHTML = `
      <div class="dashboard-rich">
        <div class="hero">
          <div>
            <p class="eyebrow">Welcome back</p>
            <h2>Freight Operations Hub</h2>
            <p class="subtitle">Biz LogicX · Single-window logistics orchestration</p>
          </div>
          <div>
            <button class="btn btn-primary" onclick="switchTab('shipment')">+ New Shipment</button>
          </div>
        </div>

        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-icon"><i class="fas fa-clipboard-list"></i></div>
            <div class="kpi-value">${dashboard.totalShipments || 0}</div>
            <div class="kpi-label">Total Shipments</div>
            <div class="kpi-note">All time records</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-icon"><i class="fas fa-plane"></i></div>
            <div class="kpi-value">${dashboard.airFreight || 0}</div>
            <div class="kpi-label">Air Freight</div>
            <div class="kpi-note">Air cargo entries</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-icon"><i class="fas fa-ship"></i></div>
            <div class="kpi-value">${dashboard.oceanFreight || 0}</div>
            <div class="kpi-label">Ocean Freight</div>
            <div class="kpi-note">Sea cargo entries</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-icon"><i class="fas fa-plane-departure"></i></div>
            <div class="kpi-value">${dashboard.exports || 0}</div>
            <div class="kpi-label">Exports</div>
            <div class="kpi-note">Outbound shipments</div>
          </div>
        </div>

        <div class="tiles-grid">
          <div class="tile" onclick="switchTab('shipment')">
            <div class="tile-icon">+</div>
            <div class="tile-title">Log Shipment</div>
            <div class="tile-sub">Create a new freight entry</div>
          </div>
          <div class="tile" onclick="switchTab('logs')">
            <div class="tile-icon">≡</div>
            <div class="tile-title">View Ledger</div>
            <div class="tile-sub">Browse all shipment records</div>
          </div>
          <div class="tile" onclick="openAssistant()">
            <div class="tile-icon">🤖</div>
            <div class="tile-title">AI Assistant</div>
            <div class="tile-sub">Ask logistics questions</div>
          </div>
          <div class="tile" onclick="switchTab('settings')">
            <div class="tile-icon">⚙️</div>
            <div class="tile-title">Configuration</div>
            <div class="tile-sub">System settings & database</div>
          </div>
        </div>

        <div class="workflow">
          <div class="workflow-card">
            <h4>Operator Workflow Guide</h4>
            <div class="steps">
              <div class="step"><div class="step-num">01</div><div class="step-body"><strong>Setup & Configure</strong><div class="small">Initialize database and configure system parameters</div></div></div>
              <div class="step"><div class="step-num">02</div><div class="step-body"><strong>Log Dispatch</strong><div class="small">Enter dimensions, values, and attach compliance documents</div></div></div>
              <div class="step"><div class="step-num">03</div><div class="step-body"><strong>Auto-Compliance Checks</strong><div class="small">Automatic warnings for EWAB, sample limits, and compliance</div></div></div>
              <div class="step"><div class="step-num">04</div><div class="step-body"><strong>Audit Trail</strong><div class="small">View and audit all committed entries in the logs ledger</div></div></div>
            </div>
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
            <div class="transport-method" style="margin-top:12px;">
              <div class="transport-tile" data-mode="air">
                <div class="icon"><i class="fas fa-plane"></i></div>
                <div class="title">Air Freight</div>
                <div class="subtitle">3-7 Days · Premium Express</div>
              </div>
              <div class="transport-tile" data-mode="sea">
                <div class="icon"><i class="fas fa-ship"></i></div>
                <div class="title">Ocean Freight</div>
                <div class="subtitle">15-40 Days · Economy</div>
              </div>
            </div>
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
        <div class="form-section-title"><i class="fas fa-cubes"></i> Dimension & Package Configuration</div>

        <div class="package-table-wrap">
          <div class="package-note">Express Carrier DIM Weight Applied (UPS / DHL / FedEx) — DIM Wt (kg) = (L × W × H in cm) ÷ 5000 | Billable Wt = max(Gross Wt, DIM Wt)</div>
          <table class="package-table" id="packageTable">
            <thead>
              <tr>
                <th>#</th>
                <th>Goods Description</th>
                <th>HS / HTS Code</th>
                <th>No. of Pkg</th>
                <th>L</th>
                <th>W</th>
                <th>H</th>
                <th>Unit</th>
                <th>Gross Wt (kg)</th>
                <th>DIM Wt (kg)</th>
                <th>Billable Wt (kg)</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody id="packageTableBody"></tbody>
            <tfoot>
              <tr>
                <td colspan="8" style="text-align:right;font-weight:700;">Totals:</td>
                <td id="pkgTotalGross">0.00 kg</td>
                <td id="pkgTotalDim">0.00 kg</td>
                <td id="pkgTotalBillable">0.00 kg</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
          <div style="margin-top:12px; display:flex; gap:10px;"><button type="button" class="add-btn" onclick="addPackageRow()">+ Add Package</button></div>
        </div>
      </div>

      <!-- REVENUE HEADS -->
      <div class="form-section revenue-section">
        <div class="form-section-title"><i class="fas fa-money-bill-wave"></i> Sale Items (Revenue)</div>
        <div class="section-panel revenue-panel">
          <div class="panel-row">
            <div class="field-group">
              <label>Category</label>
              <select id="revCategory">
                <option value="Port to Port - Air">Port to Port - Air</option>
                <option value="Port to Port - Sea">Port to Port - Sea</option>
                <option value="Door to Door">Door to Door</option>
              </select>
            </div>
            <div class="field-group">
              <label>Charge Head</label>
              <select id="revHead">
                <option value="Freight">Freight</option>
                <option value="Handling">Handling</option>
                <option value="Insurance">Insurance</option>
              </select>
            </div>
            <div class="field-group">
              <label>SAC Code (auto)</label>
              <input id="revSac" type="text" readonly value="996531">
            </div>
          </div>
          <div class="panel-row">
            <div class="field-group">
              <label>Unit Type</label>
              <select id="revUnit">
                <option>Fix</option>
                <option>Per Kg</option>
                <option>Per Shipment</option>
              </select>
            </div>
            <div class="field-group">
              <label>Qty</label>
              <input id="revQty" type="number" min="1" value="1">
            </div>
            <div class="field-group">
              <label>Rate</label>
              <input id="revRate" type="number" min="0" step="0.01" value="0.00">
            </div>
            <div class="field-group">
              <label>Currency</label>
              <select id="revCurrency">
                <option>INR</option>
                <option>USD</option>
                <option>EUR</option>
              </select>
            </div>
            <div class="field-group">
              <label>Tax Rate %</label>
              <input id="revTax" type="number" min="0" step="0.01" value="18">
            </div>
            <div class="field-group field-action">
              <button type="button" class="btn btn-primary btn-add" onclick="addSaleItem()">+ Add Sale</button>
            </div>
          </div>
        </div>

        <div class="table-card">
          <table class="table section-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Charge Head</th>
                <th>SAC</th>
                <th>Unit Type</th>
                <th>QTY</th>
                <th>Rate</th>
                <th>Amount</th>
                <th>Ex. Rate</th>
                <th>Tax</th>
                <th>Total (INR)</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody id="revenueTableBody">
              <tr><td colspan="11" class="empty-state">No sale items added yet.</td></tr>
            </tbody>
          </table>
          <div class="section-total"><span>Total Revenue (INR):</span> <strong id="revenueTotal">₹0.00</strong></div>
        </div>
      </div>

      <!-- PURCHASE ITEMS -->
      <div class="form-section purchase-section">
        <div class="form-section-title"><i class="fas fa-shopping-cart"></i> Purchase Items (Costs)</div>
        <div class="section-panel purchase-panel">
          <div class="panel-row">
            <div class="field-group">
              <label>Vendor</label>
              <select id="purchVendor">
                <option value="">-- Select Vendor --</option>
                <option value="Vendor A">Vendor A</option>
                <option value="Vendor B">Vendor B</option>
                <option value="Vendor C">Vendor C</option>
              </select>
            </div>
            <div class="field-group">
              <label>Description</label>
              <input id="purchDesc" type="text" placeholder="e.g. FREIGHT CHARGE">
            </div>
            <div class="field-group">
              <label>Unit Type</label>
              <select id="purchUnit">
                <option>Fix</option>
                <option>Per Kg</option>
              </select>
            </div>
            <div class="field-group">
              <label>Currency</label>
              <select id="purchCurrency">
                <option>INR</option>
                <option>USD</option>
                <option>EUR</option>
              </select>
            </div>
          </div>
          <div class="panel-row">
            <div class="field-group">
              <label>Qty</label>
              <input id="purchQty" type="number" min="1" value="1">
            </div>
            <div class="field-group">
              <label>Rate</label>
              <input id="purchRate" type="number" min="0" step="0.01" value="0.00">
            </div>
            <div class="field-group">
              <label>Tax Rate %</label>
              <input id="purchTax" type="number" min="0" step="0.01" value="18">
            </div>
            <div class="field-group field-action">
              <button type="button" class="btn btn-danger btn-add" onclick="addCostItem()">+ Add Cost</button>
            </div>
          </div>
        </div>

        <div class="table-card">
          <table class="table section-table">
            <thead>
              <tr>
                <th>Vendor</th>
                <th>Description</th>
                <th>Unit Type</th>
                <th>QTY</th>
                <th>Rate</th>
                <th>Amount</th>
                <th>Ex. Rate</th>
                <th>Tax</th>
                <th>Total (INR)</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody id="purchaseTableBody">
              <tr><td colspan="10" class="empty-state">No cost items added yet.</td></tr>
            </tbody>
          </table>
          <div class="section-total"><span>Total Cost (INR):</span> <strong id="costTotal">₹0.00</strong></div>
        </div>
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
  document.getElementById('packagesContainer')?.remove();
  addPackageRow();
  initializeRevenueSection();
  initializePurchaseSection();

  document.getElementById('shipmentForm').addEventListener('submit', saveShipment);
  document.getElementById('shipmentForm').addEventListener('input', updateSummary);
  setSaveButtonLabel();

  // Wire transport tiles to select
  const transportSelect = document.querySelector('select[name="transportMode"]');
  const tiles = document.querySelectorAll('.transport-tile');
  function updateTiles() {
    tiles.forEach(t => {
      if (t.dataset.mode === transportSelect.value) t.classList.add('active');
      else t.classList.remove('active');
    });
  }
  tiles.forEach(t => {
    t.addEventListener('click', () => {
      const mode = t.dataset.mode;
      transportSelect.value = mode;
      updateTiles();
    });
  });
  updateTiles();
}

function addPackage() {
  // legacy: keep no-op for compatibility
}

function addPackageRow() {
  const tbody = document.getElementById('packageTableBody');
  const idx = tbody.children.length + 1;
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td>${idx}</td>
    <td><input type="text" name="pkg_desc_${idx}" placeholder="Description..."></td>
    <td><input type="text" name="pkg_hs_${idx}" placeholder="HS Code"></td>
    <td><input type="number" name="pkg_qty_${idx}" value="1" min="1" step="1"></td>
    <td><input type="number" name="pkg_l_${idx}" value="0" step="0.01"></td>
    <td><input type="number" name="pkg_w_${idx}" value="0" step="0.01"></td>
    <td><input type="number" name="pkg_hh_${idx}" value="0" step="0.01"></td>
    <td>
      <select name="pkg_unit_${idx}">
        <option value="inches">Inches</option>
        <option value="cm">cm</option>
      </select>
    </td>
    <td><input type="number" name="pkg_gross_${idx}" value="0" step="0.01"></td>
    <td class="pkg-dim">0.00</td>
    <td class="pkg-bill">0.00</td>
    <td><button type="button" class="btn-delete" onclick="this.closest('tr').remove(); updatePackageTotals();">Delete</button></td>
  `;
  tbody.appendChild(tr);

  // wire inputs
  tr.querySelectorAll('input, select').forEach(inp => inp.addEventListener('input', updatePackageTotals));
  updatePackageTotals();
}

function updatePackageTotals() {
  const rows = Array.from(document.querySelectorAll('#packageTableBody tr'));
  let totalGross = 0, totalDim = 0, totalBill = 0;
  rows.forEach(r => {
    const qty = parseFloat(r.querySelector('input[name^="pkg_qty_"]').value) || 0;
    const L = parseFloat(r.querySelector('input[name^="pkg_l_"]').value) || 0;
    const W = parseFloat(r.querySelector('input[name^="pkg_w_"]').value) || 0;
    const H = parseFloat(r.querySelector('input[name^="pkg_hh_"]').value) || 0;
    const unit = r.querySelector('select[name^="pkg_unit_"]').value;
    const gross = parseFloat(r.querySelector('input[name^="pkg_gross_"]').value) || 0;

    // convert to cm
    let Lcm = L, Wcm = W, Hcm = H;
    if (unit === 'inches') { Lcm = L * 2.54; Wcm = W * 2.54; Hcm = H * 2.54; }

    const dimPerPkg = (Lcm * Wcm * Hcm) / 5000;
    const dimTotal = dimPerPkg * qty;
    const grossTotal = gross * qty;
    const bill = Math.max(grossTotal, dimTotal);

    r.querySelector('.pkg-dim').textContent = dimTotal.toFixed(2);
    r.querySelector('.pkg-bill').textContent = bill.toFixed(2);

    totalGross += grossTotal;
    totalDim += dimTotal;
    totalBill += bill;
  });

  document.getElementById('pkgTotalGross').textContent = `${totalGross.toFixed(2)} kg`;
  document.getElementById('pkgTotalDim').textContent = `${totalDim.toFixed(2)} kg`;
  document.getElementById('pkgTotalBillable').textContent = `${totalBill.toFixed(2)} kg`;
}

function initializeRevenueSection() {
  document.getElementById('revenueTableBody').innerHTML = `<tr><td colspan="11" class="empty-state">No sale items added yet.</td></tr>`;
  document.getElementById('revenueTotal').textContent = '₹0.00';
}

function initializePurchaseSection() {
  document.getElementById('purchaseTableBody').innerHTML = `<tr><td colspan="10" class="empty-state">No cost items added yet.</td></tr>`;
  document.getElementById('costTotal').textContent = '₹0.00';
}

function addRevenueRow(item = {}) {
  const tbody = document.getElementById('revenueTableBody');
  if (tbody.querySelector('.empty-state')) tbody.innerHTML = '';

  const total = item.quantity * item.rate;
  const tr = document.createElement('tr');
  tr.className = 'package-item';
  tr.innerHTML = `
    <td><select name="rev_cat_${Date.now()}"><option value="${item.category || 'Port to Port - Air'}">${item.category || 'Port to Port - Air'}</option></select></td>
    <td><input name="rev_head_${Date.now()}" value="${item.head || ''}" /></td>
    <td><input name="rev_sac_${Date.now()}" value="${item.sac || ''}" readonly /></td>
    <td><input name="rev_unit_${Date.now()}" value="${item.unit || 'Fix'}" readonly /></td>
    <td><select name="rev_curr_${Date.now()}">
        <option value="INR" ${item.currency === 'INR' ? 'selected' : ''}>INR</option>
        <option value="USD" ${item.currency === 'USD' ? 'selected' : ''}>USD</option>
        <option value="EUR" ${item.currency === 'EUR' ? 'selected' : ''}>EUR</option>
      </select></td>
    <td><input name="rev_qty_${Date.now()}" type="number" value="${item.quantity || 0}" min="0" /></td>
    <td><input name="rev_rate_${Date.now()}" type="number" step="0.01" value="${item.rate || 0}" /></td>
    <td>₹${(item.quantity * item.rate).toFixed(2)}</td>
    <td>1</td>
    <td><input name="rev_tax_${Date.now()}" type="number" step="0.01" value="${item.taxRate || 0}" />%</td>
    <td class="rev-total">₹${total.toFixed(2)}</td>
    <td><button type="button" class="btn-delete" onclick="this.closest('tr').remove(); updateRevenueTotals(); updateSummary(); setSaveButtonLabel();">Delete</button></td>
  `;
  tbody.appendChild(tr);
  tr.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', () => {
      updateRevenueRow(tr);
      updateRevenueTotals();
      updateSummary();
      setSaveButtonLabel();
    });
  });
}

function addPurchaseRow(item = {}) {
  const tbody = document.getElementById('purchaseTableBody');
  if (tbody.querySelector('.empty-state')) tbody.innerHTML = '';

  const total = item.quantity * item.rate;
  const tr = document.createElement('tr');
  tr.className = 'package-item';
  tr.innerHTML = `
    <td><select name="purch_vendor_${Date.now()}"><option value="${item.vendor || ''}">${item.vendor || ''}</option></select></td>
    <td><input name="purch_desc_${Date.now()}" value="${item.description || ''}" /></td>
    <td><input name="purch_unit_${Date.now()}" value="${item.unit || 'Fix'}" readonly /></td>
    <td><input name="purch_qty_${Date.now()}" type="number" value="${item.quantity || 0}" min="0" /></td>
    <td><input name="purch_rate_${Date.now()}" type="number" step="0.01" value="${item.rate || 0}" /></td>
    <td>₹${(item.quantity * item.rate).toFixed(2)}</td>
    <td>1</td>
    <td><select name="purch_curr_${Date.now()}">
        <option value="INR" ${item.currency === 'INR' ? 'selected' : ''}>INR</option>
        <option value="USD" ${item.currency === 'USD' ? 'selected' : ''}>USD</option>
        <option value="EUR" ${item.currency === 'EUR' ? 'selected' : ''}>EUR</option>
      </select></td>
    <td class="purch-total">₹${total.toFixed(2)}</td>
    <td><button type="button" class="btn-delete" onclick="this.closest('tr').remove(); updateCostTotals(); updateSummary(); setSaveButtonLabel();">Delete</button></td>
  `;
  tbody.appendChild(tr);
  tr.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', () => {
      updatePurchaseRow(tr);
      updateCostTotals();
      updateSummary();
      setSaveButtonLabel();
    });
  });
}

function updateRevenueRow(row) {
  const qty = parseFloat(row.querySelector('input[name^="rev_qty_"]')?.value || '0') || 0;
  const rate = parseFloat(row.querySelector('input[name^="rev_rate_"]')?.value || '0') || 0;
  const taxRate = parseFloat(row.querySelector('input[name^="rev_tax_"]')?.value || '0') || 0;
  const total = qty * rate + (qty * rate * taxRate / 100);
  row.querySelector('.rev-total').textContent = `₹${total.toFixed(2)}`;
}

function updatePurchaseRow(row) {
  const qty = parseFloat(row.querySelector('input[name^="purch_qty_"]')?.value || '0') || 0;
  const rate = parseFloat(row.querySelector('input[name^="purch_rate_"]')?.value || '0') || 0;
  const taxRate = parseFloat(row.querySelector('input[name^="purch_tax_"]')?.value || '0') || 0;
  const total = qty * rate + (qty * rate * taxRate / 100);
  row.querySelector('.purch-total').textContent = `₹${total.toFixed(2)}`;
}

function setSaveButtonLabel() {
  const btn = document.querySelector('#shipmentForm button[type="submit"]');
  if (!btn) return;
  btn.innerHTML = `<i class="fas fa-save"></i> ${editingShipmentId ? 'Update Shipment' : 'Save Shipment'}`;
}

function addSaleItem() {
  const category = document.getElementById('revCategory').value;
  const head = document.getElementById('revHead').value;
  const sac = document.getElementById('revSac').value;
  const unit = document.getElementById('revUnit').value;
  const qty = parseFloat(document.getElementById('revQty').value) || 0;
  const rate = parseFloat(document.getElementById('revRate').value) || 0;
  const currency = document.getElementById('revCurrency').value;
  const taxRate = parseFloat(document.getElementById('revTax').value) || 0;

  if (!category || !head || qty <= 0) return alert('Please enter category, charge head and quantity');

  addRevenueRow({
    category,
    head,
    sac,
    unit,
    quantity: qty,
    rate,
    currency,
    taxRate
  });
  updateRevenueTotals();
  setSaveButtonLabel();
}

function addCostItem() {
  const vendor = document.getElementById('purchVendor').value;
  const description = document.getElementById('purchDesc').value;
  const unit = document.getElementById('purchUnit').value;
  const currency = document.getElementById('purchCurrency').value;
  const qty = parseFloat(document.getElementById('purchQty').value) || 0;
  const rate = parseFloat(document.getElementById('purchRate').value) || 0;
  const taxRate = parseFloat(document.getElementById('purchTax').value) || 0;

  if (!vendor || !description || qty <= 0) return alert('Please choose vendor, description and quantity');

  addPurchaseRow({
    vendor,
    description,
    unit,
    quantity: qty,
    rate,
    currency,
    taxRate
  });
  updateCostTotals();
  setSaveButtonLabel();
}

function updateRevenueTotals() {
  const rows = Array.from(document.querySelectorAll('#revenueTableBody tr')).filter(r => !r.querySelector('.empty-state'));
  const total = rows.reduce((sum, row) => {
    const value = parseFloat(row.querySelector('.rev-total')?.textContent.replace(/[₹,]/g, '') || '0') || 0;
    return sum + value;
  }, 0);
  document.getElementById('revenueTotal').textContent = `₹${total.toFixed(2)}`;
  updateSummary();
}

function updateCostTotals() {
  const rows = Array.from(document.querySelectorAll('#purchaseTableBody tr')).filter(r => !r.querySelector('.empty-state'));
  const total = rows.reduce((sum, row) => {
    const value = parseFloat(row.querySelector('.purch-total')?.textContent.replace(/[₹,]/g, '') || '0') || 0;
    return sum + value;
  }, 0);
  document.getElementById('costTotal').textContent = `₹${total.toFixed(2)}`;
  updateSummary();
}

function getRowValue(row, selector) {
  return row.querySelector(selector)?.value || '';
}

function updateSummary() {
  let totalRevenue = 0;
  let totalCost = 0;

  document.querySelectorAll('#revenueTableBody tr.package-item').forEach((row) => {
    const rowTotal = parseFloat(row.querySelector('.rev-total')?.textContent.replace(/[₹,]/g, '') || '0') || 0;
    totalRevenue += rowTotal;
  });

  document.querySelectorAll('#purchaseTableBody tr.package-item').forEach((row) => {
    const rowTotal = parseFloat(row.querySelector('.purch-total')?.textContent.replace(/[₹,]/g, '') || '0') || 0;
    totalCost += rowTotal;
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

  const packages = [];
  document.querySelectorAll('#packageTableBody tr').forEach((row) => {
    const qty = parseFloat(row.querySelector('input[name^="pkg_qty_"]')?.value || '0') || 0;
    const L = parseFloat(row.querySelector('input[name^="pkg_l_"]')?.value || '0') || 0;
    const W = parseFloat(row.querySelector('input[name^="pkg_w_"]')?.value || '0') || 0;
    const H = parseFloat(row.querySelector('input[name^="pkg_hh_"]')?.value || '0') || 0;
    const unit = row.querySelector('select[name^="pkg_unit_"]')?.value || 'cm';
    const gross = parseFloat(row.querySelector('input[name^="pkg_gross_"]')?.value || '0') || 0;
    const desc = row.querySelector('input[name^="pkg_desc_"]')?.value || '';
    const hs = row.querySelector('input[name^="pkg_hs_"]')?.value || '';

    if (!desc && !hs && qty <= 0 && gross <= 0) return;

    const Lcm = unit === 'inches' ? L * 2.54 : L;
    const Wcm = unit === 'inches' ? W * 2.54 : W;
    const Hcm = unit === 'inches' ? H * 2.54 : H;
    const dimPerPkg = (Lcm * Wcm * Hcm) / 5000;
    const dimTotal = dimPerPkg * qty;
    const grossTotal = gross * qty;
    const billable = Math.max(grossTotal, dimTotal);

    packages.push({
      description: desc,
      hsCode: hs,
      quantity: qty,
      length: L,
      width: W,
      height: H,
      unit,
      grossWeight: gross,
      dimWeight: parseFloat(dimTotal.toFixed(2)),
      billableWeight: parseFloat(billable.toFixed(2))
    });
  });

  const revenueHeads = [];
  document.querySelectorAll('#revenueTableBody tr.package-item').forEach((row) => {
    const category = getRowValue(row, 'select[name^="rev_cat_"]');
    const qty = parseFloat(getRowValue(row, 'input[name^="rev_qty_"]')) || 0;
    const rate = parseFloat(getRowValue(row, 'input[name^="rev_rate_"]')) || 0;
    if (category && qty > 0) {
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

  const purchaseItems = [];
  document.querySelectorAll('#purchaseTableBody tr.package-item').forEach((row) => {
    const vendor = getRowValue(row, 'select[name^="purch_vendor_"]');
    const qty = parseFloat(getRowValue(row, 'input[name^="purch_qty_"]')) || 0;
    const rate = parseFloat(getRowValue(row, 'input[name^="purch_rate_"]')) || 0;
    if (vendor && qty > 0) {
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

  const payload = {
    bookingDate: form.bookingDate?.value || '',
    direction: form.direction?.value || 'export',
    transportMode: form.transportMode?.value || 'air',
    originCountry: form.originCountry?.value || '',
    originPort: form.originPort?.value || '',
    destCountry: form.destCountry?.value || '',
    destPort: form.destPort?.value || '',
    billTo: form.billTo?.value || '',
    shipperName: form.shipperName?.value || '',
    consignee: form.consignee?.value || '',
    nature: form.nature?.value || '',
    carrier: form.carrier?.value || '',
    service: form.service?.value || '',
    hawb: form.hawb?.value || '',
    mawb: form.mawb?.value || '',
    invoiceNo: form.invoiceNo?.value || '',
    invoiceDate: form.invoiceDate?.value || '',
    invoiceTotalValue: form.invoiceTotalValue?.value || '',
    invoiceCurrency: form.invoiceCurrency?.value || 'INR',
    remarks: form.remarks?.value || '',
    packages,
    revenueHeads,
    purchaseItems
  };

  const url = editingShipmentId ? `/api/shipments/${editingShipmentId}` : '/api/shipments';
  const method = editingShipmentId ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(formData)
    });

    if (res.ok) {
      alert(editingShipmentId ? '✓ Shipment updated successfully' : '✓ Shipment saved successfully');
      clearForm();
      await loadShipments();
      switchTab('logs');
    } else {
      const result = await res.json().catch(() => ({}));
      alert(result.message || 'Failed to save shipment');
    }
  } catch (error) {
    alert('Error saving shipment');
  }
}

function clearForm() {
  const form = document.getElementById('shipmentForm');
  if (!form) return;
  editingShipmentId = null;
  form.reset();
  document.getElementById('packageTableBody').innerHTML = '';
  document.getElementById('revenueTableBody').innerHTML = '';
  document.getElementById('purchaseTableBody').innerHTML = '';
  addPackageRow();
  initializeRevenueSection();
  initializePurchaseSection();
  document.getElementById('summary').style.display = 'none';
  updatePackageTotals();
  setSaveButtonLabel();
}

// ─────────────────────────────── SHIPMENT LOGS ───────────────────────────────

function renderLogs() {
  const content = document.getElementById('mainContent');
  if (!allShipments?.length) {
    content.innerHTML = `
      <div class="section-card" style="text-align: center; padding: 60px 30px;">
        <div style="max-width: 560px; margin: 0 auto;">
          <div style="font-size: 56px; color: #cfd8e7; margin-bottom: 24px;">📦</div>
          <h2 style="margin-bottom: 12px;">Shipment Ledger</h2>
          <p style="margin-bottom: 24px; color: #64748b;">No records stored locally yet. Create your first shipment to start tracking freight, margins and compliance.</p>
          <button class="btn btn-primary" onclick="switchTab('shipment')">Create First Shipment</button>
        </div>
      </div>
    `;
    return;
  }

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
    if (!res.ok) throw new Error('Unable to load shipment');

    const { shipment } = await res.json();
    editingShipmentId = shipment._id;
    await switchTab('shipment', document.querySelector('.nav-item[data-tab="shipment"]'), { keepEdit: true });

    setTimeout(() => {
      const form = document.getElementById('shipmentForm');
      if (!form) return;

      [
        'bookingDate', 'direction', 'transportMode', 'originCountry', 'originPort',
        'destCountry', 'destPort', 'billTo', 'shipperName', 'consignee',
        'nature', 'carrier', 'service', 'hawb', 'mawb',
        'invoiceNo', 'invoiceDate', 'invoiceTotalValue', 'invoiceCurrency', 'remarks'
      ].forEach(name => {
        const field = form.querySelector(`[name="${name}"]`);
        if (field) field.value = shipment[name] || '';
      });

      const transportSelect = form.querySelector('select[name="transportMode"]');
      document.querySelectorAll('.transport-tile').forEach(t => {
        t.classList.toggle('active', t.dataset.mode === transportSelect.value);
      });

      const pkgBody = document.getElementById('packageTableBody');
      pkgBody.innerHTML = '';
      (shipment.packages || []).forEach((pkg, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${index + 1}</td>
          <td><input type="text" name="pkg_desc_${index + 1}" value="${pkg.description || ''}" placeholder="Description..."></td>
          <td><input type="text" name="pkg_hs_${index + 1}" value="${pkg.hsCode || ''}" placeholder="HS Code"></td>
          <td><input type="number" name="pkg_qty_${index + 1}" value="${pkg.quantity || 0}" min="1" step="1"></td>
          <td><input type="number" name="pkg_l_${index + 1}" value="${pkg.length || 0}" step="0.01"></td>
          <td><input type="number" name="pkg_w_${index + 1}" value="${pkg.width || 0}" step="0.01"></td>
          <td><input type="number" name="pkg_hh_${index + 1}" value="${pkg.height || 0}" step="0.01"></td>
          <td>
            <select name="pkg_unit_${index + 1}">
              <option value="cm" ${pkg.unit === 'cm' ? 'selected' : ''}>cm</option>
              <option value="inches" ${pkg.unit === 'inches' ? 'selected' : ''}>Inches</option>
            </select>
          </td>
          <td><input type="number" name="pkg_gross_${index + 1}" value="${pkg.grossWeight || 0}" step="0.01"></td>
          <td class="pkg-dim">0.00</td>
          <td class="pkg-bill">0.00</td>
          <td><button type="button" class="btn-delete" onclick="this.closest('tr').remove(); updatePackageTotals();">Delete</button></td>
        `;
        pkgBody.appendChild(tr);
        tr.querySelectorAll('input, select').forEach(inp => inp.addEventListener('input', updatePackageTotals));
      });
      if (!shipment.packages || !shipment.packages.length) addPackageRow();
      updatePackageTotals();

      initializeRevenueSection();
      (shipment.revenueHeads || []).forEach(item => addRevenueRow({
        category: item.category,
        head: item.head,
        sac: item.sac || '',
        unit: item.unit || 'Fix',
        quantity: item.quantity || 0,
        rate: item.rate || 0,
        currency: item.currency || 'INR',
        taxRate: item.taxRate || 0
      }));
      updateRevenueTotals();

      initializePurchaseSection();
      (shipment.purchaseItems || []).forEach(item => addPurchaseRow({
        vendor: item.vendor,
        description: item.description,
        unit: item.unit || 'Fix',
        quantity: item.quantity || 0,
        rate: item.rate || 0,
        currency: item.currency || 'INR',
        taxRate: item.taxRate || 0
      }));
      updateCostTotals();

      updateSummary();
      setSaveButtonLabel();
    }, 50);
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
