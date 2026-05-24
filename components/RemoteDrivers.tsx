"use client";
import { useEffect, useState } from "react";
import { formatApiError, type ApiErrorBody } from "@/lib/api-errors";

export default function RemoteDrivers() {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const load = async () => {
    setLoading(true);
    const token = localStorage.getItem('cc_token') || '';
    try {
      const res = await fetch('/api/proxy/driver/all', {
        headers: { Authorization: token ? `Bearer ${token}` : '' }
      });
      const data = await res.json();
      setDrivers(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load() }, []);

  const addDriver = async () => {
    if (!name || !email || !password) return alert('Name, email, and password are required');
    const body = JSON.stringify({ name, email, password, role: 'DRIVER' });
    const res = await fetch('/api/proxy/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body
    });
    if (!res.ok) return alert('Failed to add driver');
    setName(''); setEmail(''); setPassword('');
    load();
  }

  const assign = async (reportId: string, driverId: string) => {
    if (!reportId) return;
    const token = localStorage.getItem('cc_token') || '';
    try {
      const res = await fetch(`/api/proxy/driver/reports/${reportId}/assign`, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ driverId })
      });
      const data = (await res.json().catch(() => ({}))) as ApiErrorBody;
      if (res.ok) {
        alert('Assigned successfully');
      } else {
        alert(formatApiError(data, 'Assignment failed. Only pending reports can be assigned to an active driver.'));
      }
    } catch {
      alert('Error during assignment. Please check your connection and try again.');
    }
    load();
  }



  return (
    <div className="animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 className="page-title" style={{ margin: 0 }}>Drivers Fleet</h2>
        <button className="top-btn" onClick={load}>Refresh Fleet</button>
      </div>

      <div style={{
        background: 'var(--bg-card)',
        padding: 24,
        borderRadius: 16,
        border: '1px solid var(--border)',
        marginBottom: 32,
        display: 'flex',
        gap: 16,
        flexWrap: 'wrap',
        alignItems: 'flex-end'
      }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Name</label>
          <input placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} style={{ width: '100%' }} />
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Email</label>
          <input placeholder="email@example.com" value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%' }} />
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Password</label>
          <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%' }} />
        </div>
        <button className="btn-assign" onClick={addDriver} style={{ height: 42 }}>Add New Driver</button>
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading drivers...</div> : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Zone</th>
                <th>Vehicle</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {drivers.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No drivers found</td></tr>
              ) : drivers.map((d: any) => (
                <tr key={d.id}>
                  <td style={{ fontWeight: 600 }}>{d.name}</td>
                  <td>{d.email}</td>
                  <td>{d.phone || 'N/A'}</td>
                  <td><span className="badge badge-pending">{d.zone || 'Unassigned'}</span></td>
                  <td>{d.vehicleNumber || 'N/A'}</td>
                  <td>
                    <button className="btn-assign" onClick={() => assign(prompt('Enter Report ID to assign to this driver:') || '', d.id)}>
                      Assign Report
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

