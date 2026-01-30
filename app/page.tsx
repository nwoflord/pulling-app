'use client';
import Link from 'next/link';

export default function LandingPage() {
  
  const MenuCard = ({ title, icon, desc, href, color, isPublic }: any) => (
    <Link 
      href={href}
      className={`relative group overflow-hidden rounded-2xl p-8 border-l-8 ${color} bg-slate-800 shadow-2xl hover:bg-slate-700 transition-all hover:-translate-y-1`}
    >
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <span className="text-9xl">{icon}</span>
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">{icon}</span>
            {isPublic && (
                <span className="bg-green-500 text-black text-[10px] font-black uppercase px-2 py-1 rounded">
                    Public
                </span>
            )}
        </div>
        <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white mb-2">
            {title}
        </h2>
        <p className="text-slate-400 font-medium text-sm leading-relaxed max-w-[90%]">
            {desc}
        </p>
        
        <div className="mt-6 flex items-center text-sm font-bold uppercase tracking-widest text-white">
            <span>Enter Area</span>
            <span className="ml-2 group-hover:translate-x-2 transition-transform">→</span>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-white">
      
      {/* HERO SECTION */}
      <div className="relative bg-blue-900 py-20 px-6 overflow-hidden">
         <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
         <div className="max-w-7xl mx-auto relative z-10 text-center">
            <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter mb-4">
                PULLING<span className="text-yellow-400">MANAGER</span>
            </h1>
            <p className="text-xl text-blue-200 font-medium max-w-2xl mx-auto">
                The complete event management system for truck and tractor pulling.
            </p>
         </div>
      </div>

      {/* MENU GRID */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        
        {/* PUBLIC SECTION */}
        <h3 className="text-slate-500 font-bold uppercase tracking-widest text-sm mb-6 border-b border-slate-800 pb-2">
            Spectator Views
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
            <MenuCard 
                title="Pit Board" 
                icon="📺" 
                desc="Live bracket status, upcoming matches, and staging lane queue." 
                href="/pit" 
                color="border-yellow-400"
                isPublic={true}
            />
            <MenuCard 
                title="Live Payouts" 
                icon="💰" 
                desc="Real-time tracker of the class purse and prize splits." 
                href="/payouts" 
                color="border-green-500"
                isPublic={true}
            />
            <MenuCard 
                title="Driver Reg" 
                icon="🏎️" 
                desc="Pre-register your truck online to save time at the gate." 
                href="/register" 
                color="border-indigo-500"
                isPublic={true}
            />
        </div>

        {/* STAFF SECTION */}
        <h3 className="text-slate-500 font-bold uppercase tracking-widest text-sm mb-6 border-b border-slate-800 pb-2">
            Event Staff Only (Login Required)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            <MenuCard 
                title="Admin" 
                icon="⚙️" 
                desc="Full event control." 
                href="/admin" 
                color="border-blue-600"
            />
            <MenuCard 
                title="Official" 
                icon="🏁" 
                desc="Trackside controller." 
                href="/trackside" 
                color="border-red-600"
            />
            <MenuCard 
                title="Lineup" 
                icon="📋" 
                desc="Staging lane management." 
                href="/lineup" 
                color="border-pink-500"
            />
            <MenuCard 
                title="Announcer" 
                icon="🎙️" 
                desc="Commentary view." 
                href="/announcer" 
                color="border-purple-600"
            />
            <MenuCard 
                title="Registration" 
                icon="📝" 
                desc="Data entry station." 
                href="/registration" 
                color="border-orange-500"
            />
        </div>

      </div>

      <div className="text-center pb-8 text-slate-700 text-sm font-bold">
        &copy; {new Date().getFullYear()} PullingManager System
      </div>
    </div>
  );
}