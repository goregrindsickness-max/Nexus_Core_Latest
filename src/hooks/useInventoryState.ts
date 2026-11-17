import { create } from 'zustand';
import { InventoryItem, InventoryAudit } from '../types';

interface InventoryState {
  inventory: InventoryItem[];
  setInventory: (items: InventoryItem[] | ((prev: InventoryItem[]) => InventoryItem[])) => void;
  editingItem: InventoryItem | null;
  setEditingItem: (item: InventoryItem | null) => void;
  stagedDistroItems: any[];
  setStagedDistroItems: (items: any[] | ((prev: any[]) => any[])) => void;
  inventoryAudits: InventoryAudit[];
  setInventoryAudits: (audits: InventoryAudit[] | ((prev: InventoryAudit[]) => InventoryAudit[])) => void;
}

const getInitialAudits = () => {
  try {
    const saved = localStorage.getItem('nexus_core_audits_offline');
    if (saved) return JSON.parse(saved);
  } catch (_) {}
  return [];
};

export const useInventoryState = create<InventoryState>((set) => ({
  inventory: [],
  setInventory: (items) => set((state) => ({ inventory: typeof items === 'function' ? items(state.inventory) : items })),
  editingItem: null,
  setEditingItem: (item) => set({ editingItem: item }),
  stagedDistroItems: [],
  setStagedDistroItems: (items) => set((state) => ({ stagedDistroItems: typeof items === 'function' ? items(state.stagedDistroItems) : items })),
  inventoryAudits: getInitialAudits(),
  setInventoryAudits: (audits) => set((state) => {
    const newVal = typeof audits === 'function' ? audits(state.inventoryAudits) : audits;
    localStorage.setItem('nexus_core_audits_offline', JSON.stringify(newVal));
    return { inventoryAudits: newVal };
  }),
}));
