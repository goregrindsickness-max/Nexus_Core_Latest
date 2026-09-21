import localforage from 'localforage';

export const wipeAllLocalData = async () => {
  try {
    const wipedFlag = localStorage.getItem('WIPED_ONCE_JULY_16_11_50');
    // Clear localStorage
    localStorage.clear();
    if (wipedFlag) localStorage.setItem('WIPED_ONCE_JULY_16_11_50', wipedFlag);
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    // Clear IndexedDB localforage stores
    await localforage.dropInstance({ name: 'NexusCore_Offline_DB' }).catch(console.error);
    await localforage.dropInstance({ name: 'nexus_van_stock_db' }).catch(console.error);
    
    // Attempt to delete native indexedDB instances
    if (window.indexedDB) {
      if (typeof window.indexedDB.databases === 'function') {
        const dbs = await window.indexedDB.databases();
        for (const db of dbs) {
          if (db.name) {
            window.indexedDB.deleteDatabase(db.name);
          }
        }
      } else {
        // Fallback for older browsers if needed
        window.indexedDB.deleteDatabase('NexusCore_Offline_DB');
        window.indexedDB.deleteDatabase('nexus_van_stock_db');
      }
    }
    
    // Optional: unregister service workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }
    }
    
    // Reload the page to clear memory state
    window.location.reload();
  } catch (error) {
    console.error('Error wiping local data:', error);
    alert('Failed to completely wipe data. Check console.');
  }
};

// Expose to window for easy developer access
if (typeof window !== 'undefined') {
  (window as any).WIPE_NEXUS_DATA = wipeAllLocalData;
}
