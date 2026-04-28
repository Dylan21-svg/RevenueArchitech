'use client';

import { Bell, Search, Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useAuthStore, useUIStore } from '@/store';

const titles: Record<string, string> = {
  '/dashboard':   'Dashboard',
  '/audits/new':  'New Audit',
  '/audits':      'Audit History',
  '/stores':      'Store History',
  '/billing':     'Billing',
  '/settings':    'Settings',
};

export default function Topbar() {
  const pathname  = usePathname();
  const { user }  = useAuthStore();
  const { toggleSidebar } = useUIStore();

  const title = Object.entries(titles).find(([k]) => pathname.startsWith(k))?.[1] ?? 'RevenueArchitect';
  const initials = user?.email?.slice(0, 2).toUpperCase() ?? 'RA';

  return (
    <header className="h-16 flex items-center justify-between px-6 bg-white/80 backdrop-blur border-b border-slate-200/80 sticky top-0 z-20">
      {/* Left */}
      <div className="flex items-center gap-4">
        <button onClick={toggleSidebar} className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-500 md:hidden">
          <Menu size={18} />
        </button>
        <h1 className="text-base font-semibold text-slate-800">{title}</h1>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        <button className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-500 relative">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#DB7245]" />
        </button>
        <div className="w-8 h-8 rounded-full bg-[#10374E] flex items-center justify-center text-xs font-bold text-[#53F6FF]">
          {initials}
        </div>
      </div>
    </header>
  );
}
