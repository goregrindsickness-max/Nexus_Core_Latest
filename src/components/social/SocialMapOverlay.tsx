import React from 'react';
import { GigMapModal } from './modals/GigMapModal';

export interface SocialMapOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMapEvent: any;
  setSelectedMapEvent: (evt: any) => void;
  selectedCityFilter: string;
  setSelectedCityFilter: (city: string) => void;
  mapFilterGenre: string;
  setMapFilterGenre: (genre: string) => void;
  userProfile: any;
  triggerNotification?: (msg: string) => void;
  liveEvents?: any[];
}

export const SocialMapOverlay: React.FC<SocialMapOverlayProps> = (props) => {
  return <GigMapModal {...props} />;
};
