'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminNav from '@/components/AdminNav';

export default function SettingsPage() {
  const router = useRouter();
  const [codes, setCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Track edits locally
  const [edits, setEdits] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchCodes();
  }, []);

  const fetchCodes = async () => {
    const res = await fetch('/api/settings');
    if (res.ok) {
        const data = await res.json();
        setCodes(data);
        const initialEdits: any = {};
        data.forEach((c: any) => initialEdits[c.role] = c.code);
        setEdits(initialEdits);
    }
    setLoading(false);
  };

  const handleChange = (role: string, val: string) => {
    setEdits(prev => ({ ...prev, [role]: val }));
  };

  const handleSave = async (role: string) => {
    const newCode = edits[role];
    if (!newCode) return alert("Code cannot be empty");

    const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, code: newCode })
    });

    if (res.ok) alert(`${role.toUpperCase()} code updated!`);
    else alert("Error updating code");
  };

  const getLabel = (role: string) => {
    switch(role) {
        case 'admin': return 'Admin Dashboard';
        case 'official': return 'Trackside Official';
        case 'lineup': return 'Lineup / Staging';
        case 'announcer': return 'Announcer View';
        case 'registration': return 'Registration Station';
        default: return role;
    }
  };

  // --- NEW FACTORY RESET LOGIC ---
  const handleFactoryReset = async () => {
    // Check 1: Simple Confirm
    if (!confirm("WARNING: This will delete ALL Classes, Entries, and Brackets.\n\nThis cannot be undone. Are you sure?")) {
        return;
    }

    // Check 2: Type to Confirm
    const verification = prompt("To confirm, type 'DELETE EVERYTHING' in the box below:");
    
    if (verification === 'DELETE EVERYTHING') {
        const res = await fetch('/api/reset', { method: 'DELETE' });
        if (res.ok) {
            alert("System has been reset for the new season.");
            router.push('/admin'); // Send them back to dashboard
        } else {
            alert("Error resetting data.");
        }
    } else {
        alert("Verification failed. Nothing was deleted.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-900 pb-20">
      <AdminNav />
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-8 text-gray-800 flex items-center gap-2">
            <span>🔐</span> Settings
        </h1>

        {/* ACCESS CODES SECTION */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 p-6 mb-12">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Access Control</h2>
            <p className="text-gray-500 mb-6">
                Manage the access codes (passwords) for the different roles in the system. 
            </p>

            {loading ? <p>Loading...</p> : (
                <div className="space-y-6">
                    {codes.map((item) => (
                        <div key={item.role} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border rounded-lg bg-gray-50">
                            <div>
                                <h3 className="font-bold text-lg text-gray-800">{getLabel(item.role)}</h3>
                                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Role: {item.role}</div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <input 
                                    type="text" 
                                    className="border-2 border-gray-300 rounded p-2 font-mono text-lg w-48 text-center focus:border-blue-500 outline-none"
                                    value={edits[item.role] || ''}
                                    onChange={(e) => handleChange(item.role, e.target.value)}
                                />
                                <button 
                                    onClick={() => handleSave(item.role)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded shadow transition-colors"
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>

        {/* DANGER ZONE SECTION */}
        <div className="bg-red-50 rounded-xl shadow-lg overflow-hidden border-2 border-red-200 p-6">
            <h2 className="text-xl font-black text-red-700 mb-2 uppercase tracking-wide">Danger Zone</h2>
            <p className="text-red-800 mb-6 font-medium">
                Use this feature to clear all event data (Classes, Entries, Hooks) to prepare for a new year/season. 
                <br/><strong>This action is irreversible.</strong> Access codes will NOT be deleted.
            </p>

            <div className="flex justify-end">
                <button 
                    onClick={handleFactoryReset}
                    className="bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest px-6 py-4 rounded-lg shadow-md border-b-4 border-red-800 active:scale-95 transition-all"
                >
                    Reset Event Data
                </button>
            </div>
        </div>

      </div>
    </div>
  );
}