'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function PublicPayouts() {
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/reports')
      .then(res => res.json())
      .then(data => {
        setReportData(data);
        setLoading(false);
      })
      .catch(err => console.error(err));
  }, []);

  // --- CALCULATION LOGIC (With Rounding) ---
  const roundToFive = (amount: number) => {
    return Math.round(amount / 5) * 5;
  };

  const calculatePayouts = (row: any) => {
    const count = parseInt(row.entry_count || 0);
    const fee = parseFloat(row.hook_fee || 0);
    const added = parseFloat(row.added_money || 0);
    const percent = parseFloat(row.payback_percent || 100) / 100;
    
    const totalPot = (count * fee * percent) + added;

    let payouts: number[] = [];
    if (row.payout_split && typeof row.payout_split === 'object') {
        const splits = Object.values(row.payout_split).map((v: any) => parseFloat(v));
        
        // Apply Rounding
        payouts = splits.map((p) => {
            const rawAmount = totalPot * (p / 100);
            return roundToFive(rawAmount);
        });
    }
    return { totalPot, payouts };
  };

  return (
    <div className="min-h-screen bg-slate-900 font-sans text-white">
      
      {/* HEADER */}
      <div className="bg-slate-800 p-4 shadow-md flex justify-between items-center sticky top-0 z-10 border-b border-slate-700">
        <div className="flex items-center gap-3">
            <span className="text-3xl">💰</span>
            <h1 className="text-2xl font-black italic uppercase tracking-tighter">
                EVENT<span className="text-green-500">PAYOUTS</span>
            </h1>
        </div>
        <Link href="/" className="text-slate-400 text-xs font-bold uppercase hover:text-white">Exit</Link>
      </div>

      <div className="max-w-5xl mx-auto p-6">
        {loading ? (
            <div className="text-center py-20 text-slate-500 text-xl font-bold animate-pulse">Calculating Pots...</div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {reportData.map((cls) => {
                    const { totalPot, payouts } = calculatePayouts(cls);

                    // Skip classes with no defined payout split yet
                    if (payouts.length === 0) return null;

                    return (
                        <div key={cls.class_id} className="bg-slate-800 rounded-xl overflow-hidden shadow-xl border border-slate-700">
                            {/* CLASS HEADER */}
                            <div className="bg-slate-700 p-4 border-b border-slate-600 flex justify-between items-center">
                                <h2 className="font-black text-xl text-white">{cls.name}</h2>
                                <div className="text-right">
                                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Total Purse</div>
                                    <div className="text-2xl font-black text-green-400 font-mono">${totalPot.toLocaleString()}</div>
                                </div>
                            </div>

                            {/* PAYOUT LIST */}
                            <div className="p-4 space-y-2">
                                {payouts.map((amt, index) => {
                                    const pos = index + 1;
                                    let medal = '';
                                    if(pos === 1) medal = '🥇';
                                    if(pos === 2) medal = '🥈';
                                    if(pos === 3) medal = '🥉';

                                    return (
                                        <div key={index} className="flex justify-between items-center p-3 bg-slate-700/50 rounded hover:bg-slate-700 transition-colors border border-transparent hover:border-slate-600">
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl">{medal}</span>
                                                <span className="font-bold text-slate-300 uppercase text-sm tracking-wider">
                                                    {pos === 1 ? '1st Place' : pos === 2 ? '2nd Place' : pos === 3 ? '3rd Place' : `${pos}th Place`}
                                                </span>
                                            </div>
                                            <div className="font-mono font-black text-xl text-white">
                                                ${amt.toFixed(2)}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* FOOTER INFO */}
                            <div className="bg-slate-900/50 p-3 text-center text-xs text-slate-500 font-bold uppercase tracking-widest">
                                {cls.entry_count} Entries • ${cls.hook_fee} Fee
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
      </div>
    </div>
  );
}