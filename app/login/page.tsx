"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const login = async () => {
    setError(null);
    if (!username || !password) {
      setError('Email and password are required');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/proxy/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: username, password }),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error('Invalid credentials or server error');
      }

      const data = await res.json();
      const token = data?.accessToken || data?.token;
      
      if (!token) {
        setError('Authentication failed: No token received');
        setLoading(false);
        return;
      }

      localStorage.setItem('cc_token', token);
      router.replace('/home');
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'radial-gradient(circle at center, #1e293b 0%, #0f172a 100%)'
    }}>
      <div style={{ 
        width: '100%', 
        maxWidth: 400, 
        padding: 40, 
        background: 'rgba(30, 41, 59, 0.5)',
        backdropFilter: 'blur(16px)',
        borderRadius: 24,
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ 
            fontFamily: 'var(--font-outfit)', 
            fontSize: 32, 
            fontWeight: 700,
            background: 'linear-gradient(135deg, #60a5fa, #2563eb)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: 8
          }}>Clean City</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Administrative Portal Access</p>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email Address</label>
          <input 
            type="email"
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            placeholder="admin@cleancity.com"
            style={{ width: '100%', padding: '12px 16px', fontSize: 15 }} 
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Password</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            placeholder="••••••••"
            style={{ width: '100%', padding: '12px 16px', fontSize: 15 }} 
          />
        </div>

        {error && (
          <div style={{ 
            background: 'rgba(239, 68, 68, 0.1)', 
            color: 'var(--error)', 
            padding: '12px 16px', 
            borderRadius: 8, 
            fontSize: 13, 
            marginBottom: 20,
            border: '1px solid rgba(239, 68, 68, 0.2)'
          }}>
            {error}
          </div>
        )}

        <button 
          onClick={login} 
          disabled={loading} 
          style={{ 
            width: '100%', 
            padding: '14px', 
            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
            color: '#fff',
            border: 'none',
            borderRadius: 12,
            fontSize: 16,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)'
          }}
        >
          {loading ? 'Authenticating...' : 'Sign In'}
        </button>
      </div>
    </div>
  );
}

