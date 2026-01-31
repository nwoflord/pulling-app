'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // If they were redirected here, go back there. Otherwise go to Admin.
  const nextUrl = searchParams.get('next') || '/admin'; 
  
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

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
        // --- FALLBACK: Set cookie MANUALLY in browser ---
        // This ensures it works even if the server header gets blocked
        document.cookie = `auth=${data.role}; path=/; max-age=604800; SameSite=Lax`;

        // --- FORCE REDIRECT ---
        // Determine destination based on role
        let destination = '/';
        if (data.role === 'admin') destination = '/admin';
        else if (data.role === 'official') destination = '/trackside';
        else if (data.role === 'lineup') destination = '/lineup';
        else if (data.role === 'announcer') destination = '/announcer';
        else if (data.role === 'registration') destination = '/registration';
        
        // Use the hard redirect
        window.location.assign(destination);
      } else {
        alert("Incorrect Access Code");
        setLoading(false); // Stop the spinner so they can try again
      }
    } catch (error) {
      console.error(error);
      alert("System Error: Please refresh and try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md text-center">
        <div className="text-5xl mb-4">🔒</div>
        <h1 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 mb-2">Staff Access</h1>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <input 
            type="password" 
            placeholder="Enter Code..." 
            className="w-full text-center text-2xl font-bold p-4 border-2 border-slate-200 rounded-xl outline-none focus:border-blue-500 text-black"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoFocus
            disabled={loading}
          />
          <button 
            disabled={loading}
            className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg transition-transform active:scale-[0.98] ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
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

export default function Login() {
  return (
    <Suspense fallback={<div className="text-white text-center pt-20">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}