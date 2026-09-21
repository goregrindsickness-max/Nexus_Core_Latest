import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, X, Shield, AlertTriangle, Plus, Database, RefreshCw, Trash2 } from 'lucide-react';

interface AdminConsoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  blacklistRecords: any[];
  setBlacklistRecords: React.Dispatch<React.SetStateAction<any[]>>;
  newBlacklistType: string;
  setNewBlacklistType: (val: string) => void;
  newBlacklistValue: string;
  setNewBlacklistValue: (val: string) => void;
  isBlacklistLoading: boolean;
  setIsBlacklistLoading: (val: boolean) => void;
  reports: any[];
  setReports: React.Dispatch<React.SetStateAction<any[]>>;
  triggerNotification?: (msg: string) => void;
  supabase?: any;
}

export const AdminConsoleModal: React.FC<AdminConsoleModalProps> = ({
  isOpen,
  onClose,
  blacklistRecords,
  setBlacklistRecords,
  newBlacklistType,
  setNewBlacklistType,
  newBlacklistValue,
  setNewBlacklistValue,
  isBlacklistLoading,
  setIsBlacklistLoading,
  reports,
  setReports,
  triggerNotification,
  supabase,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] bg-black flex flex-col animate-in fade-in duration-200">
          {/* Header */}
          <div className="bg-zinc-950 border-b border-rose-900/30 p-4 flex items-center justify-between relative z-20">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-rose-950/50 flex items-center justify-center border border-rose-500/30">
                <Lock className="w-4 h-4 text-rose-500" />
              </div>
              <div>
                <h2 className="text-rose-50 font-black uppercase tracking-widest text-sm font-display">Security Firewall</h2>
                <div className="text-rose-500/80 font-mono text-[9px] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" /> OMEGA LEVEL ACCESS
                </div>
              </div>
            </div>
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-white hover:bg-zinc-800 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Admin Content */}
          <div className="flex-1 overflow-y-auto bg-[#050608] p-4">
            <div className="max-w-2xl mx-auto space-y-6">
              
              {/* Stats / Status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex flex-col">
                  <span className="text-zinc-500 font-mono text-[10px] uppercase tracking-widest mb-1">Firewall Status</span>
                  <span className="text-emerald-400 font-black text-lg flex items-center gap-2"><Shield className="w-4 h-4" /> ACTIVE</span>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex flex-col">
                  <span className="text-zinc-500 font-mono text-[10px] uppercase tracking-widest mb-1">Restricted Entities</span>
                  <span className="text-rose-400 font-black text-lg flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> {blacklistRecords.length}</span>
                </div>
              </div>

              {/* Add to Blacklist Form */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
                <h3 className="text-white font-bold uppercase tracking-wide text-sm mb-4 font-mono border-b border-zinc-800 pb-2">Enforce New Restriction</h3>
                <div className="flex flex-col sm:flex-row gap-3">
                  <select 
                    value={newBlacklistType}
                    onChange={(e) => setNewBlacklistType(e.target.value)}
                    className="bg-black border border-zinc-700 text-white text-sm rounded-lg px-3 py-2.5 focus:border-rose-500 focus:outline-none"
                  >
                    <option value="email">Email Address</option>
                    <option value="handle">Account Handle</option>
                    <option value="band">Band Account</option>
                    <option value="creator">Creative/Creator</option>
                    <option value="promoter">Promoter</option>
                    <option value="label">Record Label</option>
                  </select>
                  <input 
                    type="text"
                    value={newBlacklistValue}
                    onChange={(e) => setNewBlacklistValue(e.target.value)}
                    placeholder={newBlacklistType === 'email' ? "target@domain.com" : "@username"}
                    className="flex-1 bg-black border border-zinc-700 text-white text-sm rounded-lg px-4 py-2.5 focus:border-rose-500 focus:outline-none"
                  />
                  <button 
                    onClick={async () => {
                      if (!newBlacklistValue) return;
                      setIsBlacklistLoading(true);
                      try {
                        if (supabase) {
                          await supabase.from('app_blacklist').insert({ type: newBlacklistType, value: newBlacklistValue.toLowerCase() });
                        }
                        // Optimistic local update
                        setBlacklistRecords(prev => [{
                          id: Math.random().toString(),
                          type: newBlacklistType,
                          value: newBlacklistValue.toLowerCase(),
                          created_at: new Date().toISOString()
                        }, ...prev]);
                        setNewBlacklistValue('');
                      } catch (err) {
                        console.error(err);
                      } finally {
                        setIsBlacklistLoading(false);
                      }
                    }}
                    disabled={isBlacklistLoading || !newBlacklistValue}
                    className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-6 py-2.5 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus className="w-4 h-4" /> BLOCK
                  </button>
                </div>
              </div>

              {/* Blacklist Registry */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                  <h3 className="text-white font-bold uppercase tracking-wide text-sm font-mono flex items-center gap-2">
                    <Database className="w-4 h-4 text-zinc-400" />
                    Global Registry
                  </h3>
                  <button 
                    onClick={async () => {
                      setIsBlacklistLoading(true);
                      if (supabase) {
                        const { data } = await supabase.from('app_blacklist').select('*').order('created_at', { ascending: false });
                        if (data) setBlacklistRecords(data);
                      } else {
                        // Mock data if no supabase
                        setBlacklistRecords([
                          { id: '1', type: 'email', value: 'banned@tour-hq.com', created_at: new Date().toISOString() },
                          { id: '2', type: 'handle', value: 'troublemaker', created_at: new Date().toISOString() }
                        ]);
                      }
                      setIsBlacklistLoading(false);
                    }}
                    className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 font-mono uppercase tracking-widest"
                  >
                    <RefreshCw className={`w-3 h-3 ${isBlacklistLoading ? 'animate-spin' : ''}`} /> Refresh
                  </button>
                </div>
                
                <div className="divide-y divide-zinc-800/50">
                  {blacklistRecords.length === 0 ? (
                    <div className="p-8 text-center text-zinc-500 font-mono text-xs uppercase">
                      No restricted entities found.
                    </div>
                  ) : (
                    blacklistRecords.map((record, rIdx) => (
                      <div key={record.id ? `bl-${record.id}-${rIdx}` : `bl-${rIdx}`} className="p-4 flex items-center justify-between hover:bg-zinc-800/20 transition-colors">
                        <div>
                          <div className="text-white font-bold text-sm mb-1">{record.value}</div>
                          <div className="text-zinc-500 font-mono text-[10px] uppercase tracking-widest">
                            TYPE: {record.type} • ADDED: {new Date(record.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <button 
                          onClick={async () => {
                            setIsBlacklistLoading(true);
                            if (supabase) {
                              await supabase.from('app_blacklist').delete().eq('id', record.id);
                            }
                            setBlacklistRecords(prev => prev.filter(r => r.id !== record.id));
                            setIsBlacklistLoading(false);
                          }}
                          className="w-8 h-8 rounded bg-zinc-800 hover:bg-rose-900/50 hover:text-rose-400 flex items-center justify-center text-zinc-400 transition-colors border border-transparent hover:border-rose-500/30"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Reported Profiles Registry */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden mt-6">
                <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                  <h3 className="text-white font-bold uppercase tracking-wide text-sm font-mono flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                    Reported Profiles Queue
                  </h3>
                </div>
                <div className="divide-y divide-zinc-800/50">
                  {reports.length === 0 ? (
                    <div className="p-8 text-center text-zinc-500 font-mono text-xs uppercase">
                      No pending reports.
                    </div>
                  ) : (
                    reports.map((report, repIdx) => (
                      <div key={report.id ? `rep-${report.id}-${repIdx}` : `rep-${repIdx}`} className="p-4 flex flex-col gap-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="text-white font-bold text-sm mb-1">{report.reportedProfileName}</div>
                            <div className="text-zinc-400 text-xs mb-2 leading-relaxed">
                              <span className="text-zinc-500 font-mono text-[10px] uppercase tracking-widest mr-2">Reason:</span>
                              {report.reason}
                            </div>
                            <div className="text-zinc-500 font-mono text-[10px] uppercase tracking-widest">
                              REPORTED ON: {new Date(report.timestamp).toLocaleString()} • STATUS: <span className={report.status === 'resolved' ? 'text-emerald-500' : 'text-amber-500'}>{report.status.toUpperCase()}</span>
                            </div>
                            {report.resolution && (
                              <div className="text-emerald-400 font-mono text-[10px] uppercase tracking-widest mt-1 border-l-2 border-emerald-500 pl-2">
                                ACTION: {report.resolution}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {report.status === 'pending' && (
                          <div className="flex gap-2 pt-2 border-t border-zinc-800/50">
                            <button
                              onClick={() => {
                                setReports(prev => prev.map(r => r.id === report.id ? { ...r, status: 'resolved', resolution: 'Warning Issued' } : r));
                                triggerNotification?.(`Warning sent to ${report.reportedProfileName} and the reporting party.`);
                              }}
                              className="flex-1 py-2 bg-zinc-800 hover:bg-amber-900/30 text-amber-500 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-colors border border-transparent hover:border-amber-500/30"
                            >
                              Warning
                            </button>
                            <button
                              onClick={() => {
                                setReports(prev => prev.map(r => r.id === report.id ? { ...r, status: 'resolved', resolution: '14 Day Ban' } : r));
                                triggerNotification?.(`14 Day Ban applied to ${report.reportedProfileName}. Notifications sent.`);
                              }}
                              className="flex-1 py-2 bg-zinc-800 hover:bg-orange-900/30 text-orange-500 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-colors border border-transparent hover:border-orange-500/30"
                            >
                              14 Day Ban
                            </button>
                            <button
                              onClick={() => {
                                setReports(prev => prev.map(r => r.id === report.id ? { ...r, status: 'resolved', resolution: '30 Day Ban' } : r));
                                triggerNotification?.(`30 Day Ban applied to ${report.reportedProfileName}. Notifications sent.`);
                              }}
                              className="flex-1 py-2 bg-zinc-800 hover:bg-rose-900/30 text-rose-400 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-colors border border-transparent hover:border-rose-500/30"
                            >
                              30 Day Ban
                            </button>
                            <button
                              onClick={() => {
                                setReports(prev => prev.map(r => r.id === report.id ? { ...r, status: 'resolved', resolution: 'Permanent Ban' } : r));
                                triggerNotification?.(`Permanent Ban applied to ${report.reportedProfileName}. Notifications sent.`);
                              }}
                              className="flex-1 py-2 bg-zinc-800 hover:bg-red-900/50 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-lg transition-colors border border-transparent hover:border-red-500/50"
                            >
                              Permaban
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
