const authCard = document.getElementById('authCard');
const mainContent = document.getElementById('mainContent');
const shipmentForm = document.getElementById('shipmentForm');
const shipmentsList = document.getElementById('shipmentsList');
const packagesContainer = document.getElementById('packagesContainer');
const logoutBtn = document.getElementById('logoutBtn');

let currentUser = null;
let packageCount = 1;

function renderAuth() {
  if (currentUser) {
    authCard.innerHTML = `
      <div class="user-pill">
        <strong>${currentUser.fullName}</strong>
        <span>${currentUser.username}</span>
      </div>
    `;
    mainContent.classList.remove('hidden');
    return;
  }

  authCard.innerHTML = `
    <div class="auth-tabs">
      <h3>Access Portal</h3>
      <form id="loginForm" class="stacked-form">
        <input name="username" placeholder="Username" required />
        <input name="password" type="password" placeholder="Password" required />
        <button type="submit" class="primary-btn">Login</button>
      </form>
      <form id="registerForm" class="stacked-form">
        <input name="fullName" placeholder="Full Name" />
        <input name="username" placeholder="New Username" required />
        <input name="password" type="password" placeholder="New Password" required />
        <button type="submit" class="secondary-btn">Create Account</button>
      </form>
    </div>
  `;

  mainContent.classList.add('hidden');
  bindAuthForms();
}

function bindAuthForms() {
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  document.getElementById('registerForm').addEventListener('submit', handleRegister);
}

async function checkAuth() {
  try {
    const response = await fetch('/api/auth/me', { credentials: 'include' });
    const data = await response.json();
    if (data.ok) {
      currentUser = data.user;
    }
  } catch (error) {
    console.error(error);
  }
  renderAuth();
  if (currentUser) {
    loadShipments();
  }
}

async function handleLogin(event) {
  event.preventDefault();
  const form = event.target;
  const payload = Object.fromEntries(new FormData(form));
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload)
  });
  const data = await response.json();
  if (!data.ok) {
    alert(data.message || 'Unable to login');
    return;
  }
  currentUser = data.user;
  form.reset();
  renderAuth();
  loadShipments();
}

async function handleRegister(event) {
  event.preventDefault();
  const form = event.target;
  const payload = Object.fromEntries(new FormData(form));
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload)
  });
  const data = await response.json();
  if (!data.ok) {
    alert(data.message || 'Unable to create account');
    return;
  }
  currentUser = data.user;
  form.reset();
  renderAuth();
  loadShipments();
}

async function logout() {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
  currentUser = null;
  renderAuth();
}

function createPackageRow(index) {
  const row = document.createElement('div');
  row.className = 'package-row';
  row.innerHTML = `
    <input name="packageType${index}" placeholder="Box / Pallet" />
    <input name="packageWeight${index}" placeholder="Weight (kg)" />
    <input name="packageLength${index}" placeholder="L" />
    <input name="packageWidth${index}" placeholder="W" />
    <input name="packageHeight${index}" placeholder="H" />
    <input name="packageDesc${index}" placeholder="Description" />
  `;
  packagesContainer.appendChild(row);
}

function addPackageRow() {
  createPackageRow(packageCount);
  packageCount += 1;
}

function collectPackages() {
  const entries = [];
  const rows = packagesContainer.querySelectorAll('.package-row');
  rows.forEach((row) => {
    const values = {
      type: row.querySelector(`[name="packageType${Array.from(rows).indexOf(row) + 1}"]`)?.value || '',
      weight: row.querySelector(`[name="packageWeight${Array.from(rows).indexOf(row) + 1}"]`)?.value || '',
      length: row.querySelector(`[name="packageLength${Array.from(rows).indexOf(row) + 1}"]`)?.value || '',
      width: row.querySelector(`[name="packageWidth${Array.from(rows).indexOf(row) + 1}"]`)?.value || '',
      height: row.querySelector(`[name="packageHeight${Array.from(rows).indexOf(row) + 1}"]`)?.value || '',
      description: row.querySelector(`[name="packageDesc${Array.from(rows).indexOf(row) + 1}"]`)?.value || ''
    };
    if (values.type || values.weight || values.description) {
      entries.push(values);
    }
  });
  return entries;
}

shipmentForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(shipmentForm);
  const payload = Object.fromEntries(formData.entries());
  payload.packages = collectPackages();

  const response = await fetch('/api/shipments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload)
  });
  const data = await response.json();
  if (!data.ok) {
    alert(data.message || 'Shipment could not be saved');
    return;
  }

  shipmentForm.reset();
  packagesContainer.innerHTML = '';
  packageCount = 1;
  createPackageRow(1);
  loadShipments();
  alert('Shipment saved successfully');
});

document.getElementById('addPackageBtn')?.addEventListener('click', addPackageRow);
logoutBtn?.addEventListener('click', logout);

async function loadShipments() {
  if (!currentUser) return;
  const response = await fetch('/api/shipments', { credentials: 'include' });
  const data = await response.json();
  if (!data.ok) {
    shipmentsList.innerHTML = '<p>Unable to load shipments.</p>';
    return;
  }

  if (!data.shipments.length) {
    shipmentsList.innerHTML = '<p>No shipments created yet.</p>';
    return;
  }

  shipmentsList.innerHTML = data.shipments.map((shipment) => `
    <article class="shipment-item">
      <div>
        <strong>${shipment.shipperName || 'Unnamed'} → ${shipment.consignee || 'Unknown'}</strong>
        <p>${shipment.bookingDate || '-'} • ${shipment.direction || 'export'} • ${shipment.carrier || '-'}</p>
      </div>
      <span class="badge">${shipment.invoiceCurrency || 'USD'} ${shipment.invoiceTotalValue || '0'}</span>
    </article>
  `).join('');
}

window.addEventListener('DOMContentLoaded', () => {
  createPackageRow(1);
  checkAuth();
});
