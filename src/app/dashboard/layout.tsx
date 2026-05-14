'use client';

import { useAccount } from 'wagmi';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { 
  LayoutDashboard, 
  PlusCircle, 
  History, 
  Settings, 
  LogOut,
  Zap,
  Menu,
  X
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const sidebarItems = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { name: 'Create Payment', icon: PlusCircle, href: '/dashboard/create' },
  { name: 'Transactions', icon: History, href: '/dashboard/transactions' },
  { name: 'Settings', icon: Settings, href: '/dashboard/settings' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isConnected, isConnecting } = useAccount();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isConnecting && !isConnected) {
      router.push('/');
    }
  }, [isConnected, isConnecting, router]);

  if (isConnecting) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-emerald-500" />
    </div>
  );

  if (!isConnected) return null;

  return (
    <div className="min-h-screen bg-[#050505] text-white flex">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 w-72 bg-black border-r border-white/5 z-50 transition-transform lg:translate-x-0 lg:static lg:block",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-full flex flex-col p-6">
          <div className="flex items-center justify-between mb-10">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-500 rounded flex items-center justify-center">
                <Zap className="text-black w-5 h-5 fill-current" />
              </div>
              <span className="text-lg font-bold tracking-tighter">ARCPAY</span>
            </Link>
            <button className="lg:hidden" onClick={() => setIsSidebarOpen(false)}>
              <X className="w-6 h-6" />
            </button>
          </div>

          <nav className="flex-1 space-y-2">
            {sidebarItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all group",
                    isActive 
                      ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" 
                      : "text-zinc-500 hover:text-white hover:bg-white/5"
                  )}
                >
                  <item.icon className={cn("w-5 h-5", isActive ? "text-emerald-500" : "text-zinc-500 group-hover:text-white")} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto pt-6 border-t border-white/5">
            <div className="flex flex-col gap-4">
              <div className="px-2 overflow-hidden">
                <ConnectButton accountStatus="address" showBalance={false} chainStatus="none" />
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-6 lg:px-10 sticky top-0 bg-black/80 backdrop-blur-xl z-30">
          <button className="lg:hidden" onClick={() => setIsSidebarOpen(true)}>
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-4 ml-auto">
             <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Arc Testnet Live</span>
             </div>
          </div>
        </header>

        <div className="flex-1 p-6 lg:p-10 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
