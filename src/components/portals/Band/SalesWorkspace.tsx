import React from 'react';
import { Users } from 'lucide-react';
import { V2ExpandableCard } from '../../V2ExpandableCard';
import SalesDashboardView from '../../sales/SalesDashboardView';
import PublicStorefrontView from '../../sales/PublicStorefrontView';
import PromoHubView from './PromoHubView';
import { LegacyMetricsCarousel } from '../../dashboard/LegacyMetricsCarousel';

export default function SalesWorkspace(props: any) {
  const {
    activeBand,
    addLog,
    bandCoverUrl,
    dashboardV2ActiveNav,
    filteredInventory,
    handleDataSubmit,
    inventory,
    loyaltyMembers,
    renderCashDrawerLedgerSection,
    renderDecoupledLiveInventorySection,
    renderDecoupledLiveTeamActivitySection,
    renderLegacyMetricsCarousel,
    renderRecentSalesFeed,
    sales,
    setInventory,
    setLoyaltyMembers,
    setShows,
    setStagedDistroItems,
    shows,
    stagedDistroItems,
    triggerNotification,
    handleNewSaleClick,
    handleNewSalePointerDown,
    handleNewSalePointerUp,
    setActiveTab,
    setDashboardV2ActiveNav,
  } = props;

  // Calculate sales metrics for LegacyMetricsCarousel
  const todayStrValForSales = new Date().toISOString().split('T')[0];
  const todaySalesOnly = (sales || []).filter((s: any) => s.date && s.date.startsWith(todayStrValForSales));
  const todayRevenue = todaySalesOnly.reduce((acc: number, s: any) => acc + (Number(s.amount) || 0), 0);
  const totalItemsSold = (sales || []).reduce((acc: number, s: any) => acc + (Number(s.quantity) || 1), 0);

  const itemCounts: Record<string, number> = {};
  (sales || []).forEach((s: any) => {
    const name = s.item_name || 'Item';
    itemCounts[name] = (itemCounts[name] || 0) + (Number(s.quantity) || 1);
  });
  let topSellerName = 'None';
  let maxCount = 0;
  Object.entries(itemCounts).forEach(([name, count]) => {
    if (count > maxCount) {
      maxCount = count;
      topSellerName = name;
    }
  });

  const totalInventoryValue = (inventory || []).reduce((acc: number, item: any) => {
    const price = Number(item.price) || 0;
    const qty = (Number(item.table_stock) || 0) + (Number(item.van_stock) || 0);
    return acc + (price * qty);
  }, 0);

  return (
    <div className="flex flex-col gap-0">
      {/* Large full width customized band card */}
      <div className="bg-black px-5 pt-4">
        <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-[#0e1117] h-44 md:h-52 w-full shadow-2xl flex items-center justify-center">
          {/* Background subtle glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-[#00ffcc]/5 to-purple-500/10 opacity-30 pointer-events-none" />
          
          {bandCoverUrl || activeBand?.logo_url ? <img src={bandCoverUrl || activeBand?.logo_url} alt={activeBand?.name} className="w-full h-full object-cover relative z-10" referrerPolicy="no-referrer" /> : <div className="flex flex-col items-center justify-center gap-2 text-zinc-500 font-mono text-xs relative z-10">
              <Users className="w-12 h-12 text-zinc-650 animate-pulse" />
              <span>NO BRAND LOGO SET</span>
            </div>}
        </div>

        {/* Band Name and Genre outside / underneath the card */}
        <div className="text-center mt-4">
          <h2 className="text-2xl md:text-3xl font-black tracking-wider uppercase font-sans text-white drop-shadow-[0_0_10px_rgba(0,255,204,0.4)] truncate max-w-full leading-tight">
            {activeBand?.name || 'Artist'}
          </h2>
          
          <p className="text-[10px] font-mono tracking-widest uppercase text-emerald-400 mt-1.5 leading-none">
            {activeBand?.genre || 'ACTIVE CONTEXT'}
          </p>
        </div>
      </div>
      
      {/* Padding under the band card */}
      <div className="bg-black h-4" />

      {/* Legacy Sales Metrics Carousel */}
      <div className="bg-black pt-2 pb-3 px-5">
        {renderLegacyMetricsCarousel ? renderLegacyMetricsCarousel() : (
          <LegacyMetricsCarousel 
            todayRevenue={todayRevenue}
            topSellerName={topSellerName}
            totalItemsSold={totalItemsSold}
            totalInventoryValue={totalInventoryValue}
          />
        )}
      </div>

      {/* Action Buttons: Record New Transaction & Inventory Manage */}
      <div className="bg-black px-5 py-2 grid grid-cols-2 gap-3.5 mb-4">
        <div 
          onClick={handleNewSaleClick || (() => setActiveTab?.('new-sale'))}
          onPointerDown={handleNewSalePointerDown}
          onPointerUp={handleNewSalePointerUp}
          onPointerLeave={handleNewSalePointerUp}
          className="bg-gradient-to-tr from-[#12b295] to-[#04ffd2] hover:to-[#57ffd9] text-black rounded-2xl p-4 cursor-pointer relative overflow-hidden flex flex-col justify-between h-[140px] group transition-all transform hover:-translate-y-0.5 border border-white/10 shadow-lg"
        >
          <div className="absolute top-0 right-0 p-1 opacity-20 group-hover:scale-110 group-hover:opacity-30 transition-all font-display text-4xl font-extrabold select-none">
            $
          </div>
          <div className="flex items-center gap-1.5 bg-black/10 self-start px-2 py-0.5 rounded-full text-[8.5px] font-mono uppercase font-bold tracking-wider">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
            SALES
          </div>
          <div className="flex flex-col gap-1 mt-auto">
            <h2 className="font-display font-bold text-xs leading-tight" style={{ fontSize: '17px' }}>Record new transaction</h2>
            <div 
              className="border border-black/25 bg-black/5 rounded-md text-[8.5px] font-mono text-black/95 leading-tight select-none self-start"
              style={{
                paddingLeft: '6px',
                paddingTop: '4px',
                paddingRight: '6px',
                marginLeft: '25px',
                marginTop: '3px',
                marginBottom: '-11px',
                paddingBottom: '4px',
                marginRight: '0px'
              }}
            >
              <div>long press to</div>
              <div className="font-bold uppercase tracking-wider text-[7.5px] mt-0.5">open cash drawer</div>
            </div>
          </div>
        </div>

        <div 
          onClick={() => {
            if (setDashboardV2ActiveNav) setDashboardV2ActiveNav('MERCH');
            else if (setActiveTab) setActiveTab('inventory');
          }}
          className="bg-[#13161d] border border-[#252830] hover:border-zinc-500 rounded-2xl p-4 cursor-pointer relative overflow-hidden flex flex-col justify-between h-[140px] group transition-all transform hover:-translate-y-0.5 shadow-lg"
        >
          <div className="absolute top-0 right-0 p-1 opacity-10 group-hover:opacity-20 transition-all font-display text-4xl font-extrabold select-none">
            📦
          </div>
          <div className="flex items-center gap-1.5 bg-zinc-800 self-start px-2 py-0.5 rounded-full text-[8.5px] font-mono uppercase font-bold tracking-wider text-zinc-400">
            STOCK
          </div>
          <div>
            <h2 
              className="font-display font-medium text-md text-white group-hover:text-[#00ffcc] leading-tight"
              style={{
                lineHeight: '20.25px',
                paddingRight: '0px',
                paddingBottom: '14px',
                marginRight: '0px',
                marginBottom: '0px',
                marginLeft: '0px',
                marginTop: '0px',
                paddingTop: '0px'
              }}
            >
              Inventory Manage
            </h2>
            <p className="text-[10px] font-mono mt-0.5 text-zinc-500">Check stockpiles</p>
          </div>
        </div>
      </div>
      
      {/* Spot 1: POS Checkout System */}
      <V2ExpandableCard title="POS Checkout System" defaultExpanded={true}>
        <div className="w-full">
          <SalesDashboardView onSubmitSale={handleDataSubmit} inventory={inventory} setInventory={setInventory} shows={shows} setShows={setShows} onBack={() => {}} triggerNotification={triggerNotification} addLog={addLog} activeBandId={activeBand?.id || ''} activeBandName={activeBand?.name || 'Artist'} loyaltyMembers={loyaltyMembers} setLoyaltyMembers={setLoyaltyMembers} />
        </div>
      </V2ExpandableCard>

      {/* Padding under POS Checkout System */}
      <div className="bg-black h-8" />

      {/* Spot 2: Cash Drawer Ledger */}
      {renderCashDrawerLedgerSection ? renderCashDrawerLedgerSection() : null}

      {/* Spot 3: VIP Club */}
      <V2ExpandableCard title="VIP Club" defaultExpanded={false}>
        <div className="bg-black">
          <PromoHubView inventory={filteredInventory} onBack={() => {}} triggerNotification={triggerNotification} addLog={addLog} activeBandName={activeBand?.name || 'Artist'} stagedDistroItems={stagedDistroItems} setStagedDistroItems={setStagedDistroItems} initialSubTab="loyalty" subTabMode="loyalty_only" loyaltyMembers={loyaltyMembers} setLoyaltyMembers={setLoyaltyMembers} />
        </div>
      </V2ExpandableCard>

      {/* Spot 4: Recent Sales Feed */}
      <V2ExpandableCard title="Recent Sales Feed" defaultExpanded={false}>
        <div className="bg-black overflow-hidden">
          {renderRecentSalesFeed ? renderRecentSalesFeed() : null}
        </div>
      </V2ExpandableCard>

      {/* Spot 5: Live Inventory */}
      {renderDecoupledLiveInventorySection ? renderDecoupledLiveInventorySection() : null}

      {/* Spot 6: Live Team/ Activity */}
      {renderDecoupledLiveTeamActivitySection ? renderDecoupledLiveTeamActivitySection() : null}
    </div>
  );
}
