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
  Copy,
  Clock,
  Store
} from 'lucide-react';
import Link from 'next/link';
import { useAccount, useBalance, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatUnits, parseUnits, erc20Abi } from 'viem';
import { supabase } from '@/lib/supabase';

const USDC_ADDRESS = '0x170aBCcca8976Ea643501a40348700244747B576' as `0x${string}`;
const ARCPAY_CONTRACT = '0x0000000000000000000000000000000000000000'; // Placeholder for smart contract logic

export default function CheckoutPage() {
  const { id } = useParams();
  const { address, isConnected } = useAccount();
  const [request, setRequest] = useState<any>(null);
  const [merchant, setMerchant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // USDC balance of user
  const { data: usdcBalance } = useBalance({
    address,
    // @ts-ignore
    token: USDC_ADDRESS,
  });

  const { writeContract: approve, data: approveData, error: approveError } = useWriteContract();
  const { writeContract: pay, data: payData, error: payError } = useWriteContract();

  const { isLoading: isApproveLoading, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({
    hash: approveData,
  });

  const { isLoading: isPayLoading, isSuccess: isPaySuccess } = useWaitForTransactionReceipt({
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

      if (error) {
        console.error('Error fetching request:', error);
      } else {
        setRequest(data);
        // Fetch merchant profile
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

      await supabase
        .from('payment_requests')
        .update({ status: 'completed' })
        .eq('id', request.id);
        
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
      if (ARCPAY_CONTRACT === '0x0000000000000000000000000000000000000000') {
        pay({
          address: USDC_ADDRESS,
          abi: erc20Abi,
          functionName: 'transfer',
          args: [request.merchant_address as `0x${string}`, amountInUnits],
          gas: BigInt(200000), 
        });
      }
    } catch (err: any) {
      setErrorMsg(err.shortMessage || err.message || 'Transaction failed');
      setStatus('error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-zinc-900/50 border border-white/5 rounded-3xl p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
          <h1 className="text-2xl font-bold mb-2">Request Not Found</h1>
          <p className="text-zinc-500 mb-8">This payment link may have expired or is invalid.</p>
          <Link href="/" className="inline-block bg-white text-black font-bold px-8 py-3 rounded-xl">Go Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 md:p-6">
      <div className="max-w-[1000px] w-full grid md:grid-cols-2 gap-8 lg:gap-12">
        {/* Left Side: Summary */}
        <div className="flex flex-col justify-center">
          <div className="mb-8">
            <Link href="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-white mb-8 transition-colors group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Cancel Payment
            </Link>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
                <Store className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Paying To</p>
                <h3 className="text-xl font-bold text-white">{merchant?.store_name || 'Verified Merchant'}</h3>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/30 border border-white/5 rounded-3xl p-8 space-y-6">
            <div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Product / Service</p>
              <h2 className="text-3xl font-bold text-white">{request.product_name}</h2>
              {request.description && <p className="text-zinc-500 mt-2 text-sm">{request.description}</p>}
            </div>

            <div className="pt-6 border-t border-white/5">
              <div className="flex justify-between items-baseline">
                <span className="text-zinc-500 text-sm">Total Amount</span>
                <div className="text-right">
                  <span className="text-4xl font-black text-emerald-500 tracking-tighter">{request.amount}</span>
                  <span className="ml-2 font-bold text-zinc-400">USDC</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-zinc-900/50 rounded-2xl border border-white/5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-widest">Secured by Arc Testnet Gateway</span>
            </div>
          </div>
        </div>

        {/* Right Side: Action */}
        <div className="flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {status === 'success' ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-emerald-500/10 border border-emerald-500/20 rounded-[40px] p-8 md:p-12 text-center"
              >
                <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_50px_-5px_rgba(16,185,129,0.5)]">
                  <CheckCircle2 className="w-12 h-12 text-black stroke-[3]" />
                </div>
                <h2 className="text-3xl font-black text-white mb-4">PAYMENT SUCCESS!</h2>
                <p className="text-zinc-400 mb-8">The transaction has been confirmed on the Arc Testnet blockchain.</p>
                
                <div className="space-y-3 mb-8">
                  <a 
                    href={`https://testnet.arcscan.app/tx/${txHash}`}
                    target="_blank"
                    className="w-full flex items-center justify-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold py-4 rounded-2xl transition-all"
                  >
                    View on Explorer
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
                
                <p className="text-[10px] text-zinc-600 font-mono break-all uppercase tracking-tighter">TX: {txHash}</p>
              </motion.div>
            ) : (
              <div className="bg-zinc-900/30 border border-white/5 rounded-[40px] p-8 md:p-12">
                <h3 className="text-xl font-bold mb-8">Complete Payment</h3>
                
                <div className="space-y-6">
                  {/* Wallet Info */}
                  <div className="p-5 bg-black rounded-3xl border border-white/5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-zinc-500" />
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">My Wallet</span>
                      </div>
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                    
                    {isConnected ? (
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-xs text-zinc-500 font-mono mb-1">{address?.slice(0, 8)}...{address?.slice(-8)}</span>
                          <span className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest">Arc Testnet</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="font-bold">
                            {usdcBalance ? `${Number(formatUnits(usdcBalance.value, usdcBalance.decimals)).toFixed(1)} USDC` : '0.0 USDC'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-zinc-500">Please connect your wallet above.</p>
                    )}
                  </div>

                  {errorMsg && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-red-400 leading-relaxed font-medium">{errorMsg}</p>
                    </div>
                  )}

                  <button
                    disabled={!isConnected || status === 'processing' || isPayLoading}
                    onClick={handlePayment}
                    className="w-full bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-black font-black py-5 rounded-2xl hover:bg-emerald-400 transition-all shadow-[0_0_30px_-5px_rgba(16,185,129,0.5)] flex items-center justify-center gap-3 group"
                  >
                    {status === 'processing' || isPayLoading ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span>PROCESSING...</span>
                      </>
                    ) : (
                      <>
                        <span>PAY {request.amount} USDC</span>
                        <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                  
                  <div className="text-center">
                    <p className="text-[10px] text-zinc-600 flex items-center justify-center gap-2">
                      <ShieldCheck className="w-3 h-3" />
                      TRUSTLESS ON-CHAIN SETTLEMENT
                    </p>
                  </div>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
