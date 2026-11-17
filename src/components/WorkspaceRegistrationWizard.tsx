import React, { useState } from 'react';

interface WorkspaceRegistrationWizardProps {
  onClose: () => void;
  onProceed: (selectedRoles: string[]) => void;
  initialRole?: string;
}

const WorkspaceRegistrationWizard: React.FC<WorkspaceRegistrationWizardProps> = ({ onClose, onProceed, initialRole }) => {
  const [selectedRoles, setSelectedRoles] = useState<string[]>(initialRole ? [initialRole] : []);

  const toggleRole = (role: string) => {
    setSelectedRoles(prev => {
      if (prev.includes(role)) {
        return prev.filter(r => r !== role);
      } else {
        return [...prev, role];
      }
    });
  };

  const handleInitialize = () => {
    if (selectedRoles.length === 0) return;
    onProceed(selectedRoles);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#0c0e12] text-white flex flex-col items-center overflow-y-auto px-4 py-6 font-sans">
      <div className="w-full max-w-xl flex flex-col items-center">
        {/* Header */}
        <div className="w-full flex items-center justify-start mb-6 gap-3">
          <button 
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-full border border-zinc-700 text-zinc-300 text-xs hover:bg-zinc-800 transition-colors"
          >
            &larr; Back
          </button>
          <div className="flex items-center gap-2 text-[10px] font-mono text-[#00ffcc] tracking-widest font-bold">
            <span className="animate-pulse">((o))</span>
            <span>LIVE SECURE REGISTER GATEWAY</span>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-6 flex flex-col items-center gap-2">
          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-white drop-shadow-[0_0_15px_rgba(0,255,204,0.3)]">
            REGISTER A NEW<br/>WORKSPACE
          </h1>
          <p className="text-[10px] font-mono tracking-[0.3em] text-zinc-400 uppercase">
            Select Access Clearances
          </p>
        </div>

        {/* Grid */}
        <div className="w-full grid grid-cols-2 gap-3 mb-6">
          {/* Artist/Band */}
          <div 
            onClick={() => toggleRole('BAND')}
            className={`p-4 rounded-xl border cursor-pointer transition-all duration-300 flex flex-col items-center text-center ${
              selectedRoles.includes('BAND')
                ? 'bg-black/50 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                : 'bg-black/20 border-emerald-900/50 hover:border-emerald-700 hover:bg-black/40'
            }`}
          >
            <div className="text-2xl mb-2 drop-shadow-md">🎸</div>
            <h3 className="text-xs font-black tracking-widest mb-3 uppercase">Artist / Band</h3>
            <ul className="text-[8.5px] font-mono text-zinc-400 tracking-wider space-y-1.5 uppercase">
              <li>• Sell merch & music live</li>
              <li>• Track van & table stock</li>
              <li>• Manage tour setlists</li>
            </ul>
          </div>

          {/* Record Label */}
          <div 
            onClick={() => toggleRole('LABEL')}
            className={`p-4 rounded-xl border cursor-pointer transition-all duration-300 flex flex-col items-center text-center ${
              selectedRoles.includes('LABEL')
                ? 'bg-black/50 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                : 'bg-black/20 border-amber-900/50 hover:border-amber-700 hover:bg-black/40'
            }`}
          >
            <div className="text-2xl mb-2 drop-shadow-md">💿</div>
            <h3 className="text-xs font-black tracking-widest mb-3 uppercase">Record Label</h3>
            <ul className="text-[8.5px] font-mono text-zinc-400 tracking-wider space-y-1.5 uppercase">
              <li>• Manage band roster</li>
              <li>• Automate revenue splits</li>
              <li>• Track master distro</li>
            </ul>
          </div>

          {/* Promoter */}
          <div 
            onClick={() => toggleRole('PROMOTER')}
            className={`p-4 rounded-xl border cursor-pointer transition-all duration-300 flex flex-col items-center text-center ${
              selectedRoles.includes('PROMOTER')
                ? 'bg-black/50 border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.2)]'
                : 'bg-black/20 border-yellow-900/50 hover:border-yellow-700 hover:bg-black/40'
            }`}
          >
            <div className="text-2xl mb-2 drop-shadow-md">🎟️</div>
            <h3 className="text-xs font-black tracking-widest mb-3 uppercase">Promoter</h3>
            <ul className="text-[8.5px] font-mono text-zinc-400 tracking-wider space-y-1.5 uppercase">
              <li>• Book shows & festivals</li>
              <li>• Manage venue calendars</li>
              <li>• Handle payouts & splits</li>
            </ul>
          </div>

          {/* Creative/Crew */}
          <div 
            onClick={() => toggleRole('CREATIVE')}
            className={`p-4 rounded-xl border cursor-pointer transition-all duration-300 flex flex-col items-center text-center ${
              selectedRoles.includes('CREATIVE')
                ? 'bg-black/50 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                : 'bg-black/20 border-purple-900/50 hover:border-purple-700 hover:bg-black/40'
            }`}
          >
            <div className="text-2xl mb-2 drop-shadow-md">🎨</div>
            <h3 className="text-xs font-black tracking-widest mb-3 uppercase">Creative/Crew</h3>
            <ul className="text-[8.5px] font-mono text-zinc-400 tracking-wider space-y-1.5 uppercase">
              <li>• Design layouts & merch</li>
              <li>• Manage design contracts</li>
              <li>• Track active freelance jobs</li>
            </ul>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleInitialize}
          disabled={selectedRoles.length === 0}
          className="w-full py-4.5 bg-[#00ffcc] text-black font-mono font-black text-xs tracking-widest uppercase hover:bg-[#00e6b8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          OPEN REGISTRATION FORM
        </button>
      </div>
    </div>
  );
};

export default WorkspaceRegistrationWizard;
