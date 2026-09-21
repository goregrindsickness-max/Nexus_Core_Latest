import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Users, UserPlus, ShieldAlert, RefreshCw, X, Check, Mail, AlertTriangle, 
  Radio, Activity, Clock, Sparkles, UserCheck, Shield, ChevronDown, ChevronRight
} from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  isYou?: boolean;
  avatar_url?: string;
  // mapped properties for display
  avatar?: string;
  status?: string;
  lastActive?: string;
}

interface PendingInvite {
  id: string;
  email: string;
  role: string;
  status: string;
  code: string;
  sentAt: string;
}

interface LiveEmailLog {
  id: string;
  timestamp: string;
  endpoint: string;
  to: string;
  from: string;
  subject: string;
  status: 'SUCCESS' | 'FAILED' | 'SIMULATED';
  details?: any;
}

interface LiveTeamActivityWorkspaceProps {
  userProfile: any;
  activeBand: any;
  triggerNotification: (msg: string) => void;
  addLog: (msg: string) => void;
  teamActivities: any[];
  isOpen: boolean;
  onClose: () => void;
}

export default function LiveTeamActivityWorkspace({
  userProfile,
  activeBand,
  triggerNotification,
  addLog,
  teamActivities,
  isOpen,
  onClose
}: LiveTeamActivityWorkspaceProps) {
  const bandId = activeBand?.id || '';

  // State
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Tour Manager (Full Edit)');

  // Simulation Email Sandbox overlay state
  const [isSandboxModalOpen, setIsSandboxModalOpen] = useState(false);
  const [selectedInviteForSandbox, setSelectedInviteForSandbox] = useState<PendingInvite | null>(null);
  const [sandboxNameInput, setSandboxNameInput] = useState('');
  const [sandboxProfilePic, setSandboxProfilePic] = useState('');
  const sandboxAvatarInputRef = useRef<HTMLInputElement | null>(null);

  // Resend Email Diagnostics States
  const [liveEmailLogs, setLiveEmailLogs] = useState<LiveEmailLog[]>([]);
  const [diagnosticRecipient, setDiagnosticRecipient] = useState(userProfile?.email || 'admin@nexus.com');
  const [diagnosticSender, setDiagnosticSender] = useState('invites@thenexuscoreapp.com');
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [diagnosticStatus, setDiagnosticStatus] = useState<'idle' | 'running' | 'success' | 'failed'>('idle');
  const [diagnosticResult, setDiagnosticResult] = useState<any>(null);
  const [diagnosticKeyInfo, setDiagnosticKeyInfo] = useState<{
    resend_enabled?: boolean;
    apiKeyPresent?: boolean;
    apiKeyMasked?: string;
    apiKeyLength?: number;
  } | null>(null);

  // Sync state from LocalStorage on mount/activeBand change
  useEffect(() => {
    // First, seed our local team list
    let localTeam: TeamMember[] = [];
    const savedTeam = localStorage.getItem(`nexus_core_team_members_${bandId}`);
    if (savedTeam) {
      try {
        localTeam = JSON.parse(savedTeam);
      } catch (e) {
        localTeam = [
          { id: 'm1', name: 'You (' + userProfile?.name + ')', email: userProfile?.email, role: userProfile?.role || 'Roster Owner (Admin)', isYou: true }
        ];
      }
    } else {
      localTeam = [
        { id: 'm1', name: 'You (' + userProfile?.name + ')', email: userProfile?.email, role: userProfile?.role || 'Roster Owner (Admin)', isYou: true }
      ];
    }
    setTeamMembers(localTeam);

    // Seed local pending invites list
    let localInvites: PendingInvite[] = [];
    const savedInvites = localStorage.getItem(`nexus_core_pending_invites_${bandId}`);
    if (savedInvites) {
      try {
        localInvites = JSON.parse(savedInvites);
      } catch (e) {
        localInvites = [];
      }
    } else {
      localInvites = [
        {
          id: 'inv_demo99',
          email: 'live_coordinator@tourdeck.io',
          role: 'Merch Manager (Sales Only)',
          status: 'pending',
          code: 'nc_demo123',
          sentAt: new Date(Date.now() - 3600000).toISOString()
        }
      ];
    }
    setPendingInvites(localInvites);

    fetchEmailDiagnostics();
  }, [bandId, userProfile]);

  // Persist edits back to local storage
  useEffect(() => {
    if (teamMembers.length > 0) {
      try {
        localStorage.setItem(`nexus_core_team_members_${bandId}`, JSON.stringify(teamMembers));
      } catch (e) {
        console.error('Failed to save team members to localStorage:', e);
      }
    }
  }, [teamMembers, bandId]);

  useEffect(() => {
    try {
      localStorage.setItem(`nexus_core_pending_invites_${bandId}`, JSON.stringify(pendingInvites));
    } catch (e) {
      console.error('Failed to save pending invites to localStorage:', e);
    }
  }, [pendingInvites, bandId]);

  const fetchEmailLogs = async () => {
    try {
      const res = await fetch('/api/emails/dispatch-logs');
      if (res.ok) {
        const data = await res.json();
        setLiveEmailLogs(data.logs || []);
      }
    } catch (err) {
      console.warn('[EMAIL DIAGNOSTICS] Failed to fetch live email logs:', err);
    }
  };

  const fetchEmailDiagnostics = async () => {
    try {
      const res = await fetch('/api/emails/test-connectivity');
      if (res.ok) {
        const data = await res.json();
        setDiagnosticKeyInfo(data);
      } else {
        setDiagnosticKeyInfo({
          resend_enabled: false,
          apiKeyPresent: false,
          apiKeyMasked: 'Not configured',
          apiKeyLength: 0,
        });
      }
      await fetchEmailLogs();
    } catch (err) {
      console.warn('[EMAIL DIAGNOSTICS] Diagnostic endpoint notice (offline or server starting):', err);
      setDiagnosticKeyInfo({
        resend_enabled: false,
        apiKeyPresent: false,
        apiKeyMasked: 'Not configured',
        apiKeyLength: 0,
      });
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) {
      triggerNotification("Please insert a valid email address.");
      return;
    }

    const seatLimit = 10;
    if (teamMembers.length + pendingInvites.length >= seatLimit) {
      triggerNotification(`Roster seat limit reached (${teamMembers.length + pendingInvites.length}/${seatLimit} seats occupied). Upgrade to Enterprise to add more members.`);
      return;
    }

    if ((teamMembers || []).some(m => m.email.toLowerCase() === inviteEmail.toLowerCase().trim())) {
      triggerNotification(`${inviteEmail} is already active on this team.`);
      return;
    }
    if ((pendingInvites || []).some(i => i.email.toLowerCase() === inviteEmail.toLowerCase().trim())) {
      triggerNotification(`An invitation has already been dispatched to ${inviteEmail}.`);
      return;
    }

    try {
      const response = await fetch('/api/emails/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          role: inviteRole,
          inviterEmail: userProfile?.email || 'A team manager',
          bandName: activeBand?.name || 'A team',
          bandId: bandId
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || result.error || 'Failed to send invite');
      }

      const newInvite: PendingInvite = {
        id: 'inv_' + Math.random().toString(36).substring(2, 9),
        email: inviteEmail.trim(),
        role: inviteRole,
        status: 'pending',
        code: 'nc_' + Math.random().toString(36).substring(2, 10),
        sentAt: new Date().toISOString()
      };

      setPendingInvites(prev => [...prev, newInvite]);
      setInviteEmail('');
      
      if (result.simulated) {
        triggerNotification(`Invitation simulation successful (No Resend Key). Logged locally!`);
      } else {
        triggerNotification(`Active invitation email sent to ${inviteEmail}!`);
      }
      
      addLog(`Sent tour invitation to ${inviteEmail} as role: ${inviteRole}`);
      fetchEmailLogs();
    } catch (e: any) {
      console.error(e);
      triggerNotification(`Error: ${e.message}`);
      fetchEmailLogs();
    }
  };

  const handleSimulateAcceptInvite = () => {
    if (!selectedInviteForSandbox) return;
    const name = sandboxNameInput.trim() || selectedInviteForSandbox.email.split('@')[0];
    
    const newMember: TeamMember = {
      id: 'm_' + Math.random().toString(36).substring(2, 9),
      name: name,
      email: selectedInviteForSandbox.email,
      role: selectedInviteForSandbox.role,
      avatar_url: sandboxProfilePic || undefined
    };

    setTeamMembers(prev => [...prev, newMember]);
    setPendingInvites(prev => prev.filter(i => i.id !== selectedInviteForSandbox.id));
    setIsSandboxModalOpen(false);
    setSelectedInviteForSandbox(null);
    triggerNotification(`🎉 Simulated Invitation Accepted! ${name} is now on the operational crew.`);
    addLog(`Simulated roster acceptance: ${name} (${selectedInviteForSandbox.email}) successfully added to active operators.`);
  };

  const handleSendDiagnosticTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!diagnosticRecipient) {
      triggerNotification("Provide a test recipient email.");
      return;
    }
    setIsDiagnosing(true);
    setDiagnosticStatus('running');
    setDiagnosticResult(null);

    try {
      const response = await fetch('/api/emails/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toEmail: diagnosticRecipient.trim(),
          fromEmail: diagnosticSender.trim()
        })
      });

      const data = await response.json();
      setDiagnosticResult(data);

      if (response.ok && data.success) {
        setDiagnosticStatus('success');
        triggerNotification("Diagnostic email sent successfully!");
        addLog(`Sent diagnostic test email to ${diagnosticRecipient}`);
      } else {
        setDiagnosticStatus('failed');
        triggerNotification(`Diagnostic send failed!`);
      }
      
      fetchEmailDiagnostics();
    } catch (err: any) {
      setDiagnosticStatus('failed');
      setDiagnosticResult({ error: err.message || 'Network error occurred during test' });
      triggerNotification(`Diagnostic send failed: ${err.message}`);
    } finally {
      setIsDiagnosing(false);
    }
  };

  // Format active team members for rendering in lists
  const displayTeamMembers = useMemo(() => {
    return teamMembers.map((m, idx) => {
      let avatar = m.avatar_url || (m.isYou ? userProfile?.avatar_url : undefined);
      if (!avatar) {
        const avatars = [
          'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=120',
          'https://images.unsplash.com/photo-1484876065684-b683cf17d276?auto=format&fit=crop&q=80&w=120',
          'https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?auto=format&fit=crop&q=80&w=120',
          'https://images.unsplash.com/photo-1525201548942-d8c8b097a3c3?auto=format&fit=crop&q=80&w=120',
        ];
        avatar = avatars[idx % avatars.length];
      }
      return {
        ...m,
        avatar,
        status: idx === 0 || idx % 2 === 0 ? 'active' : 'idle',
        lastActive: idx === 0 ? 'Active now' : `Active ${idx * 4}m ago`
      };
    });
  }, [teamMembers, userProfile]);

  if (!isOpen) return null;

  return (
    <div id="live-team-activity-workspace-fullscreen" className="fixed inset-0 w-screen h-screen z-[100] bg-[#07080d] flex flex-col overflow-hidden text-zinc-100">
      {/* 1. Header Bar */}
      <header className="h-16 border-b border-zinc-850/80 bg-[#0c0e14] px-6 flex items-center justify-between shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 border border-indigo-500/25 rounded-xl flex items-center justify-center animate-pulse">
            <Radio className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="text-left">
            <h1 className="text-xs font-mono font-bold tracking-widest text-zinc-200 uppercase flex items-center gap-2">
              LIVE CREW HUB & CO-OPS SYSTEM
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
            </h1>
            <p className="text-[10px] text-zinc-400 font-sans mt-0.5 uppercase tracking-wider font-semibold">
              Artist context: <span className="text-[#00ffcc]">{activeBand?.name || 'Virulent'}</span> • Active Operations Console
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-1.5 bg-zinc-950/80 border border-zinc-850/60 px-3 py-1.5 rounded-lg text-[9px] font-mono">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-zinc-500 uppercase tracking-widest mr-1">Session:</span>
            <span className="text-[#00ffcc] font-bold">LIVE ONLINE</span>
          </div>
          
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-rose-950/30 hover:bg-rose-900/40 border border-rose-500/20 hover:border-rose-500/50 text-rose-300 hover:text-white rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" /> Exit Console
          </button>
        </div>
      </header>

      {/* 2. Main Body (Split View, exactly fits remaining height, no page overflow) */}
      <main className="flex-grow h-[calc(100vh-64px)] overflow-hidden grid grid-cols-1 lg:grid-cols-12 p-6 gap-6 bg-[#07080d] relative">
        
        {/* Left Side: Live Activity & Feed (5 cols on Desktop) */}
        <section className="lg:col-span-5 flex flex-col h-full gap-5 overflow-hidden">
          
          {/* Active Crew Tracker Panel */}
          <div className="flex-1 bg-[#0d0f16] border border-zinc-850 rounded-2xl p-4 flex flex-col overflow-hidden shadow-lg">
            <div className="flex justify-between items-center border-b border-zinc-900/80 pb-2.5 mb-3.5">
              <h2 className="text-[11px] font-mono uppercase text-zinc-300 tracking-wider flex items-center gap-2 font-bold">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                ACTIVE CREW LIST ({displayTeamMembers.length})
              </h2>
              <span className="text-[8.5px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded uppercase font-black tracking-wider animate-pulse">
                REALTIME
              </span>
            </div>

            {/* Scrollable list inside wrapper */}
            <div className="flex-grow overflow-y-auto pr-1 space-y-2.5 scrollbar-thin scrollbar-thumb-zinc-800">
              {displayTeamMembers.map((member, idx) => (
                <div key={`${member.id}-${idx}`} className="flex items-center justify-between p-3 bg-zinc-900/25 hover:bg-zinc-900/60 rounded-xl border border-zinc-850/40 hover:border-zinc-800 transition-all w-full group">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <div className="w-9 h-9 rounded-full overflow-hidden bg-zinc-850 border border-zinc-700 group-hover:border-[#00ffcc] transition-colors shadow">
                        <img 
                          src={member.avatar} 
                          alt={member?.name} 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      {member.status === 'active' ? (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0d0f16] animate-pulse" />
                      ) : (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-zinc-600 ring-2 ring-[#0d0f16]" />
                      )}
                    </div>
                    <div className="flex flex-col min-w-0 text-left">
                      <span className="text-xs text-zinc-200 font-bold font-sans truncate leading-snug group-hover:text-[#00ffcc] transition-all">
                        {member?.name}
                      </span>
                      <span className="text-[8.5px] text-zinc-450 font-mono uppercase tracking-wider leading-none mt-0.5">
                        {member.role}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end shrink-0 gap-1">
                    <span className={`text-[8px] font-mono px-2 py-0.5 rounded uppercase font-bold tracking-widest ${
                      member.status === 'active' ? 'text-emerald-400 bg-emerald-950/20' : 'text-zinc-500 bg-zinc-950/40'
                    }`}>
                      {member.status}
                    </span>
                    <span className="text-[8px] font-mono text-zinc-550">{member.lastActive}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Crew Actions Live Feed Panel */}
          <div className="flex-1 bg-[#0d0f16] border border-zinc-850 rounded-2xl p-4 flex flex-col overflow-hidden shadow-lg">
            <div className="flex justify-between items-center border-b border-zinc-900/80 pb-2.5 mb-3.5">
              <h2 className="text-[11px] font-mono uppercase text-zinc-300 tracking-wider flex items-center gap-2 font-bold">
                <Activity className="w-3.5 h-3.5 text-indigo-400" />
                CREW ACTIONS LOGS & TELEMETRY
              </h2>
              <span className="text-[8.5px] font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded uppercase font-bold tracking-wider">
                CO-OPS FEED
              </span>
            </div>

            {/* Scrollable feed list inside wrapper */}
            <div className="flex-grow overflow-y-auto pr-1 space-y-2 scrollbar-thin scrollbar-thumb-zinc-800">
              {teamActivities.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-650 font-mono text-[10px]">
                  <span>NO CONCURRENT CO-OP ACTIONS RECORDED</span>
                </div>
              ) : (
                teamActivities.map((act, idx) => (
                  <div key={`${act.id}-${idx}`} className="text-[10px] bg-zinc-900/15 p-2.5 rounded-lg border border-zinc-850/30 leading-normal hover:border-zinc-800 transition-colors">
                    <div className="flex justify-between items-center text-[8px] text-zinc-500 font-mono mb-1">
                      <span className="font-extrabold text-zinc-300 uppercase">{act.user}</span>
                      <span>{act.time}</span>
                    </div>
                    <p className="text-zinc-400 font-sans text-[9px] text-left">
                      {act.text}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Right Side: Roster Administration & Diagnostics (7 cols on Desktop) */}
        <section className="lg:col-span-7 flex flex-col h-full bg-[#0d0f16] border border-zinc-850 rounded-2xl overflow-hidden shadow-2xl">
          
          {/* Admin Header */}
          <div className="px-5 py-4 border-b border-zinc-900/90 bg-[#11131c] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400 animate-pulse" />
              <h2 className="text-xs font-mono font-bold tracking-widest text-zinc-100 uppercase">
                CO-OP ADMINISTRATION & TEAM ROSTER
              </h2>
            </div>
            <span className="text-[9px] font-mono font-bold text-zinc-400">
              Seat Occupancy: <span className="text-[#00ffcc]">{teamMembers.length + pendingInvites.length}/10</span>
            </span>
          </div>

          {/* Scrollable Content Pane */}
          <div className="flex-grow overflow-y-auto p-5 space-y-6 scrollbar-thin scrollbar-thumb-zinc-800">
            
            {/* 1. DISPATCH OUTBOUND SEAT INVITATION FORM */}
            <div className="bg-zinc-950/45 border border-zinc-850/60 p-4.5 rounded-xl space-y-4 shadow-inner text-left">
              <h3 className="text-[10px] font-mono text-zinc-300 uppercase tracking-wider flex items-center gap-1.5 font-bold">
                <UserPlus className="w-4 h-4 text-purple-400" /> DISPATCH SECURE SEAT INVITATION
              </h3>
              
              <form onSubmit={handleSendInvite} className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                <div className="md:col-span-2 space-y-1">
                  <label className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest font-bold">Recipient Email Address</label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    placeholder="e.g. tour_ops@domain.com"
                    className="w-full bg-[#11131a] border border-zinc-800 text-white rounded-lg px-3 py-2 font-mono text-xs focus:outline-none focus:border-[#a855f7] placeholder-zinc-700 transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest font-bold">Assigned Security Role</label>
                  <div className="relative">
                    <select
                      value={inviteRole}
                      onChange={e => setInviteRole(e.target.value)}
                      className="w-full bg-[#11131a] border border-zinc-800 text-white rounded-lg px-2.5 py-2 font-mono text-xs focus:outline-none focus:border-[#a855f7] appearance-none cursor-pointer"
                    >
                      <option value="Tour Manager (Full Edit)">Tour Manager (Full Edit)</option>
                      <option value="Merch Manager (Sales Only)">Merch Manager (Sales Only)</option>
                      <option value="Band Member (View Only)">Band Member (View Only)</option>
                    </select>
                  </div>
                </div>

                <div className="md:col-span-3 mt-1">
                  <button
                    type="submit"
                    className="w-full bg-[#a855f7] hover:bg-[#b06cf7] text-white py-2.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md hover:shadow-purple-500/10 flex items-center justify-center gap-1.5"
                  >
                    🚀 Dispatch Secure Invite Link
                  </button>
                </div>
              </form>
            </div>

            {/* 2. PENDING OUTBOUND INVITATIONS */}
            {pendingInvites.length > 0 && (
              <div className="space-y-3 text-left">
                <h3 className="text-[10px] font-mono text-amber-400 uppercase tracking-wider font-bold">PENDING OUTBOUND SEAT INVITATIONS</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {pendingInvites.map((invite, idx) => (
                    <div key={`${invite.id}-${idx}`} className="bg-zinc-950/25 border border-zinc-850 p-3.5 rounded-xl flex items-center justify-between shadow-sm hover:border-amber-500/20 transition-all group">
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-zinc-200 group-hover:text-amber-300 transition-colors block truncate">{invite.email}</span>
                        <span className="block text-[8.5px] font-mono text-purple-400 font-bold mt-0.5">{invite.role}</span>
                        <div className="flex items-center gap-2.5 mt-1.5">
                          <span className="text-[7.5px] font-mono bg-amber-500/10 border border-amber-500/20 text-amber-400 px-1.5 py-0.2 rounded font-black tracking-wider animate-pulse">PENDING</span>
                          <span className="text-[7.5px] font-mono text-zinc-500">Code: {invite.code}</span>
                        </div>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedInviteForSandbox(invite);
                          setSandboxNameInput('');
                          setSandboxProfilePic('');
                          setIsSandboxModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 hover:scale-105 active:scale-95 text-black rounded-lg text-[9px] font-mono uppercase font-black tracking-wider transition-all cursor-pointer shadow shrink-0"
                      >
                        Simulate Accept
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. RESEND EMAIL GATEWAY DIAGNOSTICS */}
            <div className="border-t border-zinc-900 pt-5 space-y-4 text-left">
              <div className="flex items-center justify-between border-b border-zinc-900 pb-2 mb-1">
                <h3 className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 font-bold">
                  <ShieldAlert className="w-4 h-4 text-emerald-400" /> RESEND EMAIL GATEWAY DIAGNOSTICS
                </h3>
                <button 
                  type="button"
                  onClick={fetchEmailDiagnostics}
                  className="p-1 bg-zinc-950 border border-zinc-850 hover:border-zinc-800 text-zinc-400 hover:text-white rounded-lg text-[8px] font-mono uppercase tracking-widest px-2.5 py-1 flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <RefreshCw className="w-3 h-3" /> Refresh API Status
                </button>
              </div>

              {diagnosticKeyInfo && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
                  <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-900">
                    <span className="block text-[7.5px] font-mono text-zinc-500 uppercase tracking-widest">Gateway Provider</span>
                    <span className="text-[9.5px] font-mono font-black text-white">RESEND</span>
                  </div>
                  <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-900">
                    <span className="block text-[7.5px] font-mono text-zinc-500 uppercase tracking-widest">Gateway Status</span>
                    <span className={`text-[9.5px] font-mono font-black ${diagnosticKeyInfo.resend_enabled ? 'text-emerald-400' : 'text-zinc-500'}`}>
                      {diagnosticKeyInfo.resend_enabled ? 'ACTIVE API' : 'SIMULATED'}
                    </span>
                  </div>
                  <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-900 col-span-2">
                    <span className="block text-[7.5px] font-mono text-zinc-500 uppercase tracking-widest">API Configuration Token</span>
                    <span className="text-[9px] font-mono font-bold text-zinc-400 truncate block mt-0.5">
                      {diagnosticKeyInfo.apiKeyPresent ? `Loaded (${diagnosticKeyInfo.apiKeyMasked})` : 'Simulated Gateway / Missing env key'}
                    </span>
                  </div>
                </div>
              )}

              {/* Diagnostic Test form block */}
              <div className="bg-zinc-950/20 border border-zinc-850 rounded-xl p-4 space-y-4">
                <h4 className="text-[9px] font-mono font-black text-zinc-400 uppercase tracking-wider">Trigger Handshake Sandbox Mail</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                  <div className="space-y-1">
                    <label className="text-[8.5px] font-mono text-zinc-500 uppercase tracking-widest">Diagnostic Sender (From)</label>
                    <input
                      type="text"
                      value={diagnosticSender}
                      onChange={e => setDiagnosticSender(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-lg px-2.5 py-1.5 font-mono text-xs focus:outline-none focus:border-zinc-750"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8.5px] font-mono text-zinc-500 uppercase tracking-widest">Diagnostic Recipient (To)</label>
                    <input
                      type="email"
                      value={diagnosticRecipient}
                      onChange={e => setDiagnosticRecipient(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-lg px-2.5 py-1.5 font-mono text-xs focus:outline-none focus:border-zinc-750"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSendDiagnosticTest}
                    disabled={isDiagnosing}
                    className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-850 text-white py-1.5 rounded-lg text-[9px] font-mono uppercase font-black tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1.5 min-h-[30px] border border-emerald-500/25"
                  >
                    {isDiagnosing ? 'Sending...' : '⚡ Trigger Diagnostic'}
                  </button>
                </div>

                {diagnosticResult && (
                  <div className="bg-black/95 p-3.5 text-[9.5px] font-mono text-emerald-400 rounded-lg border border-zinc-900 shadow-inner">
                    <div className="text-[8px] text-zinc-500 uppercase tracking-widest mb-1.5 font-black flex items-center justify-between border-b border-zinc-900 pb-1">
                      <span>Latest Gateway Response:</span>
                      <span className="text-[#00ffcc] font-bold">{diagnosticStatus.toUpperCase()}</span>
                    </div>
                    <pre className="max-h-40 overflow-y-auto whitespace-pre-wrap leading-tight text-left text-xs text-emerald-300">
                      {JSON.stringify(diagnosticResult, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              {/* Telemetry dispatch logs */}
              {liveEmailLogs.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[9px] font-mono font-black text-zinc-400 uppercase tracking-wider">Live Transaction dispatch logs</h4>
                  <div className="bg-black/80 rounded-xl border border-zinc-900 overflow-hidden divide-y divide-zinc-950">
                    {liveEmailLogs.slice(0, 5).map((log, idx) => (
                      <div key={`${log.id}-${idx}`} className="p-2.5 flex items-center justify-between text-[9px] font-mono">
                        <div className="min-w-0 flex-1 text-left">
                          <div className="flex items-center gap-2">
                            <span className="text-zinc-300 truncate font-bold">{log.to}</span>
                            <span className="text-zinc-650">•</span>
                            <span className="text-zinc-500 text-[8px]">{new Date(log.timestamp).toLocaleTimeString()}</span>
                          </div>
                          <span className="text-zinc-550 text-[8.5px] block mt-0.5 truncate">{log.subject}</span>
                        </div>
                        <span className={`text-[7.5px] font-bold px-1.5 py-0.5 rounded tracking-widest ${
                          log.status === 'SUCCESS' ? 'text-emerald-400 bg-emerald-950/20' : 
                          log.status === 'SIMULATED' ? 'text-blue-400 bg-blue-950/20' : 'text-rose-400 bg-rose-950/20'
                        }`}>
                          {log.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

          </div>
        </section>
      </main>

      {/* 3. SIMULATION SANDBOX ACCEPTANCE MODAL */}
      {isSandboxModalOpen && selectedInviteForSandbox && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-[#0f1118] border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl text-left">
            <div className="px-5 py-4 border-b border-zinc-850 bg-[#141620] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-mono font-bold tracking-widest text-white uppercase">INVITATION SANDBOX ACCEPTANCE</h3>
              </div>
              <button 
                type="button" 
                onClick={() => {
                  setIsSandboxModalOpen(false);
                  setSelectedInviteForSandbox(null);
                }} 
                className="text-zinc-500 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 text-[9.5px] leading-relaxed text-amber-300 font-sans">
                You are simulating an inbound candidate accepting an invitation. Provide sandbox identity values to attach to the new operational team roster seat.
              </div>

              <div className="bg-zinc-950/40 p-3 rounded-lg border border-zinc-900 text-xs font-mono">
                <div className="text-zinc-500 text-[8.5px] uppercase tracking-widest">Inbound Seat Target:</div>
                <div className="text-zinc-200 font-bold mt-0.5 truncate">{selectedInviteForSandbox.email}</div>
                <div className="text-[9.5px] font-bold text-purple-400 mt-1 uppercase">{selectedInviteForSandbox.role}</div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest font-bold">Candidate Display Name</label>
                <input
                  type="text"
                  value={sandboxNameInput}
                  onChange={e => setSandboxNameInput(e.target.value)}
                  placeholder="e.g. Sarah Connor"
                  className="w-full bg-[#11131a] border border-zinc-800 text-white rounded-lg px-3 py-2 font-mono text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest font-bold">Candidate Profile Pic (URL)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={sandboxProfilePic}
                    onChange={e => setSandboxProfilePic(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="flex-grow bg-[#11131a] border border-zinc-800 text-white rounded-lg px-3 py-2 font-mono text-xs focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const presets = [
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120',
                        'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=120',
                        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120',
                        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120',
                      ];
                      const rand = presets[Math.floor(Math.random() * presets.length)];
                      setSandboxProfilePic(rand);
                    }}
                    className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-[9px] font-mono uppercase font-bold transition-colors cursor-pointer"
                  >
                    Random
                  </button>
                </div>
              </div>
            </div>

            <div className="px-5 py-4 bg-[#141620] border-t border-zinc-850 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsSandboxModalOpen(false);
                  setSelectedInviteForSandbox(null);
                }}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-[10px] font-mono uppercase font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSimulateAcceptInvite}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-mono uppercase font-bold transition-all cursor-pointer flex items-center gap-1 shadow-md hover:shadow-emerald-500/10"
              >
                <UserCheck className="w-4 h-4" /> Finalize Acceptance
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
