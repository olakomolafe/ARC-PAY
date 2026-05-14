'use client';

import { motion } from 'framer-motion';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Wallet, 
  CreditCard, 
  Users, 
  Activity,
  Plus,
  Copy, 
  History,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { useAccount, useBalance } from 'wagmi';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { USDC_ADDRESS, USDC_DECIMALS } from '@/lib/web3';
import { formatUnits } from 'viem';

export default function DashboardPage() {
  const { address } = useAccount();
  const { data: balance } = useBalance({
    address,
    token: USDC_ADDRESS,
  });

  const [stats, setStats] = useState({
    totalReceived: 0,
    activeRequests: 0,
    totalCustomers: 0,
    conversionRate: 0
  });
  const [recentTxs, setRecentTxs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!address || !supabase) return;

    const fetchData = async () => {
      // 1. Fetch Stats
      const { data: txs } = await supabase
        .from('transactions')
        .select('amount, sender_address')
        .eq('receiver_address', address);

      const { count: activeRequests } = await supabase
        .from('payment_requests')
        .select('*', { count: 'exact', head: true })
        .eq('merchant_address', address)
        .eq('status', 'pending');

      if (txs) {
        const total = txs.reduce((acc, curr) => acc + Number(curr.amount), 0);
        const uniqueCustomers = new Set(txs.map(t => t.sender_address)).size;
        
        setStats({
          totalReceived: total,
          activeRequests: activeRequests || 0,
          totalCustomers: uniqueCustomers,
          conversionRate: txs.length > 0 ? 100 : 0 // Simplified for now
        });
      }

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
      }, () => fetchData())
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'payment_requests' 
      }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [address]);

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      alert('Address copied to clipboard!');
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Merchant Overview</h1>
          <p className="text-zinc-500">Welcome back. Here's what's happening with your payments today.</p>
        </div>
        <Link 
          href="/dashboard/create"
          className="inline-flex items-center gap-2 bg-emerald-500 text-black font-bold px-6 py-3 rounded-xl hover:bg-emerald-400 transition-all shadow-[0_0_20px_-5px_rgba(16,185,129,0.5)]"
        >
          <Plus className="w-5 h-5" />
          Create Payment
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Received" 
          value={`${stats.totalReceived.toFixed(2)} USDC`} 
          change="Live" 
          icon={<Wallet className="w-5 h-5 text-emerald-500" />} 
        />
        <StatCard 
          title="Active Requests" 
          value={stats.activeRequests.toString()} 
          change="Pending" 
          icon={<CreditCard className="w-5 h-5 text-blue-500" />} 
        />
        <StatCard 
          title="Customers" 
          value={stats.totalCustomers.toString()} 
          change="Unique" 
          icon={<Users className="w-5 h-5 text-purple-500" />} 
        />
        <StatCard 
          title="Conversion Rate" 
          value={`${stats.conversionRate}%`} 
          change="Global" 
          icon={<Activity className="w-5 h-5 text-orange-500" />} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Transactions */}
        <div className="lg:col-span-2 bg-zinc-900/30 border border-white/5 rounded-3xl p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold">Recent Transactions</h3>
            <Link href="/dashboard/transactions" className="text-sm text-zinc-500 hover:text-white transition-colors">View All</Link>
          </div>
          
          {recentTxs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                <History className="w-8 h-8 text-zinc-700" />
              </div>
              <p className="text-zinc-500 font-medium">No transactions found yet.</p>
              <p className="text-zinc-600 text-sm">When you receive a payment, it will appear here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentTxs.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                      <ArrowDownLeft className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">{tx.payment_requests?.product_name || 'Direct Payment'}</p>
                      <p className="text-xs text-zinc-500 font-mono">{tx.sender_address.slice(0, 6)}...{tx.sender_address.slice(-4)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-500">+{tx.amount} USDC</p>
                    <a 
                      href={`https://testnet.arcscan.app/tx/${tx.tx_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-zinc-500 hover:text-white flex items-center gap-1 justify-end mt-1"
                    >
                      Explorer <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Wallet Info */}
        <div className="bg-zinc-900/30 border border-white/5 rounded-3xl p-8 h-fit">
          <h3 className="text-xl font-bold mb-8">Merchant Wallet</h3>
          <div className="p-6 bg-gradient-to-br from-zinc-800 to-black border border-white/10 rounded-2xl mb-6">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Current Balance</p>
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-4xl font-bold text-white">
                {balance ? Number(formatUnits(balance.value, balance.decimals)).toFixed(1) : '0.0'}
              </span>
              <span className="text-emerald-500 font-bold">USDC</span>
            </div>
            <div 
              onClick={copyAddress}
              className="p-3 bg-white/5 rounded-lg flex items-center justify-between group cursor-pointer hover:bg-white/10 transition-colors"
            >
              <code className="text-[10px] text-zinc-400 truncate max-w-[150px]">{address}</code>
              <button className="text-zinc-500 hover:text-white"><Copy className="w-4 h-4" /></button>
            </div>
          </div>
          
          <div className="space-y-4">
             <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500">Network</span>
                <span className="font-medium">Arc Testnet</span>
             </div>
             <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500">Asset</span>
                <span className="font-medium text-emerald-500">Circle USDC</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, change, icon }: { title: string, value: string, change: string, icon: React.ReactNode }) {
  return (
    <div className="p-6 rounded-3xl bg-zinc-900/30 border border-white/5 hover:border-white/10 transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 bg-white/5 rounded-lg">{icon}</div>
        <span className="text-[10px] font-bold px-2 py-1 rounded bg-emerald-500/10 text-emerald-500">{change}</span>
      </div>
      <p className="text-zinc-500 text-sm font-medium mb-1">{title}</p>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
    </div>
  );
}
