'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, ShoppingCart, History, LogOut, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSession, signOut } from 'next-auth/react';

export function Navigation() {
  const pathname = usePathname();
  const { data: session } = useSession();
  
  // Hide navigation on the receipt print view or login page
  if (pathname === '/receipt' || pathname === '/login') return null;
  
  if (!session) return null;

  const role = (session.user as any)?.role || 'EMPLOYEE';

  const allLinks = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN'] },
    { href: '/employee', label: 'My Dashboard', icon: LayoutDashboard, roles: ['EMPLOYEE'] },
    { href: '/pos', label: 'Point of Sale', icon: ShoppingCart, roles: ['ADMIN', 'EMPLOYEE'] },
    { href: '/inventory', label: 'Inventory', icon: Package, roles: ['ADMIN'] },
    { href: '/sales', label: 'Sales History', icon: History, roles: ['ADMIN'] },
  ];

  const links = allLinks.filter(link => link.roles.includes(role));

  return (
    <>
      {/* Desktop Sidebar */}
      <nav className="hidden lg:flex fixed top-0 left-0 h-screen w-64 bg-zinc-950 text-white border-r border-zinc-800 p-4 shadow-xl z-50 flex-col hide-on-print">
        <div className="mb-8 p-2">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Nexus POS</h1>
        </div>
        <ul className="space-y-2 flex-1">
          {links.map(link => {
            const Icon = link.icon;
            const isActive = pathname === link.href || (pathname.startsWith(link.href) && link.href !== '/');
            return (
              <li key={link.href}>
                <Link 
                  href={link.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group",
                    isActive 
                      ? "bg-blue-600/10 text-blue-400 font-medium shadow-sm border border-blue-500/20" 
                      : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                  )}
                >
                  <Icon className={cn("w-5 h-5 transition-transform duration-200", isActive ? "scale-110" : "group-hover:scale-110")} />
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
        
        <div className="mt-auto pt-4 border-t border-zinc-800 flex flex-col gap-2">
          <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/50 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-blue-500 flex items-center justify-center text-sm font-bold shadow-lg uppercase">
                {session.user?.email?.[0] || 'U'}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-white truncate">{session.user?.email}</p>
                <p className="text-xs text-zinc-500">{role}</p>
              </div>
            </div>
          </div>
          <button 
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full flex items-center justify-center gap-2 p-3 text-sm font-medium text-zinc-400 hover:text-white hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </nav>

      {/* Mobile Bottom Tab Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 w-full bg-zinc-950 text-white border-t border-zinc-800 z-50 hide-on-print pb-safe">
        <ul className="flex items-center justify-around p-2">
          {links.map(link => {
            const Icon = link.icon;
            const isActive = pathname === link.href || (pathname.startsWith(link.href) && link.href !== '/');
            return (
              <li key={link.href} className="flex-1">
                <Link 
                  href={link.href}
                  className={cn(
                    "flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200",
                    isActive ? "text-blue-400" : "text-zinc-400 hover:text-white"
                  )}
                >
                  <Icon className={cn("w-5 h-5 mb-1 transition-transform duration-200", isActive ? "scale-110" : "")} />
                  <span className="text-[10px] font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-full block px-1 text-center">{link.label}</span>
                </Link>
              </li>
            );
          })}
          <li className="flex-1">
            <button 
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="w-full flex flex-col items-center justify-center p-2 text-zinc-400 hover:text-red-400 transition-colors"
            >
              <LogOut className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-medium whitespace-nowrap">Sign Out</span>
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
}
