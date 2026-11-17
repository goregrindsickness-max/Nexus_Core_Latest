import React from 'react';
import DevBandDistroDeck from '../portals/Band/DevBandDistroDeck';
import { InventoryItem, StagedDistroItem } from '../../types';

export interface DistroDeckViewProps {
  inventory: InventoryItem[];
  triggerNotification: (msg: string) => void;
  onBack: () => void;
  onNavigateToTab: (tab: string) => void;
  stagedDistroItems: StagedDistroItem[];
  setStagedDistroItems: React.Dispatch<React.SetStateAction<StagedDistroItem[]>>;
  initialSubTab: string;
}

export const DistroDeckView: React.FC<DistroDeckViewProps> = ({
  inventory,
  triggerNotification,
  onBack,
  onNavigateToTab,
  stagedDistroItems,
  setStagedDistroItems,
  initialSubTab,
}) => {
  return (
    <div className="flex-grow overflow-y-auto px-5 py-4 scrollbar-thin">
      <DevBandDistroDeck
        inventory={inventory}
        triggerNotification={triggerNotification}
        onBack={onBack}
        onNavigateToTab={onNavigateToTab}
        stagedDistroItems={stagedDistroItems}
        setStagedDistroItems={setStagedDistroItems}
        initialSubTab={initialSubTab as any}
      />
    </div>
  );
};

export default DistroDeckView;
