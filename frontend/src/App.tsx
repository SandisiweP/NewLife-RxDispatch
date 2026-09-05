import React, { useState, useEffect } from 'react';
import './App.css';
const API_URL="https://newlife-rxdispatch.onrender.com/api"

interface Order {
  id: string;
  prescriptionId?: string;
  status: string;
  riderId?: string;
  prescription?: {
    patientName: string;
    deliveryAddress: string;
    medication?: string;
    medications?: string;
  };
  rider?: {
    id?: string;
    name?: string;
  };
}

interface Toast {
  message: string;
  type: 'success' | 'info' | 'warning';
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'retailer' | 'dispatcher' | 'rider'>('retailer');
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedRider, setSelectedRider] = useState('Alex Rider');
  const [toast, setToast] = useState<Toast | null>(null);

  // Form State
  const [patientName, setPatientName] = useState('');
  const [medications, setMedications] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [patientPhone, setPatientPhone] = useState('0700000000');

  useEffect(() => {
    fetchOrders();
  }, []);

  const showToast = (message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch('${API_URL}/api/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    }
  };

  const handleCreatePrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const presRes = await fetch(`${API_URL}/api/prescriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName,
          patientPhone,
          deliveryAddress,
          medications,
          medication: medications,
          medicalDescription: medications,
          description: medications,
          pharmacyId: '00000000-0000-0000-0000-000000000001',
        }),
      });

      if (presRes.ok) {
        const presData = await presRes.json();
        const orderRes = await fetch('${AP_URL}/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prescriptionId: presData.id }),
        });

        if (orderRes.ok) {
          const newOrder = await orderRes.json();
          showToast(`Order #${newOrder.id ? newOrder.id.substring(0, 8) : ''} logged successfully!`, 'success');
        }

        setPatientName('');
        setMedications('');
        setDeliveryAddress('');
        fetchOrders();
      } else {
        const errData = await presRes.json();
        showToast(`Error: ${errData.error || 'Failed to submit prescription'}`, 'warning');
      }
    } catch (err) {
      console.error('Form submission error:', err);
    }
  };

  const handleAssignRider = async (orderId: string, riderName: string) => {
    if (!riderName) return;

    // Optimistically update assigned rider locally
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? { ...o, rider: { name: riderName }, status: 'ASSIGNED' }
          : o
      )
    );

    try {
      const assignRes = await fetch(`${API_URL}/api/orders/${orderId}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ riderName }),
      });

      if (assignRes.ok) {
        await fetch(`${API_URL}/api/orders/${orderId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'ASSIGNED' }),
        });

        showToast(`Order #${orderId.substring(0, 8)} assigned to ${riderName}`, 'info');
      }
    } catch (err) {
      console.error('Rider assignment error:', err);
    }
  };

  // Step 1 Updated handler: Optimistic status state transition
  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    // 1. Instantly update React state so UI unlocks the next button immediately
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );

    const statusLabels: Record<string, string> = {
      ACCEPTED: 'assignment accepted by rider 👍',
      PICKED_UP: 'marked as Picked Up 📦',
      IN_TRANSIT: 'is now In-Transit 🛵',
      DELIVERED: 'marked as Delivered 🎉',
    };

    showToast(`Order #${orderId.substring(0, 8)} ${statusLabels[newStatus] || newStatus}`, 'success');

    // 2. Send update to API in background
    try {
      await fetch(`${API_URL}/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (err) {
      console.error('Status update network error:', err);
    }
  };

  const riderOrders = orders.filter((o) => o.rider?.name === selectedRider);

  const getDisplayStatus = (order: Order) => {
    if ((!order.status || order.status === 'UNASSIGNED') && order.rider?.name) {
      return 'ASSIGNED';
    }
    return order.status || 'CREATED';
  };

  return (
    <div className="app-container">
      {/* Toast Notification */}
      {toast && (
        <div className={`toast-popup toast-${toast.type}`}>
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="toast-close">×</button>
        </div>
      )}

      {/* Header */}
      <header className="header">
        <div className="header-brand">
          <span className="brand-logo">💊</span>
          <div>
            <span className="brand-title">NewLife Rx-Dispatch</span>
            <span className="brand-subtitle"> Portal</span>
          </div>
        </div>
        <div className="status-indicator">
          <span className="status-dot"></span> System Connected
        </div>
      </header>

      <main className="main-content">
        {/* Tabs */}
        <nav className="tabs">
          <button
            className={`tab-btn ${activeTab === 'retailer' ? 'active' : ''}`}
            onClick={() => setActiveTab('retailer')}
          >
            Retailer / Active Orders
          </button>
          <button
            className={`tab-btn ${activeTab === 'dispatcher' ? 'active' : ''}`}
            onClick={() => setActiveTab('dispatcher')}
          >
            Dispatcher View
          </button>
          <button
            className={`tab-btn ${activeTab === 'rider' ? 'active' : ''}`}
            onClick={() => setActiveTab('rider')}
          >
            Rider Portal
          </button>
        </nav>

        {/* TAB 1: RETAILER */}
        {activeTab === 'retailer' && (
          <div className="card">
            <div className="card-header">
              <h2>Retailer / Active Orders</h2>
              <p>Create and monitor client prescriptions here.</p>
            </div>

            <div className="form-card">
              <form onSubmit={handleCreatePrescription}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Patient Full Name <span className="req">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      placeholder="e.g. Mandy West"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Medication & Dosage Details <span className="req">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      value={medications}
                      onChange={(e) => setMedications(e.target.value)}
                      placeholder="e.g. Amoxicillin 500mg"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Delivery Destination Address <span className="req">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="e.g. 9 Kimathi Street, Nairobi"
                    required
                  />
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn-primary">
                    Submit & Authorize Order
                  </button>
                </div>
              </form>
            </div>

            <div className="section-header">
              <h3>Active Orders Log</h3>
              <span className="count-pill">{orders.length} Total</span>
            </div>

            {orders.length === 0 ? (
              <div className="empty-state">No active orders available.</div>
            ) : (
              <div className="orders-grid">
                {orders.map((o) => (
                  <div key={o.id} className="order-card">
                    <div className="order-card-header">
                      <span className="order-id">Order #{o.id.substring(0, 8)}</span>
                      <span className="status-pill">{getDisplayStatus(o)}</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.9rem' }}>
                      <div><strong>Patient:</strong> {o.prescription?.patientName || 'N/A'}</div>
                      <div><strong>Medication:</strong> {o.prescription?.medications || o.prescription?.medication || 'N/A'}</div>
                      <div><strong>Destination:</strong> {o.prescription?.deliveryAddress || 'N/A'}</div>
                      <div><strong>Rider:</strong> {o.rider?.name || 'Unassigned'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: DISPATCHER VIEW */}
        {activeTab === 'dispatcher' && (
          <div className="card">
            <div className="card-header">
              <h2>Dispatcher View</h2>
              <p>Assign riders and manage order status.</p>
            </div>

            {orders.length === 0 ? (
              <div className="empty-state">No orders available for dispatch.</div>
            ) : (
              <div className="orders-grid">
                {orders.map((o) => {
                  const currentStatus = getDisplayStatus(o);
                  const canAssign =
                    currentStatus === 'CREATED' ||
                    currentStatus === 'ASSIGNED' ||
                    currentStatus === 'UNASSIGNED';

                  return (
                    <div key={o.id} className="order-card">
                      <div className="order-card-header">
                        <span className="order-id">Order #{o.id.substring(0, 8)}</span>
                        <span className="status-pill">
                          {currentStatus} {!canAssign && '🔒'}
                        </span>
                      </div>

                      <div className="order-details-grid">
                        <div>
                          <span className="detail-label">Client / Patient</span>
                          <span className="detail-value">{o.prescription?.patientName || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="detail-label">Assigned Courier</span>
                          <span className="detail-value">{o.rider?.name || 'Unassigned'}</span>
                        </div>
                        <div className="detail-row full">
                          <span className="detail-label">Destination Address</span>
                          <span className="detail-value">{o.prescription?.deliveryAddress || 'N/A'}</span>
                        </div>
                      </div>

                      <div className="dispatch-control-row">
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>
                          {canAssign ? 'Assign Rider:' : 'Parcel En-Route (Reassignment Locked)'}
                        </span>
                        <select
                          disabled={!canAssign}
                          value={o.rider?.name || ''}
                          onChange={(e) => handleAssignRider(o.id, e.target.value)}
                          style={{ opacity: canAssign ? 1 : 0.5, cursor: canAssign ? 'pointer' : 'not-allowed' }}
                        >
                          <option value="">-- Assign Rider --</option>
                          <option value="Alex Rider">Alex Rider</option>
                          <option value="Sam Courier">Sam Courier</option>
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: RIDER PORTAL */}
        {activeTab === 'rider' && (
          <div className="card">
            <div className="card-header">
              <h2>Rider Delivery Portal</h2>
              <p>Select your rider profile below to view and action assigned deliveries.</p>
            </div>

            <div className="filter-bar">
              <label>Viewing as Rider:</label>
              <select value={selectedRider} onChange={(e) => setSelectedRider(e.target.value)}>
                <option value="Alex Rider">Alex Rider</option>
                <option value="Sam Courier">Sam Courier</option>
              </select>
            </div>

            {riderOrders.length === 0 ? (
              <div className="empty-state">No active deliveries assigned to {selectedRider}.</div>
            ) : (
              <div className="orders-grid">
                {riderOrders.map((o) => {
                  const status = getDisplayStatus(o);
                  const isDelivered = status === 'DELIVERED';

                  // Strict sequential step rules
                  const canAccept = status === 'ASSIGNED' || status === 'CREATED' || status === 'UNASSIGNED';
                  const canPickup = status === 'ACCEPTED';
                  const canTransit = status === 'PICKED_UP';
                  const canDeliver = status === 'IN_TRANSIT';

                  return (
                    <div key={o.id} className="order-card">
                      <div className="order-card-header">
                        <span className="order-id">Order #{o.id.substring(0, 8)}</span>
                        <span className="status-pill">{status}</span>
                      </div>

                      <div className="order-details-grid">
                        <div>
                          <span className="detail-label">Patient</span>
                          <span className="detail-value">{o.prescription?.patientName || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="detail-label">Medication</span>
                          <span className="detail-value">{o.prescription?.medications || o.prescription?.medication || 'N/A'}</span>
                        </div>
                        <div className="detail-row full">
                          <span className="detail-label">Destination</span>
                          <span className="detail-value">{o.prescription?.deliveryAddress || 'N/A'}</span>
                        </div>
                      </div>

                      <div className="card-actions">
                        <button
                          className="btn-action btn-purple"
                          disabled={!canAccept}
                          style={{ opacity: canAccept ? 1 : 0.4, cursor: canAccept ? 'pointer' : 'not-allowed' }}
                          onClick={() => handleUpdateStatus(o.id, 'ACCEPTED')}
                        >
                          Accept Assignment
                        </button>
                        <button
                          className="btn-action btn-blue"
                          disabled={!canPickup}
                          style={{ opacity: canPickup ? 1 : 0.4, cursor: canPickup ? 'pointer' : 'not-allowed' }}
                          onClick={() => handleUpdateStatus(o.id, 'PICKED_UP')}
                        >
                          Picked Up
                        </button>
                        <button
                          className="btn-action btn-orange"
                          disabled={!canTransit}
                          style={{ opacity: canTransit ? 1 : 0.4, cursor: canTransit ? 'pointer' : 'not-allowed' }}
                          onClick={() => handleUpdateStatus(o.id, 'IN_TRANSIT')}
                        >
                          In-Transit
                        </button>
                        <button
                          className="btn-action btn-emerald"
                          disabled={!canDeliver}
                          style={{ opacity: canDeliver ? 1 : 0.4, cursor: canDeliver ? 'pointer' : 'not-allowed' }}
                          onClick={() => handleUpdateStatus(o.id, 'DELIVERED')}
                        >
                          {isDelivered ? 'Completed 🔒' : 'Delivered'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
