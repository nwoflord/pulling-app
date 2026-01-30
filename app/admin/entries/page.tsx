'use client';
import { useState, useEffect } from 'react';
import AdminNav from '@/components/AdminNav';

interface EntryItem {
  entry_id: string;
  driver_name: string;
  truck_name: string;
  truck_number: string;
  hometown: string;
  info: string;
}

export default function EntriesPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [entries, setEntries] = useState<EntryItem[]>([]);
  
  // "Master List" (All entries from all classes to use for auto-complete)
  const [masterList, setMasterList] = useState<EntryItem[]>([]);

  // Form State
  const [number, setNumber] = useState('');
  const [driver, setDriver] = useState('');
  const [truckName, setTruckName] = useState('');
  const [hometown, setHometown] = useState('');
  const [info, setInfo] = useState('');
  
  // UI Feedback
  const [autoFilled, setAutoFilled] = useState(false);
  const [loading, setLoading] = useState(false);

  // 1. Initial Load: Get Classes AND Master List
  useEffect(() => {
    fetch('/api/classes').then(res => res.json()).then(setClasses);
    fetch('/api/entries').then(res => res.json()).then(setMasterList); // Fetch all history
  }, []);

  // 2. Class Change: Load entries for THIS class
  useEffect(() => {
    if (selectedClassId) fetchEntries();
    else setEntries([]);
  }, [selectedClassId]);

  const fetchEntries = async () => {
    setLoading(true);
    const res = await fetch(`/api/entries?class_id=${selectedClassId}`);
    if (res.ok) setEntries(await res.json());
    setLoading(false);
  };

  // 3. SMART AUTO-FILL LOGIC
  const handleNumberBlur = () => {
    if (!number) return;

    // Check if this truck is ALREADY in the CURRENT class (Duplicate Prevention)
    const isDuplicate = entries.find(e => e.truck_number === number);
    if (isDuplicate) {
        alert(`Warning: Truck #${number} is already entered in this class!`);
        return;
    }

    // Search Master List for this truck #
    const knownTruck = masterList.find(e => e.truck_number === number);
    
    if (knownTruck) {
        // Auto-fill details
        setDriver(knownTruck.driver_name); // Suggest the usual driver
        setTruckName(knownTruck.truck_name || '');
        setHometown(knownTruck.hometown || '');
        setInfo(knownTruck.info || '');
        setAutoFilled(true);
        
        // Clear success message after 3 seconds
        setTimeout(() => setAutoFilled(false), 3000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId) return alert("Select a class");

    const payload = {
      class_id: selectedClassId,
      truck_number: number,
      driver_name: driver,
      truck_name: truckName,
      hometown,
      info
    };

    const res = await fetch('/api/entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      // Clear Form
      setNumber('');
      setDriver('');
      setTruckName('');
      setHometown('');
      setInfo('');
      setAutoFilled(false);
      
      // Refresh Lists
      fetchEntries(); // Update current list
      // Also update master list so this new entry becomes the "latest" version for next time
      const newEntry = await res.json();
      setMasterList(prev => [newEntry, ...prev]); 
      
    } else {
      alert("Error adding entry");
    }
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Delete entry?")) return;
    await fetch(`/api/entries?id=${id}`, { method: 'DELETE' });
    fetchEntries();
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminNav />
      <div className="max-w-6xl mx-auto p-6 text-gray-900">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Registration</h1>

        {/* 1. SELECT CLASS */}
        <div className="mb-8 bg-white p-4 rounded shadow border-l-4 border-blue-600">
          <label className="font-bold text-gray-700 block mb-2">Select Class:</label>
          <select 
            className="w-full p-2 border rounded text-black text-lg"
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
          >
            <option value="">-- Choose Class --</option>
            {classes.map(c => <option key={c.class_id} value={c.class_id}>{c.name}</option>)}
          </select>
        </div>

        {selectedClassId && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* 2. REGISTRATION FORM (Left Side) */}
            <div className="lg:col-span-5 bg-white p-6 rounded shadow h-fit relative">
              <h2 className="text-xl font-bold mb-4 border-b pb-2">New Entry</h2>
              
              {/* Success Badge */}
              {autoFilled && (
                <div className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded absolute top-6 right-6 border border-green-200 animate-pulse">
                    ✓ Found Truck Info
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                
                <div className="grid grid-cols-4 gap-4">
                  <div className="col-span-1">
                    <label className="block text-xs font-bold text-gray-600">Truck #</label>
                    <input 
                      className="w-full border p-2 rounded font-bold text-center text-black focus:ring-2 focus:ring-blue-500 outline-none" 
                      required 
                      value={number} 
                      onChange={e => setNumber(e.target.value)} 
                      onBlur={handleNumberBlur} // <--- MAGIC HAPPENS HERE
                      placeholder="101"
                      autoComplete="off"
                    />
                  </div>
                  <div className="col-span-3">
                    <label className="block text-xs font-bold text-gray-600">Driver Name</label>
                    <input 
                      className="w-full border p-2 rounded text-black focus:ring-2 focus:ring-blue-500 outline-none" 
                      required 
                      value={driver} 
                      onChange={e => setDriver(e.target.value)} 
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600">Truck Name (Optional)</label>
                  <input 
                    className="w-full border p-2 rounded text-black" 
                    value={truckName} 
                    onChange={e => setTruckName(e.target.value)} 
                    placeholder="e.g. Iron Man"
                  />
                </div>

                {/* Announcer Fields */}
                <div className="bg-blue-50 p-3 rounded border border-blue-100">
                  <p className="text-xs text-blue-800 font-bold mb-2 uppercase">Announcer Info</p>
                  <div className="mb-2">
                    <label className="block text-xs text-gray-500">Hometown</label>
                    <input 
                      className="w-full border p-2 rounded text-black text-sm" 
                      value={hometown} 
                      onChange={e => setHometown(e.target.value)} 
                      placeholder="e.g. Springfield, IL"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500">Fun Fact / Info</label>
                    <input 
                      className="w-full border p-2 rounded text-black text-sm" 
                      value={info} 
                      onChange={e => setInfo(e.target.value)} 
                      placeholder="e.g. Sponsored by NAPA"
                    />
                  </div>
                </div>

                <button className="w-full bg-green-700 hover:bg-green-800 text-white font-bold py-3 rounded shadow-md transition-colors">
                  Add Entry
                </button>
              </form>
            </div>

            {/* 3. ENTRY LIST (Right Side) */}
            <div className="lg:col-span-7 bg-white p-6 rounded shadow">
              <h2 className="text-xl font-bold mb-4">Entries ({entries.length})</h2>
              {loading ? <p>Loading...</p> : (
                <div className="grid gap-3">
                  {entries.map(e => (
                    <div key={e.entry_id} className="flex justify-between items-center p-3 border rounded hover:bg-gray-50">
                      <div className="flex items-center gap-4">
                        {/* BIG NUMBER BADGE */}
                        <div className="bg-slate-900 text-white font-black text-xl px-3 py-2 rounded">
                          {e.truck_number}
                        </div>
                        
                        <div>
                          <div className="font-bold text-lg text-gray-900">{e.driver_name}</div>
                          <div className="text-xs text-gray-500">
                            {e.truck_name && <span className="italic mr-2">{e.truck_name}</span>}
                            {e.hometown && <span>• {e.hometown}</span>}
                          </div>
                        </div>
                      </div>

                      <button 
                        onClick={() => handleDelete(e.entry_id)}
                        className="text-red-500 font-bold text-xs border border-red-200 px-2 py-1 rounded hover:bg-red-50"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  {entries.length === 0 && <div className="text-gray-400 italic">No entries yet. Start typing a number!</div>}
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}