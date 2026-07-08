const shipmentApiUrl = '/api/shipments';

async function fetchShipments() {
  try {
    const res = await fetch(shipmentApiUrl, { credentials: 'include' });
    if (!res.ok) throw new Error('Unable to fetch shipments');
    const data = await res.json();
    return data.shipments || [];
  } catch (err) {
    console.error(err);
    return [];
  }
}

async function loadShipments() {
  const search = document.getElementById('search').value.toLowerCase();
  const statusFilter = document.getElementById('filterStatus').value;
  const shipments = await fetchShipments();

  const filtered = shipments.filter(item => {
    const matchesSearch = [item.shipmentId, item.shipperName, item.consignee, item.originPort, item.destPort]
      .filter(Boolean)
      .some(value => value.toLowerCase().includes(search));
    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  document.getElementById('totalCount').textContent = shipments.length;
  document.getElementById('pendingCount').textContent = shipments.filter(i => i.status === 'Pending').length;
  document.getElementById('transitCount').textContent = shipments.filter(i => i.status === 'In Transit').length;
  document.getElementById('deliveredCount').textContent = shipments.filter(i => i.status === 'Delivered').length;

  const tbody = document.getElementById('shipmentTable');
  tbody.innerHTML = filtered.map(item => `
    <tr>
      <td>${item.shipmentId || '-'}</td>
      <td>${item.shipperName || item.consignee || '-'}</td>
      <td>${item.originPort || item.originCountry || '-'}</td>
      <td>${item.destPort || item.destCountry || '-'}</td>
      <td>${item.status || 'Pending'}</td>
      <td><button class="secondary-btn" onclick="editShipment('${item._id}')">Edit</button></td>
    </tr>
  `).join('');
}

async function createShipment() {
  const shipmentNo = document.getElementById('shipmentNo').value.trim();
  const customerName = document.getElementById('customerName').value.trim();
  const origin = document.getElementById('origin').value.trim();
  const destination = document.getElementById('destination').value.trim();
  const status = document.getElementById('status').value;

  if (!shipmentNo || !customerName || !origin || !destination) {
    return alert('Please fill all fields');
  }

  const payload = {
    shipmentId: shipmentNo,
    shipperName: customerName,
    originPort: origin,
    destPort: destination,
    status,
    billTo: customerName,
    shipmentValue: 0,
    transportMode: 'air',
    direction: 'export',
    createdAt: new Date().toISOString()
  };

  try {
    const res = await fetch(shipmentApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || 'Could not add shipment');
    }

    document.getElementById('shipmentNo').value = '';
    document.getElementById('customerName').value = '';
    document.getElementById('origin').value = '';
    document.getElementById('destination').value = '';
    document.getElementById('status').value = 'Pending';

    loadShipments();
  } catch (err) {
    alert(err.message || 'Error adding shipment');
  }
}

function editShipment(id) {
  window.location.href = `/shipment.html?edit=${id}`;
}

async function logout() {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
  window.location.href = '/';
}

window.addEventListener('DOMContentLoaded', loadShipments);
