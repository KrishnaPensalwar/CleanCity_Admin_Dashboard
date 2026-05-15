"use client";
import { useEffect, useState } from "react";

export default function RemoteReports() {
  const [reports, setReports] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  const loadData = async () => {
    setLoading(true);
    const token = localStorage.getItem('cc_token') || '';
    const headers = { Authorization: token ? `Bearer ${token}` : '' };

    try {
      const [repRes, driRes] = await Promise.all([
        fetch('/api/proxy/reports', { headers }),
        fetch('/api/proxy/driver/all', { headers })
      ]);

      const repData = await repRes.json();
      const driData = await driRes.json();

      if (Array.isArray(repData)) {
        setReports(repData);
      } else if (repData && typeof repData === 'object' && Array.isArray(repData.reports)) {
        setReports(repData.reports);
      } else {
        setReports([]);
      }

      setDrivers(Array.isArray(driData) ? driData : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData() }, []);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    const token = localStorage.getItem('cc_token') || '';
    const res = await fetch(`/api/proxy/reports/${id}/${action}`, {
      method: 'POST',
      headers: { Authorization: token ? `Bearer ${token}` : '' }
    });
    if (res.ok) {
      alert(`Report ${action}d successfully`);
      setSelectedReport(null);
      loadData();
    } else {
      alert(`Failed to ${action} report`);
    }
  }

  const assign = async (reportId: string, driverId: string) => {
    if (!driverId) return;
    const token = localStorage.getItem('cc_token') || '';
    const res = await fetch(`/api/proxy/driver/reports/${reportId}/assign`, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ driverId })
    });
    if (res.ok) alert('Driver assigned!');
    else alert('Failed to assign');
    loadData();
  }


  const filteredReports = reports.filter(r =>
    filterStatus === "ALL" || r.status.toUpperCase() === filterStatus.toUpperCase()
  );

  const statuses = ["ALL", "PENDING", "APPROVED", "ASSIGNED", "REJECTED", "RESOLVED"];

  return (
    <div className="animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 className="page-title" style={{ margin: 0 }}>Incident Reports</h2>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ padding: '8px 12px', fontSize: 13 }}
          >
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button className="top-btn" onClick={loadData}>Refresh Data</button>
        </div>
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading reports...</div> : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Description</th>
                <th>Status</th>
                <th>Created At</th>
                <th>Assign Driver</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No reports matching "{filterStatus}"</td></tr>
              ) : filteredReports.map((r: any) => (
                <tr key={r.id}>
                  <td style={{ color: 'var(--primary)', fontWeight: 600, fontSize: 12 }}>{r.id.slice(0, 8)}...</td>
                  <td style={{ cursor: 'pointer' }} onClick={() => setSelectedReport(r)}>
                    <div style={{ fontWeight: 500 }}>{r.description}</div>
                    <span style={{ fontSize: 11, color: 'var(--primary)', textDecoration: 'underline' }}>View Details</span>
                  </td>
                  <td>
                    <span className={`badge badge-${r.status.toLowerCase()}`}>
                      {r.status}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                    {new Date(r.createdAt || r.timestamp || 0).toLocaleString()}
                  </td>
                  <td>
                    <select
                      style={{ padding: '4px 8px', fontSize: 12 }}
                      onChange={(e) => assign(r.id, e.target.value)}
                      defaultValue=""
                    >
                      <option value="" disabled>Select Driver</option>
                      {drivers.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {(r.status !== 'APPROVED' && r.status !== 'RESOLVED' && r.status !== 'REJECTED') && (
                        <button className="btn-approve" onClick={() => setSelectedReport(r)}>Review</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedReport && (
        <div className="modal-overlay" onClick={() => setSelectedReport(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 className="page-title" style={{ margin: 0 }}>Report Details</h2>
              <button className="top-btn" onClick={() => setSelectedReport(null)}>✕ Close</button>
            </div>

            <div style={{ background: 'var(--glass)', padding: 20, borderRadius: 16, marginBottom: 24 }}>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 8 }}>DESCRIPTION</p>
              <p style={{ fontSize: 18, fontWeight: 500 }}>{selectedReport.description}</p>
              <div style={{ display: 'flex', gap: 24, marginTop: 16 }}>
                <div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>STATUS</p>
                  <span className={`badge badge-${selectedReport.status.toLowerCase()}`}>{selectedReport.status}</span>
                </div>
                <div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>LOCATION</p>
                  <p style={{ fontSize: 14 }}>{selectedReport.latitude?.toFixed(4)}, {selectedReport.longitude?.toFixed(4)}</p>
                </div>
              </div>
            </div>

            <div className="img-grid">
              <div className="img-container">
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 12 }}>USER SUBMISSION</p>
                <img src={selectedReport.imageUrl || 'https://via.placeholder.com/400x300?text=No+User+Image'} alt="User upload" />
              </div>
              <div className="img-container">
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 12 }}>DRIVER PROOF (AFTER)</p>
                <img src={selectedReport.completionImageUrl || selectedReport.resolvedImageUrl || 'https://via.placeholder.com/400x300?text=No+Proof+Yet'} alt="Driver proof" />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end', marginTop: 32 }}>
              <button className="btn-reject" onClick={() => handleAction(selectedReport.id, 'reject')}>Reject Report</button>
              <button className="btn-approve" style={{ padding: '10px 32px', fontSize: 14 }} onClick={() => handleAction(selectedReport.id, 'approve')}>Approve & Resolve</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}



