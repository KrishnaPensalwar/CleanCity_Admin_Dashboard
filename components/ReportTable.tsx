"use client";

import { useRouter } from "next/navigation";

export default function ReportTable({ reports }: any) {
  const router = useRouter();

  const updateStatus = async (id: number, action: string) => {
    await fetch("/api/reports", {
      method: "PATCH",
      body: JSON.stringify({ id, action }),
    });

    router.refresh();
  };

  return (
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Location</th>
          <th>Driver</th>
          <th>Description</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>

      <tbody>
        {reports.map((r: any) => (
          <tr key={r.id}>
            <td>{r.id}</td>
            <td>{r.location}</td>
            <td>{r.driver?.name || "-"}</td>
            <td>{r.description || ""}</td>
            <td>{r.status}</td>
            <td>
              <button onClick={() => updateStatus(r.id, "resolved")}>
                Resolve
              </button>
              <button onClick={() => updateStatus(r.id, "declined")}>
                Decline
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}