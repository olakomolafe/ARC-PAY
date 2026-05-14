'use client';

import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { arcTestnet } from '@/lib/web3';
import { useEffect, useState } from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function NetworkGuard({ children }: { children: React.ReactNode }) {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isWrongNetwork = isConnected && chainId !== arcTestnet.id;

  return (
    <>
      <AnimatePresence>
        {isWrongNetwork && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          >
            <div className="bg-zinc-900 border border-emerald-500/30 rounded-2xl p-8 max-w-md w-full shadow-[0_0_50px_-12px_rgba(16,185,129,0.3)] text-center">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShieldAlert className="w-8 h-8 text-emerald-500" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Switch to Arc Testnet</h2>
              <p className="text-zinc-400 mb-8">
                ArcPay exclusively operates on the Arc Testnet. Please switch your network to continue.
              </p>
              <button
                onClick={() => switchChain({ chainId: arcTestnet.id })}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-bold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2 group"
              >
                <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                Switch Network
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className={isWrongNetwork ? 'blur-sm pointer-events-none transition-all duration-500' : 'transition-all duration-500'}>
        {children}
      </div>
    </>
  );
}
