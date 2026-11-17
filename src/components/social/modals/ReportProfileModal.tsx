import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, AlertTriangle } from 'lucide-react';

interface ReportProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedUserProfile: any;
  userProfile: any;
  reportReason: string;
  setReportReason: (val: string) => void;
  setReports: React.Dispatch<React.SetStateAction<any[]>>;
  triggerNotification?: (msg: string) => void;
}

export const ReportProfileModal: React.FC<ReportProfileModalProps> = ({
  isOpen,
  onClose,
  selectedUserProfile,
  userProfile,
  reportReason,
  setReportReason,
  setReports,
  triggerNotification,
}) => {
  return (
    <AnimatePresence>
      {isOpen && selectedUserProfile && (
        <div className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4 backdrop-blur-xl animate-in fade-in duration-200">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-[#121214] border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden relative"
          >
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="text-white font-black uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                Report Profile
              </h2>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-white hover:bg-zinc-800">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4">
              <p className="text-sm text-zinc-400 mb-4 leading-relaxed">
                You are reporting <strong className="text-white">{selectedUserProfile.name}</strong>. Please provide details about the problem to help our moderators take appropriate action.
              </p>
              <textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Explain the issue in detail (e.g., spam, scam, abusive behavior)..."
                className="w-full bg-black border border-zinc-800 text-white text-sm rounded-xl p-3 h-32 resize-none focus:outline-none focus:border-rose-500 mb-4"
              />
              <button
                onClick={() => {
                  if (!reportReason.trim()) {
                    triggerNotification?.('Please provide a reason for the report.');
                    return;
                  }
                  setReports(prev => [{
                    id: `rep_${Date.now()}`,
                    reporterId: userProfile?.id || 'admin',
                    reportedProfileId: selectedUserProfile.name,
                    reportedProfileName: selectedUserProfile.name,
                    reason: reportReason,
                    status: 'pending',
                    timestamp: new Date().toISOString()
                  }, ...prev]);
                  setReportReason('');
                  onClose();
                  triggerNotification?.('Report submitted. A moderator will review it shortly.');
                }}
                className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 rounded-xl uppercase tracking-widest text-xs transition-colors"
              >
                Submit Report
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
