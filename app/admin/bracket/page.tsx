'use client';
import { useState, useEffect } from 'react';
import AdminNav from '@/components/AdminNav';

export default function BracketManager() {
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [hooks, setHooks] = useState<any[]>([]);
  
  // Correction Mode State
  const [manageMode, setManageMode] = useState(false);
  const [selectedHook, setSelectedHook] = useState<any>(null);

  useEffect(() => {
    fetch('/api/classes').then(res => res.json()).then(setClasses);
  }, []);

  useEffect(() => {
    if (!selectedClassId) return;
    fetchHooks();
  }, [selectedClassId]);

  const fetchHooks = async () => {
    // Add timestamp to ensure we get fresh data
    const res = await fetch(`/api/hooks?class_id=${selectedClassId}&t=${Date.now()}`);
    if (res.ok) setHooks(await res.json());
  };

  const handleGenerate = async () => {
    if (!confirm("WARNING: Generating a new bracket will DELETE all current matches and progress for this class. Continue?")) return;
    
    await fetch('/api/bracket/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ class_id: selectedClassId })
    });
    fetchHooks();
  };

  // NEW: Handle Unlock / Reset
  const handleUnlock = async () => {
      const confirmation = prompt("TYPE 'RESET' TO CONFIRM.\n\nThis will DELETE the current bracket, remove all match history, and RE-OPEN registration.");
      if (confirmation !== 'RESET') return;

      await fetch('/api/bracket/reset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ class_id: selectedClassId })
      });
      fetchHooks(); // Refresh view
  };

  const handleWin = async (hook: any, winnerId: string) => {
    await fetch('/api/hooks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            hook_id: hook.hook_id, 
            winner_entry_id: winnerId,
            next_hook_id: hook.next_hook_id, 
            position: hook.bracket_position
        })
    });
    setSelectedHook(null);
    fetchHooks();
  };

  const handleReset = async (hookId: string) => {
    if(!confirm("Are you sure you want to RESET this match?")) return;
    
    await fetch('/api/hooks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset', hook_id: hookId })
    });
    setSelectedHook(null);
    fetchHooks();
  };

  const handleScratch = async (entryId: string, opponentId: string, currentHook: any) => {
    const reason = prompt("Enter reason for scratch (optional):", "Mechanical");
    if (reason === null) return; 

    await fetch('/api/entries', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'scratch', entry_id: entryId })
    });

    if (opponentId) {
        await handleWin(currentHook, opponentId);
        alert("Entry scratched. Opponent advanced automatically.");
    } else {
        fetchHooks();
        setSelectedHook(null);
    }
  };

  const rounds: Record<number, any[]> = {};
  hooks.forEach(h => {
    if (!rounds[h.round]) rounds[h.round] = [];
    rounds[h.round].push(h);
  });

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 pb-20">
      <AdminNav />
      <div className="max-w-7xl mx-auto p-6">
        
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
                <span>🏆</span> Bracket Manager
            </h1>
            <div className="flex gap-4">
                {selectedClassId && (
                    <button 
                        onClick={() => setManageMode(!manageMode)}
                        className={`px-4 py-2 rounded font-bold border transition-colors flex items-center gap-2 ${manageMode ? 'bg-yellow-100 text-yellow-800 border-yellow-400 animate-pulse' : 'bg-white text-slate-600 border-slate-300'}`}
                    >
                        {manageMode ? '🔧 Correction Mode ACTIVE' : '🔧 Enable Corrections'}
                    </button>
                )}
            </div>
        </div>

        {/* CLASS SELECTOR SECTION */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 mb-8">
            <div className="flex gap-4 items-center">
                <select 
                    className="p-3 border-2 border-slate-300 rounded-lg text-lg font-bold outline-none focus:border-blue-500 flex-grow"
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                >
                    <option value="">-- Select Class --</option>
                    {classes.map(c => <option key={c.class_id} value={c.class_id}>
                        {c.name} {c.is_locked ? '(🔒 CLOSED)' : '(OPEN)'}
                    </option>)}
                </select>
                
                {/* LOGIC: Show Generate if empty, Show Reset if exists */}
                {hooks.length > 0 ? (
               <div className="flex gap-2">
        {/* NEW PRINT BUTTON */}
        <a 
            href={`/print/bracket?class_id=${selectedClassId}`} 
            target="_blank"
            className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-4 py-3 rounded-lg border-2 border-slate-300 flex items-center gap-2"
        >
            🖨️ Print
        </a>

        <button 
            onClick={handleUnlock}
            className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-lg shadow-lg border-2 border-red-800"
        >
            ⚠️ RESET & OPEN CLASS
        </button>
    </div>
                ) : (
                    <button 
                        onClick={handleGenerate}
                        disabled={!selectedClassId}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 rounded-lg shadow-lg disabled:opacity-50"
                    >
                        GENERATE BRACKET & CLOSE
                    </button>
                )}
            </div>
        </div>

        <div className="flex gap-8 overflow-x-auto pb-10">
            {Object.keys(rounds).map((roundNum: any) => (
                <div key={roundNum} className="flex flex-col justify-around gap-4 min-w-[280px]">
                    <h3 className="text-center font-black text-slate-400 uppercase tracking-widest mb-4">Round {roundNum}</h3>
                    
                    {rounds[roundNum].sort((a,b) => a.match_order - b.match_order).map(h => (
                        <div 
                            key={h.hook_id} 
                            onClick={() => manageMode ? setSelectedHook(h) : null}
                            className={`
                                relative bg-white border-2 rounded-lg p-3 shadow-sm transition-all
                                ${manageMode ? 'cursor-pointer hover:border-yellow-400 hover:shadow-md' : ''}
                                ${h.winner_entry_id ? 'border-green-500 bg-green-50' : 'border-slate-300'}
                            `}
                        >
                            <div className="absolute -top-2 -right-2 bg-slate-200 text-slate-500 text-[10px] font-bold px-1.5 rounded border border-slate-300">
                                #{h.match_order + 1}
                            </div>

                            {/* Entry 1 */}
                            <div className={`
                                flex justify-between items-center p-2 rounded 
                                ${h.winner_entry_id === h.entry1_id ? 'bg-green-200 font-bold' : ''}
                                ${h.status1 === 'scratched' ? 'bg-red-100 text-red-600' : ''} 
                            `}>
                                <span className={`font-mono font-bold text-sm ${h.status1 === 'scratched' ? 'line-through' : ''}`}>
                                    {h.truck1_number ? `#${h.truck1_number}` : (h.round === 1 ? 'BYE' : '...')}
                                </span>
                                <span className="text-xs truncate max-w-[100px]">
                                    {h.driver1_name} {h.status1 === 'scratched' && '(SCR)'}
                                </span>
                            </div>

                            <div className="text-center text-[10px] font-bold text-slate-300 my-1">VS</div>

                            {/* Entry 2 */}
                            <div className={`
                                flex justify-between items-center p-2 rounded 
                                ${h.winner_entry_id === h.entry2_id ? 'bg-green-200 font-bold' : ''}
                                ${h.status2 === 'scratched' ? 'bg-red-100 text-red-600' : ''}
                            `}>
                                <span className={`font-mono font-bold text-sm ${h.status2 === 'scratched' ? 'line-through' : ''}`}>
                                    {h.truck2_number ? `#${h.truck2_number}` : (h.round === 1 ? 'BYE' : '...')}
                                </span>
                                <span className="text-xs truncate max-w-[100px]">
                                    {h.driver2_name} {h.status2 === 'scratched' && '(SCR)'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            ))}
        </div>

        {selectedHook && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden">
                    <div className="bg-slate-900 text-white p-4 font-bold text-lg flex justify-between items-center">
                        <span>Manage Match #{selectedHook.match_order + 1}</span>
                        <button onClick={() => setSelectedHook(null)} className="text-slate-400 hover:text-white">✕</button>
                    </div>
                    
                    <div className="p-6 space-y-6">
                        {selectedHook.winner_entry_id ? (
                            <div className="text-center">
                                <div className="text-green-600 font-black text-xl mb-2">Winner: #{selectedHook.winner_number}</div>
                                <p className="text-slate-500 text-sm mb-6">Need to change the winner? Resetting will clear the result.</p>
                                
                                <button 
                                    onClick={() => handleReset(selectedHook.hook_id)}
                                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-4 rounded shadow-lg flex justify-center items-center gap-2"
                                >
                                    <span>↺</span> RESET RESULT (Undo Win)
                                </button>
                                <p className="text-xs text-red-400 mt-3 font-bold">
                                    ⚠️ Warning: If this winner already advanced to the next round, that future match will also be reset.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <p className="text-center text-slate-500 font-bold uppercase text-xs tracking-widest mb-4">Select Action</p>
                                
                                {selectedHook.entry1_id && (
                                    <div className="flex gap-2 items-stretch">
                                        <button 
                                            onClick={() => handleWin(selectedHook, selectedHook.entry1_id)}
                                            className="flex-grow bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded shadow text-left px-4"
                                        >
                                            Win: #{selectedHook.truck1_number}
                                        </button>
                                        <button 
                                            onClick={() => handleScratch(selectedHook.entry1_id, selectedHook.entry2_id, selectedHook)}
                                            className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold px-4 rounded text-xs uppercase"
                                        >
                                            Scratch
                                        </button>
                                    </div>
                                )}

                                {selectedHook.entry2_id && (
                                    <div className="flex gap-2 items-stretch">
                                        <button 
                                            onClick={() => handleWin(selectedHook, selectedHook.entry2_id)}
                                            className="flex-grow bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded shadow text-left px-4"
                                        >
                                            Win: #{selectedHook.truck2_number}
                                        </button>
                                        <button 
                                            onClick={() => handleScratch(selectedHook.entry2_id, selectedHook.entry1_id, selectedHook)}
                                            className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold px-4 rounded text-xs uppercase"
                                        >
                                            Scratch
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="bg-slate-50 p-4 border-t text-center">
                        <button onClick={() => setSelectedHook(null)} className="text-slate-500 font-bold hover:text-slate-800">Close</button>
                    </div>
                </div>
            </div>
        )}

      </div>
    </div>
  );
}