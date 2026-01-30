'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        // Success! Force a hard refresh to ensure middleware picks up the cookie
        window.location.href = '/admin/dashboard';
      } else {
        setError(true);
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setError(true);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
        <div className="text-6xl mb-4">🚜</div>
        <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tighter mb-2">Event<span className="text-blue-600">Command</span></h1>
        <p className="text-slate-400 font-bold text-sm mb-8">OFFICIAL USE ONLY</p>
        
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-slate-100 border-2 border-slate-200 p-4 rounded-xl text-center text-xl font-bold text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition-all"
            placeholder="Enter Access Code"
            autoFocus
          />
          
          {error && (
            <div className="text-red-500 font-bold text-sm animate-pulse">
              ⛔ Access Denied. Try again.
            </div>
          )}

          <button 
            disabled={loading}
            className={`w-full py-4 rounded-xl font-black uppercase tracking-widest text-white shadow-lg transition-all ${loading ? 'bg-slate-400 cursor-wait' : 'bg-blue-600 hover:bg-blue-700 hover:scale-[1.02]'}`}
          >
            {loading ? 'Verifying...' : 'Unlock System'}
          </button>
        </form>
      </div>
    </div>
  );
}