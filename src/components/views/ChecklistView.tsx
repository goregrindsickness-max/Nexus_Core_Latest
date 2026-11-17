import React from 'react';
import TourChecklistView from '../portals/Band/TourChecklistView';
import { ChecklistItem, BankItem } from '../../types';

export interface ChecklistViewProps {
  onBack: () => void;
  checklistItems: ChecklistItem[];
  setChecklistItems: React.Dispatch<React.SetStateAction<ChecklistItem[]>>;
  checklistBank: BankItem[];
  setChecklistBank: React.Dispatch<React.SetStateAction<BankItem[]>>;
  triggerNotification: (msg: string) => void;
  addLog: (msg: string) => void;
  activeBandName?: string;
}

export const ChecklistView: React.FC<ChecklistViewProps> = ({
  onBack,
  checklistItems,
  setChecklistItems,
  checklistBank,
  setChecklistBank,
  triggerNotification,
  addLog,
  activeBandName,
}) => {
  return (
    <div className="flex-grow overflow-y-auto">
      <TourChecklistView
        onBack={onBack}
        activeItems={checklistItems}
        setActiveItems={setChecklistItems}
        bankItems={checklistBank}
        setBankItems={setChecklistBank}
        triggerNotification={triggerNotification}
        addLog={addLog}
        activeBandName={activeBandName}
      />
    </div>
  );
};

export default ChecklistView;
