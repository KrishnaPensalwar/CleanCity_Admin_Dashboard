import DriverTable from "@/components/DriverTable";

async function getDrivers() {
  const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const res = await fetch(`${base}/api/proxy/driver/all`, { cache: "no-store" });
  return res.json();
}

export default async function DriversPage() {
  const drivers = await getDrivers();

  return (
    <>
      <h1 className="page-title">Drivers</h1>
      <DriverTable drivers={drivers} />
    </>
  );
}