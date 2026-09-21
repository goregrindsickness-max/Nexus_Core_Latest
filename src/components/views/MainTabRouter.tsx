import React from 'react';
import { useBandState } from '../../hooks/useBandState';
import { useInventoryState } from '../../hooks/useInventoryState';
import { useOffersManagement } from '../../hooks/useOffersManagement';
import InventoryView from '../portals/Band/InventoryView';
import SalesDashboardView from '../sales/SalesDashboardView';
import AddItemView from '../portals/Band/AddItemView';
import ShowsView from '../portals/Band/ShowsView';
import TourNotesView from '../portals/Band/TourNotesView';
import SettingsView from '../SettingsView';
import SetlistsView from '../portals/Band/SetlistsView';
import GuestlistsView from '../portals/Band/GuestlistsView';
import PremiumGate from '../PremiumGate';
import ReportsView from '../portals/Band/ReportsView';
import PromoHubView from '../portals/Band/PromoHubView';
import PlansView from '../PlansView';
import TermsOfServiceView from '../TermsOfServiceView';
import CreativesHubView from '../portals/Band/CreativesHubView';
import CreativeDashboardViewV2 from '../portals/Creative/CreativeDashboardViewV2';
import MerchandisePrintersView from '../portals/Band/MerchandisePrintersView';
import OnRouteEssentialsView from '../portals/Band/OnRouteEssentialsView';
import { UniversalSocialFeed } from '../social/UniversalSocialFeed';

import ChecklistView from './ChecklistView';
import HelpDeskView from './HelpDeskView';
import FlightsView from './FlightsView';
import BlackBookView from './BlackBookView';
import DistroDeckView from './DistroDeckView';
import StudioView from './StudioView';

import {
  Show,
  Sale,
  InventoryItem,
  TourNote,
  Band,
  UserProfile,
  ChecklistItem,
  BankItem,
  Flight,
  InventoryAudit,
  UserReview,
  LoyaltyMember,
  Offer,
  StagedDistroItem,
} from '../../types';

export interface MainTabRouterProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  triggerNotification: (msg: string) => void;
  addLog: (msg: string) => void;

  // Home Legacy (v1) & V2 Custom Render Nodes
  dashboardRef?: React.RefObject<HTMLDivElement | null>;
  dashboardScrollPos?: React.MutableRefObject<number>;
  homeV1Content?: React.ReactNode;
  homeV2Content?: React.ReactNode;

  // Inventory
  filteredInventory: InventoryItem[];
  inventory: InventoryItem[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  inventoryAudits: InventoryAudit[];
  setInventoryAudits: React.Dispatch<React.SetStateAction<InventoryAudit[]>>;
  setEditingItem: (item: any) => void;
  editingItem: any;
  activeBandId: string;
  setTransferPreselectedId: (id: string | null) => void;
  setIsTransferModalOpen: (open: boolean) => void;
  setDistroDeckSubTab: (tab: any) => void;
  stagedDistroItems: StagedDistroItem[];
  setStagedDistroItems: React.Dispatch<React.SetStateAction<StagedDistroItem[]>>;
  activeClearanceLevel: number;

  // Sales / Shows
  shows: Show[];
  setShows: React.Dispatch<React.SetStateAction<Show[]>>;
  filteredShows: Show[];
  filteredSales: Sale[];
  sales: Sale[];
  setSales: React.Dispatch<React.SetStateAction<Sale[]>>;
  commitInventoryMutation: (items: any) => void;
  handleDataSubmit: (type: "sale" | "show" | "note", payload: any) => Promise<void>;
  activeBand: Band | null;
  setIsCashDrawerOpen: (open: boolean) => void;
  setAutoOpenSettlementShowId: (id: string | null) => void;
  loyaltyMembers: LoyaltyMember[];
  setLoyaltyMembers: React.Dispatch<React.SetStateAction<LoyaltyMember[]>>;

  // Add Item
  isOfflineSimActive: boolean;
  isOnline: boolean;
  processingGlobalSyncQueue: () => void;
  getSupabase: () => any;
  inventoryStore: any;

  // Shows Modal & Form State
  setModalType: (type: "sale" | "show" | "note" | null) => void;
  setIsModalOpen: (open: boolean) => void;
  pendingOpenShowsForm: boolean;
  setPendingOpenShowsForm: (open: boolean) => void;
  autoExpandShowId: string | null;
  setAutoExpandShowId: (id: string | null) => void;
  autoOpenSettlementShowId: string | null;
  setOnRouteVenueAddress: (addr: string | null) => void;
  offers: Offer[];
  blockedPromoters: string[];
  handleAcceptOffer: (id: string) => void;
  handleDeclineOffer: (id: string) => void;
  handleRenegotiateOffer: (id: string, text: string, targetGuarantee?: number) => void;
  handleBlockPromoter: (id: string) => void;
  handleUpdateOffer: (offer: Offer) => void;

  // Tour Notes
  filteredNotes: TourNote[];
  handleDeleteNote: (id: string) => void;
  handleUpdateNote: (id: string, updates: Partial<TourNote>) => void;

  // Settings
  userProfile: UserProfile | null;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  venues: any[];
  setVenues: React.Dispatch<React.SetStateAction<any[]>>;
  setSettingsExpandedSection: (sec: string) => void;
  logs: string[];
  handleRestock: () => void;
  dbStatus: any;
  supabaseUrl: string;
  supabaseKey: string;
  bands: Band[];
  setBands: React.Dispatch<React.SetStateAction<Band[]>>;
  setActiveBandId: (id: string) => void;
  setIsBandModalOpen: (open: boolean) => void;
  settingsExpandedSection: string;

  // Guestlists
  selectedGuestlistShowId: string | null;

  // Reports
  expenses: any[];
  setExpenses: React.Dispatch<React.SetStateAction<any[]>>;

  // Promo Hub
  promoHubSubTab: any;
  promoHubSelectedItemId: string | null;

  // Plans
  userReviews: UserReview[];
  setUserReviews: React.Dispatch<React.SetStateAction<UserReview[]>>;
  activePlan: string;
  setActivePlan: (plan: string) => void;

  // Flights
  flights: Flight[];
  setFlights: React.Dispatch<React.SetStateAction<Flight[]>>;
  commitFlightMutation: (flights: Flight[]) => void;
  pendingFlightIsAdding: boolean;
  setPendingFlightIsAdding: (val: boolean) => void;

  // Checklist
  checklistItems: ChecklistItem[];
  setChecklistItems: React.Dispatch<React.SetStateAction<ChecklistItem[]>>;
  checklistBank: BankItem[];
  setChecklistBank: React.Dispatch<React.SetStateAction<BankItem[]>>;

  // On Route
  onRouteVenueAddress: string | null;

  // Distro Deck
  distroDeckSubTab: string;

  // Navigation V2 Workspace
  dashboardV2ActiveNav?: string;
  setDashboardV2ActiveNav?: (nav: any) => void;
  onNavigateToTab?: (tab: string, subNav?: string) => void;
}

export const MainTabRouter: React.FC<MainTabRouterProps> = (props) => {
  const { bands, setBands, activeBandId, setActiveBandId, currentLoadedBandId, setCurrentLoadedBandId, editingBand, setEditingBand, deletingBandId, setDeletingBandId, bandLineup, setBandLineup, crewMembers, setCrewMembers, bandLogoUrl, setBandLogoUrl, bandCoverUrl, setBandCoverUrl, selectedMicroGenres, setSelectedMicroGenres, bandJoinRequests, setBandJoinRequests } = useBandState();
  const { inventory, setInventory, editingItem, setEditingItem, stagedDistroItems, setStagedDistroItems, inventoryAudits, setInventoryAudits } = useInventoryState();
  const { offers, setOffers, blockedPromoters, setBlockedPromoters } = useOffersManagement();

  const {
    activeTab,
    setActiveTab,
    triggerNotification,
    addLog,
    dashboardRef,
    dashboardScrollPos,
    homeV1Content,
    homeV2Content,
    filteredInventory,







    setTransferPreselectedId,
    setIsTransferModalOpen,
    setDistroDeckSubTab,


    activeClearanceLevel,
    shows,
    setShows,
    filteredShows,
    filteredSales,
    sales,
    setSales,
    commitInventoryMutation,
    handleDataSubmit,
    activeBand,
    setIsCashDrawerOpen,
    setAutoOpenSettlementShowId,
    loyaltyMembers,
    setLoyaltyMembers,
    isOfflineSimActive,
    isOnline,
    processingGlobalSyncQueue,
    getSupabase,
    inventoryStore,
    setModalType,
    setIsModalOpen,
    pendingOpenShowsForm,
    setPendingOpenShowsForm,
    autoExpandShowId,
    setAutoExpandShowId,
    autoOpenSettlementShowId,
    setOnRouteVenueAddress,


    handleAcceptOffer,
    handleDeclineOffer,
    handleRenegotiateOffer,
    handleBlockPromoter,
    handleUpdateOffer,
    filteredNotes,
    handleDeleteNote,
    handleUpdateNote,
    userProfile,
    setUserProfile,
    venues,
    setVenues,
    setSettingsExpandedSection,
    logs,
    handleRestock,
    dbStatus,
    supabaseUrl,
    supabaseKey,



    setIsBandModalOpen,
    settingsExpandedSection,
    selectedGuestlistShowId,
    expenses,
    setExpenses,
    promoHubSubTab,
    promoHubSelectedItemId,
    userReviews,
    setUserReviews,
    activePlan,
    setActivePlan,
    flights,
    setFlights,
    commitFlightMutation,
    pendingFlightIsAdding,
    setPendingFlightIsAdding,
    checklistItems,
    setChecklistItems,
    checklistBank,
    setChecklistBank,
    onRouteVenueAddress,
    distroDeckSubTab,
  } = props;

  switch (activeTab) {
    case 'home':
      return (
        <div
          className="flex-grow overflow-y-auto pb-4 scrollbar-thin"
          ref={dashboardRef}
          onScroll={(e) => {
            if (dashboardScrollPos) {
              dashboardScrollPos.current = e.currentTarget.scrollTop;
            }
          }}
        >
          {homeV1Content}
        </div>
      );

    case 'home-v2':
      return homeV2Content ? <>{homeV2Content}</> : null;

    case 'inventory':
      return (
        <div className="flex-grow overflow-y-auto">
          <InventoryView
            inventory={filteredInventory}
            setInventory={setInventory}
            inventoryAudits={inventoryAudits}
            setInventoryAudits={setInventoryAudits}
            onBack={() => { setActiveTab('home-v2'); }}
            onAddNew={() => { setEditingItem(null); setActiveTab('add-item'); }}
            onEditItem={(item) => { setEditingItem(item); setActiveTab('add-item'); }}
            triggerNotification={triggerNotification}
            addLog={addLog}
            activeBandId={activeBandId}
            onOpenTransferModal={(itemId) => {
              setTransferPreselectedId(itemId || null);
              setIsTransferModalOpen(true);
            }}
            onNavigateToPrinters={() => setActiveTab('merchandise-printers')}
            onGoToPublicStore={() => {
              setDistroDeckSubTab('merch');
              setActiveTab('distro-deck');
              triggerNotification('Navigated to your public store visual editor!');
            }}
            stagedDistroItems={stagedDistroItems}
            setStagedDistroItems={setStagedDistroItems}
            activeClearanceLevel={activeClearanceLevel}
          />
        </div>
      );

    case 'new-sale':
      return (
        <div className="flex-grow overflow-y-auto">
          <SalesDashboardView
            inventory={inventory}
            setInventory={setInventory}
            commitInventoryMutation={commitInventoryMutation}
            shows={shows}
            setShows={setShows}
            onSubmitSale={handleDataSubmit}
            onBack={() => setActiveTab('home-v2')}
            triggerNotification={triggerNotification}
            addLog={addLog}
            activeBandId={activeBandId}
            activeBandName={activeBand?.name}
            onOpenTransferModal={(itemId) => {
              setTransferPreselectedId(itemId || null);
              setIsTransferModalOpen(true);
            }}
            onOpenCashDrawer={() => setIsCashDrawerOpen(true)}
            onSettleShow={(showId) => {
              setAutoOpenSettlementShowId(showId);
              setActiveTab('shows');
            }}
            loyaltyMembers={loyaltyMembers}
            setLoyaltyMembers={setLoyaltyMembers}
          />
        </div>
      );

    case 'add-item':
      return (
        <div className="flex-grow overflow-y-auto">
          <AddItemView
            isOffline={isOfflineSimActive || !isOnline}
            initialItem={editingItem || undefined}
            onBack={() => setActiveTab('inventory')}
            onSave={async (savedItem) => {
              const completeItem = { ...savedItem, band_id: activeBandId } as InventoryItem;
              commitInventoryMutation(completeItem);
              processingGlobalSyncQueue();
              setEditingItem(null);
              return true;
            }}
            onDelete={async (itemId) => {
              const supabase = getSupabase();
              if (supabase && isOnline) {
                try {
                  await supabase.from('inventory').delete().eq('id', itemId);
                  addLog(`Successfully deleted inventory item ${itemId} from Supabase.`);
                } catch (e: any) {
                  console.error('Failed to delete item from Supabase:', e);
                }
              }
              setInventory(prev => {
                const updated = prev.filter(inv => inv.id !== itemId);
                inventoryStore.setItem('nexus_master_inventory', JSON.stringify(updated)).catch(console.warn);
                return updated;
              });
              setEditingItem(null);
            }}
            triggerNotification={triggerNotification}
          />
        </div>
      );

    case 'shows':
      return (
        <div className="flex-grow overflow-y-auto">
          <ShowsView
            shows={filteredShows}
            setShows={setShows}
            sales={filteredSales}
            triggerNotification={triggerNotification}
            addLog={addLog}
            setModalType={setModalType}
            setIsModalOpen={setIsModalOpen}
            onBack={() => setActiveTab('home-v2')}
            bandName={activeBand?.name}
            activeBandId={activeBandId}
            initialOpenForm={pendingOpenShowsForm}
            onCloseForm={() => setPendingOpenShowsForm(false)}
            inventory={filteredInventory}
            initialExpandedShowId={autoExpandShowId}
            initialSettlementShowId={autoOpenSettlementShowId}
            onClearInitialSettlementShowId={() => setAutoOpenSettlementShowId(null)}
            onOpenOnRouteEssentials={(address: string) => {
              setOnRouteVenueAddress(address);
              setActiveTab('on-route-essentials');
            }}
            onClearInitialExpandedShowId={() => setAutoExpandShowId(null)}
            offers={offers.filter(o => o.band_id === activeBandId && !blockedPromoters.includes(o.promoter_id))}
            onAcceptOffer={handleAcceptOffer}
            onDeclineOffer={handleDeclineOffer}
            onRenegotiateOffer={handleRenegotiateOffer}
            onBlockPromoter={handleBlockPromoter}
            onUpdateOffer={handleUpdateOffer}
            isOffline={isOfflineSimActive || !isOnline}
            activeClearanceLevel={activeClearanceLevel}
          />
        </div>
      );

    case 'notes':
      return (
        <div className="flex-grow overflow-y-auto">
          <TourNotesView
            notes={filteredNotes}
            shows={shows}
            onBack={() => setActiveTab('home-v2')}
            onAddNote={() => { setModalType('note'); setIsModalOpen(true); }}
            onDeleteNote={handleDeleteNote}
            triggerNotification={triggerNotification}
            addLog={addLog}
            onUpdateNote={(id, updates) => handleUpdateNote(id, updates)}
            onSubmitNote={(payload) => handleDataSubmit('note', payload)}
            isOffline={isOfflineSimActive || !isOnline}
          />
        </div>
      );

    case 'settings':
      return (
        <div className="flex-grow overflow-y-auto">
          <SettingsView
            userProfile={userProfile}
            setUserProfile={setUserProfile}
            shows={shows}
            setShows={setShows}
            inventory={inventory}
            setInventory={setInventory}
            sales={sales}
            setSales={setSales}
            venues={venues}
            setVenues={setVenues}
            onBack={() => { setActiveTab('home-v2'); setSettingsExpandedSection(''); }}
            triggerNotification={triggerNotification}
            addLog={addLog}
            activeBandName={activeBand?.name}
            logs={logs}
            onSubmitSale={handleDataSubmit}
            handleRestock={handleRestock}
            dbStatus={dbStatus === 'unconfigured' ? 'idle' : dbStatus}
            supabaseUrl={supabaseUrl || ''}
            supabaseKey={supabaseKey || ''}
            bands={bands}
            setBands={setBands}
            activeBand={activeBand}
            setActiveBandId={setActiveBandId}
            setIsBandModalOpen={setIsBandModalOpen}
            setActiveTab={setActiveTab}
            initialExpandedSection={settingsExpandedSection}
          />
        </div>
      );

    case 'setlists':
      return (
        <div className="flex-grow overflow-y-auto">
          <SetlistsView
            shows={shows}
            onBack={() => setActiveTab('home-v2')}
            triggerNotification={triggerNotification}
            addLog={addLog}
          />
        </div>
      );

    case 'guestlist':
      return (
        <div className="flex-grow overflow-y-auto">
          <GuestlistsView
            shows={shows}
            setShows={setShows}
            onBack={() => setActiveTab('home-v2')}
            triggerNotification={triggerNotification}
            addLog={addLog}
            initialShowId={selectedGuestlistShowId}
            bandName={activeBand?.name || 'Artist'}
          />
        </div>
      );

    case 'reports':
      return (
        <div className="flex-grow overflow-y-auto">
          <PremiumGate
            currentTier={userProfile?.sub_tier}
            requiredTier="power_user_pro"
            featureName="MARKET_ANALYTIC_COMPILES"
            onUpgradeSuccess={(newTier) => {
              triggerNotification(`🔓 System unlocked! Access status upgraded to: ${newTier.toUpperCase()}`);
            }}
          >
            <ReportsView
              sales={sales}
              shows={shows}
              setShows={setShows}
              inventory={inventory}
              expenses={expenses}
              setExpenses={setExpenses}
              onBack={() => setActiveTab('home-v2')}
              triggerNotification={triggerNotification}
              addLog={addLog}
              bandName={activeBand?.name || 'Artist'}
            />
          </PremiumGate>
        </div>
      );

    case 'promo-hub':
      return (
        <div className="flex-grow overflow-y-auto">
          <PromoHubView
            inventory={filteredInventory}
            onBack={() => setActiveTab('home-v2')}
            triggerNotification={triggerNotification}
            addLog={addLog}
            activeBandName={activeBand?.name}
            loyaltyMembers={loyaltyMembers}
            setLoyaltyMembers={setLoyaltyMembers}
            initialSubTab={promoHubSubTab}
            initialSelectedItemId={promoHubSelectedItemId}
            onNavigateToTab={(tab) => setActiveTab(tab as any)}
            stagedDistroItems={stagedDistroItems}
            setStagedDistroItems={setStagedDistroItems}
          />
        </div>
      );

    case 'plans':
      return (
        <div className="flex-grow overflow-y-auto">
          <PlansView
            onBack={() => setActiveTab('home-v2')}
            triggerNotification={triggerNotification}
            addLog={addLog}
            userReviews={userReviews}
            setUserReviews={setUserReviews}
            activePlan={activePlan}
            onSelectPlan={(plan) => {
              setActivePlan(plan);
              try {
                localStorage.setItem('nexus_core_active_plan', plan);
              } catch (_) {}
            }}
          />
        </div>
      );

    case 'terms':
      return (
        <div className="flex-grow overflow-y-auto">
          <TermsOfServiceView
            onBack={() => setActiveTab('settings')}
            triggerNotification={triggerNotification}
          />
        </div>
      );

    case 'black-book':
      return (
        <BlackBookView
          onBack={() => setActiveTab('home-v2')}
          triggerNotification={triggerNotification}
          userProfile={userProfile}
          setUserProfile={setUserProfile}
          activeBandName={activeBand?.name || ''}
          offers={offers}
          onUpdateOffer={handleUpdateOffer}
          userReviews={userReviews}
          venues={venues}
          setVenues={setVenues}
        />
      );

    case 'creative':
      return (
        <div className="flex-grow overflow-y-auto bg-black">
          <CreativeDashboardViewV2
            userProfile={userProfile}
            setUserProfile={setUserProfile}
            onLogout={() => {
              localStorage.removeItem('nexus_core_user_profile');
              window.location.reload();
            }}
            onBack={() => setActiveTab('home-v2')}
            triggerNotification={triggerNotification}
            addLog={addLog}
          />
        </div>
      );

    case 'creatives-hub':
      return (
        <div className="flex-grow overflow-y-auto bg-black">
          <CreativesHubView
            onBack={() => setActiveTab('home-v2')}
            triggerNotification={triggerNotification}
            addLog={addLog}
            activeBandName={activeBand?.name || 'Artist'}
          />
        </div>
      );

    case 'flights':
      return (
        <FlightsView
          onClose={() => {
            setActiveTab('home-v2');
            setPendingFlightIsAdding(false);
          }}
          flights={flights}
          setFlights={setFlights}
          commitFlightMutation={commitFlightMutation}
          triggerNotification={triggerNotification}
          addLog={addLog}
          initialIsAdding={pendingFlightIsAdding}
          isOffline={isOfflineSimActive || !isOnline}
        />
      );

    case 'merchandise-printers':
      return (
        <div className="flex-grow overflow-hidden">
          <MerchandisePrintersView
            onBack={() => setActiveTab('home-v2')}
            triggerNotification={triggerNotification}
            addLog={addLog}
            inventory={inventory}
          />
        </div>
      );

    case 'help-desk':
      return (
        <HelpDeskView
          onBack={() => setActiveTab('home-v2')}
          triggerNotification={triggerNotification}
        />
      );

    case 'checklist':
      return (
        <ChecklistView
          onBack={() => setActiveTab('home-v2')}
          checklistItems={checklistItems}
          setChecklistItems={setChecklistItems}
          checklistBank={checklistBank}
          setChecklistBank={setChecklistBank}
          triggerNotification={triggerNotification}
          addLog={addLog}
          activeBandName={activeBand?.name}
        />
      );

    case 'on-route-essentials':
      return (
        <div className="flex-grow overflow-y-auto">
          <OnRouteEssentialsView
            onBack={() => {
              setActiveTab('home-v2');
              setOnRouteVenueAddress(null);
            }}
            venueAddress={onRouteVenueAddress}
          />
        </div>
      );

    case 'studio':
      return (
        <StudioView
          onBack={() => setActiveTab('home-v2')}
          triggerNotification={triggerNotification}
        />
      );

    case 'distro-deck':
      return (
        <DistroDeckView
          inventory={inventory}
          triggerNotification={triggerNotification}
          onBack={() => setActiveTab('home-v2')}
          onNavigateToTab={(tab) => setActiveTab(tab)}
          stagedDistroItems={stagedDistroItems}
          setStagedDistroItems={setStagedDistroItems}
          initialSubTab={distroDeckSubTab}
        />
      );

    case 'social':
      return (
        <div className="fixed inset-0 z-50 bg-[#030303] overflow-y-auto w-full h-full flex flex-col">
          <UniversalSocialFeed
            userProfile={userProfile}
            setUserProfile={setUserProfile}
            portalRole={
              (userProfile?.account_type === 'fan' || userProfile?.account_type === 'fan_only' || userProfile?.active_workspace === 'fan_only') ? 'fan_only' :
              userProfile?.active_workspace === 'creative' ? 'creative' :
              userProfile?.active_workspace === 'label' ? 'label' :
              userProfile?.active_workspace === 'promoter' ? 'promoter' :
              userProfile?.active_workspace === 'band' ? 'band' :
              'industry_pro'
            }
            activeBand={activeBand}
            bands={bands}
            setBands={setBands}
            onLogout={() => {
              localStorage.removeItem('nexus_core_user_profile');
              setUserProfile(null);
              window.location.reload();
            }}
            onBack={() => {
              const target = userProfile?.active_workspace;
              if (target === 'creative') setActiveTab('creative');
              else if (target === 'label') setActiveTab('label');
              else if (target === 'promoter') setActiveTab('promoter');
              else setActiveTab('home-v2');
            }}
            triggerNotification={triggerNotification}
            addLog={addLog}
            activeBandId={activeBandId}
            onNavigateToTab={props.onNavigateToTab || ((tab: string, subNav?: string) => {
              if (subNav && props.setDashboardV2ActiveNav) {
                props.setDashboardV2ActiveNav(subNav as any);
              }
              setActiveTab(tab);
            })}
            setActiveTab={setActiveTab}
            setDashboardV2ActiveNav={props.setDashboardV2ActiveNav}
            dashboardV2ActiveNav={props.dashboardV2ActiveNav}
            onUpdateBandLogo={(newUrl) => {
              if (activeBand) {
                const updatedBand = { ...activeBand, logo_url: newUrl };
                setBands((prevBands) =>
                  prevBands.map((b) => (b.id === activeBand.id ? updatedBand : b))
                );
              }
            }}
          />
        </div>
      );

    default:
      return null;
  }
};

export default MainTabRouter;
