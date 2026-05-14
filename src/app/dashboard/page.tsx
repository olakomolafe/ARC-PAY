'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  TrendingUp, 
  Clock,
  ExternalLink,
  Plus,
  History,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { useAccount, useBalance } from 'wagmi';
import { formatUnits } from 'viem';
import { supabase } from '@/lib/supabase';

const USDC_ADDRESS = '0x170aBCcca8976Ea643501a40348700244747B576' as `0x${string}`;

export default function DashboardPage() {
  const { address } = useAccount();
  const { data: balance } = useBalance({
    address,
    // @ts-ignore
    token: USDC_ADDRESS,
  });

  const [stats, setStats] = useState({
    totalReceived: '0.0',
    pendingRequests: 0,
    activeLinks: 0,
    recentGrowth: '+0%'
  });

  const [recentTxs, setRecentTxs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!address || !supabase) {
      if (address && !supabase) setLoading(false);
      return;
    }

    const fetchData = async () => {
      // 1. Fetch Stats
      const { data: txs } = await supabase
        .from('transactions')
        .select('amount')
        .eq('receiver_address', address);
      
      // @ts-ignore
      const total = txs?.reduce((acc: any, curr: any) => acc + curr.amount, 0) || 0;

      const { count: pending } = await supabase
        .from('payment_requests')
        .select('*', { count: 'exact', head: true })
        .eq('merchant_address', address)
        .eq('status', 'pending');

      setStats(prev => ({
        ...prev,
        totalReceived: total.toFixed(1),
        pendingRequests: pending || 0,
        activeLinks: pending || 0
      }));

      // 2. Fetch Recent Transactions
      const { data: recent } = await supabase
        .from('transactions')
        .select(`
          *,
          payment_requests (
            product_name
          )
        `)
        .eq('receiver_address', address)
        .order('timestamp', { ascending: false })
        .limit(5);

      if (recent) setRecentTxs(recent);
      setLoading(false);
    };

    fetchData();

    // 3. Realtime Subscription
    const channel = supabase
      .channel('dashboard_updates')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'transactions' 
      }, (payload: any) => fetchData())
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'payment_requests' 
      }, (payload: any) => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [address]);

  if (!address) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6">
          <Wallet className="w-8 h-8 text-zinc-700" />
        </div>
        <h2 className="text-xl font-bold mb-2">Wallet Not Connected</h2>
        <p className="text-zinc-500 max-w-xs">Please connect your wallet to access your merchant dashboard.</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Merchant Overview</h1>
          <p className="text-zinc-500">Welcome back. Here is what is happening with your ArcPay store.</p>
        </div>
        <Link 
          href="/dashboard/create"
          className="bg-emerald-500 text-black font-bold px-6 py-3 rounded-xl hover:bg-emerald-400 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create New Request
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Received', value: `${stats.totalReceived} USDC`, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'Current Balance', value: balance ? `${Number(formatUnits(balance.value, balance.decimals)).toFixed(1)} USDC` : '0.0 USDC', icon: Wallet, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Active Links', value: stats.activeLinks, icon: Clock, color: 'text-purple-500', bg: 'bg-purple-500/10' },
          { label: 'Pending Payouts', value: stats.pendingRequests, icon: ArrowUpRight, color: 'text-amber-500', bg: 'bg-amber-500/10' },
        ].map((stat, i) => (
          <div 
            key={i}
            className="bg-zinc-900/30 border border-white/5 rounded-3xl p-6 group hover:border-white/10 transition-colors"
          >
            <div className={`${stat.bg} ${stat.color} w-10 h-10 rounded-xl flex items-center justify-center mb-4`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">{stat.label}</p>
            <h3 className="text-2xl font-bold">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <History className="w-5 h-5 text-zinc-500" />
              Recent Activity
            </h2>
            <Link href="/dashboard/transactions" className="text-sm font-bold text-zinc-500 hover:text-white transition-colors">View All</Link>
          </div>

          <div className="bg-zinc-900/30 border border-white/5 rounded-3xl overflow-hidden">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-4" />
                <p className="text-zinc-500">Syncing with Arc Testnet...</p>
              </div>
            ) : recentTxs.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center text-center px-6">
                <p className="text-zinc-500 font-medium">No transactions yet</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {recentTxs.map((tx) => (
                  <div key={tx.id} className="p-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
                        <ArrowDownLeft className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">{tx.payment_requests?.product_name || 'Direct Payment'}</p>
                        <p className="text-xs text-zinc-500 font-mono">{tx.sender_address.slice(0, 6)}...{tx.sender_address.slice(-4)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-500 text-sm">+{tx.amount} USDC</p>
                      <a href={`https://testnet.arcscan.app/tx/${tx.tx_hash}`} target="_blank" className="text-[10px] text-zinc-500 hover:text-white">View Scan</a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
