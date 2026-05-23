import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const InstallAppPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState<boolean>(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent browser default installer prompt overlay
      e.preventDefault();
      // Store the event so it can be triggered later.
      setDeferredPrompt(e);
      // Toggle custom installation prompt visible
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // If app is already installed in standalone mode, don't show prompt
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowPrompt(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Hide our UI prompt
    setShowPrompt(false);
    // Show the browser prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA installer decision outcome: ${outcome}`);
    
    // We used the prompt, clear it
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className="bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border-b border-emerald-500/20 px-4 py-3 font-sans relative"
      >
        <div id="pwa-install-appbar" className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500/20 px-2.5 py-2.5 rounded-xl border border-emerald-500/30">
              <Smartphone className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                Instal BizPilot AI di Handphone / Desktop
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Buka lebih cepat, hemat kuota internet, dan jalankan mandiri dari beranda kapan saja.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="pwa-install-exec-btn"
              onClick={handleInstallClick}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg transition-transform hover:scale-105 active:scale-95 flex items-center gap-1.5"
            >
              <Download className="h-3.5 w-3.5 stroke-3" />
              Pasang Sekarang
            </button>
            <button
              id="pwa-install-close-btn"
              onClick={handleDismiss}
              className="text-slate-400 hover:text-slate-200 p-2 rounded-lg hover:bg-slate-800/50 transition"
              title="Sembunyikan"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
