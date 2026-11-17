import localforage from 'localforage';

export const wipeAllLocalData = async () => {
  try {
    // Clear localStorage & sessionStorage safely
    try {
      localStorage.clear();
    } catch (_) {}
    try {
      sessionStorage.clear();
    } catch (_) {}
    
    // Clear IndexedDB localforage stores safely without throwing unhandled promise rejections
    try {
      await localforage.dropInstance({ name: 'NexusCore_Offline_DB' });
    } catch (_) {}
    try {
      await localforage.dropInstance({ name: 'nexus_van_stock_db' });
    } catch (_) {}
    
    // Attempt to delete native indexedDB instances
    if (typeof window !== 'undefined' && window.indexedDB) {
      try {
        if (typeof window.indexedDB.databases === 'function') {
          const dbs = await window.indexedDB.databases();
          for (const db of dbs) {
            if (db.name) {
              try {
                window.indexedDB.deleteDatabase(db.name);
              } catch (_) {}
            }
          }
        } else {
          try { window.indexedDB.deleteDatabase('NexusCore_Offline_DB'); } catch (_) {}
          try { window.indexedDB.deleteDatabase('nexus_van_stock_db'); } catch (_) {}
        }
      } catch (_) {}
    }
    
    // Safely unregister service workers without throwing
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          try {
            await registration.unregister();
          } catch (_) {}
        }
      } catch (_) {}
    }
    
    // Reload the page to clear memory state
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  } catch (error) {
    console.warn('Wipe local data notice:', error);
  }
};

// Expose to window for easy developer access
if (typeof window !== 'undefined') {
  (window as any).WIPE_NEXUS_DATA = wipeAllLocalData;
}
