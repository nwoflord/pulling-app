'use client';
import { useState, useEffect } from 'react';
import AdminNav from '@/components/AdminNav';

export default function SponsorManager() {
  const [sponsors, setSponsors] = useState<any[]>([]);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    fetchSponsors();
  }, []);

  const fetchSponsors = async () => {
    const res = await fetch('/api/sponsors');
    if (res.ok) setSponsors(await res.json());
  };

  const addSponsor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;

    await fetch('/api/sponsors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName })
    });
    
    setNewName('');
    fetchSponsors();
  };

  const deleteSponsor = async (id: string) => {
    if(!confirm("Remove this sponsor?")) return;
    await fetch(`/api/sponsors?id=${id}`, { method: 'DELETE' });
    fetchSponsors();
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-900">
      <AdminNav />
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">Event Sponsors</h1>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            
            {/* ADD FORM */}
            <form onSubmit={addSponsor} className="flex gap-4 mb-8">
                <input 
                    className="flex-grow border-2 border-gray-300 p-3 rounded-lg text-lg focus:border-blue-500 outline-none"
                    placeholder="Enter Sponsor Name (e.g. Bob's Towing)"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    autoFocus
                />
                <button className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 rounded-lg text-lg">
                    Add
                </button>
            </form>

            {/* LIST */}
            <div className="space-y-2">
                {sponsors.map(s => (
                    <div key={s.id} className="flex justify-between items-center p-4 bg-gray-50 border rounded hover:bg-white hover:shadow transition-all">
                        <span className="font-bold text-xl text-gray-800">{s.name}</span>
                        <button 
                            onClick={() => deleteSponsor(s.id)}
                            className="text-red-500 hover:text-red-700 font-bold text-sm border border-red-200 px-3 py-1 rounded"
                        >
                            Remove
                        </button>
                    </div>
                ))}
                {sponsors.length === 0 && (
                    <div className="text-center text-gray-400 italic py-10">
                        No sponsors added yet.
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}