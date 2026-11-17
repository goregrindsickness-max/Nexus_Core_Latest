import React from 'react';
import StudioWorkspaceWrapper from '../studio/StudioWorkspaceWrapper';

export interface StudioViewProps {
  onBack: () => void;
  triggerNotification: (msg: string) => void;
}

export const StudioView: React.FC<StudioViewProps> = ({ onBack, triggerNotification }) => {
  return (
    <div className="flex-grow overflow-y-auto bg-[#07040a]">
      <StudioWorkspaceWrapper onBack={onBack} triggerNotification={triggerNotification} />
    </div>
  );
};

export default StudioView;
