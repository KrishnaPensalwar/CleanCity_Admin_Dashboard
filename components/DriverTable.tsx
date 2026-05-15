"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DriverTable({ drivers }: any) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const addDriver = async () => {
    if (!name || !email) return;

    await fetch("/api/drivers/all", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone }),
    });

    setName("");
    setEmail("");
    setPhone("");
    router.refresh();
  };

  return (
    <>
      {/* ADD DRIVER */}
      <div style={{ marginBottom: "10px" }}>
        <input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          placeholder="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <button onClick={addDriver}>Add Driver</button>
      </div>

      {/* TABLE */}
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {drivers.map((d: any) => (
            <tr key={d.id}>
              <td>{d.id}</td>
              <td>{d.name}</td>
              <td>{d.email || ""}</td>
              <td>{d.phone || ""}</td>
              <td>{d.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}