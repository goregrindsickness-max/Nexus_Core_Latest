import React from 'react';
import { SubmitEpkModal } from './SubmitEpkModal';
import { ViewEpksModal } from './ViewEpksModal';

export { SubmitEpkModal, ViewEpksModal };

export interface EpkModalsProps {
  showSubmitEpkModal: boolean;
  setShowSubmitEpkModal: (val: boolean) => void;
  showViewEpksModal: boolean;
  setShowViewEpksModal: (val: boolean) => void;
  selectedUserProfile?: any;
  userProfile?: any;
  epkSubmissionSuccess: boolean;
  setEpkSubmissionSuccess: (val: boolean) => void;
  epkFormBandName: string;
  setEpkFormBandName: (val: string) => void;
  epkFormBio: string;
  setEpkFormBio: (val: string) => void;
  epkFormHistory: string;
  setEpkFormHistory: (val: string) => void;
  epkFormMembers: string;
  setEpkFormMembers: (val: string) => void;
  epkFormProfileLink: string;
  setEpkFormProfileLink: (val: string) => void;
  epkFormTracks: any[];
  setEpkFormTracks: (val: any[]) => void;
  isEpkDragOver: boolean;
  setIsEpkDragOver: (val: boolean) => void;
  setEpkSubmissions: React.Dispatch<React.SetStateAction<any[]>>;
  epkFilterTab: 'my_label' | 'all';
  setEpkFilterTab: (val: 'my_label' | 'all') => void;
  epkSubmissions: any[];
  expandedEpkId: string | null;
  setExpandedEpkId: (val: string | null) => void;
  triggerNotification?: (msg: string) => void;
}

export const EpkModals: React.FC<EpkModalsProps> = ({
  showSubmitEpkModal,
  setShowSubmitEpkModal,
  showViewEpksModal,
  setShowViewEpksModal,
  selectedUserProfile,
  userProfile,
  epkSubmissionSuccess,
  setEpkSubmissionSuccess,
  epkFormBandName,
  setEpkFormBandName,
  epkFormBio,
  setEpkFormBio,
  epkFormHistory,
  setEpkFormHistory,
  epkFormMembers,
  setEpkFormMembers,
  epkFormProfileLink,
  setEpkFormProfileLink,
  epkFormTracks,
  setEpkFormTracks,
  isEpkDragOver,
  setIsEpkDragOver,
  setEpkSubmissions,
  epkFilterTab,
  setEpkFilterTab,
  epkSubmissions,
  expandedEpkId,
  setExpandedEpkId,
  triggerNotification,
}) => {
  return (
    <>
      <SubmitEpkModal
        isOpen={showSubmitEpkModal}
        onClose={() => {
          setShowSubmitEpkModal(false);
          setEpkSubmissionSuccess(false);
        }}
        selectedUserProfile={selectedUserProfile}
        epkSubmissionSuccess={epkSubmissionSuccess}
        setEpkSubmissionSuccess={setEpkSubmissionSuccess}
        epkFormBandName={epkFormBandName}
        setEpkFormBandName={setEpkFormBandName}
        epkFormBio={epkFormBio}
        setEpkFormBio={setEpkFormBio}
        epkFormHistory={epkFormHistory}
        setEpkFormHistory={setEpkFormHistory}
        epkFormMembers={epkFormMembers}
        setEpkFormMembers={setEpkFormMembers}
        epkFormProfileLink={epkFormProfileLink}
        setEpkFormProfileLink={setEpkFormProfileLink}
        epkFormTracks={epkFormTracks}
        setEpkFormTracks={setEpkFormTracks}
        isDragOver={isEpkDragOver}
        setIsDragOver={setIsEpkDragOver}
        setEpkSubmissions={setEpkSubmissions}
        triggerNotification={triggerNotification}
      />

      <ViewEpksModal
        isOpen={showViewEpksModal}
        onClose={() => {
          setShowViewEpksModal(false);
          setExpandedEpkId(null);
        }}
        epkFilterTab={epkFilterTab}
        setEpkFilterTab={setEpkFilterTab}
        epkSubmissions={epkSubmissions}
        setEpkSubmissions={setEpkSubmissions}
        userProfile={userProfile}
        expandedEpkId={expandedEpkId}
        setExpandedEpkId={setExpandedEpkId}
        triggerNotification={triggerNotification}
      />
    </>
  );
};
