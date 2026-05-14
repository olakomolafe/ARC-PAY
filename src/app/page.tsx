'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { motion } from 'framer-motion';
import { ShieldCheck, Zap, Globe, ArrowRight, CheckCircle2, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useAccount } from 'wagmi';

export default function LandingPage() {
  const { isConnected } = useAccount();

  return (
    <div className="min-h-screen bg-black text-white selection:bg-emerald-500/30">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Zap className="text-black w-6 h-6 fill-current" />
            </div>
            <span className="text-xl font-bold tracking-tighter italic">ARCPAY</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
            <Link href="#features" className="hover:text-emerald-500 transition-colors">Features</Link>
            <Link href="#demo" className="hover:text-emerald-500 transition-colors">Demo</Link>
            <Link href="#docs" className="hover:text-emerald-500 transition-colors">Documentation</Link>
          </div>

          <div className="flex items-center gap-4">
            <ConnectButton chainStatus="icon" showBalance={false} />
            {isConnected && (
              <Link 
                href="/dashboard"
                className="bg-white text-black text-sm font-bold px-5 py-2.5 rounded-full hover:bg-emerald-500 transition-all"
              >
                Dashboard
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-5xl opacity-20 pointer-events-none">
          <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-emerald-500 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-500 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-bold mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                EXCLUSIVELY FOR ARC TESTNET
              </div>
              <h1 className="text-6xl md:text-8xl font-bold tracking-tighter mb-8 bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent leading-[1.1]">
                Modern USDC <br /> 
                <span className="text-white">Payments for Web3</span>
              </h1>
              <p className="text-xl text-zinc-400 mb-10 leading-relaxed max-w-2xl">
                The lightweight crypto-native checkout for the next generation of finance. Create payment requests, generate links, and get paid in USDC instantly on Arc Testnet.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Link 
                  href={isConnected ? "/dashboard" : "/"}
                  className="px-8 py-4 bg-emerald-500 text-black font-bold rounded-2xl hover:bg-emerald-400 transition-all flex items-center gap-2 group shadow-[0_0_30px_-5px_rgba(16,185,129,0.5)]"
                >
                  Start Accepting Payments
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link 
                  href="#demo"
                  className="px-8 py-4 bg-zinc-900 border border-white/10 text-white font-bold rounded-2xl hover:bg-zinc-800 transition-all"
                >
                  View Live Demo
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Preview */}
      <section className="py-12 border-y border-white/5 bg-zinc-900/20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: 'Network', value: 'Arc Testnet' },
              { label: 'Finality', value: '< 1 Second' },
              { label: 'Settlement', value: 'Native USDC' },
              { label: 'Fee', value: '0.1%' },
            ].map((stat, i) => (
              <div key={i} className="space-y-1">
                <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<ShieldCheck className="w-8 h-8 text-emerald-500" />}
              title="Arc Exclusive"
              description="Built specifically for Arc Testnet to leverage sub-second finality and native USDC gas."
            />
            <FeatureCard 
              icon={<Globe className="w-8 h-8 text-blue-500" />}
              title="Shareable Links"
              description="Generate unique payment pages and share them anywhere. No coding required."
            />
            <FeatureCard 
              icon={<TrendingUp className="w-8 h-8 text-purple-500" />}
              title="Real-time Stats"
              description="Track every transaction with live updates and a powerful merchant dashboard."
            />
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo" className="py-32 bg-zinc-900/10 border-y border-white/5 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-4xl bg-blue-500/5 blur-[120px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-20 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold mb-8 tracking-tighter">Experience the checkout of the future.</h2>
            <p className="text-zinc-400 text-lg mb-10 leading-relaxed">
              Our checkout flow is designed to be the fastest in the world. 
              No complex forms, no credit cards. Just one click, one signature, and the transaction is settled on the Arc blockchain.
            </p>
            <ul className="space-y-4 mb-10">
              {[
                'Instant wallet connection via RainbowKit',
                'Native USDC gas optimization',
                'Real-time transaction confirmation',
                'Cyberpunk fintech aesthetics'
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-zinc-300">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-[32px] blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
            <div className="relative bg-[#050505] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl">
              {/* Mock Checkout UI */}
              <div className="p-8 border-b border-white/5 bg-white/[0.02]">
                <div className="flex items-center justify-between mb-8 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                  <div className="flex items-center gap-2">
                    <Zap className="w-3 h-3 text-emerald-500" />
                    Checkout Preview
                  </div>
                  <span>Order #8492</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center overflow-hidden">
                     <div className="w-full h-full bg-gradient-to-br from-emerald-500/20 to-blue-500/20" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">Cyberpunk Edition Hoodie</h4>
                    <p className="text-sm text-zinc-500">Limited Collection • XL</p>
                  </div>
                </div>
              </div>
              <div className="p-8 space-y-6">
                <div className="flex items-center justify-between text-zinc-400 text-sm">
                  <span>Subtotal</span>
                  <span className="text-white font-medium">85.00 USDC</span>
                </div>
                <div className="flex items-center justify-between text-zinc-400 text-sm">
                  <span>Network Fee</span>
                  <span className="text-emerald-500 font-medium">Free (Native)</span>
                </div>
                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                  <span className="font-bold">Total Amount</span>
                  <span className="text-2xl font-bold text-white">85.00 USDC</span>
                </div>
                <button className="w-full py-4 bg-emerald-500 text-black font-black rounded-2xl flex items-center justify-center gap-2 shadow-[0_0_30px_-5px_rgba(16,185,129,0.5)]">
                  Pay with USDC
                  <ArrowRight className="w-5 h-5" />
                </button>
                <p className="text-[10px] text-center text-zinc-600 font-bold uppercase tracking-widest">
                  Secured by Arc Testnet
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* CTA Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-emerald-500/5 backdrop-blur-3xl" />
        <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-8 tracking-tight">Ready to build the future of finance?</h2>
          <p className="text-zinc-400 text-lg mb-12">
            Join the elite circle of developers building on Arc. Get started with ArcPay today and experience the speed of native USDC payments.
          </p>
          {!isConnected ? (
            <div className="flex justify-center">
              <ConnectButton />
            </div>
          ) : (
            <Link 
              href="/dashboard"
              className="inline-flex px-10 py-5 bg-white text-black text-xl font-bold rounded-2xl hover:bg-emerald-500 transition-all shadow-2xl"
            >
              Go to Merchant Dashboard
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-white/5 text-zinc-500 text-sm">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            <span className="font-bold text-white tracking-tighter">ARCPAY</span>
            <span>© 2026</span>
          </div>
          <div className="flex gap-8">
            <Link href="#" className="hover:text-white transition-colors">Twitter</Link>
            <Link href="#" className="hover:text-white transition-colors">GitHub</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-8 rounded-3xl bg-zinc-900/30 border border-white/5 hover:border-emerald-500/30 transition-all group">
      <div className="mb-6 group-hover:scale-110 transition-transform duration-500">{icon}</div>
      <h3 className="text-2xl font-bold mb-4">{title}</h3>
      <p className="text-zinc-400 leading-relaxed">{description}</p>
    </div>
  );
}
