"use client";
import { useEffect, useState } from "react";
import StatCard from "@/components/StatCard";

export default function HomePage() {
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, drivers: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      const token = localStorage.getItem('cc_token') || '';
      const headers = { Authorization: token ? `Bearer ${token}` : '' };
      
      try {
        const [repRes, driRes] = await Promise.all([
          fetch('/api/proxy/reports', { headers }),
          fetch('/api/proxy/driver/all', { headers })
        ]);
        
        const reports = await repRes.json();
        const drivers = await driRes.json();
        
        const repList = Array.isArray(reports) ? reports : (reports && typeof reports === 'object' && Array.isArray(reports.reports) ? reports.reports : []);
        const driList = Array.isArray(drivers) ? drivers : [];


        setStats({
          total: repList.length,
          pending: repList.filter((r: any) => r.status === 'PENDING').length,
          approved: repList.filter((r: any) => r.status === 'APPROVED').length,
          drivers: driList.length
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) return <div style={{ padding: 40, color: 'var(--text-muted)' }}>Calculating statistics...</div>;

  return (
    <div className="animate-in">
      <h1 className="page-title">Operational Overview</h1>
      
      <div className="stat-grid">
        <StatCard label="Total Incidents" value={stats.total} />
        <StatCard label="Pending Review" value={stats.pending} />
        <StatCard label="Approved Tasks" value={stats.approved} />
        <StatCard label="Active Fleet" value={stats.drivers} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 32 }}>
        <div className="stat-box" style={{ minHeight: 200 }}>
          <h3 style={{ marginBottom: 16, fontFamily: 'var(--font-outfit)' }}>System Health</h3>
          <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            All systems operational. Backend connected to <code style={{ background: 'var(--glass)', padding: '2px 6px', borderRadius: 4 }}>localhost:8080</code>
          </div>
        </div>
        <div className="stat-box" style={{ minHeight: 200 }}>
          <h3 style={{ marginBottom: 16, fontFamily: 'var(--font-outfit)' }}>Recent Activity</h3>
          <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Last data sync: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
}

