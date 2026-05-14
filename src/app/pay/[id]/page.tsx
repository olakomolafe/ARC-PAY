'use client';

import { useEffect, useState, use } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  ShieldCheck, 
  Wallet, 
  ArrowRight, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useBalance, useReadContract } from 'wagmi';
import { parseUnits, formatUnits, erc20Abi } from 'viem';
import { supabase } from '@/lib/supabase';
import { USDC_ADDRESS, USDC_DECIMALS, arcTestnet } from '@/lib/web3';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';

// Contract address for ArcPay (mock for now, should be replaced with actual deployed address)
const ARCPAY_CONTRACT = '0x0000000000000000000000000000000000000000'; 

export default function CheckoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { address, isConnected } = useAccount();
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'idle' | 'approving' | 'paying' | 'success' | 'error'>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [merchantInfo, setMerchantInfo] = useState<any>(null);

  // USDC balance of user
  const { data: usdcBalance } = useBalance({
    address,
    token: USDC_ADDRESS,
  });

  // Check allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: 'allowance',
    args: address && ARCPAY_CONTRACT !== '0x0000000000000000000000000000000000000000' ? [address, ARCPAY_CONTRACT] : undefined,
  });

  const { writeContract: approve, data: approveData, error: approveError } = useWriteContract();
  const { writeContract: pay, data: payData, error: payError } = useWriteContract();

  const { isLoading: isApproveLoading, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({
    hash: approveData,
  });

  const { isLoading: isPayLoading, isSuccess: isPaySuccess, data: payReceipt } = useWaitForTransactionReceipt({
    hash: payData,
  });

  useEffect(() => {
    async function fetchRequest() {
      if (!supabase) {
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('payment_requests')
        .select('*')
        .eq('id', id)
        .single();
      
      if (data) {
        setRequest(data);
        // Fetch merchant info
        const { data: merchant } = await supabase
          .from('merchants')
          .select('*')
          .eq('wallet_address', data.merchant_address)
          .single();
        
        if (merchant) setMerchantInfo(merchant);
      }
      setLoading(false);
    }
    fetchRequest();
  }, [id]);

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
      updatePaymentStatus();
    }
  }, [isPaySuccess, payData]);

  const updatePaymentStatus = async () => {
    if (!id || !payData || !supabase) return;
    
    // Update payment request status
    await supabase
      .from('payment_requests')
      .update({ status: 'completed' })
      .eq('id', id);

    // Insert transaction record
    await supabase
      .from('transactions')
      .insert([
        {
          payment_request_id: id,
          tx_hash: payData,
          sender_address: address,
          receiver_address: request.merchant_address,
          amount: request.amount,
          status: 'confirmed'
        }
      ]);
  };

  const handlePayment = async () => {
    if (!address || !request) return;
    setErrorMsg(null);

    try {
      const amountInUnits = parseUnits(request.amount.toString(), USDC_DECIMALS);

      // If we don't have a contract yet, just do a direct transfer for demo/MVP
      if (ARCPAY_CONTRACT === '0x0000000000000000000000000000000000000000') {
        setStatus('paying');
        pay({
          address: USDC_ADDRESS,
          abi: erc20Abi,
          functionName: 'transfer',
          args: [request.merchant_address as `0x${string}`, amountInUnits],
          gas: BigInt(200000), 
        });
      } else {
        // Logic for Contract Payment (Approve + Pay)
        if (!allowance || allowance < amountInUnits) {
          setStatus('approving');
          approve({
            address: USDC_ADDRESS,
            abi: erc20Abi,
            functionName: 'approve',
            args: [ARCPAY_CONTRACT, amountInUnits],
          });
        } else {
          setStatus('paying');
          // Call contract pay function
          // pay({...})
        }
      }
    } catch (err: any) {
      console.error('Payment Error:', err);
      setErrorMsg(err.shortMessage || err.message || 'Unknown blockchain error');
      setStatus('error');
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
    </div>
  );

  if (!request) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
      <AlertCircle className="w-16 h-16 text-zinc-800 mb-6" />
      <h1 className="text-2xl font-bold mb-2">Payment Link Not Found</h1>
      <p className="text-zinc-500 mb-8">This payment request doesn't exist or has been deleted.</p>
      <Link href="/" className="text-emerald-500 font-bold hover:underline">Go to ArcPay Home</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-emerald-500/30 font-sans">
      <div className="max-w-xl mx-auto px-6 py-12 md:py-24">
        {/* Header */}
        <div className="flex items-center justify-center gap-2 mb-12">
          <div className="w-8 h-8 bg-emerald-500 rounded flex items-center justify-center">
            <Zap className="text-black w-5 h-5 fill-current" />
          </div>
          <span className="text-lg font-bold tracking-tighter">ARCPAY</span>
        </div>

        <AnimatePresence mode="wait">
          {status === 'success' ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-zinc-900/50 border border-emerald-500/30 rounded-3xl p-10 text-center"
            >
              <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_-5px_rgba(16,185,129,0.5)]">
                <CheckCircle2 className="w-10 h-10 text-black stroke-[3]" />
              </div>
              <h2 className="text-3xl font-bold mb-4">Payment Successful!</h2>
              <p className="text-zinc-400 mb-10 leading-relaxed">
                Your payment of <span className="text-white font-bold">{request.amount} USDC</span> to <span className="text-white font-mono text-xs">{request.merchant_address.slice(0, 6)}...{request.merchant_address.slice(-4)}</span> has been confirmed on Arc Testnet.
              </p>
              
              <div className="space-y-4">
                <a 
                  href={`https://testnet.arcscan.app/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-4 bg-white/5 border border-white/10 rounded-2xl font-bold hover:bg-white/10 transition-all"
                >
                  View on Explorer
                  <ExternalLink className="w-4 h-4" />
                </a>
                <Link 
                  href="/"
                  className="block py-4 text-zinc-500 font-bold hover:text-white transition-colors"
                >
                  Return to Merchant
                </Link>
              </div>
            </motion.div>
          ) : status === 'error' ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-zinc-900/50 border border-red-500/30 rounded-3xl p-10 text-center"
            >
              <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-8">
                <AlertCircle className="w-10 h-10 text-red-500" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Transaction Failed</h2>
              <p className="text-zinc-500 mb-8 text-sm break-all font-mono">
                {errorMsg}
              </p>
              <button 
                onClick={() => setStatus('idle')}
                className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl font-bold hover:bg-white/10 transition-all"
              >
                Try Again
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="checkout"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-zinc-900/30 border border-white/5 rounded-3xl overflow-hidden shadow-2xl"
            >
              {/* Merchant Info */}
              <div className="p-8 border-b border-white/5 bg-white/[0.02]">
                <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-2">Paying to</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-blue-500 flex items-center justify-center font-bold text-xs">
                    {merchantInfo?.name ? merchantInfo.name.slice(0, 2).toUpperCase() : request.merchant_address.slice(2, 4).toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-sm">{merchantInfo?.name || 'Merchant'}</span>
                    <span className="font-mono text-[10px] text-zinc-500">
                      {request.merchant_address.slice(0, 12)}...{request.merchant_address.slice(-8)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Order Info */}
              <div className="p-8 md:p-10">
                <div className="mb-10">
                  <h1 className="text-4xl font-bold tracking-tight mb-2">{request.product_name}</h1>
                  {request.description && <p className="text-zinc-500">{request.description}</p>}
                </div>

                <div className="flex flex-col items-center justify-center py-10 bg-black/40 rounded-2xl border border-white/5 mb-10">
                  <span className="text-zinc-500 text-sm font-medium mb-1">Total Amount</span>
                  <div className="flex items-baseline gap-3">
                    <span className="text-6xl font-bold tracking-tighter">{request.amount}</span>
                    <span className="text-2xl font-bold text-emerald-500">USDC</span>
                  </div>
                </div>

                {isConnected ? (
                  <div className="space-y-6">
                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 text-sm">
                        <div className="flex items-center gap-3">
                          <Wallet className="w-5 h-5 text-zinc-500" />
                          <span className="text-zinc-400">Your Balance</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="font-bold">
                            {usdcBalance ? `${Number(formatUnits(usdcBalance.value, usdcBalance.decimals)).toFixed(1)} USDC` : '0.0 USDC'}
                          </span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-zinc-500 font-mono">
                              {address?.slice(0, 6)}...{address?.slice(-4)}
                            </span>
                            <div className="scale-75 origin-right">
                              <ConnectButton accountStatus="address" showBalance={false} chainStatus="none" />
                            </div>
                          </div>
                        </div>
                      </div>

                    <button
                      onClick={handlePayment}
                      disabled={status !== 'idle' || isPayLoading || (usdcBalance && usdcBalance.value < parseUnits(request.amount.toString(), USDC_DECIMALS))}
                      className="w-full py-5 bg-emerald-500 text-black font-black text-xl rounded-2xl hover:bg-emerald-400 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_40px_-5px_rgba(16,185,129,0.4)]"
                    >
                      {status === 'paying' || isPayLoading ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        <>
                          Pay with USDC
                          <ArrowRight className="w-6 h-6" />
                        </>
                      )}
                    </button>
                    
                    {usdcBalance && usdcBalance.value < parseUnits(request.amount.toString(), USDC_DECIMALS) && (
                      <p className="text-center text-xs text-red-500 font-medium">Insufficient USDC balance on Arc Testnet</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="text-center p-6 bg-blue-500/5 border border-blue-500/20 rounded-2xl">
                      <p className="text-sm text-blue-400 font-medium">Connect your wallet to pay with USDC on Arc Testnet</p>
                    </div>
                    <div className="flex justify-center">
                       <ConnectButton label="Connect Wallet to Pay" />
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-6 bg-black border-t border-white/5 flex items-center justify-center gap-2 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                <ShieldCheck className="w-3.5 h-3.5" />
                Secured by Arc Testnet & Circle Infrastructure
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
