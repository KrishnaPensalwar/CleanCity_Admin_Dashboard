"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('cc_token') : null;
    if (!token) router.replace('/login');
    else router.replace('/home');
  }, [router]);

  return <div style={{padding:24}}>Redirecting…</div>;
}