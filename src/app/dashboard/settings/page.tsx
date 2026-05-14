'use client';

import { useEffect, useState } from 'react';
import { 
  User, 
  Bell, 
  Shield, 
  Globe, 
  Save, 
  AlertTriangle,
  ExternalLink,
  Zap,
  Loader2
} from 'lucide-react';
import { useAccount } from 'wagmi';
import { supabase } from '@/lib/supabase';

export default function SettingsPage() {
  const { address } = useAccount();
  const [merchantName, setMerchantName] = useState('My Arc Store');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState({
    email: true,
    browser: false,
    payments: true
  });

  useEffect(() => {
    if (!address || !supabase) return;

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('merchants')
        .select('*')
        .eq('wallet_address', address)
        .single();

      if (data) {
        setMerchantName(data.name || 'My Arc Store');
        setEmail(data.email || '');
        if (data.settings) setNotifications(data.settings);
      }
      setLoading(false);
    };

    fetchProfile();
  }, [address]);

  const handleSave = async () => {
    if (!address || !supabase) return;
    setSaving(true);

    const { error } = await supabase
      .from('merchants')
      .upsert({
        wallet_address: address,
        name: merchantName,
        email: email,
        settings: notifications,
        updated_at: new Date().toISOString()
      }, { onConflict: 'wallet_address' });

    setSaving(false);
    if (error) {
      alert('Error saving settings: ' + error.message);
    } else {
      alert('Settings saved successfully!');
    }
  };

  if (loading && address) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
    </div>
  );

  return (
    <div className="space-y-10 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Settings</h1>
        <p className="text-zinc-500">Manage your merchant profile and platform preferences.</p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Profile Section */}
        <div className="bg-zinc-900/30 border border-white/5 rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center gap-3">
            <User className="w-5 h-5 text-emerald-500" />
            <h2 className="font-bold">Merchant Profile</h2>
          </div>
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400">Merchant Name</label>
                <input 
                  type="text" 
                  value={merchantName}
                  onChange={(e) => setMerchantName(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:border-emerald-500/50 outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400">Support Email</label>
                <input 
                  type="email" 
                  placeholder="contact@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:border-emerald-500/50 outline-none transition-all"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">Settlement Wallet (Arc Testnet)</label>
              <div className="flex items-center gap-3 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                <code className="text-xs text-emerald-500 font-mono flex-1">{address}</code>
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Verified</span>
              </div>
              <p className="text-[10px] text-zinc-600 mt-2">All payments from ArcPay will be settled instantly to this address.</p>
            </div>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="bg-zinc-900/30 border border-white/5 rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center gap-3">
            <Bell className="w-5 h-5 text-blue-500" />
            <h2 className="font-bold">Notifications</h2>
          </div>
          <div className="p-8 space-y-4">
            <ToggleItem 
              title="Email Alerts" 
              description="Get notified via email when a payment is confirmed."
              enabled={notifications.email}
              onChange={() => setNotifications({...notifications, email: !notifications.email})}
            />
            <ToggleItem 
              title="Payment Success" 
              description="Receive a browser notification on successful checkout."
              enabled={notifications.payments}
              onChange={() => setNotifications({...notifications, payments: !notifications.payments})}
            />
          </div>
        </div>

        {/* Infrastructure Section */}
        <div className="bg-zinc-900/30 border border-white/5 rounded-3xl overflow-hidden opacity-80">
          <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center gap-3">
            <Zap className="w-5 h-5 text-orange-500" />
            <h2 className="font-bold">Infrastructure</h2>
          </div>
          <div className="p-8">
            <div className="flex items-center justify-between text-sm mb-4">
              <span className="text-zinc-500">Blockchain Network</span>
              <span className="font-bold flex items-center gap-2">
                Arc Testnet
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </span>
            </div>
            <div className="flex items-center justify-between text-sm mb-6">
              <span className="text-zinc-500">Supabase Connection</span>
              <span className="font-bold text-emerald-500 flex items-center gap-1">
                Connected
                <ExternalLink className="w-3 h-3" />
              </span>
            </div>
            <button className="text-xs text-zinc-600 hover:text-white transition-colors underline">
              View Database Logs
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-500/5 border border-red-500/10 rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-red-500/10 bg-red-500/[0.02] flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h2 className="font-bold text-red-500">Danger Zone</h2>
          </div>
          <div className="p-8">
            <p className="text-sm text-zinc-500 mb-6">Once you disconnect your account, you will no longer be able to track your existing payment requests.</p>
            <button className="px-6 py-3 border border-red-500/30 text-red-500 rounded-xl text-sm font-bold hover:bg-red-500 hover:text-white transition-all">
              Disconnect Merchant Account
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-6">
        <button 
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-emerald-500 text-black font-black px-10 py-4 rounded-2xl hover:bg-emerald-400 transition-all shadow-[0_0_30px_-5px_rgba(16,185,129,0.5)] disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}

function ToggleItem({ title, description, enabled, onChange }: { title: string, description: string, enabled: boolean, onChange: () => void }) {
  return (
    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
      <div>
        <p className="font-bold text-sm">{title}</p>
        <p className="text-xs text-zinc-500">{description}</p>
      </div>
      <button 
        onClick={onChange}
        className={`w-12 h-6 rounded-full transition-all relative ${enabled ? 'bg-emerald-500' : 'bg-zinc-700'}`}
      >
        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${enabled ? 'left-7' : 'left-1'}`} />
      </button>
    </div>
  );
}
