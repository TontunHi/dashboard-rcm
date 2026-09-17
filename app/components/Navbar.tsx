'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Stethoscope, LayoutDashboard, BedDouble } from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: any;
  badge?: string;
}

export default function Navbar() {
  const pathname = usePathname();

  const links: NavItem[] = [
    {
      href: '/sss-dental',
      label: 'ประกันสังคมทำฟัน (2.1.1.1)',
      icon: Stethoscope,
    },
    {
      href: '/opd-doctor',
      label: 'OPD (2.1.1.2)',
      icon: Stethoscope,
    },
    {
      href: '/ipd',
      label: 'IPD (2.1.2.1)',
      icon: BedDouble,
    },
  ];

  return (
    <header className="bg-emerald-950 text-emerald-100 pt-2.5 px-4 shadow-md border-b border-emerald-900 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-end gap-1.5 overflow-x-auto">
          {/* Project Brand */}
          <Link href="/" className="flex items-center gap-2 pb-2.5 pr-4 mr-2 text-white font-bold text-sm tracking-wide shrink-0 hover:opacity-90 transition">
            <img src="/icon.svg" alt="Dashboard-RCM Icon" className="w-6 h-6 rounded-md shadow-sm" />
            <span className="text-emerald-50 font-extrabold font-mono text-base">Dashboard-RCM</span>
          </Link>

          {/* Navigation Links */}
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-medium text-sm transition cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-slate-50 text-emerald-800 font-bold shadow-sm'
                    : 'text-emerald-200 hover:text-white hover:bg-emerald-900/50'
                }`}
              >
                <Icon className="h-4 w-4 text-emerald-600" />
                <span>{link.label}</span>
                {link.badge && (
                  <span className="text-[10px] ml-1 bg-amber-400 text-amber-950 px-1.5 py-0.2 rounded-full font-bold">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

      </div>
    </header>
  );
}
