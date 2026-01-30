'use client';
import { useState, useEffect } from 'react';
import AdminNav from '@/components/AdminNav'; 

interface ClassItem {
  class_id: number;
  name: string;
  sponsor_name: string; 
  hook_fee: number;
  added_money: number;
  payout_distribution: number[];
}

export default function ClassSetupForm() {
  const [name, setName] = useState('');
  const [sponsor, setSponsor] = useState('');
  const [addedMoney, setAddedMoney] = useState('');
  const [hookFee, setHookFee] = useState('');
  
  const [numPlaces, setNumPlaces] = useState(1); 
  const [percentages, setPercentages] = useState<string[]>(['100']); 
  const [total, setTotal] = useState(100);

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const res = await fetch('/api/classes');
      if (res.ok) {
        const data = await res.json();
        setClasses(data);
      }
    } catch (error) {
      console.error("Failed to fetch classes", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this class?")) return;

    try {
      const res = await fetch(`/api/classes?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.text());
      setClasses(classes.filter((c) => c.class_id !== id));
    } catch (error: any) {
      alert("Error deleting: " + error.message);
    }
  };

  useEffect(() => {
    setPercentages((prev) => {
      const newArr = [...prev];
      if (newArr.length < numPlaces) {
        while (newArr.length < numPlaces) newArr.push('');
      } else {
        newArr.length = numPlaces;
      }
      return newArr;
    });
  }, [numPlaces]);

  useEffect(() => {
    const sum = percentages.reduce((acc, val) => acc + (Number(val) || 0), 0);
    setTotal(sum);
  }, [percentages]);

  const handlePercentageChange = (index: number, value: string) => {
    const newPercentages = [...percentages];
    newPercentages[index] = value;
    setPercentages(newPercentages);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (total !== 100) {
      alert(`Percentages must equal 100%. Currently: ${total}%`);
      return;
    }

    const payload = {
      name,
      sponsor,                  
      added_money: Number(addedMoney),
      hook_fee: Number(hookFee),
      payout_distribution: percentages.map((p) => Number(p)),
    };

    try {
      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(await res.text());

      alert('Class Created Successfully!');
      setName('');
      setSponsor('');
      setAddedMoney('');
      setHookFee('');
      setNumPlaces(1);
      setPercentages(['100']);
      fetchClasses();
    } catch (error: any) {
      console.error(error);
      alert('Error creating class: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 pb-20">
      <AdminNav />
      <div className="max-w-4xl mx-auto p-6">
        
        {/* PAGE TITLE */}
        <h1 className="text-3xl font-bold mb-8 text-slate-800 flex items-center gap-2">
            <span>🚜</span> Manage Classes
        </h1>

        {/* CREATE FORM CARD */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 mb-10">
          <h2 className="text-xl font-bold mb-6 text-slate-800 flex items-center gap-2">
             <span>➕</span> Create New Class
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* ROW 1: Name & Sponsor */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Class Name</label>
                    <input 
                        type="text" 
                        className="w-full border-2 border-slate-300 p-3 rounded-lg text-slate-900 font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        required 
                        placeholder="e.g. 6200lb Pro Stock" 
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Class Sponsor</label>
                    <input 
                        type="text" 
                        className="w-full border-2 border-slate-300 p-3 rounded-lg text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all" 
                        value={sponsor} 
                        onChange={(e) => setSponsor(e.target.value)} 
                        placeholder="e.g. Napa Auto Parts" 
                    />
                </div>
            </div>

            {/* ROW 2: Money */}
            <div className="grid grid-cols-2 gap-6">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Added Money ($)</label>
                    <input 
                        type="number" 
                        className="w-full border-2 border-slate-300 p-3 rounded-lg text-slate-900 font-bold outline-none focus:border-green-500 focus:ring-4 focus:ring-green-50 transition-all" 
                        value={addedMoney} 
                        onChange={(e) => setAddedMoney(e.target.value)} 
                        placeholder="500" 
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Hook Fee ($)</label>
                    <input 
                        type="number" 
                        className="w-full border-2 border-slate-300 p-3 rounded-lg text-slate-900 font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all" 
                        value={hookFee} 
                        onChange={(e) => setHookFee(e.target.value)} 
                        required 
                        placeholder="50" 
                    />
                </div>
            </div>

            <hr className="border-slate-200" />
            
            {/* PAYOUT LOGIC */}
            <div className="bg-slate-50 p-5 rounded-lg border border-slate-200">
                <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide">Payout Structure</label>
                
                <div className="flex items-center gap-4 mb-4">
                    <span className="text-sm font-bold text-slate-500">Places Paid:</span>
                    <select 
                        value={numPlaces} 
                        onChange={(e) => setNumPlaces(Number(e.target.value))} 
                        className="border-2 border-slate-300 p-2 rounded-lg text-slate-900 font-bold outline-none focus:border-blue-500 cursor-pointer"
                    >
                        <option value={1}>1 Place</option>
                        <option value={2}>2 Places</option>
                        <option value={3}>3 Places</option>
                        <option value={4}>4 Places</option>
                    </select>
                </div>

                <div className="space-y-3">
                    {percentages.map((p, index) => (
                    <div key={index} className="flex items-center gap-3">
                        <span className="w-12 text-sm font-bold text-slate-500 text-right">
                            {index === 0 ? '1st' : index === 1 ? '2nd' : index === 2 ? '3rd' : '4th'}
                        </span>
                        <div className="relative">
                            <input 
                                type="number" 
                                className="w-24 border-2 border-slate-300 p-2 pr-8 rounded text-right font-bold text-slate-900 outline-none focus:border-blue-500" 
                                value={p} 
                                onChange={(e) => handlePercentageChange(index, e.target.value)} 
                                placeholder="0" 
                            />
                            <span className="absolute right-3 top-2.5 text-slate-400 font-bold">%</span>
                        </div>
                    </div>
                    ))}
                </div>
                
                <div className={`mt-4 text-sm font-bold text-right flex justify-end items-center gap-2 ${total === 100 ? 'text-green-600' : 'text-red-500'}`}>
                    <span>Total Distribution:</span>
                    <span className="text-lg">{total}%</span>
                    {total !== 100 && <span className="text-xs bg-red-100 px-2 py-1 rounded text-red-700 border border-red-200">Must equal 100%</span>}
                </div>
            </div>

            <button 
                type="submit" 
                disabled={total !== 100} 
                className={`w-full font-black uppercase tracking-widest p-4 rounded-lg shadow-lg transition-transform active:scale-[0.99] ${total === 100 ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-slate-300 text-slate-500 cursor-not-allowed'}`}
            >
                Create Class
            </button>
          </form>
        </div>

        {/* EXISTING CLASSES LIST */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
          <h2 className="text-xl font-bold mb-6 text-slate-800 flex items-center gap-2">
            <span>📋</span> Existing Classes
          </h2>
          
          {loading ? (
            <div className="text-center py-10 text-slate-400 font-bold">Loading classes...</div>
          ) : classes.length === 0 ? (
            <div className="text-center py-10 text-slate-400 italic bg-slate-50 rounded-lg border border-slate-100">
                No classes created yet. Use the form above to add one.
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="p-4 font-bold text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">Class Name</th>
                    <th className="p-4 font-bold text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">Sponsor</th>
                    <th className="p-4 font-bold text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">Fee</th>
                    <th className="p-4 font-bold text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">Added</th>
                    <th className="p-4 font-bold text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">Payout</th>
                    <th className="p-4 font-bold text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {classes.map((c) => (
                    <tr key={c.class_id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 text-slate-800 font-bold">{c.name}</td>
                      <td className="p-4 text-slate-500 text-sm font-medium">{c.sponsor_name || '-'}</td>
                      <td className="p-4 text-slate-800 font-mono">${c.hook_fee}</td>
                      <td className="p-4 text-green-700 font-bold font-mono">${c.added_money}</td>
                      <td className="p-4 text-slate-500 text-xs font-medium">
                        {Array.isArray(c.payout_distribution) 
                          ? c.payout_distribution.map(p => `${p}%`).join(' / ') 
                          : 'Custom'}
                      </td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => handleDelete(c.class_id)}
                          className="text-red-500 hover:text-white border border-red-200 hover:bg-red-500 font-bold text-xs uppercase px-3 py-1 rounded transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}