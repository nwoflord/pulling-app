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

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col">
      
      {/* HEADER */}
      <div className="bg-slate-900 p-4 border-b border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4 md:gap-0 md:h-20 flex-shrink-0">
        <div className="flex items-center gap-4 w-full md:w-auto justify-between">
            <h1 className="text-xl md:text-2xl font-black italic uppercase tracking-tighter text-red-500">
                OFFICIAL<span className="text-white">CONTROLLER</span>
            </h1>
            <button 
                onClick={handleLogout}
                className="text-xs font-bold text-slate-500 hover:text-white border border-slate-700 hover:border-white px-2 py-1 rounded transition-colors uppercase"
            >
                Exit & Lock
            </button>
        </div>

        <select 
            className="h-10 md:h-12 px-4 rounded font-bold text-black bg-white text-sm md:text-lg outline-none border-4 border-slate-600 focus:border-red-500 w-full md:w-auto"
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
        <div className="flex-grow flex items-center justify-center text-slate-500 text-xl md:text-3xl font-bold uppercase p-4 text-center">
            Select Class to Begin
        </div>
      ) : (
        <div className="flex-grow flex flex-col md:flex-row overflow-hidden">
            
            {/* SIDEBAR: Horizontal Strip (Mobile) / Vertical Sidebar (Desktop) */}
            <div className="
                w-full md:w-80 
                bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 
                flex flex-row md:flex-col 
                overflow-x-auto md:overflow-y-auto
                flex-shrink-0
                h-auto md:h-full
            ">
                <div className="p-2 md:p-4 bg-slate-800 font-bold uppercase tracking-widest text-slate-400 text-xs md:text-sm sticky left-0 md:top-0">
                    Queue ({readyMatches.length})
                </div>
                
                <div className="flex flex-row md:flex-col gap-2 p-2 flex-grow">
                    {readyMatches.map((h) => (
                        <div 
                            key={h.hook_id}
                            onClick={() => setActiveHookId(h.hook_id)}
                            className={`
                                p-3 md:p-4 rounded border-2 cursor-pointer transition-all min-w-[140px] md:min-w-0 flex-shrink-0
                                ${activeHook?.hook_id === h.hook_id 
                                ? 'bg-red-900/50 border-red-500 shadow-lg' 
                                : 'bg-slate-800 border-slate-700 hover:bg-slate-700'}
                            `}
                        >
                            <div className="flex justify-between text-[10px] md:text-xs font-bold text-slate-400 mb-2">
                                <span className="text-white bg-slate-700 px-2 py-0.5 rounded shadow">
                                   HOOK {h.matchNum}
                                </span>
                                <span>RD {h.round}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-lg md:text-xl font-black font-mono">#{h.truck1_number}</span>
                                <span className="text-[10px] md:text-xs font-bold text-slate-500">VS</span>
                                <span className="text-lg md:text-xl font-black font-mono">#{h.truck2_number}</span>
                            </div>
                        </div>
                    ))}
                    {readyMatches.length === 0 && <div className="p-4 md:p-8 text-center text-slate-600 font-bold italic text-sm">No matches ready.</div>}
                </div>
            </div>

            {/* MAIN AREA */}
            <div className="flex-grow flex flex-col bg-black relative">
                {activeHook ? (
                    <div className="h-full flex flex-col md:flex-row">
                        {/* LEFT TRUCK */}
                        <button 
                            onClick={() => handleWinner(activeHook.entry1_id, activeHook.truck1_number)}
                            className="flex-1 bg-blue-900 hover:bg-blue-800 active:bg-blue-700 flex flex-col items-center justify-center border-b-4 md:border-b-0 md:border-r-8 border-black transition-colors group relative overflow-hidden p-4"
                        >
                            <div className="text-xl md:text-3xl font-bold text-blue-300 mb-2 md:mb-4 uppercase tracking-widest z-10">Left Lane</div>
                            {/* SCALED DOWN TEXT FOR MOBILE */}
                            <div className="text-7xl md:text-[180px] font-black leading-none group-active:scale-95 transition-transform z-10">{activeHook.truck1_number}</div>
                            <div className="text-xl md:text-4xl font-bold text-white mt-2 md:mt-4 uppercase z-10 truncate max-w-full">{activeHook.driver1_name}</div>
                            <div className="mt-4 md:mt-12 bg-blue-600 text-white px-6 md:px-8 py-2 md:py-4 rounded-full text-lg md:text-2xl font-black shadow-lg uppercase z-10">Tap to Win</div>
                        </button>

                        {/* RIGHT TRUCK */}
                        <button 
                            onClick={() => handleWinner(activeHook.entry2_id, activeHook.truck2_number)}
                            className="flex-1 bg-green-900 hover:bg-green-800 active:bg-green-700 flex flex-col items-center justify-center border-t-4 md:border-t-0 md:border-l-8 border-black transition-colors group relative overflow-hidden p-4"
                        >
                            <div className="text-xl md:text-3xl font-bold text-green-300 mb-2 md:mb-4 uppercase tracking-widest z-10">Right Lane</div>
                            {/* SCALED DOWN TEXT FOR MOBILE */}
                            <div className="text-7xl md:text-[180px] font-black leading-none group-active:scale-95 transition-transform z-10">{activeHook.truck2_number}</div>
                            <div className="text-xl md:text-4xl font-bold text-white mt-2 md:mt-4 uppercase z-10 truncate max-w-full">{activeHook.driver2_name}</div>
                            <div className="mt-4 md:mt-12 bg-green-600 text-white px-6 md:px-8 py-2 md:py-4 rounded-full text-lg md:text-2xl font-black shadow-lg uppercase z-10">Tap to Win</div>
                        </button>

                        {/* CENTER BADGE - ADJUSTED POSITION */}
                        <div className="
                            absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                            bg-black rounded-3xl 
                            px-4 py-3 md:px-8 md:py-6 
                            border-2 md:border-4 border-slate-700 shadow-2xl z-20 pointer-events-none 
                            min-w-[160px] md:min-w-[240px]
                            scale-75 md:scale-100 opacity-90
                        ">
                            <div className="text-center">
                                <div className="text-slate-400 font-bold text-[10px] md:text-xs uppercase mb-1 tracking-widest">Current Match</div>
                                <div className="text-white font-black text-3xl md:text-5xl leading-tight">HOOK {activeHook.matchNum}</div>
                                <div className="text-slate-500 font-bold text-sm md:text-xl mt-1 md:mt-2">ROUND {activeHook.round}</div>
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