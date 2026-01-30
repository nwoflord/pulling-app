'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AnnouncerScreen() {
  const router = useRouter();
  
  // VIEW STATE: 'live' or 'sponsors'
  const [activeTab, setActiveTab] = useState<'live' | 'sponsors'>('live');

  // DATA STATE
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [hooks, setHooks] = useState<any[]>([]);
  const [activeHookId, setActiveHookId] = useState<string | null>(null);
  
  // SPONSOR STATE
  const [sponsors, setSponsors] = useState<any[]>([]); // The raw data
  const [displaySponsors, setDisplaySponsors] = useState<any[]>([]); // The ordered list
  const [readSponsorIds, setReadSponsorIds] = useState<string[]>([]); // List of IDs marked as 'read'

  // Load Initial Data
  useEffect(() => {
    fetch('/api/classes').then(res => res.json()).then(setClasses);
    fetch('/api/sponsors')
      .then(res => res.json())
      .then(data => {
         setSponsors(data);
         setDisplaySponsors(data); // Initially set display to default order
      });
  }, []);

  // Poll Hooks (only if on Live tab)
  useEffect(() => {
    if (!selectedClassId || activeTab !== 'live') return;
    fetchHooks();
    const interval = setInterval(fetchHooks, 5000); 
    return () => clearInterval(interval);
  }, [selectedClassId, activeTab]);

  const fetchHooks = async () => {
    try {
      const res = await fetch(`/api/hooks?class_id=${selectedClassId}`);
      if (res.ok) setHooks(await res.json());
    } catch(e) { console.error(e); }
  };

  const processedHooks = [...hooks]
    .sort((a, b) => a.round - b.round)
    .map((h, index) => ({ ...h, matchNum: index + 1 }));

  const readyMatches = processedHooks.filter(h => !h.winner_entry_id && h.entry1_id && h.entry2_id);
  const activeHook = activeHookId ? processedHooks.find(h => h.hook_id === activeHookId) : readyMatches[0];
  const currentClass = classes.find(c => c.class_id === selectedClassId);

  const handleLogout = () => {
    document.cookie = "auth=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    router.push('/');
    router.refresh();
  };

  // --- SPONSOR LOGIC ---

  const toggleSponsorRead = (id: string) => {
    setReadSponsorIds(prev => 
        prev.includes(id) 
        ? prev.filter(i => i !== id) // Unmark if already read
        : [...prev, id] // Mark as read
    );
  };

  const resetReads = () => {
    if(confirm("Reset all sponsors to 'Unread'?")) {
        setReadSponsorIds([]);
    }
  };

  const shuffleSponsors = () => {
    // Fisher-Yates Shuffle Algorithm
    const array = [...displaySponsors];
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    setDisplaySponsors(array);
  };

  // Helper Components
  const DriverCard = ({ number, name, truck, hometown, info, colorClass }: any) => (
    <div className={`flex flex-col h-full bg-white rounded-2xl shadow-xl overflow-hidden border-t-8 ${colorClass}`}>
        <div className="flex items-center border-b border-gray-200 p-6 bg-gray-50">
            <div className="text-8xl font-black text-gray-900 tracking-tighter mr-8">#{number}</div>
            <div>
                <div className="text-4xl font-bold text-gray-900 uppercase leading-none mb-1">{name}</div>
                {truck && <div className="text-2xl font-medium text-gray-500 italic">"{truck}"</div>}
            </div>
        </div>
        <div className="flex-grow p-8 flex flex-col gap-8">
            <div className="flex items-start gap-4">
                <div className="bg-gray-200 p-3 rounded-full text-3xl">📍</div>
                <div>
                    <div className="text-sm font-bold text-gray-400 uppercase tracking-widest">Hometown</div>
                    <div className="text-4xl font-bold text-gray-800">{hometown || "Unknown"}</div>
                </div>
            </div>
            <div className="flex items-start gap-4">
                <div className="bg-blue-100 p-3 rounded-full text-3xl">ℹ️</div>
                <div>
                    <div className="text-sm font-bold text-gray-400 uppercase tracking-widest">Details</div>
                    <div className="text-2xl font-medium text-gray-700 leading-relaxed">{info || "No additional info provided."}</div>
                </div>
            </div>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 font-sans flex flex-col">
      
      {/* HEADER WITH TABS */}
      <div className="bg-slate-900 border-b border-slate-700 flex flex-col flex-shrink-0">
        
        {/* Top Bar */}
        <div className="p-4 flex justify-between items-center h-20">
            <div className="flex items-center gap-6">
                <h1 className="text-2xl font-black italic uppercase tracking-tighter text-gray-500">
                    ANNOUNCER<span className="text-white">VIEW</span>
                </h1>
                
                {/* TABS */}
                <div className="flex bg-slate-800 rounded p-1">
                    <button 
                        onClick={() => setActiveTab('live')}
                        className={`px-4 py-1 rounded font-bold text-sm uppercase transition-all ${activeTab === 'live' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                    >
                        Live Action
                    </button>
                    <button 
                        onClick={() => setActiveTab('sponsors')}
                        className={`px-4 py-1 rounded font-bold text-sm uppercase transition-all ${activeTab === 'sponsors' ? 'bg-yellow-500 text-black shadow' : 'text-slate-400 hover:text-white'}`}
                    >
                        Sponsor Read
                    </button>
                </div>
            </div>

            <div className="flex gap-4">
                 {activeTab === 'live' && (
                    <select 
                        className="h-10 px-4 rounded font-bold text-black bg-white outline-none focus:border-yellow-400"
                        value={selectedClassId}
                        onChange={(e) => { setSelectedClassId(e.target.value); setActiveHookId(null); }}
                    >
                        <option value="">-- SELECT CLASS --</option>
                        {classes.map(c => <option key={c.class_id} value={c.class_id}>{c.name}</option>)}
                    </select>
                 )}
                 <button onClick={handleLogout} className="text-xs font-bold text-slate-500 hover:text-white border border-slate-700 hover:border-white px-3 py-2 rounded transition-colors uppercase">
                    Sign Out
                 </button>
            </div>
        </div>

        {/* Sub-Header (Class Info) - Only show on Live Tab */}
        {activeTab === 'live' && selectedClassId && currentClass && (
            <div className="bg-slate-800 px-4 py-2 flex items-center gap-4 border-t border-slate-700">
                <span className="text-white font-black uppercase text-xl italic">{currentClass.name}</span>
                {currentClass.sponsor_name && (
                    <span className="text-yellow-400 font-bold uppercase text-sm">
                        Presented by <span className="text-white ml-1">{currentClass.sponsor_name}</span>
                    </span>
                )}
            </div>
        )}
      </div>

      {/* --- CONTENT AREA --- */}

      {/* TAB 1: LIVE ACTION */}
      {activeTab === 'live' && (
        !selectedClassId ? (
            <div className="flex-grow flex items-center justify-center text-gray-400 text-3xl font-bold uppercase">Select Class to Begin</div>
        ) : (
            <div className="flex-grow flex overflow-hidden">
                {/* SIDEBAR */}
                <div className="w-80 bg-slate-800 border-r border-slate-700 flex flex-col overflow-hidden">
                    <div className="p-4 bg-slate-900 font-bold uppercase tracking-widest text-slate-400 text-sm shadow">Run Order ({readyMatches.length})</div>
                    <div className="overflow-y-auto flex-grow p-2 space-y-2">
                        {readyMatches.map((h) => (
                            <div 
                                key={h.hook_id}
                                onClick={() => setActiveHookId(h.hook_id)}
                                className={`p-3 rounded border-l-4 cursor-pointer transition-all hover:bg-slate-700 ${
                                    activeHook?.hook_id === h.hook_id ? 'bg-slate-700 border-yellow-400 shadow-md' : 'bg-slate-800 border-transparent text-slate-400'
                                }`}
                            >
                                <div className="flex justify-between text-[10px] font-bold uppercase mb-1 opacity-75">
                                    <span className="text-white">HOOK {h.matchNum}</span>
                                    <span>ROUND {h.round}</span>
                                </div>
                                <div className="flex items-center gap-2 text-white font-bold">
                                    <span className="bg-black/50 px-1 rounded font-mono">#{h.truck1_number}</span>
                                    <span className="text-xs text-slate-500">vs</span>
                                    <span className="bg-black/50 px-1 rounded font-mono">#{h.truck2_number}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* MAIN STAGE */}
                <div className="flex-grow p-6 bg-gray-200 overflow-y-auto">
                    {activeHook ? (
                        <div className="h-full flex flex-col">
                            <div className="flex items-center justify-center mb-6">
                                <div className="bg-slate-900 text-white px-8 py-2 rounded-full shadow-lg flex items-center gap-4 border border-slate-700">
                                    <span className="text-2xl font-black text-yellow-400">HOOK {activeHook.matchNum}</span>
                                    <span className="text-slate-500">|</span>
                                    <span className="text-lg font-bold text-slate-300 uppercase">ROUND {activeHook.round}</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
                                <DriverCard number={activeHook.truck1_number} name={activeHook.driver1_name} truck={activeHook.truck1_name} hometown={activeHook.hometown1} info={activeHook.info1} colorClass="border-blue-600" />
                                <DriverCard number={activeHook.truck2_number} name={activeHook.driver2_name} truck={activeHook.truck2_name} hometown={activeHook.hometown2} info={activeHook.info2} colorClass="border-green-600" />
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-400 text-2xl font-bold uppercase">Waiting for Bracket...</div>
                    )}
                </div>
            </div>
        )
      )}

      {/* TAB 2: SPONSOR LIST */}
      {activeTab === 'sponsors' && (
        <div className="flex-grow bg-slate-900 p-8 overflow-y-auto">
            <div className="max-w-5xl mx-auto">
                <div className="text-center mb-10">
                    <h2 className="text-yellow-400 font-black italic text-4xl uppercase tracking-widest mb-4">
                        Official Event Sponsors
                    </h2>
                    
                    {/* SPONSOR CONTROLS */}
                    <div className="flex justify-center gap-4">
                        <button 
                            onClick={shuffleSponsors}
                            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded font-bold uppercase text-sm transition-colors"
                        >
                            <span>🔀</span> Shuffle Order
                        </button>
                        <button 
                            onClick={resetReads}
                            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded font-bold uppercase text-sm transition-colors"
                        >
                            <span>↺</span> Reset All
                        </button>
                        <div className="bg-slate-800 px-4 py-2 rounded text-slate-400 font-bold text-sm">
                            Read: <span className="text-white">{readSponsorIds.length}</span> / {sponsors.length}
                        </div>
                    </div>
                </div>
                
                {sponsors.length === 0 ? (
                    <div className="text-center text-slate-600 text-2xl font-bold">No sponsors listed.</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {displaySponsors.map((s) => {
                            const isRead = readSponsorIds.includes(s.id);
                            return (
                                <div 
                                    key={s.id} 
                                    onClick={() => toggleSponsorRead(s.id)}
                                    className={`
                                        p-8 rounded-xl shadow-lg flex items-center justify-center text-center cursor-pointer select-none transition-all duration-300
                                        ${isRead 
                                            ? 'bg-slate-800 text-slate-600 scale-95 opacity-50 border border-slate-700 grayscale' 
                                            : 'bg-white text-slate-900 hover:scale-105 hover:shadow-2xl'
                                        }
                                    `}
                                >
                                    <span className={`text-3xl font-black uppercase leading-tight ${isRead ? 'line-through decoration-4 decoration-slate-700' : ''}`}>
                                        {s.name}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
      )}

    </div>
  );
}