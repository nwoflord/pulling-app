'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TracksideScreen() {
  const router = useRouter();
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [hooks, setHooks] = useState<any[]>([]);
  const [activeHookId, setActiveHookId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/classes').then(res => res.json()).then(setClasses);
  }, []);

  useEffect(() => {
    if (!selectedClassId) return;
    fetchHooks();
    const interval = setInterval(fetchHooks, 5000); 
    return () => clearInterval(interval);
  }, [selectedClassId]);

  const fetchHooks = async () => {
    try {
      const res = await fetch(`/api/hooks?class_id=${selectedClassId}`);
      if (res.ok) setHooks(await res.json());
    } catch(e) { console.error(e); }
  };

  const processedHooks = [...hooks]
    .sort((a, b) => a.round - b.round)
    .map((h, index) => ({ ...h, matchNum: index + 1 }));

  const readyMatches = processedHooks.filter(h => 
    !h.winner_entry_id && h.entry1_id && h.entry2_id
  );

  const activeHook = activeHookId 
    ? processedHooks.find(h => h.hook_id === activeHookId) 
    : readyMatches[0];

  const handleWinner = async (winnerId: string, truckNum: string) => {
    if (!activeHook) return;
    if (!confirm(`CONFIRM WINNER:\n\nTRUCK #${truckNum}\n\nIs this correct?`)) return;

    try {
      const res = await fetch('/api/hooks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            hook_id: activeHook.hook_id, 
            winner_entry_id: winnerId,
            next_hook_id: activeHook.next_hook_id, 
            position: activeHook.bracket_position
        })
      });

      if (!res.ok) throw new Error(await res.text());
      setActiveHookId(null); 
      fetchHooks(); 
    } catch (error: any) {
      alert("Error: " + error.message);
    }
  };

  // --- LOGOUT LOGIC ---
  const handleLogout = () => {
    document.cookie = "auth=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    router.push('/');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col">
      
      {/* HEADER */}
      <div className="bg-slate-900 p-4 border-b border-slate-700 flex justify-between items-center h-20 flex-shrink-0">
        <div className="flex items-center gap-4">
            <h1 className="text-xl md:text-2xl font-black italic uppercase tracking-tighter text-red-500">
                OFFICIAL<span className="text-white">CONTROLLER</span>
            </h1>
            <button 
                onClick={handleLogout}
                className="text-xs font-bold text-slate-500 hover:text-white border border-slate-700 hover:border-white px-2 py-1 rounded transition-colors uppercase"
            >
                Exit
            </button>
        </div>

        <select 
            className="h-12 px-4 rounded font-bold text-black bg-white text-lg outline-none border-4 border-slate-600 focus:border-red-500"
            value={selectedClassId}
            onChange={(e) => {
                setSelectedClassId(e.target.value);
                setActiveHookId(null);
            }}
        >
            <option value="">-- SELECT CLASS --</option>
            {classes.map(c => <option key={c.class_id} value={c.class_id}>{c.name}</option>)}
        </select>
      </div>

      {!selectedClassId ? (
        <div className="flex-grow flex items-center justify-center text-slate-500 text-3xl font-bold uppercase">
            Select Class to Begin
        </div>
      ) : (
        <div className="flex-grow flex overflow-hidden">
            
            {/* SIDEBAR */}
            <div className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col hidden md:flex">
                <div className="p-4 bg-slate-800 font-bold uppercase tracking-widest text-slate-400 text-sm">
                    Upcoming Queue ({readyMatches.length})
                </div>
                <div className="overflow-y-auto flex-grow p-2 space-y-2">
                    {readyMatches.map((h) => (
                        <div 
                            key={h.hook_id}
                            onClick={() => setActiveHookId(h.hook_id)}
                            className={`p-4 rounded border-2 cursor-pointer transition-all ${
                                activeHook?.hook_id === h.hook_id 
                                ? 'bg-red-900/50 border-red-500 shadow-lg' 
                                : 'bg-slate-800 border-slate-700 hover:bg-slate-700'
                            }`}
                        >
                            <div className="flex justify-between text-xs font-bold text-slate-400 mb-2">
                                <span className="text-white bg-slate-700 px-2 py-0.5 rounded shadow">
                                   HOOK {h.matchNum}
                                </span>
                                <span>RD {h.round}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xl font-black font-mono">#{h.truck1_number}</span>
                                <span className="text-xs font-bold text-slate-500">VS</span>
                                <span className="text-xl font-black font-mono">#{h.truck2_number}</span>
                            </div>
                        </div>
                    ))}
                    {readyMatches.length === 0 && <div className="p-8 text-center text-slate-600 font-bold italic">No matches ready.</div>}
                </div>
            </div>

            {/* MAIN AREA */}
            <div className="flex-grow flex flex-col bg-black relative">
                {activeHook ? (
                    <div className="h-full flex flex-col md:flex-row">
                        {/* LEFT TRUCK */}
                        <button 
                            onClick={() => handleWinner(activeHook.entry1_id, activeHook.truck1_number)}
                            className="flex-1 bg-blue-900 hover:bg-blue-800 active:bg-blue-700 flex flex-col items-center justify-center border-b-8 md:border-b-0 md:border-r-8 border-black transition-colors group"
                        >
                            <div className="text-2xl md:text-3xl font-bold text-blue-300 mb-4 uppercase tracking-widest">Left Lane</div>
                            <div className="text-[120px] md:text-[180px] font-black leading-none group-active:scale-95 transition-transform">{activeHook.truck1_number}</div>
                            <div className="text-2xl md:text-4xl font-bold text-white mt-4 uppercase">{activeHook.driver1_name}</div>
                            <div className="mt-12 bg-blue-600 text-white px-8 py-4 rounded-full text-2xl font-black shadow-lg uppercase">Tap to Win</div>
                        </button>

                        {/* RIGHT TRUCK */}
                        <button 
                            onClick={() => handleWinner(activeHook.entry2_id, activeHook.truck2_number)}
                            className="flex-1 bg-green-900 hover:bg-green-800 active:bg-green-700 flex flex-col items-center justify-center border-t-8 md:border-t-0 md:border-l-8 border-black transition-colors group"
                        >
                            <div className="text-2xl md:text-3xl font-bold text-green-300 mb-4 uppercase tracking-widest">Right Lane</div>
                            <div className="text-[120px] md:text-[180px] font-black leading-none group-active:scale-95 transition-transform">{activeHook.truck2_number}</div>
                            <div className="text-2xl md:text-4xl font-bold text-white mt-4 uppercase">{activeHook.driver2_name}</div>
                            <div className="mt-12 bg-green-600 text-white px-8 py-4 rounded-full text-2xl font-black shadow-lg uppercase">Tap to Win</div>
                        </button>

                        {/* CENTER BADGE */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black rounded-3xl px-8 py-6 border-4 border-slate-700 shadow-2xl z-10 pointer-events-none min-w-[240px]">
                            <div className="text-center">
                                <div className="text-slate-400 font-bold text-xs uppercase mb-1 tracking-widest">Current Match</div>
                                <div className="text-white font-black text-5xl leading-tight">HOOK {activeHook.matchNum}</div>
                                <div className="text-slate-500 font-bold text-xl mt-2">ROUND {activeHook.round}</div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex items-center justify-center flex-col gap-6">
                        <div className="text-slate-700 text-9xl">✓</div>
                        <div className="text-slate-500 font-bold text-2xl uppercase tracking-widest">All Matches Complete</div>
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
}