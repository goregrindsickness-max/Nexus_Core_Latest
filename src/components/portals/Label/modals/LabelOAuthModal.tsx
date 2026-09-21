import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CreditCard, X, RefreshCw, CheckSquare } from 'lucide-react';
import { getSupabase } from '../../../../supabase';

interface LabelOAuthModalProps {
  labelOAuthProcessor: { id: 'stripe' | 'paypal'; name: string } | null;
  setLabelOAuthProcessor: React.Dispatch<React.SetStateAction<{ id: 'stripe' | 'paypal'; name: string } | null>> | ((proc: { id: 'stripe' | 'paypal'; name: string } | null) => void);
  labelOAuthStep: number;
  setLabelOAuthStep: (step: number) => void;
  userProfile: any;
  setUserProfile: (profile: any) => void;
  showLocalToast: (msg: string) => void;
}

export const LabelOAuthModal: React.FC<LabelOAuthModalProps> = ({
  labelOAuthProcessor,
  setLabelOAuthProcessor,
  labelOAuthStep,
  setLabelOAuthStep,
  userProfile,
  setUserProfile,
  showLocalToast
}) => {
  return (
    <AnimatePresence>
      {labelOAuthProcessor && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            className="bg-[#0e1015] border border-zinc-850 rounded-3xl p-6 w-full max-w-sm relative shadow-2xl overflow-hidden text-white"
          >
            <div className="absolute top-4 right-4">
              <button
                type="button"
                onClick={() => setLabelOAuthProcessor(null)}
                className="p-2 bg-zinc-900/80 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center space-y-4 mt-2">
              <div className="w-16 h-16 bg-black border border-zinc-800 rounded-2xl mx-auto flex items-center justify-center text-2xl shadow-lg">
                <CreditCard className="w-8 h-8 text-[#00ffcc]" />
              </div>
              
              {labelOAuthStep === 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white font-display tracking-wide">
                    Connect {labelOAuthProcessor.name}
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed px-2">
                    Our platform uses secure OAuth protocol to integrate with {labelOAuthProcessor.name}. <br/><br/>
                    You will be redirected safely to register or grant access. <strong className="text-[#00ffcc]">No technical API keys needed.</strong>
                  </p>
                  <button
                    type="button"
                    onClick={async () => {
                      setLabelOAuthStep(1);
                      try {
                        const urlEndpoint = labelOAuthProcessor.id === 'stripe' ? '/api/auth/stripe/url' : '/api/auth/paypal/url';
                        const response = await fetch(urlEndpoint);
                        if (!response.ok) throw new Error('Failed to fetch authorization URL');
                        const { url } = await response.json();
                        
                        const width = 600, height = 700;
                        const left = window.screen.width / 2 - width / 2;
                        const top = window.screen.height / 2 - height / 2;
                        
                        const authWindow = window.open(
                          url,
                          `${labelOAuthProcessor.id}_oauth_popup`,
                          `width=${width},height=${height},top=${top},left=${left}`
                        );
                        if (!authWindow) {
                          setLabelOAuthStep(0);
                          showLocalToast("⚠️ POPUP BLOCKED: Please enable popups.");
                        }
                      } catch (err: any) {
                        setLabelOAuthStep(0);
                        showLocalToast(`⚠️ Connection error: ${err.message}`);
                      }
                    }}
                    className="w-full mt-4 bg-[#00ffcc] hover:bg-[#0fd9ae] text-black py-3 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition cursor-pointer"
                  >
                    Authorize {labelOAuthProcessor.name}
                  </button>
                </div>
              )}

              {labelOAuthStep === 1 && (
                <div className="space-y-5 animate-pulse min-h-[160px] flex flex-col justify-center items-center">
                  <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
                  <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest font-extrabold flex items-center gap-1">
                    Waiting for Authorization...
                  </p>
                  <p className="text-[9px] text-zinc-500 max-w-[200px]">
                    Please authorize in the popup window.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      const id = labelOAuthProcessor.id;
                      if (id === 'stripe') {
                        setUserProfile({
                          ...userProfile,
                          stripe_customer_id: 'acct_label_oauth_' + Math.random().toString(36).substring(2, 6).toUpperCase(),
                          label_stripe_connected: true
                        });
                      } else {
                        setUserProfile({
                          ...userProfile,
                          paypal_email: 'label_paypal_oauth_' + Math.random().toString(36).substring(2, 5) + '@nexus.core',
                          label_paypal_connected: true
                        });
                      }
                      setLabelOAuthStep(2);
                    }}
                    className="text-[10px] font-mono text-[#00ffcc] uppercase tracking-widest border border-[#00ffcc]/30 px-3 py-1.5 rounded-lg hover:bg-[#00ffcc]/10 transition cursor-pointer mt-2"
                  >
                    [Simulate Success fallback]
                  </button>
                </div>
              )}

              {labelOAuthStep === 2 && (
                <div className="space-y-4 min-h-[160px] flex flex-col justify-center items-center">
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-2 relative">
                     <CheckSquare className="w-6 h-6 text-emerald-400 absolute" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider font-display">
                      OAuth Success
                    </h3>
                    <p className="text-[11px] text-zinc-400 mt-1">
                      Account successfully connected and synchronized.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const supabase = getSupabase();
                        if (supabase && userProfile?.id) {
                          await supabase.from('profiles').upsert(userProfile);
                        }
                      } catch (e) {
                        console.error("Database profile sync error:", e);
                      }
                      
                      showLocalToast(`${labelOAuthProcessor.name} successfully linked!`);
                      setLabelOAuthProcessor(null);
                    }}
                    className="w-full mt-4 bg-emerald-500 text-black py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-500/20 hover:brightness-110 transition cursor-pointer"
                  >
                    Complete setup
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
