'use client';
import { useState, useEffect } from 'react';
import AdminNav from '@/components/AdminNav';

export default function ReportsPage() {
  const [reportData, setReportData] = useState<any[]>([]);
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'financial' | 'winners'>('financial');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [reportsRes, entriesRes] = await Promise.all([
          fetch('/api/reports'),
          fetch('/api/entries')
      ]);

      if (reportsRes.ok && entriesRes.ok) {
          setReportData(await reportsRes.json());
          setEntries(await entriesRes.json());
      }
    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  };

  // --- CALCULATIONS ---
  
  // NEW: Helper to round to nearest $5.00
  const roundToFive = (amount: number) => {
    return Math.round(amount / 5) * 5;
  };

  const calculateData = (row: any) => {
    const count = parseInt(row.entry_count || 0);
    const fee = parseFloat(row.hook_fee || 0);
    const added = parseFloat(row.added_money || 0);
    const percent = parseFloat(row.payback_percent || 100) / 100;
    
    // Total Pot is raw calculation
    const totalPot = (count * fee * percent) + added;

    let payouts: number[] = [];
    if (row.payout_split && typeof row.payout_split === 'object') {
        const splits = Object.values(row.payout_split).map((v: any) => parseFloat(v));
        
        // APPLY ROUNDING HERE
        payouts = splits.map((p) => {
            const rawAmount = totalPot * (p / 100);
            return roundToFive(rawAmount);
        });
    }
    return { count, fee, added, totalPot, payouts };
  };

  // --- ACTIONS ---
  const assignWinner = async (classId: string, entryId: string, position: number) => {
    await fetch('/api/entries', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            action: 'update_finish', 
            class_id: classId,
            entry_id: entryId, 
            finish_position: position 
        })
    });
    fetchData(); // Refresh to show update
  };

  // --- EXPORTS ---
  const exportWinners = () => {
    const headers = ['Class', 'Position', 'Payout Amount', 'Truck #', 'Driver', 'Payee Signature'];
    const rows: string[] = [];

    reportData.forEach(cls => {
        const { payouts } = calculateData(cls);
        const classEntries = entries.filter(e => e.class_id === cls.class_id);

        payouts.forEach((amt, index) => {
            const pos = index + 1;
            const winner = classEntries.find(e => e.finish_position === pos);
            
            rows.push([
                `"${cls.name}"`,
                `${pos}st`,
                `$${amt.toFixed(2)}`, // This will now show the rounded amount .00
                winner ? `#${winner.truck_number}` : 'unassigned',
                winner ? `"${winner.driver_name}"` : '',
                '' // Blank for signature
            ].join(','));
        });
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csvContent], { type: 'text/csv' }));
    link.setAttribute('download', `Winners_Report_${new Date().getFullYear()}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  // Helper for grand totals
  const grandTotalPot = reportData.reduce((acc, r) => acc + calculateData(r).totalPot, 0);

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-900 pb-20">
      <AdminNav />
      <div className="max-w-7xl mx-auto p-6">
        
        {/* HEADER & TABS */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                <span>📊</span> Event Reports
            </h1>
            
            <div className="flex bg-white rounded-lg shadow p-1">
                <button 
                    onClick={() => setActiveTab('financial')}
                    className={`px-4 py-2 rounded font-bold transition-all ${activeTab === 'financial' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                    Financial Overview
                </button>
                <button 
                    onClick={() => setActiveTab('winners')}
                    className={`px-4 py-2 rounded font-bold transition-all ${activeTab === 'winners' ? 'bg-green-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                    Winners & Payouts
                </button>
            </div>
        </div>

        {/* TAB: FINANCIAL OVERVIEW */}
        {activeTab === 'financial' && (
            <div className="animate-in fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl shadow border-l-4 border-blue-500">
                        <div className="text-gray-500 font-bold uppercase text-xs tracking-widest mb-1">Total Entries</div>
                        <div className="text-4xl font-black text-gray-800">
                            {reportData.reduce((acc, r) => acc + parseInt(r.entry_count || 0), 0)}
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow border-l-4 border-green-500">
                        <div className="text-gray-500 font-bold uppercase text-xs tracking-widest mb-1">Total Purse</div>
                        <div className="text-4xl font-black text-green-700">${grandTotalPot.toLocaleString()}</div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-bold tracking-wider border-b">
                            <tr>
                                <th className="p-4">Class</th>
                                <th className="p-4 text-center">Count</th>
                                <th className="p-4 text-right">Pot</th>
                                <th className="p-4">Projected Payouts (Rounded)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {reportData.map(row => {
                                const { totalPot, payouts } = calculateData(row);
                                return (
                                    <tr key={row.class_id}>
                                        <td className="p-4 font-bold">{row.name}</td>
                                        <td className="p-4 text-center">{row.entry_count}</td>
                                        <td className="p-4 text-right font-mono font-bold text-green-700">${totalPot.toLocaleString()}</td>
                                        <td className="p-4 text-xs">
                                            {payouts.map((p, i) => (
                                                <span key={i} className="mr-2 bg-gray-100 px-2 py-1 rounded border">
                                                    {i+1}st: <b>${p.toFixed(0)}</b>
                                                </span>
                                            ))}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* TAB: WINNERS MANAGER */}
        {activeTab === 'winners' && (
            <div className="animate-in fade-in">
                <div className="flex justify-end mb-6">
                    <button 
                        onClick={exportWinners}
                        className="bg-green-700 hover:bg-green-800 text-white font-bold py-3 px-6 rounded-lg shadow-lg flex items-center gap-2"
                    >
                        <span>💾</span> Download Payout Report (CSV)
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-8">
                    {reportData.map(row => {
                        const { totalPot, payouts } = calculateData(row);
                        const classEntries = entries.filter(e => e.class_id === row.class_id);

                        // If no split defined, skip
                        if(payouts.length === 0) return null;

                        return (
                            <div key={row.class_id} className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
                                <div className="bg-slate-50 p-4 border-b border-gray-200 flex justify-between items-center">
                                    <h2 className="text-xl font-black text-slate-800">{row.name}</h2>
                                    <span className="text-green-700 font-bold font-mono text-lg">Pot: ${totalPot.toLocaleString()}</span>
                                </div>
                                <div className="p-4">
                                    {payouts.map((amt, i) => {
                                        const position = i + 1;
                                        // Find who currently has this position
                                        const winner = classEntries.find(e => e.finish_position === position);

                                        return (
                                            <div key={i} className="flex items-center gap-4 py-3 border-b last:border-0">
                                                <div className="w-24 flex-shrink-0">
                                                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                                        {position === 1 ? '🥇 1st' : position === 2 ? '🥈 2nd' : position === 3 ? '🥉 3rd' : `${position}th`}
                                                    </div>
                                                    <div className="font-mono font-black text-xl text-green-600">
                                                        ${amt.toFixed(2)}
                                                    </div>
                                                </div>

                                                <div className="flex-grow">
                                                    {/* DROPDOWN SELECTOR */}
                                                    <select 
                                                        className={`w-full p-2 border-2 rounded font-bold cursor-pointer outline-none ${winner ? 'border-green-500 bg-green-50 text-green-900' : 'border-gray-200 text-gray-400'}`}
                                                        value={winner ? winner.entry_id : ''}
                                                        onChange={(e) => assignWinner(row.class_id, e.target.value, position)}
                                                    >
                                                        <option value="">-- Select Winner --</option>
                                                        {classEntries.map(e => (
                                                            <option key={e.entry_id} value={e.entry_id}>
                                                                #{e.truck_number} - {e.driver_name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        )}

      </div>
    </div>
  );
}