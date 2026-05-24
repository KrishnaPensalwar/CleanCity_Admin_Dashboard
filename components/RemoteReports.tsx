"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ApiErrorBody,
  canAssignReport,
  canReviewReport,
  formatApiError,
  getReportDriverId,
  hasCompletionProof,
  isAuthError,
  nextWorkflowStep,
  normalizeStatus,
  statusBadgeClass,
  statusLabel,
} from "@/lib/api-errors";

type Driver = { id: string; name: string; isActive?: boolean };
type Report = {
  id: string;
  description?: string;
  status: string;
  createdAt?: string;
  timestamp?: number;
  latitude?: number;
  longitude?: number;
  imageUrl?: string;
  completionImageUrl?: string;
  resolvedImageUrl?: string;
  assignedDriverId?: string;
  assignedDriverName?: string;
  assignedDriver?: { id?: string; name?: string };
  driverId?: string;
  completedByDriverId?: string;
};

type Toast = {
  type: "success" | "error";
  title: string;
  message: string;
  code?: string;
} | null;

const STATUSES = ["ALL", "PENDING", "ASSIGNED", "AWAITING_REVIEW", "APPROVED", "REJECTED"];

const WORKFLOW_STEPS = [
  { status: "PENDING", label: "Pending" },
  { status: "ASSIGNED", label: "Assigned" },
  { status: "AWAITING_REVIEW", label: "Awaiting Review" },
  { status: "APPROVED", label: "Approved / Rejected" },
];

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("cc_token") || "";
  return { Authorization: token ? `Bearer ${token}` : "" };
}

function mergeReport(existing: Report, updated: Partial<Report>): Report {
  return {
    ...existing,
    ...updated,
    status: updated.status ? normalizeStatus(updated.status) : normalizeStatus(existing.status),
    assignedDriverId:
      updated.assignedDriverId ??
      updated.assignedDriver?.id ??
      existing.assignedDriverId ??
      existing.assignedDriver?.id,
    assignedDriverName:
      updated.assignedDriverName ??
      updated.assignedDriver?.name ??
      existing.assignedDriverName ??
      existing.assignedDriver?.name,
  };
}

export default function RemoteReports() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<"approve" | "reject" | null>(null);
  const [toast, setToast] = useState<Toast>(null);

  const showToast = useCallback((next: Toast) => {
    setToast(next);
    if (next) {
      window.setTimeout(() => setToast(null), 5000);
    }
  }, []);

  const handleAuthFailure = useCallback(
    (status: number, data?: ApiErrorBody) => {
      if (isAuthError(status, data)) {
        localStorage.removeItem("cc_token");
        router.replace("/login");
        return true;
      }
      return false;
    },
    [router]
  );

  const showApiError = useCallback(
    (title: string, status: number, data: ApiErrorBody, fallback: string) => {
      if (handleAuthFailure(status, data)) return;
      showToast({
        type: "error",
        title,
        message: formatApiError(data, fallback),
        code: data.errorCode,
      });
    },
    [handleAuthFailure, showToast]
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const headers = authHeaders();
      const [repRes, driRes] = await Promise.all([
        fetch("/api/proxy/reports", { headers }),
        fetch("/api/proxy/driver/active", { headers }),
      ]);

      const repData = await repRes.json().catch(() => ({}));
      const driData = await driRes.json().catch(() => []);

      if (!repRes.ok) {
        showApiError("Could not load reports", repRes.status, repData, "Failed to fetch reports");
      }

      if (!driRes.ok && !handleAuthFailure(driRes.status, driData)) {
        showApiError("Could not load drivers", driRes.status, driData, "Failed to fetch active drivers");
      }

      let list: Report[] = [];
      if (Array.isArray(repData)) {
        list = repData;
      } else if (repData && typeof repData === "object" && Array.isArray(repData.reports)) {
        list = repData.reports;
      }

      setReports(
        list.map((r) => ({
          ...r,
          status: normalizeStatus(r.status),
        }))
      );
      setDrivers(Array.isArray(driData) ? driData : []);
    } catch (err) {
      console.error(err);
      showToast({
        type: "error",
        title: "Network error",
        message: "Unable to reach the server. Check your connection and try again.",
      });
    } finally {
      setLoading(false);
    }
  }, [handleAuthFailure, showApiError, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const updateReportInList = (id: string, patch: Partial<Report>) => {
    setReports((prev) => prev.map((r) => (r.id === id ? mergeReport(r, patch) : r)));
    setSelectedReport((prev) => (prev?.id === id ? mergeReport(prev, patch) : prev));
  };

  const handleAction = async (id: string, action: "approve" | "reject") => {
    setActionLoading(action);
    try {
      const res = await fetch(`/api/proxy/reports/${id}/${action}`, {
        method: "POST",
        headers: authHeaders(),
      });

      const data = (await res.json().catch(() => ({}))) as ApiErrorBody & Partial<Report>;

      if (res.ok) {
        const newStatus = normalizeStatus(
          data.status || (action === "approve" ? "APPROVED" : "REJECTED")
        );
        updateReportInList(id, { ...data, status: newStatus });
        showToast({
          type: "success",
          title: action === "approve" ? "Report approved" : "Report rejected",
          message:
            action === "approve"
              ? "The incident is approved. The citizen receives +10 reward points."
              : "The report has been rejected. No reward points were awarded.",
        });
        setSelectedReport(null);
      } else {
        showApiError(
          action === "approve" ? "Approval failed" : "Rejection failed",
          res.status,
          data,
          action === "approve"
            ? "This report must be awaiting review with a completion photo before approval."
            : "This report can only be rejected while awaiting review."
        );
      }
    } catch {
      showToast({
        type: "error",
        title: "Request failed",
        message: `Could not ${action} the report. Please try again.`,
      });
    } finally {
      setActionLoading(null);
    }
  };

  const assign = async (reportId: string, driverId: string) => {
    if (!driverId) {
      showToast({
        type: "error",
        title: "No driver selected",
        message: formatApiError({ errorCode: "DRIVER_003" }, "Please select a driver."),
        code: "DRIVER_003",
      });
      return;
    }

    const driver = drivers.find((d) => d.id === driverId);
    setAssigningId(reportId);

    try {
      const res = await fetch(`/api/proxy/driver/reports/${reportId}/assign`, {
        method: "POST",
        headers: {
          ...authHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ driverId }),
      });

      const data = (await res.json().catch(() => ({}))) as ApiErrorBody & Partial<Report>;

      if (res.ok) {
        updateReportInList(reportId, {
          ...data,
          status: normalizeStatus(data.status || "ASSIGNED"),
          assignedDriverId: data.assignedDriverId || driverId,
          assignedDriverName: data.assignedDriverName || driver?.name,
        });
        showToast({
          type: "success",
          title: "Driver assigned",
          message: driver
            ? `${driver.name} is now assigned. Status moved to Assigned — waiting for driver proof.`
            : "Report assigned. Status is now Assigned.",
        });
      } else {
        showApiError(
          "Assignment failed",
          res.status,
          data,
          "Only pending reports can be assigned to an active driver."
        );
      }
    } catch {
      showToast({
        type: "error",
        title: "Assignment failed",
        message: "Could not assign the driver. Please try again.",
      });
    } finally {
      setAssigningId(null);
    }
  };

  const filteredReports = reports.filter(
    (r) => filterStatus === "ALL" || normalizeStatus(r.status) === filterStatus
  );

  const driverNameFor = (report: Report) => {
    const id = getReportDriverId(report);
    if (report.assignedDriverName) return report.assignedDriverName;
    if (report.assignedDriver?.name) return report.assignedDriver.name;
    return drivers.find((d) => d.id === id)?.name || "";
  };

  const selectedHasProof = selectedReport ? hasCompletionProof(selectedReport) : false;

  return (
    <div className="animate-in">
      {toast && (
        <div className={`toast toast-${toast.type}`} role="status">
          <div className="toast-icon">{toast.type === "success" ? "✓" : "!"}</div>
          <div className="toast-body">
            <p className="toast-title">{toast.title}</p>
            <p className="toast-message">{toast.message}</p>
            {toast.code && <p className="toast-code">{toast.code}</p>}
          </div>
          <button className="toast-close" onClick={() => setToast(null)} aria-label="Dismiss">
            ✕
          </button>
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <h2 className="page-title" style={{ margin: 0 }}>
          Incident Reports
        </h2>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ padding: "8px 12px", fontSize: 13 }}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s === "ALL" ? "All statuses" : statusLabel(s)}
              </option>
            ))}
          </select>
          <button className="top-btn" onClick={loadData} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh Data"}
          </button>
        </div>
      </div>

      <div className="workflow-strip">
        {WORKFLOW_STEPS.map((step, i) => (
          <span key={step.status} className="workflow-step">
            {i > 0 && <span className="workflow-arrow">→</span>}
            <span className="workflow-label">{step.label}</span>
          </span>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
          Loading reports...
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Description</th>
                <th>Status</th>
                <th>Next Step</th>
                <th>Assigned Driver</th>
                <th>Created At</th>
                <th>Assign Driver</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
                    No reports matching &ldquo;{filterStatus === "ALL" ? "any status" : statusLabel(filterStatus)}&rdquo;
                  </td>
                </tr>
              ) : (
                filteredReports.map((r) => {
                  const driverId = getReportDriverId(r);
                  const assignedName = driverNameFor(r);
                  const status = normalizeStatus(r.status);
                  const isAssigning = assigningId === r.id;
                  const step = nextWorkflowStep(status);

                  return (
                    <tr key={r.id}>
                      <td style={{ color: "var(--primary)", fontWeight: 600, fontSize: 12 }}>
                        {r.id.slice(0, 8)}...
                      </td>
                      <td style={{ cursor: "pointer" }} onClick={() => setSelectedReport(r)}>
                        <div style={{ fontWeight: 500 }}>{r.description}</div>
                        <span
                          style={{
                            fontSize: 11,
                            color: "var(--primary)",
                            textDecoration: "underline",
                          }}
                        >
                          View Details
                        </span>
                      </td>
                      <td>
                        <span className={statusBadgeClass(status)}>{statusLabel(status)}</span>
                      </td>
                      <td style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        {step || "Closed"}
                      </td>
                      <td style={{ fontSize: 13, color: assignedName ? "var(--text-main)" : "var(--text-muted)" }}>
                        {assignedName || "—"}
                      </td>
                      <td style={{ color: "var(--text-muted)", fontSize: 12 }}>
                        {new Date(r.createdAt || r.timestamp || 0).toLocaleString()}
                      </td>
                      <td>
                        <select
                          style={{ padding: "4px 8px", fontSize: 12, minWidth: 140 }}
                          value={driverId}
                          disabled={!canAssignReport(status) || isAssigning}
                          onChange={(e) => assign(r.id, e.target.value)}
                        >
                          <option value="" disabled>
                            {isAssigning
                              ? "Assigning…"
                              : canAssignReport(status)
                                ? drivers.length
                                  ? "Select Driver"
                                  : "No active drivers"
                                : assignedName || "Assigned"}
                          </option>
                          {drivers.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 8 }}>
                          {canReviewReport(status) && (
                            <button className="btn-approve" onClick={() => setSelectedReport(r)}>
                              Review
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {selectedReport && (
        <div className="modal-overlay" onClick={() => setSelectedReport(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 24,
              }}
            >
              <h2 className="page-title" style={{ margin: 0 }}>
                Report Details
              </h2>
              <button className="top-btn" onClick={() => setSelectedReport(null)}>
                ✕ Close
              </button>
            </div>

            <div style={{ background: "var(--glass)", padding: 20, borderRadius: 16, marginBottom: 24 }}>
              <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 8 }}>DESCRIPTION</p>
              <p style={{ fontSize: 18, fontWeight: 500 }}>{selectedReport.description}</p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                  gap: 24,
                  marginTop: 16,
                }}
              >
                <div>
                  <p style={{ fontSize: 12, color: "var(--text-muted)" }}>STATUS</p>
                  <span className={statusBadgeClass(selectedReport.status)}>
                    {statusLabel(selectedReport.status)}
                  </span>
                </div>
                <div>
                  <p style={{ fontSize: 12, color: "var(--text-muted)" }}>NEXT STEP</p>
                  <p style={{ fontSize: 14 }}>
                    {nextWorkflowStep(selectedReport.status) || "No further action"}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: 12, color: "var(--text-muted)" }}>ASSIGNED DRIVER</p>
                  <p style={{ fontSize: 14 }}>
                    {driverNameFor(selectedReport) || "Not assigned yet"}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: 12, color: "var(--text-muted)" }}>LOCATION</p>
                  <p style={{ fontSize: 14 }}>
                    {selectedReport.latitude?.toFixed(4)}, {selectedReport.longitude?.toFixed(4)}
                  </p>
                </div>
              </div>
            </div>

            <div className="img-grid">
              <div className="img-container">
                <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 12 }}>
                  USER SUBMISSION
                </p>
                <img
                  src={selectedReport.imageUrl || "https://via.placeholder.com/400x300?text=No+User+Image"}
                  alt="User upload"
                />
              </div>
              <div className="img-container">
                <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 12 }}>
                  DRIVER PROOF (AFTER)
                </p>
                <img
                  src={
                    selectedReport.completionImageUrl ||
                    selectedReport.resolvedImageUrl ||
                    "https://via.placeholder.com/400x300?text=No+Proof+Yet"
                  }
                  alt="Driver proof"
                />
                {canReviewReport(selectedReport.status) && !selectedHasProof && (
                  <p className="img-warning">Completion photo required before approval (REPORT_005)</p>
                )}
              </div>
            </div>

            {canReviewReport(selectedReport.status) ? (
              <div style={{ display: "flex", gap: 16, justifyContent: "flex-end", marginTop: 32 }}>
                <button
                  className="btn-reject"
                  disabled={actionLoading !== null}
                  onClick={() => handleAction(selectedReport.id, "reject")}
                >
                  {actionLoading === "reject" ? "Rejecting…" : "Reject Report"}
                </button>
                <button
                  className="btn-approve"
                  style={{ padding: "10px 32px", fontSize: 14 }}
                  disabled={actionLoading !== null || !selectedHasProof}
                  title={!selectedHasProof ? "Driver completion photo is required (REPORT_005)" : undefined}
                  onClick={() => handleAction(selectedReport.id, "approve")}
                >
                  {actionLoading === "approve" ? "Approving…" : "Approve & Resolve"}
                </button>
              </div>
            ) : (
              <div className="modal-info-banner">
                {normalizeStatus(selectedReport.status) === "PENDING" && (
                  <p>
                    <strong>Step 1:</strong> Assign an active driver. Only <em>Pending</em> reports accept
                    assignment (REPORT_002 if already in progress).
                  </p>
                )}
                {normalizeStatus(selectedReport.status) === "ASSIGNED" && (
                  <p>
                    <strong>Step 2:</strong> The assigned driver must upload a completion photo. Status will
                    move to <em>Awaiting Review</em> automatically.
                  </p>
                )}
                {(normalizeStatus(selectedReport.status) === "APPROVED" ||
                  normalizeStatus(selectedReport.status) === "REJECTED") && (
                  <p>
                    This report is closed.
                    {normalizeStatus(selectedReport.status) === "APPROVED"
                      ? " The citizen received +10 reward points."
                      : " No reward points were awarded on rejection."}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
