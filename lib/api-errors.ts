export type ApiErrorBody = {
  errorCode?: string;
  message?: string;
  isSuccess?: boolean;
  error?: string;
  raw?: string;
};

/** Maps backend error codes to admin-friendly messages (see backend ErrorCode enum). */
const ERROR_MESSAGES: Record<string, string> = {
  AUTH_001: "Your session has expired. Please sign in again.",
  AUTH_002: "Invalid email or password.",
  AUTH_003: "You don't have permission to perform this action.",
  AUTH_008: "You are not authorized to access this resource.",
  REPORT_001: "Report not found. It may have been removed.",
  REPORT_002: "Only pending reports can be assigned. This report is already in progress.",
  REPORT_003: "Approve and reject are only available when the report is awaiting review.",
  REPORT_004: "This report is already approved and cannot be rejected.",
  REPORT_005: "Cannot approve — the driver has not uploaded a completion photo yet.",
  REPORT_006: "Invalid report ID.",
  DRIVER_001: "The selected driver was not found.",
  DRIVER_002: "The selected driver is inactive. Choose an active driver from the list.",
  DRIVER_003: "Please select a driver before assigning.",
  DRIVER_004: "This report is not in an assigned state.",
  VALID_001: "Validation failed. Please check the submitted data.",
  VALID_002: "This operation cannot be completed in the report's current state.",
  SYS_001: "A server error occurred. Please try again shortly.",
};

export function formatApiError(data: ApiErrorBody | null | undefined, fallback: string): string {
  if (!data) return fallback;
  if (data.errorCode && ERROR_MESSAGES[data.errorCode]) {
    return ERROR_MESSAGES[data.errorCode];
  }
  if (typeof data.message === "string" && data.message) return data.message;
  if (typeof data.error === "string" && data.error) return data.error;
  if (typeof data.raw === "string" && data.raw) return data.raw;
  return fallback;
}

export function isAuthError(status: number, data?: ApiErrorBody | null): boolean {
  return (
    status === 401 ||
    status === 403 ||
    data?.errorCode?.startsWith("AUTH_") === true
  );
}

export async function parseApiError(res: Response, fallback: string): Promise<string> {
  try {
    const data = (await res.clone().json()) as ApiErrorBody;
    return formatApiError(data, fallback);
  } catch {
    // response body is not JSON
  }

  try {
    const text = await res.text();
    if (!text) return fallback;
    try {
      return formatApiError(JSON.parse(text) as ApiErrorBody, fallback);
    } catch {
      if (text.length < 200) return text;
    }
  } catch {
    // ignore
  }

  return fallback;
}

export function normalizeStatus(status: string): string {
  return (status || "PENDING").toUpperCase().replace(/-/g, "_");
}

export function statusLabel(status: string): string {
  const normalized = normalizeStatus(status);
  const labels: Record<string, string> = {
    PENDING: "Pending",
    ASSIGNED: "Assigned",
    AWAITING_REVIEW: "Awaiting Review",
    APPROVED: "Approved",
    REJECTED: "Rejected",
  };
  return labels[normalized] || normalized;
}

export function statusBadgeClass(status: string): string {
  return `badge badge-${normalizeStatus(status).toLowerCase()}`;
}

export function getReportDriverId(report: {
  assignedDriverId?: string;
  assignedDriver?: { id?: string };
  driverId?: string;
  completedByDriverId?: string;
}): string {
  return (
    report.assignedDriverId ||
    report.assignedDriver?.id ||
    report.driverId ||
    report.completedByDriverId ||
    ""
  );
}

/** Admin workflow: PENDING → ASSIGNED → AWAITING_REVIEW → APPROVED | REJECTED */
export function nextWorkflowStep(status: string): string | null {
  const steps: Record<string, string> = {
    PENDING: "Assign a driver",
    ASSIGNED: "Driver uploads completion photo",
    AWAITING_REVIEW: "Approve or reject",
  };
  return steps[normalizeStatus(status)] ?? null;
}

export function canAssignReport(status: string): boolean {
  return normalizeStatus(status) === "PENDING";
}

export function canReviewReport(status: string): boolean {
  return normalizeStatus(status) === "AWAITING_REVIEW";
}

export function hasCompletionProof(report: {
  completionImageUrl?: string;
  resolvedImageUrl?: string;
}): boolean {
  return Boolean(report.completionImageUrl || report.resolvedImageUrl);
}
