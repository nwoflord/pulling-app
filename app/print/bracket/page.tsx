'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function PrintBracket() {
  const searchParams = useSearchParams();
  const classId = searchParams.get('class_id');
  
  const [hooks, setHooks] = useState<any[]>([]);
  const [className, setClassName] = useState('');

  useEffect(() => {
    if (!classId) return;

    // Fetch Class Name
    fetch('/api/classes').then(res => res.json()).then(data => {
        const cls = data.find((c: any) => c.class_id === classId);
        if (cls) setClassName(cls.name);
    });

    // Fetch Bracket Data
    fetch(`/api/hooks?class_id=${classId}&t=${Date.now()}`)
        .then(res => res.json())
        .then(setHooks);
  }, [classId]);

  // Group hooks by round
  const rounds: Record<number, any[]> = {};
  hooks.forEach(h => {
    if (!rounds[h.round]) rounds[h.round] = [];
    rounds[h.round].push(h);
  });

  const uniqueRounds = Object.keys(rounds).map(Number).sort((a,b) => a-b);
  const maxRound = Math.max(...uniqueRounds);

  return (
    <div className="min-h-screen bg-white text-black font-sans p-8">
      
      {/* PRINT CONTROLS (Hidden when printing) */}
      <div className="print:hidden mb-8 flex justify-between items-center bg-gray-100 p-4 rounded border border-gray-300">
        <div>
            <h2 className="font-bold text-lg">🖨️ Print Preview</h2>
            <p className="text-sm text-gray-500">Use Landscape mode for best results.</p>
        </div>
        <button 
            onClick={() => window.print()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded shadow"
        >
            PRINT NOW
        </button>
      </div>

      {/* HEADER */}
      <div className="text-center mb-8 border-b-2 border-black pb-4">
        <h1 className="text-4xl font-black uppercase tracking-tighter">{className}</h1>
        <p className="text-lg font-bold mt-1">OFFICIAL BRACKET • {new Date().toLocaleDateString()}</p>
      </div>

      {/* BRACKET TREE */}
      <div className="flex justify-center gap-4 align-top">
        {uniqueRounds.map((round) => {
            const isFirstRound = round === 1;
            const isLastRound = round === maxRound;
            
            return (
                <div key={round} className="flex flex-col min-w-[200px]">
                    <div className="text-center font-bold uppercase border-b border-black mb-4 pb-1">
                        {round === maxRound ? 'Champion' : `Round ${round}`}
                    </div>

                    <div className="flex flex-col justify-around flex-grow gap-2">
                        {hooks
                            .filter(h => h.round === round)
                            .sort((a,b) => a.match_order - b.match_order)
                            .map((hook) => (
                                <div key={hook.hook_id} className="flex flex-col justify-center relative flex-1 my-2">
                                    
                                    {/* CONNECTOR LINES (CSS) */}
                                    {!isFirstRound && (
                                        <div className="absolute top-1/2 left-[-16px] w-4 border-b-2 border-black"></div>
                                    )}

                                    {/* MATCH BOX */}
                                    <div className="border-2 border-black rounded p-1 bg-white relative z-10">
                                        <div className="absolute -top-2 -right-2 bg-white border border-black text-[8px] px-1 font-bold">
                                            M{hook.match_order + 1}
                                        </div>

                                        {/* Top Truck */}
                                        <div className={`flex justify-between border-b border-gray-300 px-1 ${hook.winner_entry_id === hook.entry1_id ? 'font-black bg-gray-200' : ''}`}>
                                            <span className="text-sm">
                                                {hook.truck1_number ? `#${hook.truck1_number}` : (round === 1 ? 'BYE' : '')}
                                            </span>
                                            <span className="text-xs truncate max-w-[100px] ml-2">
                                                {hook.driver1_name}
                                            </span>
                                        </div>

                                        {/* Bottom Truck */}
                                        <div className={`flex justify-between px-1 ${hook.winner_entry_id === hook.entry2_id ? 'font-black bg-gray-200' : ''}`}>
                                            <span className="text-sm">
                                                {hook.truck2_number ? `#${hook.truck2_number}` : (round === 1 ? 'BYE' : '')}
                                            </span>
                                            <span className="text-xs truncate max-w-[100px] ml-2">
                                                {hook.driver2_name}
                                            </span>
                                        </div>
                                    </div>

                                    {/* RIGHT SIDE CONNECTORS */}
                                    {!isLastRound && (
                                        <>
                                            <div className="absolute top-1/2 right-[-16px] w-4 h-[50%] border-r-2 border-black rounded-tr-lg translate-y-0"></div>
                                            <div className="absolute bottom-1/2 right-[-16px] w-4 h-[50%] border-r-2 border-black rounded-br-lg translate-y-0"></div>
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
  );
}