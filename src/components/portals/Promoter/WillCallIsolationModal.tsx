import React, { useState, useEffect, useMemo } from 'react';
import { Package, Check, AlertTriangle, ShieldAlert } from 'lucide-react';
import { Show } from '../../../types';

interface WillCallIsolationModalProps {
  shows: Show[];
}

export default function WillCallIsolationModal({ shows }: WillCallIsolationModalProps) {
  const [isActive, setIsActive] = useState(false);
  const [willCallOrders, setWillCallOrders] = useState<any[]>([]);

  // Periodically check if we are in the Merch Call window
  useEffect(() => {
    const checkWindow = () => {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      
      let isWindowActive = false;

      for (const show of shows) {
        if (!show.load_in_time || !show.doors_time) continue;
        if (show.date !== todayStr) continue;

        const [year, month, day] = show.date.split('-').map(Number);
        
        const loadParts = String(show.load_in_time).split(':');
        const loadDate = new Date(year, month - 1, day, parseInt(loadParts[0] || '0', 10), parseInt(loadParts[1] || '0', 10), 0);

        const doorParts = String(show.doors_time).split(':');
        const doorDate = new Date(year, month - 1, day, parseInt(doorParts[0] || '0', 10), parseInt(doorParts[1] || '0', 10), 0);


        // Active between load in and doors
        if (now >= loadDate && now < doorDate) {
          isWindowActive = true;
          break;
        }
      }

      // Read local will call array
      if (isWindowActive) {
        try {
          const stored = JSON.parse(localStorage.getItem('nexus_master_will_call') || '[]');
          const unfulfilled = stored.filter((o: any) => !o.is_fulfilled);
          if (unfulfilled.length > 0) {
            setWillCallOrders(unfulfilled);
            setIsActive(true);
            return;
          }
        } catch (e) {}
      }
      setIsActive(false);
    };

    checkWindow();
    const int = setInterval(checkWindow, 10000);
    return () => clearInterval(int);
  }, [shows]);

  const aggregatedSummary = useMemo(() => {
    const counts: Record<string, number> = {};
    willCallOrders.forEach(order => {
      const quantity = order.quantity || 1;
      counts[order.item_name] = (counts[order.item_name] || 0) + quantity;
    });
    return counts;
  }, [willCallOrders]);

  const markFulfilled = (orderId: string) => {
    try {
      const stored = JSON.parse(localStorage.getItem('nexus_master_will_call') || '[]');
      const updated = stored.map((o: any) => o.id === orderId ? { ...o, is_fulfilled: true } : o);
      localStorage.setItem('nexus_master_will_call', JSON.stringify(updated));
      
      // Also update local sales offline to mark as fulfilled if it exists
      const offlineSales = JSON.parse(localStorage.getItem('nexus_core_sales_offline') || '[]');
      const updatedOffline = offlineSales.map((s: any) => s.id === orderId ? { ...s, is_fulfilled: true } : s);
      localStorage.setItem('nexus_core_sales_offline', JSON.stringify(updatedOffline));

      setWillCallOrders(updated.filter((o: any) => !o.is_fulfilled));
    } catch (e) {
      console.error(e);
    }
  };

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-[99999] bg-black backdrop-blur-3xl flex items-center justify-center p-4">
      {/* Heavy Brutalist/Industrial Modal Container */}
      <div className="bg-[#0b0c10] border-4 border-rose-500 w-full max-w-4xl max-h-[90vh] flex flex-col shadow-[0_0_50px_rgba(244,63,94,0.3)]">
        
        {/* Header Block */}
        <div className="bg-rose-500 text-black p-4 flex items-center gap-4">
          <ShieldAlert className="w-10 h-10 animate-pulse" />
          <div>
            <h1 className="text-3xl font-black tracking-tighter uppercase leading-none">
              [ MERCH CALL INITIALIZATION // WILL-CALL ISOLATION ACTIVE ]
            </h1>
            <p className="font-mono text-sm font-bold mt-1 uppercase">
              Screen locked during setup window prior to public doors. Do not bypass.
            </p>
          </div>
        </div>

        <div className="p-6 overflow-y-auto space-y-8 flex-grow">
          
          {/* Aggregated Summary block */}
          <div className="bg-rose-500/10 border border-rose-500 p-4 relative overflow-hidden">
            <h2 className="text-rose-400 font-mono font-black text-xl mb-4 tracking-widest border-b border-rose-500/30 pb-2">
              <Package className="w-5 h-5 inline mr-2 -mt-1" />
              GLOBAL INFLUENCE REQUIRED: AGGREGATED ISOLATION LIST
            </h2>
            <ul className="space-y-2 relative z-10">
              {Object.entries(aggregatedSummary).map(([itemName, count], idx) => (
                <li key={`${itemName}-${idx}`} className="text-white font-mono text-lg flex items-center gap-3">
                  <span className="text-zinc-500">ISOLATE:</span> 
                  <span className="bg-rose-500 text-black font-black px-2 py-0.5 min-w-[50px] text-center">({count})</span>
                  <span className="font-bold text-zinc-200">{itemName}</span>
                </li>
              ))}
            </ul>
            <AlertTriangle className="absolute -bottom-10 -right-10 w-48 h-48 text-rose-500/5 rotate-12" />
          </div>

          {/* Operational Checklist Block */}
          <div>
            <h3 className="text-white font-black uppercase tracking-widest text-lg mb-4 flex items-center gap-2">
              <Check className="text-[#00ffcc] w-5 h-5" /> 
              BUYER OPERATIONAL CHECKLIST
            </h3>
            
            <div className="space-y-3">
              {willCallOrders.map((order, idx) => (
                <div key={`willcall-order-${order.id || "order"}-${idx}`} className="bg-black border border-zinc-800 p-4 flex items-center justify-between gap-4 group hover:border-zinc-700 transition-colors">
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-zinc-800 text-white font-mono text-[10px] px-1.5 py-0.5 rounded font-bold">
                        ORDER {order.id?.split('-')[1]?.substring(0,6) || idx}
                      </span>
                      <span className="text-white font-bold truncate">
                        {order.customer_name || 'Will-Call Guest'}
                      </span>
                      <span className="text-zinc-500 text-xs truncate">
                        ({order.customer_email})
                      </span>
                    </div>
                    
                    <p className="font-mono text-sm text-indigo-300 font-bold truncate">
                      {order.item_name}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => markFulfilled(order.id)}
                    className="shrink-0 bg-zinc-900 border border-zinc-700 hover:bg-[#00ffcc] hover:text-black hover:border-[#00ffcc] text-[#00ffcc] font-black font-mono px-6 py-3 transition-colors uppercase flex items-center gap-2"
                  >
                    [ CONFIRM HAND-OFF ]
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
