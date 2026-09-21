import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import BrutalistModal from '../BrutalistModal';
import DigitalReceiptModal from './DigitalReceiptModal';
import ArtistManagementModal from './ArtistManagementModal';
import QuickShortcutsModal from './QuickShortcutsModal';
import CashDrawerView from '../portals/Band/CashDrawerView';
import EditableChecklistModal from '../portals/Band/EditableChecklistModal';
import { PTTRadioModal } from '../portals/Band/PTTRadioModal';
import VanToTableTransferModal from '../portals/Band/VanToTableTransferModal';
import LiveTeamActivityWorkspace from '../portals/Band/LiveTeamActivityWorkspace';
import WorkspaceRegistrationWizard from '../WorkspaceRegistrationWizard';
import WillCallIsolationModal from '../portals/Promoter/WillCallIsolationModal';
import { MetalArchivesImportModal } from '../social/modals/MetalArchivesImportModal';
import { SettingsDrawer } from './SettingsDrawer';
import { useModalStore } from '../../store/useModalStore';
import { Show, Sale, Band, UserProfile, InventoryItem } from '../../types';

export interface GlobalModalsContainerProps {
  // Will Call & Global Context
  userProfile: UserProfile | null;
  setUserProfile?: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  activeTab: string;
  shows: Show[];

  // Brutalist Modal
  isModalOpen?: boolean;
  setIsModalOpen?: (open: boolean) => void;
  modalType?: 'sale' | 'show' | 'note' | null;
  setModalType?: (type: 'sale' | 'show' | 'note' | null) => void;
  handleDataSubmit: (type: "sale" | "show" | "note", payload: any) => void;
  inventory: InventoryItem[];

  // Digital Receipt
  selectedSaleReceipt?: Sale | null;
  setSelectedSaleReceipt?: (sale: Sale | null) => void;
  triggerNotification: (msg: string) => void;

  // Artist Management
  isBandModalOpen?: boolean;
  setIsBandModalOpen?: (open: boolean) => void;
  bandManagement?: any;
  editingBand?: Band | null;
  setEditingBand?: (band: Band | null) => void;
  editName?: string;
  setEditName?: (val: string) => void;
  editGenre?: string;
  setEditGenre?: (val: string) => void;
  editLogoUrl?: string;
  setEditLogoUrl?: (val: string) => void;
  editLogoPresetIdx?: number;
  setEditLogoPresetIdx?: (val: number) => void;
  handleUpdateBand?: (e: React.FormEvent) => void;
  dragActive?: boolean;
  setDragActive?: (val: boolean) => void;
  handleLogoUpload?: (file: File, isEdit: boolean) => void;
  editRosterFileInputRef?: React.RefObject<HTMLInputElement | null>;
  rosterFileInputRef?: React.RefObject<HTMLInputElement | null>;
  logoPresets?: string[];
  bandLogoUrl?: string;
  activeBand: Band | null;
  bands: Band[];
  activeBandId: string;
  setActiveBandId: (id: string) => void;
  addLog?: (msg: string) => void;
  deletingBandId?: string | null;
  setDeletingBandId?: (id: string | null) => void;
  handleDeleteBand?: (id: string, name: string) => void;
  newBandForm?: any;
  setNewBandForm?: React.Dispatch<React.SetStateAction<any>>;
  handleCreateBand?: (e: React.FormEvent) => void;
  customLogoPreset?: number;
  setCustomLogoPreset?: (val: number) => void;
  editIsManagedClient?: boolean;
  setEditIsManagedClient?: (val: boolean) => void;
  editManagementRole?: 'tour_manager' | 'booking_agent' | 'executive_producer' | 'owner';
  setEditManagementRole?: (val: 'tour_manager' | 'booking_agent' | 'executive_producer' | 'owner') => void;
  editCommissionPct?: number;
  setEditCommissionPct?: (val: number) => void;
  editDayRate?: number;
  setEditDayRate?: (val: number) => void;
  editExecutiveContactName?: string;
  setEditExecutiveContactName?: (val: string) => void;
  editExecutiveContactEmail?: string;
  setEditExecutiveContactEmail?: (val: string) => void;
  editExecutiveContactPhone?: string;
  setEditExecutiveContactPhone?: (val: string) => void;
  editClientRosterNotes?: string;
  setEditClientRosterNotes?: (val: string) => void;

  // Cash Drawer
  isCashDrawerOpen?: boolean;
  setIsCashDrawerOpen?: (open: boolean) => void;
  cashTransactions?: any[];
  setCashTransactions?: React.Dispatch<React.SetStateAction<any[]>>;

  // Checklist
  isChecklistModalOpen?: boolean;
  setIsChecklistModalOpen?: (open: boolean) => void;
  checklistItems?: any[];
  setChecklistItems?: React.Dispatch<React.SetStateAction<any[]>>;
  checklistBank?: any[];
  setChecklistBank?: React.Dispatch<React.SetStateAction<any[]>>;

  // Quick Shortcuts
  isQuickActionPanelOpen?: boolean;
  setIsQuickActionPanelOpen?: (open: boolean) => void;
  setActiveTab?: (tab: string) => void;
  setEditingItem?: (item: any) => void;
  setPendingOpenShowsForm?: (val: boolean) => void;
  setPendingFlightIsAdding?: (val: boolean) => void;

  // PTT Radio
  isPttOpen?: boolean;
  setIsPttOpen?: (open: boolean) => void;
  playPttSound?: (type: "beep-on" | "beep-off" | "static") => void;

  // Van to Table Transfer
  isTransferModalOpen?: boolean;
  setIsTransferModalOpen?: (open: boolean) => void;
  transferPreselectedId?: string | null;
  setTransferPreselectedId?: (id: string | null) => void;
  setInventory?: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  commitInventoryMutation?: (items: InventoryItem[]) => void;

  // Live Team Activity
  isLiveTeamActivityOpen?: boolean;
  setIsLiveTeamActivityOpen?: (open: boolean) => void;
  teamActivities?: any[];

  // Workspace Registration Wizard
  showWorkspaceRegistration?: boolean;
  setShowWorkspaceRegistration?: (val: boolean) => void;
  setIsUpgradeMode?: (val: boolean) => void;
  setLoginInitialTab?: (tab: any) => void;
  setIsLoggedOut?: (val: boolean) => void;

  // Settings Drawer
  isSettingsDrawerOpen?: boolean;
  setIsSettingsDrawerOpen?: (open: boolean) => void;
}

const GlobalMetalArchivesImportModalListener: React.FC = () => {
  const [maModalOpen, setMaModalOpen] = useState(false);
  const [maBandId, setMaBandId] = useState('band-1');
  const [maBandName, setMaBandName] = useState('');

  useEffect(() => {
    const handleOpenMA = (e: any) => {
      if (e.detail?.bandId) setMaBandId(e.detail.bandId);
      if (e.detail?.bandName) setMaBandName(e.detail.bandName);
      setMaModalOpen(true);
    };
    window.addEventListener('open_metal_archives_import', handleOpenMA as EventListener);
    return () => {
      window.removeEventListener('open_metal_archives_import', handleOpenMA as EventListener);
    };
  }, []);

  return (
    <MetalArchivesImportModal
      key="global-metal-archives-import-modal"
      isOpen={maModalOpen}
      onClose={() => setMaModalOpen(false)}
      bandId={maBandId}
      bandName={maBandName}
      onImportSuccess={(count) => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('nexus_community_bands_updated'));
        }
      }}
    />
  );
};

export const GlobalModalsContainer: React.FC<GlobalModalsContainerProps> = (props) => {
  const modalStore = useModalStore();

  const {
    userProfile,
    setUserProfile,
    activeTab,
    shows = [],
    handleDataSubmit,
    inventory = [],
    setInventory = () => {},
    triggerNotification = () => {},
    editingBand,
    setEditingBand,
    bandLogoUrl,
    activeBand,
    bands = [],
    activeBandId,
    setActiveBandId,
    deletingBandId,
    setDeletingBandId,
    handleDeleteBand,
    cashTransactions = [],
    setCashTransactions = () => {},
    checklistItems = [],
    setChecklistItems = () => {},
    checklistBank = [],
    setChecklistBank = () => {},
    setActiveTab = () => {},
    setEditingItem = () => {},
    setPendingOpenShowsForm = () => {},
    setPendingFlightIsAdding = () => {},
    playPttSound = () => {},
    commitInventoryMutation = () => {},
    teamActivities = [],
    setIsUpgradeMode = () => {},
    setLoginInitialTab = () => {},
    setIsLoggedOut = () => {},
  } = props;

  // Resolve modal states from props or modalStore fallback
  const isModalOpen = props.isModalOpen !== undefined ? props.isModalOpen : modalStore.isModalOpen;
  const setIsModalOpen = props.setIsModalOpen || modalStore.setIsModalOpen;
  const modalType = props.modalType !== undefined ? props.modalType : modalStore.modalType;
  const setModalType = props.setModalType || modalStore.setModalType;

  const selectedSaleReceipt = props.selectedSaleReceipt !== undefined ? props.selectedSaleReceipt : modalStore.selectedSaleReceipt;
  const setSelectedSaleReceipt = props.setSelectedSaleReceipt || modalStore.setSelectedSaleReceipt;

  const isBandModalOpen = props.isBandModalOpen !== undefined ? props.isBandModalOpen : modalStore.isBandModalOpen;
  const setIsBandModalOpen = props.setIsBandModalOpen || modalStore.setIsBandModalOpen;

  const isCashDrawerOpen = props.isCashDrawerOpen !== undefined ? props.isCashDrawerOpen : modalStore.isCashDrawerOpen;
  const setIsCashDrawerOpen = props.setIsCashDrawerOpen || modalStore.setIsCashDrawerOpen;

  const isChecklistModalOpen = props.isChecklistModalOpen !== undefined ? props.isChecklistModalOpen : modalStore.isChecklistModalOpen;
  const setIsChecklistModalOpen = props.setIsChecklistModalOpen || modalStore.setIsChecklistModalOpen;

  const isQuickActionPanelOpen = props.isQuickActionPanelOpen !== undefined ? props.isQuickActionPanelOpen : modalStore.isQuickActionPanelOpen;
  const setIsQuickActionPanelOpen = props.setIsQuickActionPanelOpen || modalStore.setIsQuickActionPanelOpen;

  const isPttOpen = props.isPttOpen !== undefined ? props.isPttOpen : modalStore.isPttOpen;
  const setIsPttOpen = props.setIsPttOpen || modalStore.setIsPttOpen;

  const isTransferModalOpen = props.isTransferModalOpen !== undefined ? props.isTransferModalOpen : modalStore.isTransferModalOpen;
  const setIsTransferModalOpen = props.setIsTransferModalOpen || modalStore.setIsTransferModalOpen;
  const transferPreselectedId = props.transferPreselectedId !== undefined ? props.transferPreselectedId : modalStore.transferPreselectedId;
  const setTransferPreselectedId = props.setTransferPreselectedId || modalStore.setTransferPreselectedId;

  const isLiveTeamActivityOpen = props.isLiveTeamActivityOpen !== undefined ? props.isLiveTeamActivityOpen : modalStore.isLiveTeamActivityOpen;
  const setIsLiveTeamActivityOpen = props.setIsLiveTeamActivityOpen || modalStore.setIsLiveTeamActivityOpen;

  const showWorkspaceRegistration = props.showWorkspaceRegistration !== undefined ? props.showWorkspaceRegistration : modalStore.showWorkspaceRegistration;
  const setShowWorkspaceRegistration = props.setShowWorkspaceRegistration || modalStore.setShowWorkspaceRegistration;

  const isSettingsDrawerOpen = props.isSettingsDrawerOpen !== undefined ? props.isSettingsDrawerOpen : modalStore.isSettingsDrawerOpen;
  const setIsSettingsDrawerOpen = props.setIsSettingsDrawerOpen || modalStore.setIsSettingsDrawerOpen;

  // Resolve Band Management attributes
  const bm = props.bandManagement || {};
  const editName = props.editName ?? bm.editName ?? '';
  const setEditName = props.setEditName ?? bm.setEditName ?? (() => {});
  const editGenre = props.editGenre ?? bm.editGenre ?? '';
  const setEditGenre = props.setEditGenre ?? bm.setEditGenre ?? (() => {});
  const editLogoUrl = props.editLogoUrl ?? bm.editLogoUrl ?? '';
  const setEditLogoUrl = props.setEditLogoUrl ?? bm.setEditLogoUrl ?? (() => {});
  const editLogoPresetIdx = props.editLogoPresetIdx ?? bm.editLogoPresetIdx ?? 0;
  const setEditLogoPresetIdx = props.setEditLogoPresetIdx ?? bm.setEditLogoPresetIdx ?? (() => {});
  const handleUpdateBand = props.handleUpdateBand ?? bm.handleUpdateBand ?? (() => {});
  const dragActive = props.dragActive ?? bm.dragActive ?? false;
  const setDragActive = props.setDragActive ?? bm.setDragActive ?? (() => {});
  const handleLogoUpload = props.handleLogoUpload ?? bm.handleLogoUpload ?? (() => {});
  const editRosterFileInputRef = props.editRosterFileInputRef ?? bm.editRosterFileInputRef;
  const rosterFileInputRef = props.rosterFileInputRef ?? bm.rosterFileInputRef;
  const logoPresets = props.logoPresets ?? bm.logoPresets ?? [];
  const newBandForm = props.newBandForm ?? bm.newBandForm ?? { name: '', genre: '', logo_url: '' };
  const setNewBandForm = props.setNewBandForm ?? bm.setNewBandForm ?? (() => {});
  const handleCreateBand = props.handleCreateBand ?? bm.handleCreateBand ?? (() => {});
  const customLogoPreset = props.customLogoPreset ?? bm.customLogoPreset ?? 0;
  const setCustomLogoPreset = props.setCustomLogoPreset ?? bm.setCustomLogoPreset ?? (() => {});
  const editIsManagedClient = props.editIsManagedClient ?? bm.editIsManagedClient ?? false;
  const setEditIsManagedClient = props.setEditIsManagedClient ?? bm.setEditIsManagedClient ?? (() => {});
  const editManagementRole = props.editManagementRole ?? bm.editManagementRole ?? 'tour_manager';
  const setEditManagementRole = props.setEditManagementRole ?? bm.setEditManagementRole ?? (() => {});
  const editCommissionPct = props.editCommissionPct ?? bm.editCommissionPct ?? 15;
  const setEditCommissionPct = props.setEditCommissionPct ?? bm.setEditCommissionPct ?? (() => {});
  const editDayRate = props.editDayRate ?? bm.editDayRate ?? 250;
  const setEditDayRate = props.setEditDayRate ?? bm.setEditDayRate ?? (() => {});
  const editExecutiveContactName = props.editExecutiveContactName ?? bm.editExecutiveContactName ?? '';
  const setEditExecutiveContactName = props.setEditExecutiveContactName ?? bm.setEditExecutiveContactName ?? (() => {});
  const editExecutiveContactEmail = props.editExecutiveContactEmail ?? bm.editExecutiveContactEmail ?? '';
  const setEditExecutiveContactEmail = props.setEditExecutiveContactEmail ?? bm.setEditExecutiveContactEmail ?? (() => {});
  const editExecutiveContactPhone = props.editExecutiveContactPhone ?? bm.editExecutiveContactPhone ?? '';
  const setEditExecutiveContactPhone = props.setEditExecutiveContactPhone ?? bm.setEditExecutiveContactPhone ?? (() => {});
  const editClientRosterNotes = props.editClientRosterNotes ?? bm.editClientRosterNotes ?? '';
  const setEditClientRosterNotes = props.setEditClientRosterNotes ?? bm.setEditClientRosterNotes ?? (() => {});
  const addLog = props.addLog ?? (() => {});

  return (
    <>
      {/* Will Call Isolation Modal */}
      {(userProfile?.account_type !== 'creative' && activeTab !== 'pay-portal') && (
        <WillCallIsolationModal shows={shows} />
      )}

      {/* Main Data Modal (Brutalist) */}
      <BrutalistModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setModalType(null);
        }}
        type={modalType}
        onSubmit={handleDataSubmit}
        inventory={inventory}
        shows={shows}
      />

      {/* Digital Receipt Modal */}
      <DigitalReceiptModal
        selectedSaleReceipt={selectedSaleReceipt}
        onClose={() => setSelectedSaleReceipt(null)}
        triggerNotification={triggerNotification}
      />

      {/* Artist Management Roster Switcher Modal */}
      <ArtistManagementModal
        isOpen={isBandModalOpen}
        onClose={() => setIsBandModalOpen(false)}
        editingBand={editingBand}
        setEditingBand={setEditingBand}
        editName={editName}
        setEditName={setEditName}
        editGenre={editGenre}
        setEditGenre={setEditGenre}
        editLogoUrl={editLogoUrl}
        setEditLogoUrl={setEditLogoUrl}
        editLogoPresetIdx={editLogoPresetIdx}
        setEditLogoPresetIdx={setEditLogoPresetIdx}
        handleUpdateBand={handleUpdateBand}
        dragActive={dragActive}
        setDragActive={setDragActive}
        handleLogoUpload={handleLogoUpload}
        editRosterFileInputRef={editRosterFileInputRef}
        rosterFileInputRef={rosterFileInputRef}
        logoPresets={logoPresets}
        bandLogoUrl={bandLogoUrl}
        activeBand={activeBand}
        bands={bands}
        activeBandId={activeBandId}
        setActiveBandId={setActiveBandId}
        addLog={addLog}
        triggerNotification={triggerNotification}
        deletingBandId={deletingBandId}
        setDeletingBandId={setDeletingBandId}
        handleDeleteBand={handleDeleteBand}
        newBandForm={newBandForm}
        setNewBandForm={setNewBandForm}
        handleCreateBand={handleCreateBand}
        customLogoPreset={customLogoPreset}
        setCustomLogoPreset={setCustomLogoPreset}
        editIsManagedClient={editIsManagedClient}
        setEditIsManagedClient={setEditIsManagedClient}
        editManagementRole={editManagementRole}
        setEditManagementRole={setEditManagementRole}
        editCommissionPct={editCommissionPct}
        setEditCommissionPct={setEditCommissionPct}
        editDayRate={editDayRate}
        setEditDayRate={setEditDayRate}
        editExecutiveContactName={editExecutiveContactName}
        setEditExecutiveContactName={setEditExecutiveContactName}
        editExecutiveContactEmail={editExecutiveContactEmail}
        setEditExecutiveContactEmail={setEditExecutiveContactEmail}
        editExecutiveContactPhone={editExecutiveContactPhone}
        setEditExecutiveContactPhone={setEditExecutiveContactPhone}
        editClientRosterNotes={editClientRosterNotes}
        setEditClientRosterNotes={setEditClientRosterNotes}
        userProfile={userProfile}
      />

      {/* Cash Drawer Modal */}
      <AnimatePresence>
        {isCashDrawerOpen && (
          <motion.div key="cash-drawer-wrapper" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <CashDrawerView
              onClose={() => setIsCashDrawerOpen(false)}
              transactions={cashTransactions}
              setTransactions={setCashTransactions}
              triggerNotification={triggerNotification}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Editable Checklist Modal */}
      <AnimatePresence>
        {isChecklistModalOpen && (
          <motion.div key="checklist-modal-wrapper" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <EditableChecklistModal
              onClose={() => setIsChecklistModalOpen(false)}
              activeItems={checklistItems}
              setActiveItems={setChecklistItems}
              bankItems={checklistBank}
              setBankItems={setChecklistBank}
              triggerNotification={triggerNotification}
              addLog={addLog}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Shortcuts Actions Panel */}
      <QuickShortcutsModal
        isOpen={isQuickActionPanelOpen}
        onClose={() => setIsQuickActionPanelOpen(false)}
        setActiveTab={setActiveTab}
        setEditingItem={setEditingItem}
        setPendingOpenShowsForm={setPendingOpenShowsForm}
        setModalType={setModalType as any}
        setIsModalOpen={setIsModalOpen}
        setPendingFlightIsAdding={setPendingFlightIsAdding}
        triggerNotification={triggerNotification}
      />

      {/* PTT Walkie Talkie Modal */}
      <PTTRadioModal
        isOpen={isPttOpen}
        onClose={() => setIsPttOpen(false)}
        userProfile={userProfile}
        triggerNotification={triggerNotification}
        playPttSound={playPttSound}
      />

      {/* Van To Table Inventory Transfer Modal */}
      <VanToTableTransferModal
        isOpen={isTransferModalOpen}
        onClose={() => {
          setIsTransferModalOpen(false);
          setTransferPreselectedId(null);
        }}
        inventory={inventory}
        setInventory={setInventory}
        commitInventoryMutation={commitInventoryMutation}
        triggerNotification={triggerNotification}
        addLog={addLog}
        preselectedItemId={transferPreselectedId}
      />

      {/* Live Team Activity Workspace */}
      <LiveTeamActivityWorkspace
        isOpen={isLiveTeamActivityOpen}
        onClose={() => setIsLiveTeamActivityOpen(false)}
        userProfile={userProfile}
        activeBand={activeBand}
        triggerNotification={triggerNotification}
        addLog={addLog}
        teamActivities={teamActivities}
      />

      {/* Workspace Registration Wizard */}
      {showWorkspaceRegistration && (
        <WorkspaceRegistrationWizard
          initialRole={typeof window !== 'undefined' ? (localStorage.getItem('nexus_target_register_workspace')?.toUpperCase() || undefined) : undefined}
          onClose={() => {
            setShowWorkspaceRegistration(false);
            if (typeof window !== 'undefined') localStorage.removeItem('nexus_target_register_workspace');
          }}
          onProceed={(selectedRoles) => {
            if (typeof window !== 'undefined') {
              localStorage.setItem('nexus_wizard_roles', JSON.stringify(selectedRoles));
            }
            setShowWorkspaceRegistration(false);
            if (userProfile && userProfile.id) {
              setIsUpgradeMode(true);
            } else {
              setIsUpgradeMode(false);
            }
            setLoginInitialTab('signup');
            setIsLoggedOut(true);
          }}
        />
      )}

      {/* Metal-Archives Import Modal Event Listener */}
      <GlobalMetalArchivesImportModalListener />

      {/* Global Settings & Gateway Infrastructure Drawer */}
      <SettingsDrawer
        isOpen={isSettingsDrawerOpen}
        onClose={() => setIsSettingsDrawerOpen(false)}
        userProfile={props.userProfile}
        setUserProfile={props.setUserProfile || (() => {})}
        triggerNotification={props.triggerNotification}
        activeTab={props.activeTab}
        setActiveTab={props.setActiveTab as any}
      />
    </>
  );
};

export default GlobalModalsContainer;
