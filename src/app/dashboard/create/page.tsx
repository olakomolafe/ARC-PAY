'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBag, 
  DollarSign, 
  FileText, 
  Calendar,
  ChevronRight,
  Copy,
  Check,
  QrCode,
  Link as LinkIcon,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { supabase } from '@/lib/supabase';
import { QRCodeSVG } from 'qrcode.react';

export default function CreatePaymentPage() {
  const { address } = useAccount();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [createdRequest, setCreatedRequest] = useState<any>(null);
  const [isReceived, setIsReceived] = useState(false);

  const [formData, setFormData] = useState({
    productName: '',
    description: '',
    amount: '',
    expiration: ''
  });

  useEffect(() => {
    if (!createdRequest || !supabase) return;

    const channel = supabase
      .channel(`payment_${createdRequest.id}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'payment_requests',
        filter: `id=eq.${createdRequest.id}`
      }, 
      // @ts-ignore
      (payload) => {
        if (payload.new.status === 'completed') {
          setIsReceived(true);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [createdRequest]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return;
    if (!supabase) {
      alert('Supabase is not configured.');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('payment_requests')
        .insert([
          {
            merchant_address: address,
            product_name: formData.productName,
            description: formData.description,
            amount: parseFloat(formData.amount),
            expiration_date: formData.expiration || null,
            status: 'pending'
          }
        ])
        .select()
        .single();

      if (error) throw error;
      
      setCreatedId(data.id);
      setCreatedRequest(data);
      setStep(2);
    } catch (err) {
      console.error('Error creating payment:', err);
      alert('Failed to create payment request.');
    } finally {
      setLoading(false);
    }
  };

  const paymentUrl = createdId ? `${window.location.origin}/pay/${createdId}` : '';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(paymentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-10">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-zinc-500 hover:text-white mb-6 transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Create Payment Request</h1>
        <p className="text-zinc-500">Generate a unique link to receive USDC payments on Arc Testnet.</p>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="bg-zinc-900/30 border border-white/5 rounded-3xl p-8 lg:p-12"
          >
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-zinc-400 mb-2 uppercase tracking-widest">Product Name</label>
                    <input 
                      required
                      type="text"
                      className="w-full bg-black border border-white/10 rounded-2xl py-4 px-4 focus:border-emerald-500/50 outline-none transition-all"
                      value={formData.productName}
                      onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-zinc-400 mb-2 uppercase tracking-widest">Amount (USDC)</label>
                    <input 
                      required
                      type="number"
                      step="0.01"
                      className="w-full bg-black border border-white/10 rounded-2xl py-4 px-4 focus:border-emerald-500/50 outline-none transition-all"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-zinc-400 mb-2 uppercase tracking-widest">Description</label>
                    <textarea 
                      className="w-full bg-black border border-white/10 rounded-2xl py-4 px-4 focus:border-emerald-500/50 outline-none transition-all resize-none"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-white/5">
                <button 
                  disabled={loading}
                  type="submit"
                  className="w-full md:w-auto bg-emerald-500 text-black font-bold px-10 py-4 rounded-2xl hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ChevronRight className="w-5 h-5" />}
                  Generate Payment Request
                </button>
              </div>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="step2"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="grid md:grid-cols-2 gap-8"
          >
            <div className="bg-zinc-900/30 border border-white/5 rounded-3xl p-8 lg:p-12 flex flex-col items-center justify-center text-center">
              <AnimatePresence mode="wait">
                {isReceived ? (
                  <motion.div 
                    key="success"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center py-6"
                  >
                    <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mb-8 shadow-[0_0_50px_-5px_rgba(16,185,129,0.8)] animate-bounce">
                      <Check className="w-12 h-12 text-black stroke-[4]" />
                    </div>
                    <h2 className="text-4xl font-black mb-4">PAYMENT RECEIVED!</h2>
                    <p className="text-emerald-500 font-bold mb-8 uppercase tracking-widest text-sm text-center">Arc Testnet Confirmed</p>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="waiting"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center"
                  >
                    <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mb-6">
                      <Check className="w-10 h-10 text-black stroke-[3]" />
                    </div>
                    <h2 className="text-3xl font-bold mb-4">Request Created!</h2>
                    
                    <div className="bg-black p-4 rounded-2xl border border-emerald-500/20 mb-8">
                      <QRCodeSVG value={paymentUrl} size={180} includeMargin={true} bgColor="#000000" fgColor="#10b981" />
                    </div>

                    <button onClick={copyToClipboard} className="flex items-center gap-2 text-emerald-500 font-bold">
                      {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                      {copied ? 'Copied Link' : 'Copy Payment Link'}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="space-y-6">
               <div className="bg-zinc-900/30 border border-white/5 rounded-3xl p-8">
                  <h3 className="font-bold mb-6">Payment Details</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500">Product</span>
                      <span className="font-medium text-white">{formData.productName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500">Amount</span>
                      <span className="font-medium text-emerald-500">{formData.amount} USDC</span>
                    </div>
                  </div>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
