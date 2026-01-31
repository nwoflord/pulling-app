'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { name: 'Dashboard', href: '/admin' },
    { name: 'Classes', href: '/admin/classes' },
    { name: 'Registration', href: '/admin/entries' },
    { name: 'Bracket', href: '/admin/bracket' },
    { name: 'Reports', href: '/admin/reports' },
    { name: 'Sponsors', href: '/admin/sponsors' },
    { name: 'Settings', href: '/admin/settings' }, // <--- NEW LINK
  ];

  const handleLogout = () => {
  // Clear the cookie for the WHOLE site
  document.cookie = "auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
  // Force reload to login page
  window.location.href = '/login';
};

  return (
    <nav className="bg-slate-900 text-white shadow-lg mb-6">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          
          <div className="flex-shrink-0 font-black italic text-xl tracking-tighter text-yellow-400">
            PULLING<span className="text-white">MANAGER</span>
          </div>

          <div className="hidden md:flex items-center space-x-4 ml-10">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link 
                    key={item.name} 
                    href={item.href}
                    className={`px-3 py-2 rounded-md text-sm font-bold uppercase tracking-wide transition-colors ${
                      isActive 
                        ? 'bg-slate-800 text-white border-b-2 border-yellow-400' 
                        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    {item.name}
                  </Link>
                );
              })}
          </div>

          <div>
            <button 
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase px-4 py-2 rounded transition-colors"
            >
                Sign Out
            </button>
          </div>

        </div>
      </div>
    </nav>
  );
}