import React from 'react';
import BaseHelpDeskView from '../HelpDeskView';

export interface HelpDeskViewProps {
  onBack: () => void;
  triggerNotification: (msg: string) => void;
}

export const HelpDeskView: React.FC<HelpDeskViewProps> = ({ onBack, triggerNotification }) => {
  return (
    <div className="flex-grow overflow-hidden">
      <BaseHelpDeskView onBack={onBack} triggerNotification={triggerNotification} />
    </div>
  );
};

export default HelpDeskView;
