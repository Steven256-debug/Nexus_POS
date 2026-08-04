'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  ShoppingCart, 
  Receipt, 
  BarChart3, 
  Settings, 
  ChevronDown, 
  ChevronRight, 
  LogOut, 
  Sparkles,
  Layers,
  Tag,
  Scale,
  FileSpreadsheet,
  FileText,
  Clock,
  UserCheck,
  Building,
  Shield,
  History
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSession, signOut } from 'next-auth/react';
import {} from './theme-toggle';
import type { LucideIcon } from 'lucide-react';

interface NavGroup {
  label: string;
  icon: LucideIcon;
  href?: string;
  subItems?: { label: string; href: string; icon?: LucideIcon }[];
}

export function Navigation() {
  const pathname = usePathname();
  const { data: session } = useSession();

  // Keep track of expanded dropdown sections
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    Contacts: true,
    Products: true,
    Sell: true,
  });

  if (pathname === '/receipt' || pathname === '/login') return null;
  if (!session) return null;

  const role = session.user?.role || 'ADMIN';

  const navGroups: NavGroup[] = [
    {
      label: 'Home',
      icon: LayoutDashboard,
      href: '/',
    },
    {
      label: 'Contacts',
      icon: Users,
      subItems: [
        { label: 'Suppliers', href: '/contacts/suppliers', icon: Building },
        { label: 'Customers', href: '/contacts/customers', icon: UserCheck },
        { label: 'Customer Groups', href: '/contacts/groups', icon: Users },
        { label: 'Import Contacts', href: '/contacts/import', icon: FileSpreadsheet },
      ],
    },
    {
      label: 'Products',
      icon: Package,
      subItems: [
        { label: 'List Products', href: '/inventory', icon: Package },
        ...(role === 'ADMIN' ? [{ label: 'Add Product', href: '/inventory/add', icon: Sparkles }] : []),
        ...(role === 'ADMIN' ? [{ label: 'Update Price', href: '/inventory/price-update', icon: Tag }] : []),
        { label: 'Print Labels', href: '/inventory/labels', icon: FileText },
        { label: 'Variations', href: '/inventory/variations', icon: Layers },
        { label: 'Units', href: '/inventory/units', icon: Scale },
        { label: 'Categories', href: '/inventory/categories', icon: Tag },
      ],
    },
    {
      label: 'Sell',
      icon: ShoppingCart,
      subItems: [
        { label: 'All Sales', href: '/sales', icon: FileText },
        { label: 'Point of Sale (POS)', href: '/pos', icon: ShoppingCart },
        { label: 'List POS Sales', href: '/sales/pos-list', icon: Clock },
        { label: 'Draft Sales', href: '/sales/drafts', icon: FileText },
        { label: 'Quotations', href: '/sales/quotations', icon: FileSpreadsheet },
      ],
    },
    {
      label: 'Expenses',
      icon: Receipt,
      href: '/expenses',
    },
    {
      label: 'Reports',
      icon: BarChart3,
      href: '/reports',
    },
    ...(role === 'ADMIN' ? [{
      label: 'Admin',
      icon: Shield,
      subItems: [
        { label: 'Staff Management', href: '/users', icon: Users },
        { label: 'Audit Logs', href: '/audit-logs', icon: History },
      ]
    }] : []),
    {
      label: 'Settings',
      icon: Settings,
      href: '/settings',
    },
  ];

  const toggleSection = (label: string) => {
    setOpenSections(prev => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <>
      {/* Desktop Rich Sidebar */}
      <nav className="hidden lg:flex fixed top-0 left-0 h-screen w-20 hover:w-64 transition-[width] duration-300 ease-in-out group bg-transparent dark:bg-transparent backdrop-blur-2xl text-card-foreground border-r border-border/30 p-4 z-50 flex-col hide-on-print overflow-x-hidden overflow-y-auto">
        <div className="mb-6 p-2 flex items-center justify-start gap-4">
          <div className="w-9 h-9 shrink-0 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center text-lg shadow-md shadow-blue-500/20">
            FA
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
            <h1 className="text-base font-black tracking-tight text-foreground leading-tight">FRANCIS AMOAKO</h1>
            <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">VENTURES POS</p>
          </div>
        </div>

        <div className="flex-1 space-y-1.5 scrollbar-hide">
          {navGroups.map(group => {
            const Icon = group.icon;
            const hasSub = group.subItems && group.subItems.length > 0;
            const isOpen = openSections[group.label];
            const isDirectActive = group.href && pathname && (pathname === group.href || (pathname.startsWith(group.href) && group.href !== '/'));
            const isSubActive = hasSub && group.subItems?.some(s => pathname === s.href);

            if (!hasSub && group.href) {
              return (
                <Link
                  key={group.label}
                  href={group.href}
                  className={cn(
                    "flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 text-sm font-semibold group",
                    isDirectActive
                      ? "bg-blue-500/10 backdrop-blur-md border border-blue-500/20 text-blue-700 shadow-sm shadow-blue-500/5"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-transparent"
                  )}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span className="whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">{group.label}</span>
                </Link>
              );
            }

            return (
              <div key={group.label} className="space-y-1">
                <button
                  onClick={() => toggleSection(group.label)}
                  className={cn(
                    "w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-200 text-sm font-semibold group",
                    isSubActive
                      ? "bg-blue-500/10 backdrop-blur-md border border-blue-500/20 text-blue-700 dark:text-blue-400 font-bold shadow-sm shadow-blue-500/5"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-transparent"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 shrink-0" />
                    <span className="whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">{group.label}</span>
                  </div>
                  {isOpen ? (
                    <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground transition-transform opacity-0 group-hover:opacity-100" />
                  ) : (
                    <ChevronRight className="w-4 h-4 shrink-0 text-muted-foreground transition-transform opacity-0 group-hover:opacity-100" />
                  )}
                </button>

                {isOpen && (
                  <div className="pl-9 pr-2 space-y-1 border-l-2 border-border/60 ml-5 py-1 hidden group-hover:block transition-all">
                    {group.subItems?.map(sub => {
                      const isSubItemActive = pathname === sub.href;
                      const SubIcon = sub.icon;
                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150",
                            isSubItemActive
                              ? "bg-blue-500/10 backdrop-blur-md border border-blue-500/20 text-blue-700 dark:text-blue-400 shadow-sm shadow-blue-500/5"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent"
                          )}
                        >
                          {SubIcon && <SubIcon className="w-3.5 h-3.5 shrink-0" />}
                          <span className="whitespace-nowrap">{sub.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-auto pt-4 border-t border-border flex flex-col gap-2">
          <div className="p-1.5 group-hover:p-3 rounded-xl bg-muted/40 border border-border/50 flex items-center gap-0 group-hover:gap-3 transition-all overflow-hidden">
            <div className="w-9 h-9 shrink-0 rounded-full bg-blue-600/20 text-blue-600 font-bold flex items-center justify-center text-xs mx-auto group-hover:mx-0">
              {session.user?.name?.[0] || 'B'}
            </div>
            <div className="hidden group-hover:block opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap overflow-hidden flex-1">
              <p className="text-xs font-bold text-foreground truncate">{session.user?.name || session.user?.email}</p>
              <p className="text-[10px] text-muted-foreground font-semibold">{role}</p>
            </div>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full flex items-center justify-start group-hover:justify-center gap-2 p-2.5 text-xs font-bold text-muted-foreground hover:bg-red-500/10 hover:text-red-500 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">Sign Out</span>
          </button>
        </div>
      </nav>

      {/* Mobile Bottom Tab Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 w-full bg-white/30 dark:bg-zinc-950/40 backdrop-blur-xl text-card-foreground border-t border-border/50 z-50 hide-on-print pb-safe">
        <ul className="flex items-center justify-around p-2">
          {[
            { href: '/', label: 'Home', icon: LayoutDashboard },
            { href: '/pos', label: 'POS', icon: ShoppingCart },
            { href: '/inventory', label: 'Products', icon: Package },
            { href: '/sales', label: 'Sales', icon: FileText },
            { href: '/expenses', label: 'Expenses', icon: Receipt },
          ].map(link => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <li key={link.href} className="flex-1">
                <Link
                  href={link.href}
                  className={cn(
                    "flex flex-col items-center justify-center p-2 rounded-xl transition-all",
                    isActive ? "text-blue-600 font-bold" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="w-5 h-5 mb-0.5" />
                  <span className="text-[10px] font-medium">{link.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
