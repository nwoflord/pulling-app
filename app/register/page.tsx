'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function PublicRegistration() {
  const [classes, setClasses] = useState<any[]>([]);
  const [form, setForm] = useState({
    class_ids: [] as string[],
    driver_name: '',
    truck_name: '',
    hometown: '',
    info: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/classes').then(res => res.json()).then(setClasses);
  }, []);

  const toggleClass = (c: any) => {
    // 1. BLOCK IF LOCKED
    if (c.is_locked) {
        alert("Sorry, registration for this class is closed because the bracket has started.");
        return;
    }

    const id = c.class_id;
    setForm(prev => {
        const exists = prev.class_ids.includes(id);
        if (exists) return { ...prev, class_ids: prev.class_ids.filter(cid => cid !== id) };
        return { ...prev, class_ids: [...prev.class_ids, id] };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.class_ids.length === 0) return alert("Please select at least one class.");
    
    setLoading(true);

    // Loop through selected classes to handle potential multiple failures gracefully
    // (Or send as batch if API supports it, but loop is safer for now)
    let successCount = 0;
    
    for (const classId of form.class_ids) {
        const res = await fetch('/api/entries', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                class_id: classId,
                truck_number: 'TBD', // Automatic Placeholder for public reg
                driver_name: form.driver_name,
                truck_name: form.truck_name,
                hometown: form.hometown,
                info: form.info,
                checked_in: false
            })
        });
        if (res.ok) successCount++;
    }

    if (successCount > 0) {
        setSubmitted(true);
    } else {
        alert("Error submitting registration. The class might be closed.");
    }
    setLoading(false);
  };

  if (submitted) {
    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl p-8 max-w-md w-full text-center shadow-2xl">
                <div className="text-6xl mb-4">✅</div>
                <h1 className="text-3xl font-black text-slate-800 mb-2">You're on the list!</h1>
                <p className="text-slate-600 mb-6">
                    Registered for <strong>{form.class_ids.length} Classes</strong>.<br/>
                    Please proceed to the gate to get your Truck Number and activate.
                </p>
                <button 
                    onClick={() => { setSubmitted(false); setForm({...form, class_ids: []}); }}
                    className="text-blue-600 font-bold hover:underline"
                >
                    Register another truck
                </button>
                <div className="mt-4">
                    <Link href="/" className="text-slate-400 text-sm hover:text-slate-600">Back to Home</Link>
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 py-10 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="bg-blue-900 p-6 text-center">
            <h1 className="text-2xl font-black italic uppercase tracking-tighter text-white">
                DRIVER<span className="text-yellow-400">REGISTRATION</span>
            </h1>
            <p className="text-blue-200 text-sm mt-1">Pre-register now, get your number at the gate.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
            
            {/* MULTI-SELECT CLASS GRID */}
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-3">Select Classes to Enter</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {classes.map(c => {
                        const isSelected = form.class_ids.includes(c.class_id);
                        
                        // LOCKED STYLING LOGIC
                        if (c.is_locked) {
                            return (
                                <div key={c.class_id} className="p-4 rounded-lg border-2 border-slate-100 bg-slate-50 opacity-60 cursor-not-allowed flex items-center justify-between">
                                    <span className="font-bold text-slate-400">{c.name}</span>
                                    <span className="text-xs font-black bg-slate-200 text-slate-500 px-2 py-1 rounded">🔒 CLOSED</span>
                                </div>
                            );
                        }

                        // OPEN STYLING LOGIC
                        return (
                            <div 
                                key={c.class_id}
                                onClick={() => toggleClass(c)}
                                className={`
                                    cursor-pointer p-4 rounded-lg border-2 transition-all flex items-center justify-between select-none
                                    ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-300'}
                                `}
                            >
                                <span className={`font-bold ${isSelected ? 'text-blue-900' : 'text-slate-700'}`}>{c.name}</span>
                                {isSelected && <span className="text-blue-600 font-black text-xl">✓</span>}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* DRIVER INFO (No Truck Number) */}
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Driver Name</label>
                <input required className="w-full p-3 border-2 border-slate-200 rounded-lg outline-none focus:border-blue-500" placeholder="John Doe" value={form.driver_name} onChange={e => setForm({...form, driver_name: e.target.value})} />
            </div>

            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Truck Name (Optional)</label>
                <input className="w-full p-3 border-2 border-slate-200 rounded-lg outline-none focus:border-blue-500" placeholder="e.g. Iron Man" value={form.truck_name} onChange={e => setForm({...form, truck_name: e.target.value})} />
            </div>

            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Hometown</label>
                <input required className="w-full p-3 border-2 border-slate-200 rounded-lg outline-none focus:border-blue-500" placeholder="City, State" value={form.hometown} onChange={e => setForm({...form, hometown: e.target.value})} />
            </div>

            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Announcer Info / Sponsors</label>
                <textarea className="w-full p-3 border-2 border-slate-200 rounded-lg outline-none focus:border-blue-500 h-24" placeholder="List your sponsors..." value={form.info} onChange={e => setForm({...form, info: e.target.value})} />
            </div>

            <button disabled={loading} className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-black uppercase text-xl py-4 rounded-lg shadow-lg transition-transform active:scale-[0.98] disabled:opacity-50">
                {loading ? 'Submitting...' : 'Submit Pre-Registration'}
            </button>
        </form>
      </div>
    </div>
  );
}