'use client';
import { useState, useEffect } from 'react';
import AdminNav from '@/components/AdminNav';

interface ClassItem {
  class_id: string;
  name: string;
}
interface EntryItem {
  entry_id: string;
  driver_name: string;
  truck_name: string;
}
interface HookRecord {
  hook_id: string;
  truck1_name: string;
  truck2_name: string;
  winner_name: string;
  round: number;
}

export default function ResultsPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  
  const [entries, setEntries] = useState<EntryItem[]>([]);
  const [truck1, setTruck1] = useState<string>('');
  const [truck2, setTruck2] = useState<string>('');
  
  const [matchHistory, setMatchHistory] = useState<HookRecord[]>([]);

  // Load Classes
  useEffect(() => {
    fetch('/api/classes').then(res => res.json()).then(setClasses);
  }, []);

  // Load Entries & History when Class selected
  useEffect(() => {
    if (!selectedClassId) {
      setEntries([]);
      setMatchHistory([]);
      return;
    }
    fetch(`/api/entries?class_id=${selectedClassId}`).then(res => res.json()).then(setEntries);
    fetchHistory();
  }, [selectedClassId]);

  const fetchHistory = () => {
    fetch(`/api/hooks?class_id=${selectedClassId}`).then(res => res.json()).then(setMatchHistory);
  };

  const handleWinner = async (winnerId: string) => {
    if (!truck1 || !truck2) return alert("Select two trucks first!");
    if (truck1 === truck2) return alert("A truck cannot pull against itself!");

    const payload = {
      class_id: selectedClassId,
      entry1_id: truck1,       // Matching the new DB column
      entry2_id: truck2,       // Matching the new DB column
      winner_entry_id: winnerId, 
      round: 1
    };

    try {
      const res = await fetch('/api/hooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(await res.text());

      // Reset selection
      setTruck1('');
      setTruck2('');
      fetchHistory(); 
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const getTruckName = (id: string) => entries.find(e => e.entry_id === id)?.truck_name || "Unknown";

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminNav />
      
      <div className="max-w-5xl mx-auto p-6 text-gray-900">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Run Event</h1>

        {/* SELECT CLASS */}
        <div className="mb-8 p-6 bg-white rounded shadow border-l-4 border-blue-600">
          <label className="block text-lg font-bold mb-2">Select Class:</label>
          <select 
            className="w-full p-3 border rounded text-lg text-black bg-gray-50"
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
          >
            <option value="">-- Choose Class --</option>
            {classes.map(c => <option key={c.class_id} value={c.class_id}>{c.name}</option>)}
          </select>
        </div>

        {selectedClassId && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* RECORD MATCH */}
            <div className="bg-white p-6 rounded shadow border-t-4 border-red-600">
              <h2 className="text-2xl font-bold mb-6 text-center">New Matchup</h2>
              <div className="flex flex-col gap-6">
                
                {/* Truck 1 */}
                <div>
                  <label className="block font-bold text-gray-600 mb-1">Truck 1 (Left)</label>
                  <select 
                    className="w-full p-3 border rounded text-black font-bold"
                    value={truck1}
                    onChange={(e) => setTruck1(e.target.value)}
                  >
                    <option value="">-- Select Truck --</option>
                    {entries.map(e => <option key={e.entry_id} value={e.entry_id}>{e.truck_name}</option>)}
                  </select>
                </div>

                <div className="text-center font-black text-xl text-red-600">VS</div>

                {/* Truck 2 */}
                <div>
                  <label className="block font-bold text-gray-600 mb-1">Truck 2 (Right)</label>
                  <select 
                    className="w-full p-3 border rounded text-black font-bold"
                    value={truck2}
                    onChange={(e) => setTruck2(e.target.value)}
                  >
                    <option value="">-- Select Truck --</option>
                    {entries.map(e => <option key={e.entry_id} value={e.entry_id}>{e.truck_name}</option>)}
                  </select>
                </div>

                {/* Buttons */}
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <button 
                    onClick={() => handleWinner(truck1)}
                    disabled={!truck1 || !truck2}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded disabled:bg-gray-300"
                  >
                    {truck1 ? `${getTruckName(truck1)} WINS` : "Select Truck 1"}
                  </button>
                  <button 
                    onClick={() => handleWinner(truck2)}
                    disabled={!truck1 || !truck2}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded disabled:bg-gray-300"
                  >
                    {truck2 ? `${getTruckName(truck2)} WINS` : "Select Truck 2"}
                  </button>
                </div>
              </div>
            </div>

            {/* MATCH HISTORY */}
            <div className="bg-white p-6 rounded shadow">
              <h2 className="text-xl font-bold mb-4 text-gray-800">History</h2>
              {matchHistory.length === 0 ? <p className="text-gray-500 italic">No matches yet.</p> : (
                <div className="space-y-3">
                  {matchHistory.map((hook) => (
                    <div key={hook.hook_id} className="p-3 bg-gray-50 border border-gray-200 rounded flex justify-between items-center">
                      <div className="text-sm">
                        <span className="text-gray-600">{hook.truck1_name}</span>
                        <span className="font-bold text-red-500 mx-2">VS</span>
                        <span className="text-gray-600">{hook.truck2_name}</span>
                      </div>
                      <div className="font-bold text-green-700 bg-green-100 px-2 py-1 rounded text-sm">
                        Winner: {hook.winner_name}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}