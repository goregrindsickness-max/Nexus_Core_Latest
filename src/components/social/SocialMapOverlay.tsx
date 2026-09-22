import React from 'react';
import { EventsDirectoryModal, EventsDirectoryModalProps } from './modals/EventsDirectoryModal';

export interface SocialMapOverlayProps extends EventsDirectoryModalProps {}

export const SocialMapOverlay: React.FC<SocialMapOverlayProps> = (props) => {
  return <EventsDirectoryModal {...props} />;
};

export { EventsDirectoryModal };
