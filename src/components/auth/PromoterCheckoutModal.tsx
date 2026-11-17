import React from 'react';

interface PromoterCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  promoterPipeline: string;
  checkoutCardName: string;
  setCheckoutCardName: (v: string) => void;
  checkoutCardNumber: string;
  setCheckoutCardNumber: (v: string) => void;
  checkoutCardExpiry: string;
  setCheckoutCardExpiry: (v: string) => void;
  checkoutCardCvc: string;
  setCheckoutCardCvc: (v: string) => void;
  checkoutCardZip: string;
  setCheckoutCardZip: (v: string) => void;
  checkoutError: string;
  setCheckoutError: (v: string) => void;
  checkoutLoading: boolean;
  onCompleteCheckout: () => void;
  onDeferPayment: () => void;
}

export const PromoterCheckoutModal: React.FC<PromoterCheckoutModalProps> = ({
  isOpen,
  onClose,
  promoterPipeline,
  checkoutCardName,
  setCheckoutCardName,
  checkoutCardNumber,
  setCheckoutCardNumber,
  checkoutCardExpiry,
  setCheckoutCardExpiry,
  checkoutCardCvc,
  setCheckoutCardCvc,
  checkoutCardZip,
  setCheckoutCardZip,
  checkoutError,
  setCheckoutError,
  checkoutLoading,
  onCompleteCheckout,
  onDeferPayment
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-md bg-zinc-950 border border-yellow-500 rounded-2xl p-6 shadow-2xl relative space-y-6 text-left">
        {/* Border accent */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-600" />
        
        {/* Title */}
        <div className="text-center space-y-1.5">
          <h3 className="text-sm font-black tracking-widest uppercase text-white drop-shadow-[0_0_8px_rgba(234,179,8,0.4)]">
            🔒 SECURE GATEWAY CHECKOUT
          </h3>
          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
            ESTABLISHING VENUE PROMOTER ACCOUNT
          </p>
        </div>

        {/* Subscription info */}
        <div className="bg-yellow-950/20 border border-yellow-900/40 rounded-lg p-3.5 space-y-2 text-left">
          <div className="flex justify-between items-center border-b border-yellow-900/30 pb-2">
            <span className="text-[10px] font-mono text-zinc-400 uppercase">ACCESS PIPELINE</span>
            <span className="text-xs font-mono font-bold text-yellow-500 uppercase">
              {promoterPipeline === 'subscription' ? '🏢 VENUE / YEAR-ROUND' : '🎪 ANNUAL FESTIVAL OPERATOR'}
            </span>
          </div>
          {promoterPipeline === 'subscription' ? (
            <>
              <div className="flex justify-between items-center pt-1">
                <span className="text-[10px] font-mono text-zinc-400 uppercase">INITIALIZE VALUE</span>
                <span className="text-xs font-mono font-bold text-emerald-400">$0.00</span>
              </div>
              <div className="text-[9px] font-mono text-yellow-300 leading-normal uppercase">
                🎁 30-DAY FREE TRIAL INCLUDED. BILLING BEGINS ACROSS OUR 3 SUBSCRIPTION TIERS THEREAFTER.
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-between items-center pt-1">
                <span className="text-[10px] font-mono text-zinc-400 uppercase">EVENT SETUP FEE</span>
                <span className="text-xs font-mono font-bold text-yellow-400">$49.00 / Flat</span>
              </div>
              <div className="text-[9px] font-mono text-yellow-300 leading-normal uppercase">
                OR OPT FOR $1 PER-TICKET-SOLD STRUCTURE SETTLED DIRECTLY AT DOOR CHECKOUT.
              </div>
            </>
          )}
          <div className="text-[8px] font-mono text-zinc-500 leading-normal uppercase">
            Enter billing credentials below to finalize account creation and secure your routing license keys.
          </div>
        </div>

        {/* Card Details form */}
        <div className="space-y-4">
          <div className="space-y-1.5 text-left">
            <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase">CARDHOLDER NAME</label>
            <input 
              type="text" 
              placeholder="ENTER CARDHOLDER FULL NAME"
              value={checkoutCardName}
              onChange={(e) => setCheckoutCardName(e.target.value.toUpperCase())}
              className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-xs font-mono text-yellow-500 focus:border-yellow-500 outline-none"
            />
          </div>

          <div className="space-y-1.5 text-left">
            <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase">CARD NUMBER</label>
            <input 
              type="text" 
              maxLength={19}
              placeholder="0000 0000 0000 0000"
              value={checkoutCardNumber}
              onChange={(e) => {
                const v = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
                const matches = v.match(/\d{4,16}/g);
                const match = matches && matches[0] || '';
                const parts = [];
                for (let i=0, len=match.length; i<len; i+=4) {
                  parts.push(match.substring(i, i+4));
                }
                if (parts.length > 0) {
                  setCheckoutCardNumber(parts.join(' '));
                } else {
                  setCheckoutCardNumber(v);
                }
              }}
              className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-xs font-mono text-yellow-500 focus:border-yellow-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5 text-left col-span-1">
              <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase">EXPIRY</label>
              <input 
                type="text" 
                maxLength={5}
                placeholder="MM/YY"
                value={checkoutCardExpiry}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, '');
                  if (v.length >= 2) {
                    setCheckoutCardExpiry(`${v.slice(0, 2)}/${v.slice(2, 4)}`);
                  } else {
                    setCheckoutCardExpiry(v);
                  }
                }}
                className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-xs font-mono text-yellow-500 focus:border-yellow-500 outline-none"
              />
            </div>

            <div className="space-y-1.5 text-left col-span-1">
              <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase">CVC</label>
              <input 
                type="text" 
                maxLength={4}
                placeholder="123"
                value={checkoutCardCvc}
                onChange={(e) => setCheckoutCardCvc(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-xs font-mono text-yellow-500 focus:border-yellow-500 outline-none"
              />
            </div>

            <div className="space-y-1.5 text-left col-span-1">
              <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase">POSTAL CODE</label>
              <input 
                type="text" 
                placeholder="12345"
                value={checkoutCardZip}
                onChange={(e) => setCheckoutCardZip(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-xs font-mono text-yellow-500 focus:border-yellow-500 outline-none"
              />
            </div>
          </div>
        </div>

        {checkoutError && (
          <p className="text-[9px] font-mono font-bold text-red-500 uppercase tracking-widest text-left">
            ⚠️ {checkoutError}
          </p>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => {
                onClose();
                setCheckoutError('');
              }}
              disabled={checkoutLoading}
              className="w-1/3 border border-zinc-800 hover:bg-zinc-900 text-zinc-400 py-2.5 rounded text-xs font-mono tracking-wider uppercase transition-all"
            >
              CANCEL
            </button>
            <button
              type="button"
              onClick={onCompleteCheckout}
              disabled={checkoutLoading}
              className="w-2/3 bg-yellow-500 hover:bg-yellow-400 text-neutral-950 font-black py-2.5 rounded text-xs tracking-wider uppercase transition-all shadow-[0_0_12px_rgba(234,179,8,0.4)]"
            >
              {checkoutLoading ? 'VALIDATING...' : 'AUTHORIZE PAYMENT METHOD'}
            </button>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-zinc-800"></div>
            <span className="flex-shrink mx-3 text-[9px] font-mono text-zinc-500 uppercase">or defer activation</span>
            <div className="flex-grow border-t border-zinc-800"></div>
          </div>

          <button
            type="button"
            onClick={onDeferPayment}
            disabled={checkoutLoading}
            className="w-full border border-dashed border-zinc-700 hover:border-yellow-500/50 hover:bg-yellow-500/5 text-yellow-400/90 hover:text-yellow-400 py-3 rounded-lg text-xs font-mono tracking-widest uppercase transition-all flex flex-col items-center justify-center space-y-0.5 animate-pulse"
          >
            <span className="font-bold">⚡ DEFER PAYMENT FOR 72 HOURS</span>
            <span className="text-[8px] text-zinc-500 uppercase font-normal">Check out full workspace features first (No card required)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
