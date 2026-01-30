'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RegistrationStation() {
  const router = useRouter();
  const [classes, setClasses] = useState<any[]>([]);
  
  // DATA STATE
  const [activeEntries, setActiveEntries] = useState<any[]>([]);
  const [pendingEntries, setPendingEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // FILTER STATE
  const [searchTerm, setSearchTerm] = useState('');

  // MANUAL FORM STATE
  const [targetClassIds, setTargetClassIds] = useState<string[]>([]);
  const [number, setNumber] = useState('');
  const [driver, setDriver] = useState('');
  const [truckName, setTruckName] = useState('');
  const [hometown, setHometown] = useState('');
  const [info, setInfo] = useState('');

  useEffect(() => {
    const init = async () => {
        setLoading(true);
        const [classRes, entryRes] = await Promise.all([
            fetch('/api/classes'),
            fetch('/api/entries') 
        ]);

        if (classRes.ok && entryRes.ok) {
            const classData = await classRes.json();
            const entryData = await entryRes.json();
            setClasses(classData);
            processEntries(entryData, classData);
        }
        setLoading(false);
    };
    init();
  }, []);

  const processEntries = (entries: any[], classList: any[]) => {
    const classMap: Record<string, string> = {};
    classList.forEach(c => classMap[c.class_id] = c.name);

    const withNames = entries.map(e => ({
        ...e,
        className: classMap[e.class_id] || 'Unknown Class'
    }));

    setActiveEntries(withNames.filter(e => e.checked_in));
    setPendingEntries(withNames.filter(e => !e.checked_in));
  };

  const refreshData = async () => {
    const res = await fetch('/api/entries');
    if (res.ok) {
        processEntries(await res.json(), classes);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (targetClassIds.length === 0) return alert("Select at least one class.");

    // Loop through selected classes to handle potential multiple failures gracefully
    let successCount = 0;

    for (const classId of targetClassIds) {
        const res = await fetch('/api/entries', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                class_id: classId,
                truck_number: number,
                driver_name: driver,
                truck_name: truckName,
                hometown,
                info,
                checked_in: true 
            })
        });
        if (res.ok) successCount++;
    }

    if (successCount > 0) {
      setNumber(''); setDriver(''); setTruckName(''); setHometown(''); setInfo('');
      setTargetClassIds([]); 
      refreshData();
      alert(`Successfully added entry to ${successCount} classes!`);
    } else {
      alert("Failed to add entry. The selected class might be closed.");
    }
  };

  // --- SMART CHECK-IN ---
  const handleCheckIn = async (entry: any) => {
    // 1. Find other pending entries for this same driver
    const matches = pendingEntries.filter(e => 
        e.driver_name.toLowerCase() === entry.driver_name.toLowerCase() && 
        e.entry_id !== entry.entry_id
    );

    let idsToCheckIn = [entry.entry_id];
    let confirmMsg = `Confirm payment for ${entry.driver_name} (${entry.className})?`;

    // 2. If Matches Found, ask to Batch
    if (matches.length > 0) {
        const otherClasses = matches.map(m => m.className).join(', ');
        const doBatch = confirm(
            `Found ${matches.length} other pending entries for ${entry.driver_name}:\n\n` + 
            `Also in: ${otherClasses}\n\n` + 
            `Do you want to check ALL of them in at once?`
        );
        
        if (doBatch) {
            idsToCheckIn = [entry.entry_id, ...matches.map(m => m.entry_id)];
            confirmMsg = `Confirm TOTAL payment for ${idsToCheckIn.length} entries for ${entry.driver_name}?`;
        }
    }

    // 3. Confirm Payment
    if (!confirm(confirmMsg)) return;

    // 4. Assign Truck Number
    let truckNum = entry.truck_number;
    const input = prompt(`Assign Truck Number for ${entry.driver_name}:`, "");
    if (!input || input.trim() === "") return; 
    truckNum = input;

    // 5. Send Batch Update
    await fetch('/api/entries', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            action: 'check_in', 
            entry_ids: idsToCheckIn, 
            truck_number: truckNum
        })
    });
    refreshData();
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Remove this entry?")) return;
    await fetch(`/api/entries?id=${id}`, { method: 'DELETE' });
    refreshData();
  };

  const handleLogout = () => {
    document.cookie = "auth=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    router.push('/');
    router.refresh();
  };

  // THIS WAS THE FUNCTION WITH THE TYPO IN THE JSX
  const toggleTargetClass = (c: any) => {
    // LOCK CHECK
    if (c.is_locked) {
        alert("This class is CLOSED because the bracket has started. No new manual entries allowed.");
        return;
    }
    const id = c.class_id;
    setTargetClassIds(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  const filterList = (list: any[]) => {
    if (!searchTerm) return list;
    const lower = searchTerm.toLowerCase();
    return list.filter(e => 
        e.driver_name.toLowerCase().includes(lower) || 
        e.truck_number.includes(lower) ||
        e.className.toLowerCase().includes(lower)
    );
  };

  const displayedPending = filterList(pendingEntries);
  const displayedActive = filterList(activeEntries);

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-gray-900">
      
      {/* HEADER */}
      <div className="bg-slate-900 text-white p-4 shadow-md mb-6 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
                <span className="text-3xl">📝</span>
                <h1 className="text-2xl font-black italic uppercase tracking-tighter">
                    REGISTRATION<span className="text-yellow-400">STATION</span>
                </h1>
            </div>

            <div className="flex-grow max-w-md mx-4 relative w-full text-slate-800">
                <input 
                    type="text" 
                    placeholder="Search Driver, Number, or Class..." 
                    className="w-full pl-10 pr-4 py-2 rounded-full bg-white text-black font-bold outline-none focus:ring-2 focus:ring-yellow-400 shadow-sm"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
                <span className="absolute left-3 top-2.5 text-slate-400">🔍</span>
            </div>

            <button onClick={handleLogout} className="text-xs font-bold text-red-400 hover:text-red-300 border border-red-900 hover:border-red-400 px-3 py-1 rounded transition-colors uppercase">
                Log Out
            </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        
        {loading ? <div className="text-center py-20 text-2xl font-bold text-slate-400">Loading Rosters...</div> : (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            
            {/* 1. MANUAL ENTRY FORM */}
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 h-fit order-2 xl:order-1">
              <h2 className="text-xl font-black text-gray-800 mb-4 flex items-center gap-2"><span>➕</span> Manual Entry</h2>
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div className="bg-slate-50 p-3 rounded border border-slate-200 max-h-40 overflow-y-auto">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Select Classes:</label>
                    <div className="space-y-1">
                        {classes.map(c => {
                            const isLocked = c.is_locked;
                            return (
                                <label 
                                    key={c.class_id} 
                                    className={`flex items-center gap-2 p-1 rounded ${isLocked ? 'opacity-50 cursor-not-allowed bg-slate-100' : 'cursor-pointer hover:bg-slate-100'}`}
                                >
                                    <input 
                                        type="checkbox" 
                                        checked={targetClassIds.includes(c.class_id)}
                                        // FIX: Changed 'toggleClass' to 'toggleTargetClass'
                                        onChange={() => toggleTargetClass(c)}
                                        disabled={isLocked}
                                        className="w-4 h-4 text-blue-600 rounded disabled:opacity-50"
                                    />
                                    <span className={`text-sm font-bold ${targetClassIds.includes(c.class_id) ? 'text-blue-700' : 'text-slate-600'}`}>
                                        {c.name} {isLocked && <span className="text-red-500 text-[10px] ml-1">(CLOSED)</span>}
                                    </span>
                                </label>
                            );
                        })}
                    </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div className="col-span-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Truck #</label>
                    <input className="w-full border-2 border-gray-300 p-2 rounded font-black text-xl text-center" required value={number} onChange={e => setNumber(e.target.value)} />
                  </div>
                  <div className="col-span-3">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Driver Name</label>
                    <input className="w-full border-2 border-gray-300 p-2 rounded font-bold" required value={driver} onChange={e => setDriver(e.target.value)} />
                  </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Truck Name</label>
                    <input className="w-full border-2 border-gray-300 p-2 rounded" value={truckName} onChange={e => setTruckName(e.target.value)} />
                </div>
                <div className="bg-slate-50 p-3 rounded border">
                    <div className="grid grid-cols-1 gap-2">
                      <input className="w-full border p-2 rounded text-sm" value={hometown} onChange={e => setHometown(e.target.value)} placeholder="Hometown" />
                      <input className="w-full border p-2 rounded text-sm" value={info} onChange={e => setInfo(e.target.value)} placeholder="Sponsor Info" />
                    </div>
                </div>
                <button className="w-full bg-slate-800 text-white font-bold py-3 rounded hover:bg-slate-700">Add Entry ({targetClassIds.length} Classes)</button>
              </form>
            </div>

            {/* 2. PENDING LIST (Global) */}
            <div className="bg-yellow-50 p-6 rounded-xl shadow-lg border-2 border-yellow-200 h-fit order-1 xl:order-2">
                <div className="flex justify-between items-center mb-4 border-b border-yellow-200 pb-2">
                    <h2 className="text-xl font-black text-yellow-800">Pending Pre-Reg</h2>
                    <span className="bg-yellow-200 text-yellow-900 font-bold px-2 py-1 rounded-full text-xs">{displayedPending.length}</span>
                </div>
                
                {displayedPending.length === 0 ? (
                    <p className="text-yellow-600 italic text-sm text-center py-4">No pending registrations found.</p>
                ) : (
                    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                        {displayedPending.map(e => (
                            <div key={e.entry_id} className="bg-white p-3 rounded shadow-sm border border-yellow-100 relative">
                                <div className="absolute top-2 right-2 bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                                    {e.className}
                                </div>
                                <div className="pr-12">
                                    <div className="font-bold text-lg text-slate-800 leading-tight">{e.driver_name}</div>
                                    <div className="text-xs text-slate-500 font-medium mt-1">
                                        {e.truck_name && <span className="text-blue-600 font-bold mr-1">{e.truck_name}</span>}
                                        {e.hometown}
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleCheckIn(e)}
                                    className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white text-sm font-black uppercase py-2 rounded shadow transition-transform active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <span>$$</span> Accept Payment
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 3. ACTIVE ROSTER (Global) */}
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 h-fit order-3">
              <div className="flex justify-between items-center mb-4 border-b pb-2">
                  <h2 className="text-xl font-black text-green-800">Active Roster</h2>
                  <span className="bg-green-100 text-green-800 font-bold px-2 py-1 rounded-full text-xs">{displayedActive.length}</span>
              </div>
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                  {displayedActive.map(e => (
                    <div key={e.entry_id} className="flex justify-between items-center p-2 border border-gray-100 rounded hover:bg-slate-50 group">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="bg-slate-800 text-white font-bold text-sm w-8 h-8 flex-shrink-0 flex items-center justify-center rounded">
                            {e.truck_number}
                        </div>
                        <div className="min-w-0">
                            <div className="font-bold text-sm text-slate-700 truncate">{e.driver_name}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide truncate">{e.className}</div>
                        </div>
                      </div>
                      <button onClick={() => handleDelete(e.entry_id)} className="text-red-400 hover:text-red-600 text-[10px] font-bold uppercase opacity-0 group-hover:opacity-100 ml-2">
                        Remove
                      </button>
                    </div>
                  ))}
                  {displayedActive.length === 0 && <p className="text-gray-400 text-xs italic text-center">No active entries.</p>}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}