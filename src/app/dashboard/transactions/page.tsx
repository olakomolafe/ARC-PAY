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
import { cn } from '@/lib/utils';

export default function TransactionsPage() {
  const { address } = useAccount();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!address || !supabase) {
      if (address && !supabase) setLoading(false);
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
      }, (payload: any) => {
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

      <div className="bg-zinc-900/30 border border-white/5 rounded-3xl overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-4" />
            <p className="text-zinc-500">Loading transactions...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <History className="w-8 h-8 text-zinc-700 mb-4" />
            <p className="text-zinc-500 font-medium">No transactions found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">Type</th>
                  <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">Product</th>
                  <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">Amount</th>
                  <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {transactions.map((tx) => {
                  const isIncoming = tx.receiver_address.toLowerCase() === address?.toLowerCase();
                  return (
                    <tr key={tx.id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center",
                            isIncoming ? "bg-emerald-500/10" : "bg-blue-500/10"
                          )}>
                            {isIncoming ? <ArrowDownLeft className="w-4 h-4 text-emerald-500" /> : <ArrowUpRight className="w-4 h-4 text-blue-500" />}
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
                        <span className={cn("text-sm font-bold", isIncoming ? "text-emerald-500" : "text-white")}>
                          {isIncoming ? '+' : '-'}{tx.amount} USDC
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <a 
                          href={`https://testnet.arcscan.app/tx/${tx.tx_hash}`}
                          target="_blank"
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
