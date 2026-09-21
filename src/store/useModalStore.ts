import { create } from 'zustand';
import { Sale } from '../types';

export type BrutalistModalType = 'sale' | 'show' | 'note' | null;

export interface ModalStoreState {
  // 1. Brutalist Data Modal (Show, Sale, Note)
  isModalOpen: boolean;
  modalType: BrutalistModalType;
  openDataModal: (type: 'sale' | 'show' | 'note') => void;
  closeDataModal: () => void;
  setIsModalOpen: (open: boolean) => void;
  setModalType: (type: BrutalistModalType) => void;

  // 2. Digital Receipt Modal
  selectedSaleReceipt: Sale | null;
  setSelectedSaleReceipt: (sale: Sale | null) => void;
  openReceiptModal: (sale: Sale) => void;
  closeReceiptModal: () => void;

  // 3. Artist Management & Roster Switcher Modal
  isBandModalOpen: boolean;
  setIsBandModalOpen: (open: boolean) => void;
  openBandModal: () => void;
  closeBandModal: () => void;

  // 4. Cash Drawer Modal
  isCashDrawerOpen: boolean;
  setIsCashDrawerOpen: (open: boolean) => void;
  openCashDrawer: () => void;
  closeCashDrawer: () => void;

  // 5. Checklist Modal
  isChecklistModalOpen: boolean;
  setIsChecklistModalOpen: (open: boolean) => void;
  openChecklistModal: () => void;
  closeChecklistModal: () => void;

  // 6. Quick Actions / Shortcuts Panel
  isQuickActionPanelOpen: boolean;
  setIsQuickActionPanelOpen: (open: boolean) => void;
  openQuickActionPanel: () => void;
  closeQuickActionPanel: () => void;

  // 7. PTT Walkie-Talkie Radio
  isPttOpen: boolean;
  setIsPttOpen: (open: boolean) => void;
  openPtt: () => void;
  closePtt: () => void;

  // 8. Van to Table Inventory Transfer Modal
  isTransferModalOpen: boolean;
  setIsTransferModalOpen: (open: boolean) => void;
  transferPreselectedId: string | null;
  setTransferPreselectedId: (id: string | null) => void;
  openTransferModal: (preselectedId?: string | null) => void;
  closeTransferModal: () => void;

  // 9. Live Team Activity Workspace
  isLiveTeamActivityOpen: boolean;
  setIsLiveTeamActivityOpen: (open: boolean) => void;
  openLiveTeamActivity: () => void;
  closeLiveTeamActivity: () => void;

  // 10. Multi-Portal Workspace Registration Wizard
  showWorkspaceRegistration: boolean;
  setShowWorkspaceRegistration: (open: boolean) => void;
  openWorkspaceRegistration: (targetRole?: string) => void;
  closeWorkspaceRegistration: () => void;

  // 11. Global Settings & Gateway Infrastructure Drawer
  isSettingsDrawerOpen: boolean;
  setIsSettingsDrawerOpen: (open: boolean) => void;
  openSettingsDrawer: () => void;
  closeSettingsDrawer: () => void;

  // Utility to close all open dialogs
  closeAllModals: () => void;
}

export const useModalStore = create<ModalStoreState>((set) => ({
  // 1. Brutalist Data Modal
  isModalOpen: false,
  modalType: null,
  openDataModal: (type) => set({ isModalOpen: true, modalType: type }),
  closeDataModal: () => set({ isModalOpen: false, modalType: null }),
  setIsModalOpen: (open) => set((state) => ({ isModalOpen: open, modalType: open ? state.modalType : null })),
  setModalType: (type) => set({ modalType: type, isModalOpen: type !== null }),

  // 2. Digital Receipt
  selectedSaleReceipt: null,
  setSelectedSaleReceipt: (sale) => set({ selectedSaleReceipt: sale }),
  openReceiptModal: (sale) => set({ selectedSaleReceipt: sale }),
  closeReceiptModal: () => set({ selectedSaleReceipt: null }),

  // 3. Artist Management
  isBandModalOpen: false,
  setIsBandModalOpen: (open) => set({ isBandModalOpen: open }),
  openBandModal: () => set({ isBandModalOpen: true }),
  closeBandModal: () => set({ isBandModalOpen: false }),

  // 4. Cash Drawer
  isCashDrawerOpen: false,
  setIsCashDrawerOpen: (open) => set({ isCashDrawerOpen: open }),
  openCashDrawer: () => set({ isCashDrawerOpen: true }),
  closeCashDrawer: () => set({ isCashDrawerOpen: false }),

  // 5. Checklist Modal
  isChecklistModalOpen: false,
  setIsChecklistModalOpen: (open) => set({ isChecklistModalOpen: open }),
  openChecklistModal: () => set({ isChecklistModalOpen: true }),
  closeChecklistModal: () => set({ isChecklistModalOpen: false }),

  // 6. Quick Actions
  isQuickActionPanelOpen: false,
  setIsQuickActionPanelOpen: (open) => set({ isQuickActionPanelOpen: open }),
  openQuickActionPanel: () => set({ isQuickActionPanelOpen: true }),
  closeQuickActionPanel: () => set({ isQuickActionPanelOpen: false }),

  // 7. PTT Radio
  isPttOpen: false,
  setIsPttOpen: (open) => set({ isPttOpen: open }),
  openPtt: () => set({ isPttOpen: true }),
  closePtt: () => set({ isPttOpen: false }),

  // 8. Inventory Transfer
  isTransferModalOpen: false,
  setIsTransferModalOpen: (open) => set({ isTransferModalOpen: open }),
  transferPreselectedId: null,
  setTransferPreselectedId: (id) => set({ transferPreselectedId: id }),
  openTransferModal: (preselectedId = null) => set({ isTransferModalOpen: true, transferPreselectedId: preselectedId }),
  closeTransferModal: () => set({ isTransferModalOpen: false, transferPreselectedId: null }),

  // 9. Live Team Activity
  isLiveTeamActivityOpen: false,
  setIsLiveTeamActivityOpen: (open) => set({ isLiveTeamActivityOpen: open }),
  openLiveTeamActivity: () => set({ isLiveTeamActivityOpen: true }),
  closeLiveTeamActivity: () => set({ isLiveTeamActivityOpen: false }),

  // 10. Workspace Registration
  showWorkspaceRegistration: false,
  setShowWorkspaceRegistration: (open) => set({ showWorkspaceRegistration: open }),
  openWorkspaceRegistration: (targetRole) => {
    if (typeof window !== 'undefined' && targetRole) {
      localStorage.setItem('nexus_target_register_workspace', targetRole.toLowerCase());
    }
    set({ showWorkspaceRegistration: true });
  },
  closeWorkspaceRegistration: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('nexus_target_register_workspace');
    }
    set({ showWorkspaceRegistration: false });
  },

  // 11. Settings Drawer
  isSettingsDrawerOpen: false,
  setIsSettingsDrawerOpen: (open) => set({ isSettingsDrawerOpen: open }),
  openSettingsDrawer: () => set({ isSettingsDrawerOpen: true }),
  closeSettingsDrawer: () => set({ isSettingsDrawerOpen: false }),

  // Global helper
  closeAllModals: () => set({
    isModalOpen: false,
    modalType: null,
    selectedSaleReceipt: null,
    isBandModalOpen: false,
    isCashDrawerOpen: false,
    isChecklistModalOpen: false,
    isQuickActionPanelOpen: false,
    isPttOpen: false,
    isTransferModalOpen: false,
    transferPreselectedId: null,
    isLiveTeamActivityOpen: false,
    showWorkspaceRegistration: false,
    isSettingsDrawerOpen: false
  })
}));

// Setup global event listeners if running in browser for cross-portal event triggering
if (typeof window !== 'undefined') {
  window.addEventListener('nexus_open_cash_drawer', () => {
    useModalStore.getState().openCashDrawer();
  });
  window.addEventListener('nexus_open_transfer', ((e: CustomEvent) => {
    useModalStore.getState().openTransferModal(e?.detail?.preselectedId || null);
  }) as EventListener);
  window.addEventListener('nexus_open_band_management', () => {
    useModalStore.getState().openBandModal();
  });
  window.addEventListener('nexus_open_settings_drawer', () => {
    useModalStore.getState().openSettingsDrawer();
  });
  window.addEventListener('nexus_open_workspace_registration', ((e: CustomEvent) => {
    useModalStore.getState().openWorkspaceRegistration(e?.detail?.role);
  }) as EventListener);
}
