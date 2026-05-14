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

    // Listen for this specific request to be completed
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
                    <label className="block text-sm font-bold text-zinc-400 mb-2 uppercase tracking-widest">Product / Service Name</label>
                    <div className="relative">
                      <ShoppingBag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
                      <input 
                        required
                        type="text"
                        placeholder="e.g. Cyberpunk Asset Pack"
                        className="w-full bg-black border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:border-emerald-500/50 outline-none transition-all"
                        value={formData.productName}
                        onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-zinc-400 mb-2 uppercase tracking-widest">Amount (USDC)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
                      <input 
                        required
                        type="number"
                        step="0.01"
