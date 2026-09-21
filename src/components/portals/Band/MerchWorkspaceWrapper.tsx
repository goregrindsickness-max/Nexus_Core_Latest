import React, { useState, useEffect } from 'react';
import { labelCatalogStore } from '../../../utils/indexedDB';
import { V2ExpandableCard } from '../../V2ExpandableCard';
import InventoryView from './InventoryView';
import CreativesHubView from './CreativesHubView';
import ReleasesCatalogTab from '../Label/ReleasesCatalogTab';
import PublicStorefrontView from '../../sales/PublicStorefrontView';
import { ShoppingBag, Globe, Play, Music, Radio, Sparkles, Box, Check, Star, RefreshCw, Layers } from 'lucide-react';

interface MerchWorkspaceWrapperProps {
  filteredInventory: any[];
  setInventory: React.Dispatch<React.SetStateAction<any[]>>;
  inventoryAudits: any[];
  setInventoryAudits: React.Dispatch<React.SetStateAction<any[]>>;
  triggerNotification: (msg: string) => void;
  addLog: (msg: string) => void;
  activeBandId: string;
  activeBand: any;
  onOpenTransferModal: (itemId: string | null) => void;
  stagedDistroItems: any[];
  setStagedDistroItems: React.Dispatch<React.SetStateAction<any[]>>;
  setEditingItem: (item: any) => void;
  setActiveTab: (tab: any) => void;
}

export default function MerchWorkspaceWrapper({
  filteredInventory,
  setInventory,
  inventoryAudits,
  setInventoryAudits,
  triggerNotification,
  addLog,
  activeBandId,
  activeBand,
  onOpenTransferModal,
  stagedDistroItems,
  setStagedDistroItems,
  setEditingItem,
  setActiveTab
}: MerchWorkspaceWrapperProps) {
  const [labelRosterData, setLabelRosterData] = useState<any[]>([
    {
      id: "b1",
      name: "TOMB MOLD",
      handle: "tombmold",
      status: "TOURING",
      inventory_level: 84,
      revenue_split: 50,
      digital_split: 70,
      pending_ledger: 10420.50,
      active_lp: "NX-001"
    },
    {
      id: "b2",
      name: "BLOOD INCANTATION",
      handle: "bloodincantation",
      status: "STUDIO",
      inventory_level: 42,
      revenue_split: 70,
      digital_split: 70,
      pending_ledger: 3450.00,
      active_lp: "NX-002"
    },
    {
      id: "b3",
      name: "UNDEATH",
      handle: "undeath",
      status: "OFF-CYCLE",
      inventory_level: 15,
      revenue_split: 50,
      digital_split: 70,
      pending_ledger: 850.25,
      active_lp: "NX-003"
    }
  ]);

  const [catalogReleases, setCatalogReleases] = useState<Record<string, any[]>>({});
  const [catalogApparel, setCatalogApparel] = useState<Record<string, any[]>>({});
  const [storefrontSyncRecord, setStorefrontSyncRecord] = useState<Record<string, boolean>>({});
  const [vanApparelStocks, setVanApparelStocks] = useState<Record<string, any>>({});
  const [isPublicStorefrontOpen, setIsPublicStorefrontOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const getBandIdKey = (bandId: string) => {
    if (!bandId) return 'b1';
    const lower = bandId.toLowerCase();
    if (lower.includes('virulent') || lower.includes('b1') || lower.includes('tomb') || lower.includes('excision')) return 'b1';
    if (lower.includes('spectral') || lower.includes('b2') || lower.includes('blood') || lower.includes('incantation') || lower.includes('aqueous') || lower.includes('acid') || lower.includes('xenomorph')) return 'b2';
    if (lower.includes('undeath') || lower.includes('b3')) return 'b3';
    return 'b1'; // default fallback
  };

  const activeKey = getBandIdKey(activeBandId);

  useEffect(() => {
    // 1. Load releases
    labelCatalogStore.getItem('label_catalog_releases').then((cachedReleases) => {
      if (cachedReleases) {
        try {
          setCatalogReleases(JSON.parse(cachedReleases as string));
        } catch(e) {}
      } else {
        const oldCached = localStorage.getItem('label_catalog_releases');
        if (oldCached) {
          try {
            const parsed = JSON.parse(oldCached);
            setCatalogReleases(parsed);
            labelCatalogStore.setItem('label_catalog_releases', JSON.stringify(parsed));
          } catch(e) {}
        } else {
          const defaultReleases: Record<string, any[]> = {};
          setCatalogReleases(defaultReleases);
          labelCatalogStore.setItem('label_catalog_releases', JSON.stringify(defaultReleases));
        }
      }
    });

    // 2. Load apparel
    const MOCK_MERCH_IDS = new Set([
      "dfd0c9f8-b3d1-4aee-b248-26cf03e87870",
      "a40237bb-539c-4ea6-81d3-34e8979148d1",
      "f2f993f4-18ea-4672-91d1-6fc72e9fc988",
      "9a5ef28d-195c-443b-8fe9-a5c9b7482565",
      "c6e75924-be8c-4a1e-8e41-e94f8306df9a",
      "ecf0f2cf-bf0b-4df2-b5e0-b6f759e5bc53",
      "039e1ff1-460d-4581-9bfe-852438cb20d4"
    ]);

    const sanitizeApparel = (raw: Record<string, any[]>) => {
      const cleaned: Record<string, any[]> = {};
      for (const key in raw) {
        cleaned[key] = (raw[key] || []).filter(item => !MOCK_MERCH_IDS.has(item.id));
      }
      return cleaned;
    };

    labelCatalogStore.getItem('label_catalog_apparel').then((cachedApparel) => {
      if (cachedApparel) {
        try {
          const parsed = JSON.parse(cachedApparel as string);
          setCatalogApparel(sanitizeApparel(parsed));
        } catch(e) {}
      } else {
        const oldCached = localStorage.getItem('label_catalog_apparel');
        if (oldCached) {
          try {
            const parsed = JSON.parse(oldCached);
            setCatalogApparel(sanitizeApparel(parsed));
            labelCatalogStore.setItem('label_catalog_apparel', JSON.stringify(sanitizeApparel(parsed)));
          } catch(e) {}
        } else {
          const defaultApparel: Record<string, any[]> = {};
          setCatalogApparel(defaultApparel);
          labelCatalogStore.setItem('label_catalog_apparel', JSON.stringify(defaultApparel));
        }
      }
    });

    // 3. Load storefront sync record
    const cachedSync = localStorage.getItem('label_storefront_sync_record');
    if (cachedSync) {
      try {
        const parsed = JSON.parse(cachedSync);
        const cleanedSync: Record<string, boolean> = {};
        for (const k in parsed) {
          if (!MOCK_MERCH_IDS.has(k)) {
            cleanedSync[k] = parsed[k];
          }
        }
        setStorefrontSyncRecord(cleanedSync);
      } catch(e) {}
    } else {
      const defaultSync = {};
      setStorefrontSyncRecord(defaultSync);
      localStorage.setItem('label_storefront_sync_record', JSON.stringify(defaultSync));
    }

    // 4. Load van stocks representation
    const cachedVan = localStorage.getItem('label_van_apparel_stocks');
    if (cachedVan) {
      try {
        setVanApparelStocks(JSON.parse(cachedVan));
      } catch(e) {}
    }

    setIsLoading(false);
  }, []);

  // Sync to Storage
  useEffect(() => {
    if (!isLoading && Object.keys(catalogReleases).length > 0) {
      labelCatalogStore.setItem('label_catalog_releases', JSON.stringify(catalogReleases)).catch(() => {});
    }
  }, [catalogReleases, isLoading]);

  useEffect(() => {
    if (!isLoading && Object.keys(catalogApparel).length > 0) {
      labelCatalogStore.setItem('label_catalog_apparel', JSON.stringify(catalogApparel)).catch(() => {});
    }
  }, [catalogApparel, isLoading]);

  useEffect(() => {
    if (!isLoading && Object.keys(storefrontSyncRecord).length > 0) {
      localStorage.setItem('label_storefront_sync_record', JSON.stringify(storefrontSyncRecord));
    }
  }, [storefrontSyncRecord, isLoading]);

  const handleDispatchToVanIndexedDB = (bandId: string, title: string, format: 'vinyl' | 'cd' | 'cassette', qty: number) => {
    if (qty < 1) return;
    
    const releases = catalogReleases[bandId] || [];
    const target = releases.find(r => r.title === title);
    if (!target) return;
    const safeFormats = target.formats || { vinyl: { warehouse_qty: 0 }, cd: { warehouse_qty: 0 }, cassette: { warehouse_qty: 0 } };
    const currentQty = safeFormats[format]?.warehouse_qty || 0;
    if (currentQty < qty) {
      triggerNotification(`CRITICAL: INSUFFICIENT MASTER WAREHOUSE INVENTORY OF ${format.toUpperCase()}`);
      return;
    }

    setCatalogReleases(prev => {
      const updated = { ...prev };
      const list = updated[bandId] || [];
      updated[bandId] = list.map(r => {
        if (r.title === title) {
          const sFormats = r.formats || { vinyl: { warehouse_qty: 0 }, cd: { warehouse_qty: 0 }, cassette: { warehouse_qty: 0 } };
          const sFormatVal = sFormats[format] || { warehouse_qty: 0 };
          return {
            ...r,
            formats: {
              ...sFormats,
              [format]: { warehouse_qty: Math.max(0, sFormatVal.warehouse_qty - qty) }
            }
          };
        }
        return r;
      });
      return updated;
    });

    try {
      const openRequest = indexedDB.open('nexus_van_stock_db', 1);
      openRequest.onupgradeneeded = (e: any) => {
        const db = e.target?.result;
        if (!db.objectStoreNames.contains('van_stock')) {
          db.createObjectStore('van_stock', { keyPath: 'id' });
        }
      };
      
      openRequest.onsuccess = (e: any) => {
        const db = e.target?.result;
        const transaction = db.transaction('van_stock', 'readwrite');
        const store = transaction.objectStore('van_stock');
        
        const txnRecordId = `dispatch_${bandId}_${Date.now()}`;
        store.put({
          id: txnRecordId,
          bandId,
          releaseTitle: title,
          format,
          quantity: qty,
          dispatchedAt: new Date().toISOString()
        });
      };
    } catch (dbErr) {
      console.warn("IndexedDB execution restricted:", dbErr);
    }

    setLabelRosterData(prev => {
      return prev.map(member => {
        if (member.id === bandId) {
          const addedPerc = Math.min(100, member.inventory_level + Math.floor(qty / 2));
          return { ...member, inventory_level: addedPerc };
        }
        return member;
      });
    });

    triggerNotification(`SUCCESS: Allocated ${qty} ${format.toUpperCase()} to Tour Van Database.`);
  };

  const toggleSync = (itemId: string) => {
    setStorefrontSyncRecord(prev => {
      const updated = { ...prev, [itemId]: !prev[itemId] };
      return updated;
    });
    triggerNotification(`Toggled direct-to-fan storefront visibility!`);
  };

  const activeReleases = catalogReleases[activeKey] || [];
  const activeApparel = catalogApparel[activeKey] || [];

  return (
    <div className="flex flex-col gap-0 bg-[#070707] w-full">
      
      {/* SECTION 1: FULL-SIZE INVENTORY MANAGER (ALWAYS OPEN) */}
      <div className="w-full bg-black border-b border-[#222222] overflow-hidden">
        <InventoryView
          inventory={filteredInventory}
          setInventory={setInventory}
          inventoryAudits={inventoryAudits}
          setInventoryAudits={setInventoryAudits}
          onBack={() => {}}
          onAddNew={() => { setEditingItem(null); setActiveTab('add-item'); }}
          onEditItem={(item) => { setEditingItem(item); setActiveTab('add-item'); }}
          triggerNotification={triggerNotification}
          addLog={addLog}
          activeBandId={activeBandId}
          onOpenTransferModal={(itemId) => {
            onOpenTransferModal(itemId);
          }}
          onNavigateToPrinters={() => setActiveTab('merchandise-printers')}
          onGoToPublicStore={() => {
            setIsPublicStorefrontOpen(true);
          }}
          stagedDistroItems={stagedDistroItems}
          setStagedDistroItems={setStagedDistroItems}
        />
      </div>

      {/* SECTION 2: CREATIVES HUB (COLLAPSIBLE) */}
      <V2ExpandableCard title="Creatives Hub" defaultExpanded={false}>
        <div className="bg-black border-t border-[#1a1a1a]">
          <CreativesHubView
            onBack={() => {}}
            triggerNotification={triggerNotification}
            addLog={addLog}
            activeBandName={activeBand?.name || 'Artist'}
          />
        </div>
      </V2ExpandableCard>

      {/* SECTION 3: MUSIC CATALOG (COLLAPSIBLE) */}
      <V2ExpandableCard title="Music Catalog & Master Releases" defaultExpanded={false}>
        <div className="bg-black border-t border-[#1a1a1a] p-1">
          {!isLoading && (
            <ReleasesCatalogTab
              labelRosterData={labelRosterData}
              setLabelRosterData={setLabelRosterData}
              catalogReleases={catalogReleases}
              setCatalogReleases={setCatalogReleases}
              catalogApparel={catalogApparel}
              setCatalogApparel={setCatalogApparel}
              vanApparelStocks={vanApparelStocks}
              setVanApparelStocks={setVanApparelStocks}
              handleDispatchToVanIndexedDB={handleDispatchToVanIndexedDB}
              showLocalToast={triggerNotification}
              forcedBandId={activeBandId}
              isCompactWorkspaceMode={true}
            />
          )}
        </div>
      </V2ExpandableCard>

      {/* SECTION 4: BAND'S PUBLIC STOREFRONT (DIRECT) */}
      <V2ExpandableCard title="Public Storefront" defaultExpanded={false}>
        <div className="bg-black border-t border-[#1a1a1a] p-2 sm:p-4">
          <PublicStorefrontView
            catalogReleases={catalogReleases}
            catalogApparel={catalogApparel}
            storefrontSyncRecord={storefrontSyncRecord}
            setStorefrontSyncRecord={setStorefrontSyncRecord}
            setCatalogReleases={setCatalogReleases}
            setCatalogApparel={setCatalogApparel}
            labelName={activeBand?.name || 'MANAGED BAND'}
            onClose={() => setIsPublicStorefrontOpen(false)}
            triggerNotification={triggerNotification}
            isInline={true}
          />
        </div>
      </V2ExpandableCard>

      {/* FULLSCREEN PUBLIC STOREFRONT OVERLAY */}
      {isPublicStorefrontOpen && (
        <PublicStorefrontView
          catalogReleases={catalogReleases}
          catalogApparel={catalogApparel}
          storefrontSyncRecord={storefrontSyncRecord}
          labelName={activeBand?.name || 'MANAGED BAND'}
          onClose={() => setIsPublicStorefrontOpen(false)}
          triggerNotification={triggerNotification}
        />
      )}

    </div>
  );
}
