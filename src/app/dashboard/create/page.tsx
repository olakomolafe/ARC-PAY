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
