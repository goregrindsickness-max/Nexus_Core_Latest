import React from 'react';
import PromoterDashboardViewV2 from './Promoter/PromoterDashboardViewV2';

export interface PromoterVenuePortalProps {
  onUpgradeToPro: () => void;
  userProfile: any;
  setUserProfile: React.Dispatch<React.SetStateAction<any>>;
  onLogout: () => void;
  onBack: () => void;
  notifications: any[];
  onOpenNotifications: () => void;
  triggerNotification: (msg: string) => void;
  setActiveTab: (tab: any) => void;
  addLog: (msg: string) => void;
  bands: any[];
  offers: any[];
  onCreateOffer: (offer: any) => void | Promise<void>;
  onUpdateOffer: (offer: any) => void | Promise<void>;
  shows: any[];
  onMarkAsRead: (id: string) => void | Promise<void>;
  activeBand: any;
  activeBandId: string;
  setActiveBandId: React.Dispatch<React.SetStateAction<string>>;
  isOfflineSimActive: boolean;
  setIsOfflineSimActive: React.Dispatch<React.SetStateAction<boolean>>;
  isOnline: boolean;
}

export const PromoterVenuePortal: React.FC<PromoterVenuePortalProps> = (props) => {
  return (
    <div className="flex-grow overflow-y-auto">
      <PromoterDashboardViewV2 {...props} />
    </div>
  );
};

export default PromoterVenuePortal;
