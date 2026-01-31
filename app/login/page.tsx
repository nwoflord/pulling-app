'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // ... inside app/login/page.tsx

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
        const res = await fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ attempt: password })
        });

        const data = await res.json();

        if (data.success && data.role) {
            // 1. Set the cookie manually to be safe
            document.cookie = `auth=${data.role}; path=/; max-age=604800; SameSite=Lax`;
            
            // 2. FORCE RELOAD (Fixes the hanging spinner)
            // Use window.location.href instead of router.push
            if (data.role === 'admin') window.location.href = '/admin';
            else if (data.role === 'official') window.location.href = '/trackside';
            else if (data.role === 'lineup') window.location.href = '/lineup';
            else if (data.role === 'announcer') window.location.href = '/announcer';
            else if (data.role === 'registration') window.location.href = '/registration';
            else window.location.href = '/'; 
            
        } else {
            alert("Invalid Access Code");
            setLoading(false);
        }
    } catch (error) {
        console.error(error);
        alert("Login Error");
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md text-center">
        <div className="text-5xl mb-4">🔒</div>
        <h1 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 mb-2">Staff Access</h1>
        <p className="text-slate-500 mb-8">Enter your role access code to continue.</p>
        
        <form onSubmit={handleLogin} className="space-y-4">
            <input 
                type="password" 
                placeholder="Enter Code..." 
                className="w-full text-center text-2xl font-bold p-4 border-2 border-slate-200 rounded-xl outline-none focus:border-blue-500 transition-colors"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoFocus
                disabled={loading}
            />
            <button 
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg transition-transform active:scale-[0.98] disabled:opacity-50"
            >
                {loading ? 'Verifying...' : 'Unlock Dashboard'}
            </button>
        </form>
        
        <button onClick={() => router.push('/')} className="mt-6 text-slate-400 text-sm font-bold hover:text-slate-600">
            ← Back to Public Menu
        </button>
      </div>
    </div>
  );
}