"use client";
import { useRouter } from "next/navigation";

export default function Topbar() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('cc_token');
    router.replace('/login');
  };

  return (
    <div className="topbar">
      <div className="topbar-left">
        <div>
          <div className="app-name">Clean City</div>
          <div className="app-sub">Command Center · Administrator</div>
        </div>
      </div>
      <div className="topbar-right">
        <button className="top-btn" onClick={() => router.push('/remote-reports')}>Real-time Monitor</button>
        <div style={{ width: 1, height: 24, background: 'var(--border)', margin: '0 8px' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="admin-av">AD</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)' }}>System Admin</span>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', cursor: 'pointer' }} onClick={handleLogout}>Logout</span>
          </div>
        </div>
      </div>
    </div>
  );
}