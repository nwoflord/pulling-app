'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function PitScreen() {
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [hooks, setHooks] = useState<any[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    fetch('/api/classes').then(res => res.json()).then(setClasses);
  }, []);

  useEffect(() => {
    if (!selectedClassId) return;
    fetchBracket();
    const interval = setInterval(fetchBracket, 5000); // Increased speed to 5s for better responsiveness
    return () => clearInterval(interval);
  }, [selectedClassId]);

  const fetchBracket = async () => {
    try {
      // Added timestamp to prevent caching old data
      const res = await fetch(`/api/hooks?class_id=${selectedClassId}&t=${Date.now()}`);
      if (res.ok) {
        setHooks(await res.json());
        setLastUpdated(new Date());
      }
    } catch(e) { console.error(e); }
  };

  // Sort matches by order so the sidebar queue is accurate
  const sortedHooks = [...hooks].sort((a,b) => a.match_order - b.match_order);

  const upcomingMatches = sortedHooks.filter(h => !h.winner_entry_id && h.entry1_id && h.entry2_id);
  const currentMatch = upcomingMatches[0];
  const onDeckMatch = upcomingMatches[1];
  const inTheHoleMatch = upcomingMatches[2];

  // Helper: Status Card (Sidebar)
  const StatusCard = ({ match, title, colorClass, isMain = false }: any) => {
    return (
      <div className={`flex flex-col w-full rounded-xl border-2 shadow-lg overflow-hidden relative flex-shrink-0 ${colorClass} ${isMain ? 'bg-slate-900 h-64' : 'bg-slate-800 h-40'}`}>
         <div className={`text-center font-black uppercase tracking-widest py-1 text-white text-xs md:text-sm ${colorClass.replace('border-', 'bg-').split(' ')[0]}`}>
            {title}
         </div>
         <div className="flex-grow flex flex-col justify-center items-center p-2 text-center">
            {match ? (
                <>
                    <div className="flex items-center justify-center gap-2 w-full">
                        <div className="flex-1">
                            <div className={`${isMain ? 'text-5xl' : 'text-3xl'} font-black text-white leading-none`}>
                                #{match.truck1_number || '?'}
                            </div>
                        </div>
                        <div className={`${isMain ? 'text-2xl' : 'text-lg'} font-black italic text-yellow-500`}>VS</div>
                        <div className="flex-1">
                            <div className={`${isMain ? 'text-5xl' : 'text-3xl'} font-black text-white leading-none`}>
                                #{match.truck2_number || '?'}
                            </div>
                        </div>
                    </div>
                    {isMain && (
                        <div className="flex justify-between w-full px-2 mt-2 text-[10px] uppercase text-slate-400 font-bold">
                             <span className="truncate max-w-[45%] text-right">{match.driver1_name}</span>
                             <span className="truncate max-w-[45%] text-left">{match.driver2_name}</span>
                        </div>
                    )}
                </>
            ) : (
                <span className="text-slate-500 font-bold italic text-sm">Waiting...</span>
            )}
         </div>
      </div>
    );
  };

  // Helper: Bracket Box (UPDATED WITH SCRATCH LOGIC)
  const BracketBox = ({ hook, truckNum }: { hook: any, truckNum: 1 | 2 }) => {
    if (!hook) {
        return (
            <div className="bg-slate-800/50 border border-slate-700/50 h-10 w-full rounded flex items-center justify-center">
                <span className="text-slate-600 font-bold text-[10px]">TBD</span>
            </div>
        );
    }

    const entryId = truckNum === 1 ? hook.entry1_id : hook.entry2_id;
    const number = truckNum === 1 ? hook.truck1_number : hook.truck2_number;
    
    // Check Status for Red Styling
    const status = truckNum === 1 ? hook.status1 : hook.status2;
    const isScratched = status === 'scratched';
    
    const isWinner = hook.winner_entry_id === entryId && entryId;

    let displayText = "TBD";
    let statusColor = "text-slate-500"; 

    if (number) {
        displayText = `#${number}`;
        statusColor = "text-white"; 
    } else if (hook.round === 1 && entryId === null) {
        displayText = "BYE";
        statusColor = "text-slate-500 italic";
    }
    
    // --- STYLING LOGIC ---
    let boxStyle = 'bg-slate-800 border-slate-600'; // Default
    
    if (isWinner) {
        boxStyle = 'bg-green-900 border-green-500';
    } else if (isScratched) {
        boxStyle = 'bg-red-900/50 border-red-600 text-red-300';
        statusColor = "text-red-300 line-through decoration-2 decoration-red-500";
    }

    return (
      <div className={`flex items-center justify-center rounded border w-full h-10 transition-all relative ${boxStyle}`}>
        <span className={`font-black text-lg tracking-tight ${statusColor}`}>
            {displayText}
        </span>
        {isScratched && (
            <span className="absolute -top-2 -right-1 bg-red-600 text-white text-[8px] font-bold px-1 rounded">
                SCR
            </span>
        )}
      </div>
    );
  };

  // DYNAMIC ROUND CALCULATOR
  const uniqueRounds = [...new Set(hooks.map(h => h.round))].sort((a,b) => a-b);
  const maxRound = Math.max(...uniqueRounds);

  const getRoundLabel = (r: number) => {
      if (r === maxRound) return "Finals";
      if (r === maxRound - 1) return "Semi Finals";
      return `Round ${r}`;
  };

  return (
    <div className="h-screen bg-slate-950 text-white font-sans overflow-hidden flex flex-col">
      
      {/* Top Bar */}
      <div className="bg-blue-900 p-2 flex justify-between items-center shadow-lg border-b border-blue-700 flex-shrink-0 z-20">
        <h1 className="text-lg font-black italic tracking-tighter">PIT<span className="text-blue-400">BOARD</span></h1>
        <div className="flex items-center gap-4">
            <span className="text-xs text-blue-200 hidden md:block">Last Update: {lastUpdated.toLocaleTimeString()}</span>
            <select 
                className="p-1 rounded font-bold text-black bg-white w-48 outline-none text-sm"
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
            >
                <option value="">-- Select Class --</option>
                {classes.map(c => <option key={c.class_id} value={c.class_id}>{c.name}</option>)}
            </select>
        </div>
      </div>

      <div className="flex-grow flex overflow-hidden">
        {!selectedClassId ? (
            <div className="w-full h-full flex items-center justify-center text-slate-500 text-2xl">Select a Class</div>
        ) : (
            <>
                {/* --- LEFT SIDEBAR --- */}
                <div className="w-1/3 max-w-sm bg-slate-900 border-r border-slate-800 p-4 flex flex-col gap-4 overflow-y-auto z-10 shadow-xl">
                    <h3 className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-1">Queue</h3>
                    <StatusCard match={currentMatch} title="Now Pulling" colorClass="border-green-500" isMain={true} />
                    <StatusCard match={onDeckMatch} title="On Deck" colorClass="border-yellow-500" />
                    <StatusCard match={inTheHoleMatch} title="In The Hole" colorClass="border-red-600" />
                </div>

                {/* --- RIGHT AREA (DYNAMIC BRACKET) --- */}
                <div className="flex-1 bg-slate-950 p-6 overflow-auto relative">
                     <div className="flex h-full min-h-[600px] pl-4">
                        
                        {uniqueRounds.map((round) => {
                            const isFirstRound = round === 1;
                            const isLastRound = round === maxRound;
                            
                            return (
                                <div key={round} className="flex flex-col h-full mr-12 min-w-[140px]">
                                    {/* Dynamic Header Label */}
                                    <div className="text-center font-bold text-blue-500 uppercase tracking-widest text-sm mb-4 border-b border-slate-800 pb-2">
                                        {getRoundLabel(round)}
                                    </div>
                                    
                                    <div className="flex flex-col justify-around flex-grow gap-2">
                                        {/* FILTER AND SORT to keep alignment correct */}
                                        {hooks
                                            .filter(h => h.round === round)
                                            .sort((a,b) => a.match_order - b.match_order)
                                            .map((hook) => (
                                            <div key={hook.hook_id} className="flex flex-col gap-1 relative justify-center flex-1">
                                                
                                                {/* Connector Lines Logic */}
                                                {!isFirstRound && (
                                                    <div className="absolute top-1/2 left-[-24px] w-6 border-b-2 border-slate-600 opacity-50"></div>
                                                )}

                                                <BracketBox hook={hook} truckNum={1} />
                                                <BracketBox hook={hook} truckNum={2} />

                                                {!isLastRound && (
                                                    <>
                                                        <div className="absolute top-1/2 right-[-24px] w-6 h-[50%] border-r-2 border-slate-600 rounded-tr-lg translate-y-0 opacity-50"></div>
                                                        <div className="absolute bottom-1/2 right-[-24px] w-6 h-[50%] border-r-2 border-slate-600 rounded-br-lg translate-y-0 opacity-50"></div>
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}

                     </div>
                </div>
            </>
        )}
      </div>
    </div>
  );
}