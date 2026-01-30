'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminNav from '@/components/AdminNav';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalClasses: 0, totalEntries: 0, totalPot: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Reuse the reports API to get quick stats
    fetch('/api/reports')
      .then(res => res.json())
      .then(data => {
         const totalClasses = data.length;
         const totalEntries = data.reduce((acc: number, r: any) => acc + parseInt(r.entry_count || 0), 0);
         
         // Calculate Pot based on your custom logic
         const totalPot = data.reduce((acc: number, r: any) => {
            const fee = parseFloat(r.hook_fee || 0);
            const added = parseFloat(r.added_money || 0);
            const count = parseInt(r.entry_count || 0);
            const percent = parseFloat(r.payback_percent || 100) / 100;
            return acc + ((count * fee * percent) + added);
         }, 0);

         setStats({ totalClasses, totalEntries, totalPot });
         setLoading(false);
      });
  }, []);

  const QuickAction = ({ title, desc, link, icon, color, newTab }: any) => (
    <Link 
        href={link} 
        target={newTab ? "_blank" : "_self"}
        className={`block bg-white p-6 rounded-xl shadow-md border-l-8 ${color} hover:shadow-xl hover:scale-[1.02] transition-all group`}
    >
        <div className="flex items-center justify-between mb-2">
            <h3 className="font-black text-xl uppercase tracking-tighter text-gray-800 group-hover:text-blue-600 transition-colors">{title}</h3>
            <span className="text-3xl grayscale group-hover:grayscale-0 transition-all">{icon}</span>
        </div>
        <p className="text-gray-500 text-sm font-medium">{desc}</p>
    </Link>
  );

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-900">
      <AdminNav />
      
      <div className="max-w-7xl mx-auto p-6">
        
        {/* WELCOME BANNER */}
        <div className="bg-slate-900 rounded-2xl p-8 mb-10 shadow-2xl text-white relative overflow-hidden">
             <div className="relative z-10">
                <h1 className="text-4xl font-black italic uppercase tracking-tighter mb-2 text-yellow-400">
                    Event<span className="text-white">Command</span>
                </h1>
                <p className="text-slate-400 font-medium">Welcome back. System is active and ready.</p>
             </div>
             {/* Background Decoration */}
             <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-slate-800 to-transparent opacity-50 pointer-events-none"></div>
        </div>

        {/* STATS ROW */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white p-6 rounded-xl shadow-lg flex items-center gap-4 border border-gray-100">
                <div className="bg-blue-100 p-4 rounded-full text-3xl">🚛</div>
                <div>
                    <div className="text-gray-500 font-bold text-xs uppercase tracking-widest">Total Entries</div>
                    <div className="text-3xl font-black text-gray-900">{loading ? '...' : stats.totalEntries}</div>
                </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg flex items-center gap-4 border border-gray-100">
                <div className="bg-green-100 p-4 rounded-full text-3xl">💰</div>
                <div>
                    <div className="text-gray-500 font-bold text-xs uppercase tracking-widest">Total Purse</div>
                    <div className="text-3xl font-black text-green-700">{loading ? '...' : `$${stats.totalPot.toLocaleString()}`}</div>
                </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg flex items-center gap-4 border border-gray-100">
                <div className="bg-purple-100 p-4 rounded-full text-3xl">🏆</div>
                <div>
                    <div className="text-gray-500 font-bold text-xs uppercase tracking-widest">Active Classes</div>
                    <div className="text-3xl font-black text-gray-900">{loading ? '...' : stats.totalClasses}</div>
                </div>
            </div>
        </div>

        {/* STATION SHORTCUTS */}
        <div className="mb-6 flex items-end justify-between border-b-2 border-slate-200 pb-2">
             <h2 className="text-slate-500 font-bold uppercase tracking-widest text-sm">Station Shortcuts</h2>
             <span className="text-xs font-bold text-slate-400 bg-slate-200 px-2 py-1 rounded">ADMIN ACCESS ONLY</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <QuickAction 
                title="Registration" 
                desc="Staff Check-In Station." 
                link="/registration" 
                icon="📝" 
                color="border-blue-500"
                newTab={true}
            />
            
            <QuickAction 
                title="Lineup Board" 
                desc="Staging Lanes View." 
                link="/lineup" 
                icon="🚧" 
                color="border-purple-500"
                newTab={true} // Opens in new tab so you don't lose dashboard
            />
            
            <QuickAction 
                title="Announcer" 
                desc="Live Feed & Sponsors." 
                link="/announcer" 
                icon="🎙️" 
                color="border-yellow-500"
                newTab={true}
            />
            
            <QuickAction 
                title="Official" 
                desc="Track Side Offical." 
                link="/trackside" 
                icon="🏁" 
                color="border-red-600"
                newTab={true}
            />

        </div>

      </div>
    </div>
  );
}