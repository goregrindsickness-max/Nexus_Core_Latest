import React from 'react';

interface EscrowReleaseReceiptProps {
  grossAmount: number;
  jobTarget?: string;
  hiringReq?: string;
  dispatch?: string;
  onAuthorize: () => void | Promise<void>;
  onCancel: () => void;
  isProcessing?: boolean;
}

export default function EscrowReleaseReceipt({
  grossAmount,
  jobTarget = "Sound Engineering – Tour Contract Shift",
  hiringReq = "Ephemeral Eradication (Band Entity)",
  dispatch = "Alex Silva (Independent Contractor)",
  onAuthorize,
  onCancel,
  isProcessing = false
}: EscrowReleaseReceiptProps) {
  // Calculate exact 7.77% application fee allocation
  const platformFee = Math.round(grossAmount * 0.0777 * 100) / 100;
  const netPayout = Math.round((grossAmount - platformFee) * 100) / 100;

  return (
    <div id="escrow-release-receipt" className="w-full px-4 py-6 sm:max-w-[620px] mx-auto font-mono text-zinc-300 select-none">
      <div className="border border-zinc-500 bg-black p-5 space-y-4 text-[11px] leading-relaxed">
        <div className="text-center font-black text-zinc-400">
          ======================================================================
          <div className="py-1 text-xs text-white tracking-widest uppercase">
            [ // TRANSACTION ESCROW RELEASE: FINAL CONFIRMATION ]
          </div>
          ----------------------------------------------------------------------
        </div>

        <div className="space-y-1">
          <div><span className="text-zinc-500 inline-block w-20">JOB TARGET</span>: <span className="text-white font-bold">{jobTarget}</span></div>
          <div><span className="text-zinc-500 inline-block w-20">HIRING REQ</span>: <span className="text-white font-bold">{hiringReq}</span></div>
          <div><span className="text-zinc-500 inline-block w-20">DISPATCH</span>: <span className="text-white font-bold">{dispatch}</span></div>
        </div>

        <div className="font-black text-zinc-400">
          ----------------------------------------------------------------------
          <div className="py-1 text-zinc-300 font-extrabold uppercase">
            ENGINE VALUATION LEDGER:
          </div>
          ----------------------------------------------------------------------
        </div>

        <div className="space-y-1.5 font-mono">
          <div className="flex justify-between">
            <span>GROSS CONTRACT TOTAL ......................</span>
            <span className="text-white">${grossAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</span>
          </div>
          <div className="flex justify-between text-red-400">
            <span>ALL-IN PLATFORM SERVICE FEE (7.77%) .......</span>
            <span>- ${platformFee.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</span>
          </div>
          <div className="border-t border-dashed border-zinc-700 my-2" />
          <div className="flex justify-between text-[#00ffcc] font-black text-xs">
            <span>NET CREATIVE PAYOUT AMOUNT ................</span>
            <span>${netPayout.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</span>
          </div>
        </div>

        <div className="font-black text-zinc-400">
          ----------------------------------------------------------------------
        </div>

        <div className="space-y-2 text-[10px] leading-relaxed text-zinc-450">
          <div className="text-amber-500 font-black uppercase tracking-wider flex items-center gap-1.5">
            [!] TAX & LEGAL COMPLIANCE PROTOCOL:
          </div>
          <p>
            This transaction constitutes a B2B independent contractor settlement. 
            No federal, state, or local income withholding taxes have been 
            deducted from this payout. Recipient assumes 100% statutory 
            responsibility for all self-employment tax liabilities and year-end 
            IRS reporting obligations.
          </p>
        </div>

        <div className="font-black text-zinc-400 pt-2">
          ----------------------------------------------------------------------
        </div>

        {/* Action Tapping Buttons */}
        <div className="flex flex-col gap-2.5 pt-1">
          <button
            onClick={onAuthorize}
            disabled={isProcessing}
            className="w-full h-11 bg-white hover:bg-zinc-200 text-black font-black uppercase tracking-widest transition-all disabled:opacity-50 text-[11px] rounded-none cursor-pointer border border-white"
          >
            {isProcessing ? 'PROCESSING ESCROW DISPATCH...' : '[ ACTION: AUTHORIZE & RELEASE FUNDS ]'}
          </button>
          
          <button
            onClick={onCancel}
            disabled={isProcessing}
            className="w-full py-3 text-zinc-500 hover:text-zinc-300 font-black uppercase tracking-widest text-[11px] transition-all bg-zinc-950/40 hover:bg-zinc-900/30 text-center rounded-none cursor-pointer"
          >
            [ ACTION: CANCEL TRANSACTION ]
          </button>
        </div>
      </div>
    </div>
  );
}
