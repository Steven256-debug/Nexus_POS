'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, ShoppingCart, History, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSession, signOut } from 'next-auth/react';
import { ThemeToggle } from './theme-toggle';

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
      <nav className="hidden lg:flex fixed top-0 left-0 h-screen w-64 bg-card text-card-foreground border-r border-border p-4 shadow-sm z-50 flex-col hide-on-print">
        <div className="mb-8 p-2 flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight text-foreground">Nexus POS</h1>
          <ThemeToggle />
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
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group text-sm font-medium",
                    isActive 
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  <Icon className={cn("w-5 h-5 transition-transform duration-200", isActive ? "scale-110" : "group-hover:scale-110")} />
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
        
        <div className="mt-auto pt-4 border-t border-border flex flex-col gap-2">
          <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold uppercase">
                {session.user?.email?.[0] || 'U'}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-foreground truncate">{session.user?.email}</p>
                <p className="text-xs text-muted-foreground">{role}</p>
              </div>
            </div>
          </div>
          <button 
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full flex items-center justify-center gap-2 p-3 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </nav>

      {/* Mobile Bottom Tab Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 w-full bg-card text-card-foreground border-t border-border z-50 hide-on-print pb-safe">
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
                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className={cn("w-5 h-5 mb-1 transition-transform duration-200", isActive ? "scale-110" : "")} />
                  <span className="text-[10px] font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-full block px-1 text-center">{link.label}</span>
                </Link>
              </li>
            );
          })}
          <li className="flex-1">
            <div className="w-full flex flex-col items-center justify-center p-2 text-muted-foreground transition-colors">
              <ThemeToggle className="mb-1 bg-transparent hover:bg-transparent" />
            </div>
          </li>
        </ul>
      </nav>
    </>
  );
}
