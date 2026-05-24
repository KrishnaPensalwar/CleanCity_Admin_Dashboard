"use client";
import { useEffect, useState } from "react";
import StatCard from "@/components/StatCard";
import { normalizeStatus } from "@/lib/api-errors";

export default function HomePage() {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    assigned: 0,
    awaitingReview: 0,
    approved: 0,
    drivers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      const token = localStorage.getItem("cc_token") || "";
      const headers = { Authorization: token ? `Bearer ${token}` : "" };

      try {
        const [repRes, driRes] = await Promise.all([
          fetch("/api/proxy/reports", { headers }),
          fetch("/api/proxy/driver/active", { headers }),
        ]);

        const reports = await repRes.json();
        const drivers = await driRes.json();

        const repList = Array.isArray(reports)
          ? reports
          : reports && typeof reports === "object" && Array.isArray(reports.reports)
            ? reports.reports
            : [];
        const driList = Array.isArray(drivers) ? drivers : [];

        setStats({
          total: repList.length,
          pending: repList.filter((r: { status: string }) => normalizeStatus(r.status) === "PENDING").length,
          assigned: repList.filter((r: { status: string }) => normalizeStatus(r.status) === "ASSIGNED").length,
          awaitingReview: repList.filter((r: { status: string }) => normalizeStatus(r.status) === "AWAITING_REVIEW")
            .length,
          approved: repList.filter((r: { status: string }) => normalizeStatus(r.status) === "APPROVED").length,
          drivers: driList.length,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) return <div style={{ padding: 40, color: "var(--text-muted)" }}>Calculating statistics...</div>;

  return (
    <div className="animate-in">
      <h1 className="page-title">Operational Overview</h1>

      <div className="stat-grid">
        <StatCard label="Total Incidents" value={stats.total} />
        <StatCard label="Pending Assignment" value={stats.pending} />
        <StatCard label="With Drivers" value={stats.assigned} />
        <StatCard label="Awaiting Review" value={stats.awaitingReview} />
        <StatCard label="Approved" value={stats.approved} />
        <StatCard label="Active Drivers" value={stats.drivers} />
      </div>

      <div className="workflow-strip" style={{ marginTop: 8 }}>
        <span className="workflow-step">
          <span className="workflow-label">Pending</span>
        </span>
        <span className="workflow-step">
          <span className="workflow-arrow">→</span>
          <span className="workflow-label">Assign driver</span>
        </span>
        <span className="workflow-step">
          <span className="workflow-arrow">→</span>
          <span className="workflow-label">Assigned</span>
        </span>
        <span className="workflow-step">
          <span className="workflow-arrow">→</span>
          <span className="workflow-label">Driver proof</span>
        </span>
        <span className="workflow-step">
          <span className="workflow-arrow">→</span>
          <span className="workflow-label">Awaiting Review</span>
        </span>
        <span className="workflow-step">
          <span className="workflow-arrow">→</span>
          <span className="workflow-label">Approve (+10 pts) / Reject</span>
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 32 }}>
        <div className="stat-box" style={{ minHeight: 200 }}>
          <h3 style={{ marginBottom: 16, fontFamily: "var(--font-outfit)" }}>System Health</h3>
          <div style={{ color: "var(--text-muted)", fontSize: 14 }}>
            All systems operational. Backend connected to{" "}
            <code style={{ background: "var(--glass)", padding: "2px 6px", borderRadius: 4 }}>
              localhost:8080
            </code>
          </div>
        </div>
        <div className="stat-box" style={{ minHeight: 200 }}>
          <h3 style={{ marginBottom: 16, fontFamily: "var(--font-outfit)" }}>Admin Workflow</h3>
          <div style={{ color: "var(--text-muted)", fontSize: 14, lineHeight: 1.6 }}>
            Assign drivers to <strong>Pending</strong> reports only. Approve or reject only when status is{" "}
            <strong>Awaiting Review</strong> and a completion photo is present.
          </div>
        </div>
      </div>
    </div>
  );
}
