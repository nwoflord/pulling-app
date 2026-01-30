'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function LineupPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  
  const [needsFound, setNeedsFound] = useState<any[]>([]);
  const [staging, setStaging] = useState<any[]>([]);
  const [readyEntries, setReadyEntries] = useState<any[]>([]); 
  
  useEffect(() => {
    fetch('/api/classes').then(res => res.json()).then(data => {
        setClasses(data);
        if (data.length > 0) setSelectedClassId(data[0].class_id);
      });
  }, []);

  useEffect(() => {
    if (!selectedClassId) return;
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [selectedClassId]);

  const fetchData = async () => {
    try {
      const [entriesRes, hooksRes] = await Promise.all([
        fetch(`/api/entries?class_id=${selectedClassId}`),
        fetch(`/api/hooks?class_id=${selectedClassId}`)
      ]);

      if (entriesRes.ok && hooksRes.ok) {
        const entriesData = await entriesRes.json();
        const hooksData = await hooksRes.json();

        const truckMatchMap: any = {};
        hooksData.filter((h: any) => !h.winner_entry_id).forEach((h: any) => {
             const info = { matchNum: h.match_order + 1, round: h.round };
             if (h.entry1_id) truckMatchMap[h.entry1_id] = info;
             if (h.entry2_id) truckMatchMap[h.entry2_id] = info;
        });

        const mergedEntries = entriesData
            .map((e: any) => ({
                ...e, 
                status: (e.status === 'active' || !e.status) ? 'needs_found' : e.status,
                matchInfo: truckMatchMap[e.entry_id]
            }))
            .filter((e: any) => e.status !== 'hooked' && e.status !== 'scratched');

        mergedEntries.sort((a: any, b: any) => {
            const roundA = a.matchInfo?.round || 999;
            const roundB = b.matchInfo?.round || 999;
            if (roundA !== roundB) return roundA - roundB;

            const matchA = a.matchInfo?.matchNum || 999;
            const matchB = b.matchInfo?.matchNum || 999;
            return matchA - matchB;
        });

        setNeedsFound(mergedEntries.filter((e: any) => e.status === 'needs_found'));
        setStaging(mergedEntries.filter((e: any) => e.status === 'staging'));
        setReadyEntries(mergedEntries.filter((e: any) => e.status === 'ready'));
      }
    } catch (error) { console.error("Polling Error:", error); }
  };

  const moveStatus = async (entry: any, newStatus: string) => {
    if (newStatus === 'staging') {
        setNeedsFound(prev => prev.filter(e => e.entry_id !== entry.entry_id));
        setStaging(prev => [...prev, entry]);
    }

    await fetch('/api/entries', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entry_id: entry.entry_id, status: newStatus })
    });
    fetchData();
  };

  const groupReadyByMatch = () => {
      const groups: any = {};
      readyEntries.forEach(e => {
          const key = e.matchInfo ? `R${e.matchInfo.round}_M${e.matchInfo.matchNum}` : 'Unmatched';
          if (!groups[key]) groups[key] = [];
          groups[key].push(e);
      });
      return groups;
  };
  
  const readyGroups = groupReadyByMatch();

  const markMatchHooked = async (entries: any[]) => {
      if(!confirm(`Confirm Hook is COMPLETE? (${entries.length} trucks)`)) return;
      
      await Promise.all(entries.map(e => 
          fetch('/api/entries', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ entry_id: e.entry_id, status: 'hooked' })
          })
      ));
      fetchData();
  };

  const MatchBadge = ({ info }: any) => {
      if (!info) return <span className="text-[10px] bg-slate-200 px-1 rounded text-slate-500">TBD</span>;
      return <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2 py-1 rounded border border-blue-200">R{info.round} - Hook {info.matchNum}</span>;
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans overflow-hidden flex flex-col">
      <div className="bg-slate-800 p-4 shadow-md flex justify-between items-center z-10">
        <div className="flex items-center gap-4">
            <h1 className="text-2xl font-black italic uppercase tracking-tighter">LINEUP<span className="text-yellow-400">BOARD</span></h1>
            <select className="bg-slate-700 font-bold p-2 rounded border border-slate-600 outline-none" value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)}>
                {classes.map(c => <option key={c.class_id} value={c.class_id}>{c.name}</option>)}
            </select>
        </div>
        <Link href="/" className="text-slate-400 text-xs font-bold uppercase hover:text-white">Exit</Link>
      </div>

      <div className="flex-grow grid grid-cols-3 gap-1 p-2 h-full overflow-hidden">
        
        {/* NEEDS FOUND */}
        <div className="bg-slate-800/50 rounded-lg flex flex-col border border-slate-700 h-full">
            <div className="bg-red-600/90 p-3 text-center font-black uppercase tracking-widest text-lg shadow-md">Needs Found ({needsFound.length})</div>
            <div className="p-2 space-y-2 overflow-y-auto flex-grow">
                {needsFound.map(e => (
                    <div 
                        key={e.entry_id} 
                        onClick={() => moveStatus(e, 'staging')} 
                        className="bg-white text-slate-900 p-4 rounded shadow-lg cursor-pointer hover:bg-red-50 hover:scale-[1.02] transition-all border-l-8 border-red-500 relative"
                    >
                        <div className="absolute top-2 right-2"><MatchBadge info={e.matchInfo} /></div>
                        <div className="text-4xl font-black mt-2">#{e.truck_number}</div>
                        <div className="font-bold text-lg leading-tight truncate">{e.driver_name}</div>
                        <div className="text-xs text-slate-400 font-bold uppercase tracking-wide mt-1 text-right">Tap to Stage &rarr;</div>
                    </div>
                ))}
            </div>
        </div>

        {/* STAGING */}
        <div className="bg-slate-800/50 rounded-lg flex flex-col border border-slate-700 h-full">
            <div className="bg-yellow-500/90 text-slate-900 p-3 text-center font-black uppercase tracking-widest text-lg shadow-md">Staging ({staging.length})</div>
            <div className="p-2 space-y-2 overflow-y-auto flex-grow">
                {staging.map(e => (
                    <div 
                        key={e.entry_id} 
                        onClick={() => moveStatus(e, 'ready')}
                        className="bg-white text-slate-900 p-4 rounded shadow-lg cursor-pointer hover:bg-yellow-50 hover:scale-[1.02] transition-all border-l-8 border-yellow-400 relative"
                    >
                        <div className="absolute top-2 right-2 flex gap-2 items-center">
                            <MatchBadge info={e.matchInfo} />
                            <button 
                                onClick={(evt) => { evt.stopPropagation(); moveStatus(e, 'needs_found'); }} 
                                className="bg-slate-200 hover:bg-slate-300 text-slate-600 text-xs px-2 py-1 rounded font-bold z-10"
                            >
                                Back
                            </button>
                        </div>
                        <div className="text-4xl font-black mt-4">#{e.truck_number}</div>
                        <div className="font-bold text-lg leading-tight truncate">{e.driver_name}</div>
                        <div className="text-xs text-slate-400 font-bold uppercase tracking-wide mt-2 text-right">Tap to Ready &rarr;</div>
                    </div>
                ))}
            </div>
        </div>

        {/* READY TO HOOK */}
        <div className="bg-slate-800/50 rounded-lg flex flex-col border border-slate-700 h-full">
            <div className="bg-green-600/90 p-3 text-center font-black uppercase tracking-widest text-lg shadow-md">Ready to Hook</div>
            <div className="p-2 space-y-4 overflow-y-auto flex-grow">
                {Object.keys(readyGroups).sort((a,b) => {
                     const getParts = (str: string) => {
                        const parts = str.match(/R(\d+)_M(\d+)/);
                        if (!parts) return { r: 999, m: 999 };
                        return { r: parseInt(parts[1]), m: parseInt(parts[2]) };
                     };
                     const pA = getParts(a);
                     const pB = getParts(b);
                     if (pA.r !== pB.r) return pA.r - pB.r;
                     return pA.m - pB.m;
                }).map(key => {
                    const group = readyGroups[key];
                    const matchInfo = group[0].matchInfo;
                    
                    return (
                        <div 
                            key={key} 
                            onClick={() => markMatchHooked(group)}
                            className="bg-slate-700 rounded-xl p-3 border-2 border-green-500/50 shadow-xl cursor-pointer hover:bg-slate-600 hover:border-green-400 transition-all active:scale-[0.98]"
                        >
                            <div className="text-center font-black text-green-400 uppercase tracking-widest mb-2 border-b border-slate-600 pb-1">
                                {matchInfo ? `Hook ${matchInfo.matchNum} (Round ${matchInfo.round})` : 'Unmatched Entry'}
                            </div>
                            
                            <div className="space-y-2 mb-1">
                                {group.map((e: any) => (
                                    <div key={e.entry_id} className="bg-white text-slate-900 p-3 rounded flex justify-between items-center border-l-8 border-green-600">
                                        <div>
                                            <div className="text-3xl font-black">#{e.truck_number}</div>
                                            <div className="font-bold leading-none">{e.driver_name}</div>
                                        </div>
                                        <button 
                                            onClick={(evt) => { evt.stopPropagation(); moveStatus(e, 'staging'); }}
                                            className="bg-slate-200 text-slate-500 text-xs px-2 py-1 rounded font-bold hover:bg-slate-300"
                                        >
                                            &larr; Back
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <div className="text-center text-green-400 text-xs font-bold uppercase mt-2 tracking-widest animate-pulse">
                                Tap Box to Complete Hook
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>

      </div>
    </div>
  );
}