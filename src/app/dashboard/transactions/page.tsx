'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAccount } from 'wagmi';
import { 
  History, 
  Search, 
  Filter, 
  ExternalLink, 
  ArrowUpRight, 
  ArrowDownLeft,
  Loader2
} from 'lucide-react';

export default function TransactionsPage() {
  const { address } = useAccount();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!address) return;
    if (!supabase) {
      setLoading(false);
      return;
    }

    async function fetchTransactions() {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          payment_requests (
            product_name
          )
        `)
        .or(`sender_address.eq.${address},receiver_address.eq.${address}`)
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('Error fetching transactions:', error);
      } else {
        setTransactions(data || []);
      }
      setLoading(false);
    }

    fetchTransactions();

    // Subscribe to new transactions
    const subscription = supabase
      .channel('transactions_channel')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'transactions' 
      }, (payload) => {
        setTransactions(prev => [payload.new, ...prev]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [address]);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Transaction History</h1>
        <p className="text-zinc-500">Track all USDC payments received and sent on Arc Testnet.</p>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input 
            type="text" 
            placeholder="Search by hash or address..."
            className="w-full bg-zinc-900/50 border border-white/5 rounded-xl py-3 pl-10 pr-4 focus:border-emerald-500/50 outline-none transition-all text-sm"
          />
        </div>
        <button className="px-6 py-3 bg-zinc-900/50 border border-white/5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-zinc-800 transition-all">
          <Filter className="w-4 h-4" />
          Filter
        </button>
      </div>

      <div className="bg-zinc-900/30 border border-white/5 rounded-3xl overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-4" />
            <p className="text-zinc-500">Loading transactions...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
              <History className="w-8 h-8 text-zinc-700" />
            </div>
            <p className="text-zinc-500 font-medium">No transactions found.</p>
            <p className="text-zinc-600 text-sm">Your activity will appear here once you start using ArcPay.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">Type</th>
                  <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">Product</th>
                  <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">Amount</th>
                  <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">From / To</th>
                  <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {transactions.map((tx) => {
                  const isIncoming = tx.receiver_address.toLowerCase() === address?.toLowerCase();
                  return (
                    <tr key={tx.id} className="hover:bg-white/[0.01] transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center",
                            isIncoming ? "bg-emerald-500/10" : "bg-blue-500/10"
                          )}>
                            {isIncoming ? (
                              <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
                            ) : (
                              <ArrowUpRight className="w-4 h-4 text-blue-500" />
                            )}
                          </div>
                          <span className="text-sm font-medium">{isIncoming ? 'Received' : 'Sent'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-sm text-zinc-300 font-medium">
                          {tx.payment_requests?.product_name || 'Direct Transfer'}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-1.5">
                          <span className={cn(
                            "text-sm font-bold",
                            isIncoming ? "text-emerald-500" : "text-white"
                          )}>
                            {isIncoming ? '+' : '-'}{tx.amount}
                          </span>
                          <span className="text-[10px] font-bold text-zinc-600">USDC</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <code className="text-xs text-zinc-500">
                          {isIncoming 
                            ? `${tx.sender_address.slice(0, 6)}...${tx.sender_address.slice(-4)}` 
                            : `${tx.receiver_address.slice(0, 6)}...${tx.receiver_address.slice(-4)}`
                          }
                        </code>
                      </td>
                      <td className="px-6 py-5">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold">
                          <div className="w-1 h-1 rounded-full bg-emerald-500" />
                          Confirmed
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <a 
                          href={`https://testnet.arcscan.app/tx/${tx.tx_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-white/5 rounded-lg text-zinc-500 hover:text-white transition-all inline-flex"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

import { cn } from '@/lib/utils';
