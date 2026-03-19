'use client';
import { useState, useEffect, useRef } from 'react';

export default function PitScreen() {
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [hooks, setHooks] = useState<any[]>([]);
  const [entries, setEntries] = useState<any[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isAutoScroll, setIsAutoScroll] = useState(false);
  const bracketContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/classes').then(res => res.json()).then(setClasses);
  }, []);

  useEffect(() => {
    if (!selectedClassId) return;
    fetchBracket();
    const interval = setInterval(fetchBracket, 5000); 
    return () => clearInterval(interval);
  }, [selectedClassId]);

  const fetchBracket = async () => {
    try {
      // Fetch Hooks
      const hooksRes = await fetch(`/api/hooks?class_id=${selectedClassId}&t=${Date.now()}`);
      if (hooksRes.ok) {
        setHooks(await hooksRes.json());
      }

      // Fetch Entries for count
      const entriesRes = await fetch(`/api/entries?class_id=${selectedClassId}`);
      if (entriesRes.ok) {
        setEntries(await entriesRes.json());
      }

      setLastUpdated(new Date());
    } catch(e) { console.error(e); }
  };

  useEffect(() => {
    if (!isAutoScroll || !bracketContainerRef.current) return;

    let requestId: number;
    const container = bracketContainerRef.current;
    
    // Use local variables to track scroll position within the animation loop
    let x = container.scrollLeft;
    let y = container.scrollTop;
    
    const animate = () => {
        if (!isAutoScroll || !bracketContainerRef.current) return;
        
        const maxScrollX = container.scrollWidth - container.clientWidth;
        const maxScrollY = container.scrollHeight - container.clientHeight;

        if (maxScrollX <= 0 && maxScrollY <= 0) return;

        // Increment positions
        if (x < maxScrollX) x += 0.5;
        if (y < maxScrollY) y += 0.2;

        container.scrollLeft = x;
        container.scrollTop = y;

        // If we've reached the end, wait then reset
        if (x >= maxScrollX && y >= maxScrollY) {
            setTimeout(() => {
                if (!isAutoScroll) return;
                x = 0;
                y = 0;
                container.scrollLeft = 0;
                container.scrollTop = 0;
                requestId = requestAnimationFrame(animate);
            }, 5000);
        } else {
            requestId = requestAnimationFrame(animate);
        }
    };

    requestId = requestAnimationFrame(animate);
    return () => {
        if (requestId) cancelAnimationFrame(requestId);
    };
  }, [isAutoScroll, selectedClassId]);

  const sortedHooks = [...hooks].sort((a,b) => a.match_order - b.match_order);
  const upcomingMatches = sortedHooks.filter(h => !h.winner_entry_id && h.entry1_id && h.entry2_id);
  const currentMatch = upcomingMatches[0];
  const onDeckMatch = upcomingMatches[1];
  const inTheHoleMatch = upcomingMatches[2];

  const currentClass = classes.find(c => c.class_id === selectedClassId);

  // Helper: Status Card (Responsive)
  const StatusCard = ({ match, title, colorClass, isMain = false }: any) => {
    return (
      <div className={`
        flex flex-col rounded-xl border-2 shadow-lg overflow-hidden relative flex-shrink-0 
        ${colorClass} 
        ${isMain ? 'bg-slate-900' : 'bg-slate-800'}
        /* MOBILE: Fixed width for horizontal scrolling, shorter height */
        w-[85vw] md:w-full h-32 md:h-auto
        ${isMain ? 'md:h-64' : 'md:h-40'}
      `}>
         <div className={`text-center font-black uppercase tracking-widest py-1 text-white text-[10px] md:text-sm ${colorClass.replace('border-', 'bg-').split(' ')[0]}`}>
            {title}
         </div>
         <div className="flex-grow flex flex-col justify-center items-center p-2 text-center">
            {match ? (
                <>
                    <div className="flex flex-col items-center justify-center w-full">
                        <div className="flex items-center justify-center gap-2 w-full">
                            <div className="flex-1 flex flex-col items-center">
                                <div className={`${isMain ? 'text-4xl md:text-6xl' : 'text-2xl md:text-3xl'} font-black text-white leading-none`}>
                                    #{match.truck1_number || '?'}
                                </div>
                                <div className="text-[10px] md:text-xs uppercase text-slate-400 font-bold truncate max-w-full mt-1">
                                    {match.driver1_name || ''}
                                </div>
                            </div>
                            <div className={`${isMain ? 'text-xl md:text-2xl' : 'text-sm md:text-base'} font-black italic text-yellow-500`}>VS</div>
                            <div className="flex-1 flex flex-col items-center">
                                <div className={`${isMain ? 'text-4xl md:text-6xl' : 'text-2xl md:text-3xl'} font-black text-white leading-none`}>
                                    #{match.truck2_number || '?'}
                                </div>
                                <div className="text-[10px] md:text-xs uppercase text-slate-400 font-bold truncate max-w-full mt-1">
                                    {match.driver2_name || ''}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <span className="text-slate-500 font-bold italic text-sm">Waiting...</span>
            )}
         </div>
      </div>
    );
  };

  const BracketBox = ({ hook, truckNum }: { hook: any, truckNum: 1 | 2 }) => {
    if (!hook) {
        return (
            <div className="bg-slate-800/50 border border-slate-700/50 h-8 md:h-10 w-full rounded flex items-center justify-center">
                <span className="text-slate-600 font-bold text-[8px] md:text-[10px]">TBD</span>
            </div>
        );
    }

    const entryId = truckNum === 1 ? hook.entry1_id : hook.entry2_id;
    const number = truckNum === 1 ? hook.truck1_number : hook.truck2_number;
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
    
    let boxStyle = 'bg-slate-800 border-slate-600'; 
    if (isWinner) {
        boxStyle = 'bg-green-900 border-green-500';
    } else if (isScratched) {
        boxStyle = 'bg-red-900/50 border-red-600 text-red-300';
        statusColor = "text-red-300 line-through decoration-2 decoration-red-500";
    }

    const driver = truckNum === 1 ? hook.driver1_name : hook.driver2_name;

    return (
      <div className={`flex flex-col items-center justify-center rounded border w-full h-10 md:h-12 transition-all relative ${boxStyle}`}>
        <span className={`font-black text-sm md:text-lg tracking-tight leading-none ${statusColor}`}>
            {displayText}
        </span>
        {number && (
            <span className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase truncate max-w-[90%] mt-0.5">
                {driver}
            </span>
        )}
        {isScratched && (
            <span className="absolute -top-2 -right-1 bg-red-600 text-white text-[8px] font-bold px-1 rounded">
                SCR
            </span>
        )}
      </div>
    );
  };

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
            <button 
                onClick={() => setIsAutoScroll(!isAutoScroll)}
                className={`px-3 py-1 rounded text-xs font-bold uppercase transition-colors ${
                    isAutoScroll 
                    ? 'bg-green-500 text-white shadow-[0_0_10px_rgba(34,197,94,0.5)]' 
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
            >
                {isAutoScroll ? 'Auto Scroll: ON' : 'Auto Scroll: OFF'}
            </button>
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

      <div className="flex-grow flex overflow-hidden flex-col md:flex-row">
        {!selectedClassId ? (
            <div className="w-full h-full flex items-center justify-center text-slate-500 text-2xl">Select a Class</div>
        ) : (
            <>
                {/* --- QUEUE SECTION --- */}
                {/* Mobile: Horizontal Scroll Strip / Desktop: Vertical Sidebar */}
                <div className="
                    w-full md:w-1/3 md:max-w-sm 
                    bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 
                    p-2 md:p-4 
                    flex flex-row md:flex-col gap-2 md:gap-4 
                    overflow-x-auto md:overflow-y-auto 
                    z-10 shadow-xl flex-shrink-0
                ">
                    {/* NEW CLASS HEADER */}
                    <div className="
                        flex flex-col bg-slate-900 border-2 border-slate-700/50 p-4 shadow-xl rounded-xl
                        /* Mobile: matches StatusCard width for scroll consistency, min-height to handle wrapping */
                        w-[85vw] md:w-full min-h-[8rem] h-auto
                        flex-shrink-0
                    ">
                        <div className="text-[10px] font-black uppercase text-blue-400 tracking-[0.2em] mb-1">Current Class</div>
                        <h2 className="text-xl md:text-3xl font-black text-white leading-tight uppercase mb-1 md:mb-2 italic">
                            {currentClass?.name || 'Loading...'}
                        </h2>
                        
                        <div className="flex flex-col gap-2">
                            <div className="flex items-start gap-2">
                                <span className="text-[8px] md:text-[10px] bg-yellow-500 text-black font-bold px-1.5 rounded mt-1">SPONSOR</span>
                                <span className="text-xs md:text-lg font-bold text-slate-300 break-words">
                                    {currentClass?.sponsor_name || 'No Sponsor'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[8px] md:text-[10px] bg-slate-700 text-slate-300 font-bold px-1.5 rounded uppercase">Total Trucks</span>
                                <span className="text-sm md:text-2xl font-black text-white">
                                    {entries.length}
                                </span>
                            </div>
                        </div>
                    </div>

                    <StatusCard match={currentMatch} title="Now Pulling" colorClass="border-green-500" isMain={true} />
                    <StatusCard match={onDeckMatch} title="On Deck" colorClass="border-yellow-500" />
                    <StatusCard match={inTheHoleMatch} title="In The Hole" colorClass="border-red-600" />
                </div>

                {/* --- BRACKET SECTION --- */}
                <div ref={bracketContainerRef} className="flex-1 bg-slate-950 p-4 md:p-6 overflow-auto relative scroll-smooth">
                      <div className="flex h-full min-h-[400px] md:min-h-[600px] pl-2 md:pl-4">
                        
                        {(() => {
                            // Calculate proper number of rounds based on round 1 participants
                            const round1MatchesCount = hooks.filter(h => h.round === 1).length;
                            // Add Math.max to prevent log2(0) and log2(1) resolving weirdly when DB hooks fall below 2
                            const baseCount = Math.max(round1MatchesCount, 1);
                            
                            // If we have 2 round 1 matches, it's 2 total rounds (Semis & Finals)
                            // If we have 4 round 1 matches, it's 3 total rounds (Qtrs, Semis, Finals)
                            // So we need Math.ceil(Math.log2(round1MatchesCount * 2)) basically.
                            let calculatedRounds = Math.ceil(Math.log2(baseCount * 2));
                            if (calculatedRounds < 1) calculatedRounds = 1;
                            
                            const getDynamicLabel = (r: number, total: number) => {
                                if (r === total) return "Finals";
                                if (r === total - 1 && total > 1) return "Semi Finals";
                                if (r === total - 2 && total > 2) return "Quarter Finals";
                                return `Round ${r}`;
                            };

                            const roundColumns = [];
                            
                            for (let roundNum = 1; roundNum <= calculatedRounds; roundNum++) {
                                const isFirstRound = roundNum === 1;
                                const isLastRound = roundNum === calculatedRounds;
                                
                                // Fetch real DB hooks for this round
                                let roundHooks = hooks
                                    .filter(h => h.round === roundNum)
                                    .sort((a,b) => a.match_order - b.match_order);
                                
                                // How many total expected brackets in this column? 
                                // Round 1 = baseCount. Round 2 = baseCount/2. Round 3 = baseCount/4...
                                // Handle edge case: baseCount starts odd (e.g. 3). Round 2 needs 2. Round 3 needs 1.
                                const expectedBracketCount = Math.pow(2, calculatedRounds - roundNum);

                                // Inject dummy matchups so the grid always fills visual layout space structurally
                                const renderedHooks = [];
                                for (let i = 0; i < expectedBracketCount; i++) {
                                    if (roundHooks[i]) {
                                         renderedHooks.push(roundHooks[i]);
                                    } else {
                                         // Provide unique fake key so it maps without warnings
                                         renderedHooks.push({ hook_id: `dummy-${roundNum}-${i}`, round: roundNum, dummy: true });
                                    }
                                }

                                roundColumns.push(
                                    <div key={roundNum} className="flex flex-col h-full mr-8 md:mr-16 min-w-[140px] md:min-w-[180px]">
                                        <div className="text-center font-bold text-blue-500 uppercase tracking-widest text-xs md:text-sm mb-4 border-b border-slate-800 pb-2 flex-shrink-0">
                                            {getDynamicLabel(roundNum, calculatedRounds)}
                                        </div>
                                        
                                        <div className="flex flex-col justify-around flex-grow gap-2">
                                            {renderedHooks.map((hook, idx) => {
                                                
                                                // Drawing Tree Logic
                                                // Even indices go down to meet odd indices.
                                                // Since flex places them, we will use pseudo-styling on container edges
                                                const isTopNodeOfPair = idx % 2 === 0;
                                                
                                                return (
                                                  <div key={hook.hook_id} className="flex flex-col gap-1 relative justify-center flex-1 w-full">
                                                      
                                                      {/* INCOMING LINE from Left (Not on Round 1) */}
                                                      {!isFirstRound && (
                                                          <div className="absolute top-1/2 left-[-16px] md:left-[-32px] w-4 md:w-8 border-b-2 border-green-500/50"></div>
                                                      )}
      
                                                      {/* BRACKET BOXES */}
                                                      {hook.dummy ? (
                                                          <>
                                                              <BracketBox hook={null} truckNum={1} />
                                                              <BracketBox hook={null} truckNum={2} />
                                                          </>
                                                      ) : (
                                                          <>
                                                              <BracketBox hook={hook} truckNum={1} />
                                                              <BracketBox hook={hook} truckNum={2} />
                                                          </>
                                                      )}
      
                                                      {/* OUTGOING LINES to Right (Not on Final Round) */}
                                                      {!isLastRound && (
                                                          <>
                                                              {/* Horizontal Stub Out */}
                                                              <div className="absolute top-1/2 right-[-8px] md:right-[-16px] w-2 md:w-4 border-b-2 border-slate-600"></div>
                                                              
                                                              {/* Vertical Drop / Rise */}
                                                              {isTopNodeOfPair ? (
                                                                  // I am top: go down
                                                                  <div className="absolute top-1/2 right-[-8px] md:right-[-16px] w-2 md:w-4 border-r-2 border-slate-600 h-[100%]"></div>
                                                              ) : (
                                                                  // I am bottom: go up
                                                                  <div className="absolute bottom-1/2 right-[-8px] md:right-[-16px] w-2 md:w-4 border-r-2 border-slate-600 h-[100%]"></div>
                                                              )}
                                                          </>
                                                      )}
                                                  </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                );
                            }
                            return roundColumns;
                        })()}

                     </div>
                </div>
            </>
        )}
      </div>
    </div>
  );
}