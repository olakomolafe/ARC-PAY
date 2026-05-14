'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, 
  ShieldCheck, 
  ChevronRight, 
  CheckCircle2, 
  ArrowLeft,
  Loader2,
  AlertCircle,
  ExternalLink,
  Store
} from 'lucide-react';
import Link from 'next/link';
import { useAccount, useBalance, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatUnits, parseUnits, erc20Abi } from 'viem';
import { supabase } from '@/lib/supabase';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { USDC_ADDRESS } from '@/lib/web3';

const ARCPAY_CONTRACT = '0x0000000000000000000000000000000000000000'; 

export default function CheckoutPage() {
  const { id } = useParams();
  const { address, isConnected } = useAccount();
  const [request, setRequest] = useState<any>(null);
  const [merchant, setMerchant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: usdcBalance } = useBalance({
    address,
    // @ts-ignore
    token: USDC_ADDRESS,
  });

  const { writeContract: pay, data: payData, error: payError } = useWriteContract();

  const { isSuccess: isPaySuccess } = useWaitForTransactionReceipt({
    hash: payData,
  });

  useEffect(() => {
    if (payError) {
      setErrorMsg((payError as any).shortMessage || payError.message);
      setStatus('error');
    }
  }, [payError]);

  useEffect(() => {
    if (isPaySuccess && payData) {
      setTxHash(payData);
      setStatus('success');
      recordTransaction(payData);
    }
  }, [isPaySuccess, payData]);

  useEffect(() => {
    if (!id || !supabase) return;

    const fetchRequest = async () => {
      const { data, error } = await supabase
        .from('payment_requests')
        .select('*')
        .eq('id', id)
        .single();

      if (!error && data) {
        setRequest(data);
        const { data: merchantData } = await supabase
          .from('merchants')
          .select('*')
          .eq('wallet_address', data.merchant_address)
          .single();
        if (merchantData) setMerchant(merchantData);
      }
      setLoading(false);
    };

    fetchRequest();
  }, [id]);

  const recordTransaction = async (hash: string) => {
    if (!request || !address || !supabase) return;
    try {
      await supabase.from('transactions').insert([
        {
          payment_request_id: request.id,
          sender_address: address,
          receiver_address: request.merchant_address,
          amount: request.amount,
          tx_hash: hash,
          status: 'completed'
        }
      ]);
      await supabase.from('payment_requests').update({ status: 'completed' }).eq('id', request.id);
    } catch (err) {
      console.error('Error recording transaction:', err);
    }
  };

  const handlePayment = async () => {
    if (!request || !address) return;
    setStatus('processing');
    setErrorMsg(null);
    const amountInUnits = parseUnits(request.amount.toString(), 6);
    try {
      pay({
        address: USDC_ADDRESS,
        abi: erc20Abi,
        functionName: 'transfer',
        args: [request.merchant_address as `0x${string}`, amountInUnits],
        gas: BigInt(200000), 
      });
    } catch (err: any) {
      setErrorMsg(err.shortMessage || err.message || 'Transaction failed');
      setStatus('error');
    }
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="w-10 h-10 text-emerald-500 animate-spin" /></div>;
  if (!request) return <div className="min-h-screen bg-black flex items-center justify-center p-6 text-center"><div><AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" /><h1 className="text-2xl font-bold">Request Not Found</h1></div></div>;

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-[1000px] w-full grid md:grid-cols-2 gap-8 lg:gap-12">
        <div className="flex flex-col justify-center">
          <Link href="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-white mb-8 transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Cancel Payment
          </Link>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500"><Store /></div>
            <div><p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Paying To</p><h3 className="text-xl font-bold text-white">{merchant?.store_name || 'Verified Merchant'}</h3></div>
          </div>
          <div className="bg-zinc-900/30 border border-white/5 rounded-3xl p-8 space-y-6">
            <div><p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Product</p><h2 className="text-3xl font-bold text-white">{request.product_name}</h2></div>
            <div className="pt-6 border-t border-white/5 flex justify-between items-baseline"><span className="text-zinc-500 text-sm">Total Amount</span><div className="text-right"><span className="text-4xl font-black text-emerald-500 tracking-tighter">{request.amount}</span><span className="ml-2 font-bold text-zinc-400">USDC</span></div></div>
          </div>
        </div>

        <div className="flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {status === 'success' ? (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-emerald-500/10 border border-emerald-500/20 rounded-[40px] p-12 text-center">
                <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8"><CheckCircle2 className="w-12 h-12 text-black" /></div>
                <h2 className="text-3xl font-black text-white mb-4">PAYMENT SUCCESS!</h2>
                <a href={`https://testnet.arcscan.app/tx/${txHash}`} target="_blank" className="w-full flex items-center justify-center gap-2 bg-white/5 border border-white/10 py-4 rounded-2xl text-white font-bold">View on Scan <ExternalLink className="w-4 h-4" /></a>
              </motion.div>
            ) : (
              <div className="bg-zinc-900/30 border border-white/5 rounded-[40px] p-8 md:p-12">
                <h3 className="text-xl font-bold mb-8">Checkout</h3>
                <div className="space-y-6">
                  <div className="p-5 bg-black rounded-3xl border border-white/5">
                    {isConnected ? (
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col"><span className="text-xs text-zinc-500 font-mono mb-1">{address?.slice(0, 8)}...{address?.slice(-8)}</span><span className="text-[10px] text-zinc-600 font-bold uppercase">Arc Testnet</span></div>
                        <div className="text-right"><span className="font-bold">{usdcBalance ? `${Number(formatUnits(usdcBalance.value, usdcBalance.decimals)).toFixed(1)} USDC` : '0.0 USDC'}</span></div>
                      </div>
                    ) : (
                      <div className="flex justify-center"><ConnectButton /></div>
                    )}
                  </div>
                  {errorMsg && <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3"><AlertCircle className="w-5 h-5 text-red-500" /><p className="text-xs text-red-400">{errorMsg}</p></div>}
                  <button disabled={!isConnected || status === 'processing'} onClick={handlePayment} className="w-full bg-emerald-500 disabled:opacity-50 text-black font-black py-5 rounded-2xl flex items-center justify-center gap-3">
                    {status === 'processing' ? <Loader2 className="animate-spin" /> : <><span>PAY {request.amount} USDC</span><ChevronRight /></>}
                  </button>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
