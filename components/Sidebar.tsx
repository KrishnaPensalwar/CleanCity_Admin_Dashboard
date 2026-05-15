"use client";

import { useRouter, usePathname } from "next/navigation";

const nav = [
  { name: "Dashboard", path: "/home", icon: "📊" },
  { name: "Live Reports", path: "/remote-reports", icon: "📋" },
  { name: "Fleet Management", path: "/remote-drivers", icon: "🚛" },
];

const manage = [
  { name: "User Directory", path: "/users", icon: "👥" },
  { name: "Reward Center", path: "/rewards", icon: "🏆" },
  { name: "System Settings", path: "/settings", icon: "⚙️" },
];

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="sidebar">
      <div className="nav-section">
        <div className="nav-label">Operation</div>
        {nav.map((item) => (
          <div
            key={item.path}
            className={`nav-link ${pathname === item.path ? "active" : ""}`}
            onClick={() => router.push(item.path)}
            style={{ cursor: 'pointer' }}
          >
            <span className="nav-icon" style={{ fontSize: 18 }}>{item.icon}</span>
            <span style={{ fontWeight: pathname === item.path ? 600 : 400 }}>{item.name}</span>
          </div>
        ))}
      </div>
      <div className="nav-section" style={{ marginTop: 'auto' }}>
        <div className="nav-label">Admin</div>
        {manage.map((item) => (
          <div
            key={item.path}
            className={`nav-link ${pathname === item.path ? "active" : ""}`}
            onClick={() => router.push(item.path)}
            style={{ cursor: 'pointer' }}
          >
            <span className="nav-icon" style={{ fontSize: 18 }}>{item.icon}</span>
            <span>{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}