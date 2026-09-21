import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, ChevronLeft, Download, Trash2, Plus, Clock, Eye, Mail, 
  Settings, ChevronDown, ChevronUp, Upload, X, Check, 
  Coins, BarChart2, FileText, Package, Landmark, RefreshCw,
  FileSpreadsheet, Sparkles, Sliders, Palette, Calendar, Trash
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Sale, Show, InventoryItem } from '../../../types';

interface ScheduledExport {
  id: string;
  name: string;
  frequency: string;
  nextRun: string;
  recipients: number;
}

interface RecentExport {
  id: string;
  filename: string;
  date: string;
  size: string;
  format: 'PDF' | 'CSV' | 'Excel' | 'JSON';
}

interface ExportReportsSetupProps {
  sales: Sale[];
  shows: Show[];
  inventory: InventoryItem[];
  onBack: () => void;
  triggerNotification: (msg: string) => void;
  addLog: (msg: string) => void;
  bandName: string;
}

export default function ExportReportsSetup({
  sales = [],
  shows = [],
  inventory = [],
  onBack,
  triggerNotification,
  addLog,
  bandName
}: ExportReportsSetupProps) {
  // Current interactive configurations
  const [reportType, setReportType] = useState<'full_tour' | 'single_show' | 'inventory' | 'financial' | 'tax' | 'reconciliation'>('full_tour');
  const [exportFormat, setExportFormat] = useState<'PDF' | 'CSV' | 'Excel' | 'JSON'>('PDF');
  
  // Custom Fields checklist configuration state
  const [customFields, setCustomFields] = useState({
    dateTime: true,
    venueName: true,
    teamMember: false,
    notes: false,
    // Financials
    totalRevenue: true,
    paymentMethod: true,
    avgTransaction: false,
    profitMargin: false,
    // Sales
    itemsSold: true,
    customerCount: false,
    topProducts: false,
    // Inventory
    inventoryChanges: false
  });

  // Calculate selected count
  const selectedFieldsCount = useMemo(() => {
    return Object.values(customFields).filter(Boolean).length;
  }, [customFields]);

  // Advanced Options state
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeAnalytics, setIncludeAnalytics] = useState(true);
  const [whiteLabel, setWhiteLabel] = useState(false);
  const [currency, setCurrency] = useState('USD ($)');
  const [groupBy, setGroupBy] = useState('No Grouping');

  // PDF Customization state
  const [logoOption, setLogoOption] = useState<'upload' | 'crest' | 'grid' | 'neon' | 'none'>('crest');
  const [primaryColor, setPrimaryColor] = useState('#25f4d1');
  const [footerText, setFooterText] = useState('Confidential - For Internal Use Only');

  // Collapsible accordion panels states
  const [collapsed, setCollapsed] = useState({
    basic: false,
    customFields: false,
    advanced: false,
    pdf: false,
    scheduled: false,
    recent: false
  });

  // Stateful Scheduled Exports list
  const [schedules, setSchedules] = useState<ScheduledExport[]>([
    { id: 'sch-1', name: 'Weekly Sales Summary', frequency: 'Every Monday at 9:00 AM', nextRun: 'Mar 24, 2026', recipients: 2 },
    { id: 'sch-2', name: 'Monthly Financial Report', frequency: '1st of every month', nextRun: 'Apr 1, 2026', recipients: 1 },
  ]);

  // Stateful Recent Exports history tracker
  const [recentExports, setRecentExports] = useState<RecentExport[]>([]);

  // Modals / Overlays triggers
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isEmailOpen, setIsEmailOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);

  // Email state variables
  const [recipientEmail, setRecipientEmail] = useState('');
  const [emailSubject, setEmailSubject] = useState(`${bandName} Custom Tour Report`);

  // New Schedule Form state
  const [newScheduleName, setNewScheduleName] = useState('');
  const [newScheduleFrequency, setNewScheduleFrequency] = useState('Every Monday at 9:00 AM');
  const [newScheduleRecipients, setNewScheduleRecipients] = useState('1');

  // Interactive "Exporting loading workflow" simulation
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  // Template Quick Buttons helper
  const applyTemplate = (templateType: 'accountant' | 'manager' | 'tax' | 'inventory') => {
    if (templateType === 'accountant') {
      setReportType('financial');
      setExportFormat('Excel');
      setCustomFields({
        dateTime: true,
        venueName: true,
        teamMember: false,
        notes: true,
        totalRevenue: true,
        paymentMethod: true,
        avgTransaction: true,
        profitMargin: true,
        itemsSold: true,
        customerCount: true,
        topProducts: false,
        inventoryChanges: false
      });
      setIncludeCharts(false);
      setIncludeAnalytics(true);
      setPrimaryColor('#4ade80');
      triggerNotification('Applied: Accountant Report template selected!');
    } else if (templateType === 'manager') {
      setReportType('full_tour');
      setExportFormat('PDF');
      setCustomFields({
        dateTime: true,
        venueName: true,
        teamMember: true,
        notes: true,
        totalRevenue: true,
        paymentMethod: true,
        avgTransaction: true,
        profitMargin: true,
        itemsSold: true,
        customerCount: true,
        topProducts: true,
        inventoryChanges: true
      });
      setIncludeCharts(true);
      setIncludeAnalytics(true);
      setPrimaryColor('#25f4d1');
      triggerNotification('Applied: Manager Summary template (Include all insights)');
    } else if (templateType === 'tax') {
      setReportType('tax');
      setExportFormat('PDF');
      setCustomFields({
        dateTime: true,
        venueName: false,
        teamMember: false,
        notes: true,
        totalRevenue: true,
        paymentMethod: true,
        avgTransaction: false,
        profitMargin: true,
        itemsSold: false,
        customerCount: false,
        topProducts: false,
        inventoryChanges: false
      });
      setIncludeCharts(false);
      setIncludeAnalytics(false);
      setPrimaryColor('#ef4444');
      triggerNotification('Applied: Tax Compliance Checklist Template');
    } else if (templateType === 'inventory') {
      setReportType('inventory');
      setExportFormat('CSV');
      setCustomFields({
        dateTime: true,
        venueName: true,
        teamMember: true,
        notes: false,
        totalRevenue: false,
        paymentMethod: false,
        avgTransaction: false,
        profitMargin: false,
        itemsSold: true,
        customerCount: false,
        topProducts: true,
        inventoryChanges: true
      });
      setIncludeCharts(true);
      setIncludeAnalytics(true);
      setPrimaryColor('#fb923c');
      triggerNotification('Applied: Stock Audit Ledger Checklist Template');
    }
  };

  const handleExportSubmit = () => {
    setIsExporting(true);
    setExportProgress(0);
    triggerNotification('Initiated secure file compilation...');

    const interval = setInterval(() => {
      setExportProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsExporting(false);
            triggerDownloadPayload();
          }, 300);
          return 100;
        }
        return prev + 10;
      });
    }, 150);
  };

  const triggerDownloadPayload = () => {
    // Compile actual active configuration data into a nice download
    const filename = `${bandName.toUpperCase().replace(/\s+/g, '_')}_REPORT_${new Date().toISOString().split('T')[0]}.${exportFormat.toLowerCase()}`;
    
    // Check if we are downloading JSON, CSV, Excel text mockup, or simulating doc
    let blobContent = '';
    let mimeType = 'text/plain';

    if (exportFormat === 'JSON') {
      mimeType = 'application/json';
      const payload = {
        bandName,
        exportDate: new Date().toISOString(),
        reportType,
        configuredCurrency: currency,
        footerText,
        selectedFields: Object.entries(customFields).filter(([_, val]) => val).map(([key]) => key),
        metricsSnapshot: {
          totalSalesRecorded: sales.length,
          totalRevenue: sales.reduce((sum, s) => sum + (s.amount * (s.quantity || 1)), 0),
          totalShows: shows.length,
          totalInventoryQuantity: inventory.reduce((sum, i) => sum + (i.table_stock + i.van_stock), 0),
        }
      };
      blobContent = JSON.stringify(payload, null, 2);
    } else {
      // CSV & spreadsheet representation
      mimeType = 'text/csv';
      const headers = ['Report Category', 'Field Header', 'Calculated Value', 'Detail Notes'];
      const rows = [
        ['METADATA', 'Report Type', reportType.toUpperCase(), `Generated for ${bandName}`],
        ['METADATA', 'File Format', exportFormat, 'Verified output compile'],
        ['METADATA', 'Footer Notice', footerText, 'License security level'],
        ['METADATA', 'Logo Motif', logoOption.toUpperCase(), `Primary Hue Used: ${primaryColor}`],
      ];

      if (customFields.totalRevenue) {
        const rev = sales.reduce((sum, s) => sum + (s.amount * (s.quantity || 1)), 0);
        rows.push(['FINANCIALS', 'Total Combined Turnover', `$${rev.toFixed(2)}`, 'All recorded shows aggregate']);
      }
      if (customFields.itemsSold) {
        const sold = sales.reduce((sum, s) => sum + (s.quantity || 1), 0);
        rows.push(['VOLUME', 'Items Sold Count', sold.toString(), 'Physical merch products']);
      }
      if (customFields.venueName) {
        const cities = shows.map(s => s.city || s.name).join(' | ');
        rows.push(['MAP', 'Tour Stops List', cities, `${shows.length} official coordinates`]);
      }

      blobContent = [headers.join(','), ...rows.map(r => r.map(x => `"${x.replace(/"/g, '""')}"`).join(','))].join('\n');
    }

    try {
      const blob = new Blob([blobContent], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      // safe fallback
    }

    // Add to stateful history list!
    const sizeMap = { PDF: '1.2 MB', CSV: '42 KB', Excel: '118 KB', JSON: '14 KB' };
    const newExport: RecentExport = {
      id: `exp-${Date.now()}`,
      filename,
      date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      size: sizeMap[exportFormat],
      format: exportFormat
    };

    setRecentExports(prev => [newExport, ...prev]);
    addLog(`Exported full compiled report file: ${filename} as ${exportFormat}`);
    triggerNotification(`Success! ${exportFormat} compiled and downloaded.`);
  };

  // Scheduled exporter handle
  const handleAddScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newScheduleName.trim()) {
      triggerNotification('Please provide a schedule report name');
      return;
    }

    const nSch: ScheduledExport = {
      id: `sch-${Date.now()}`,
      name: newScheduleName.trim(),
      frequency: newScheduleFrequency,
      nextRun: 'Next execution scheduled in 7 days',
      recipients: parseInt(newScheduleRecipients) || 1
    };

    setSchedules(prev => [...prev, nSch]);
    addLog(`Created new automated scheduled task queue sequence: ${nSch.name}`);
    triggerNotification(`Created automated task for ${nSch.name}`);
    setNewScheduleName('');
    setIsScheduleOpen(false);
  };

  const handleDeleteSchedule = (id: string, name: string) => {
    setSchedules(prev => prev.filter(s => s.id !== id));
    addLog(`Cancelled automated reporting task queue stream: ${name}`);
    triggerNotification(`Deleted report schedule: ${name}`);
  };

  return (
    <div className="min-h-screen bg-[#0c0e12] overflow-y-auto pb-32 flex flex-col font-sans select-none text-white relative">
      
      {/* HEADER SECTION */}
      <div className="px-5 py-4 border-b border-[#1c1f26] flex items-center justify-between bg-[#080a0e] sticky top-0 z-40 pl-16 md:pl-20">
        
        <h2 className="text-sm font-bold uppercase tracking-widest font-display text-white mt-0.5">
          Export Reports
        </h2>
        
        <div className="w-10"></div> {/* Spacer balance */}
      </div>

      {/* QUICK TEMPLATES GRID */}
      <div className="p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#00ffcc]" />
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300">Quick Templates</h3>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {/* Accountant Report */}
          <button 
            onClick={() => applyTemplate('accountant')}
            className="p-3 bg-zinc-900/50 hover:bg-zinc-900/90 border border-zinc-800 hover:border-[#4ade80]/40 rounded-xl text-left transition-all duration-200 cursor-pointer flex flex-col justify-between h-[85px] active:scale-95 group focus:ring-1 focus:ring-[#4ade80]/50"
          >
            <div className="p-1.5 bg-amber-500/10 rounded-lg w-fit group-hover:bg-amber-500/20 transition-all">
              <Coins className="w-5 h-5 text-amber-400" />
            </div>
            <span className="text-[11px] font-bold text-zinc-200 tracking-tight leading-none">Accountant Report</span>
          </button>

          {/* Manager Summary */}
          <button 
            onClick={() => applyTemplate('manager')}
            className="p-3 bg-zinc-900/50 hover:bg-zinc-900/90 border border-zinc-800 hover:border-[#25f4d1]/40 rounded-xl text-left transition-all duration-200 cursor-pointer flex flex-col justify-between h-[85px] active:scale-95 group focus:ring-1 focus:ring-[#25f4d1]/50"
          >
            <div className="p-1.5 bg-[#25f4d1]/10 rounded-lg w-fit group-hover:bg-[#25f4d1]/20 transition-all">
              <BarChart2 className="w-5 h-5 text-[#25f4d1]" />
            </div>
            <span className="text-[11px] font-bold text-zinc-200 tracking-tight leading-none">Manager Summary</span>
          </button>

          {/* Tax Report */}
          <button 
            onClick={() => applyTemplate('tax')}
            className="p-3 bg-zinc-900/50 hover:bg-zinc-900/90 border border-zinc-800 hover:border-red-500/40 rounded-xl text-left transition-all duration-200 cursor-pointer flex flex-col justify-between h-[85px] active:scale-95 group focus:ring-1 focus:ring-red-500/50"
          >
            <div className="p-1.5 bg-red-500/10 rounded-lg w-fit group-hover:bg-red-500/20 transition-all">
              <FileText className="w-5 h-5 text-red-400" />
            </div>
            <span className="text-[11px] font-bold text-zinc-200 tracking-tight leading-none">Tax Report</span>
          </button>

          {/* Inventory Audit */}
          <button 
            onClick={() => applyTemplate('inventory')}
            className="p-3 bg-zinc-900/50 hover:bg-zinc-900/90 border border-zinc-800 hover:border-amber-500/40 rounded-xl text-left transition-all duration-200 cursor-pointer flex flex-col justify-between h-[85px] active:scale-95 group focus:ring-1 focus:ring-amber-500/50"
          >
            <div className="p-1.5 bg-purple-500/10 rounded-lg w-fit group-hover:bg-purple-500/20 transition-all">
              <Package className="w-5 h-5 text-purple-400" />
            </div>
            <span className="text-[11px] font-bold text-zinc-200 tracking-tight leading-none">Inventory Audit</span>
          </button>
        </div>
      </div>

      {/* RENDER CONFIGURATIONS ACCORDIONS */}
      <div className="px-5 space-y-4">

        {/* 1. BASIC CONFIGURATION */}
        <div className="bg-[#111319]/80 border border-zinc-850/70 rounded-2xl overflow-hidden shadow-lg">
          <button 
            onClick={() => setCollapsed(prev => ({ ...prev, basic: !prev.basic }))}
            className="w-full px-4 py-3.5 flex items-center justify-between bg-zinc-900/40 text-left border-b border-zinc-850 cursor-pointer"
          >
            <span className="text-xs font-bold uppercase tracking-wider text-white font-display flex items-center gap-2">
              <Settings className="w-4 h-4 text-[#00ffcc]" />
              Basic Configuration
            </span>
            {collapsed.basic ? <ChevronDown className="w-4.5 h-4.5 text-zinc-500" /> : <ChevronUp className="w-4.5 h-4.5 text-zinc-500" />}
          </button>

          <AnimatePresence initial={false}>
            {!collapsed.basic && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 space-y-4 text-left">
                  {/* Report Type selections */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono uppercase tracking-wider font-bold text-zinc-400 block">Report Type</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { id: 'full_tour', label: 'Full Tour', icon: FileText },
                        { id: 'single_show', label: 'Single Show', icon: BarChart2 },
                        { id: 'inventory', label: 'Inventory', icon: Package },
                        { id: 'financial', label: 'Financial', icon: Coins },
                        { id: 'tax', label: 'Tax Report', icon: Landmark },
                        { id: 'reconciliation', label: 'Reconciliation', icon: RefreshCw },
                      ].map((type, idx) => {
                        const IconComponent = type.icon;
                        const isSel = reportType === type.id;
                        return (
                          <button
                            key={`${type.id}-${idx}`}
                            onClick={() => setReportType(type.id as any)}
                            className={`flex items-center gap-2 px-3 py-2 border rounded-xl text-xs font-medium cursor-pointer transition-all active:scale-95 ${
                              isSel 
                                ? 'bg-zinc-900 border-[#00ffcc] text-white font-bold ring-1 ring-[#00ffcc]/35' 
                                : 'bg-transparent border-zinc-850 text-zinc-400 hover:text-white hover:bg-zinc-950/20'
                            }`}
                          >
                            <IconComponent className={`w-3.5 h-3.5 ${isSel ? 'text-[#00ffcc]' : 'text-zinc-500'}`} />
                            {type.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Export format card selections */}
                  <div className="space-y-2 pt-1.5">
                    <label className="text-[10px] font-mono uppercase tracking-wider font-bold text-zinc-400 block">Export Format</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { id: 'PDF', label: 'PDF', color: 'text-red-400 border-red-950 bg-red-500/5', iconColor: 'text-red-500' },
                        { id: 'CSV', label: 'CSV', color: 'text-emerald-400 border-emerald-950 bg-emerald-500/5', iconColor: 'text-emerald-500' },
                        { id: 'Excel', label: 'Excel', color: 'text-teal-400 border-teal-950 bg-teal-500/5', iconColor: 'text-[#22c55e]' },
                        { id: 'JSON', label: 'JSON', color: 'text-orange-400 border-orange-950 bg-orange-500/5', iconColor: 'text-amber-500' },
                      ].map((fmt, idx) => {
                        const isSel = exportFormat === fmt.id;
                        return (
                          <button
                            key={`${fmt.id}-${idx}`}
                            onClick={() => setExportFormat(fmt.id as any)}
                            className={`py-3.5 border rounded-xl text-center cursor-pointer transition-all active:scale-95 flex flex-col items-center gap-1.5 ${
                              isSel 
                                ? 'bg-zinc-900/95 border-[#00ffcc] font-bold text-white shadow-xl shadow-[#00ffcc]/5' 
                                : 'bg-transparent border-zinc-850 text-zinc-400 hover:text-white'
                            }`}
                          >
                            <FileSpreadsheet className={`w-5 h-5 ${isSel ? 'text-[#00ffcc]' : fmt.iconColor}`} />
                            <span className="text-[10px] font-mono leading-none tracking-wider font-bold">{fmt.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 2. CUSTOM FIELDS SELECTOR */}
        <div className="bg-[#111319]/80 border border-zinc-850/70 rounded-2xl overflow-hidden shadow-lg">
          <button 
            type="button"
            onClick={() => setCollapsed(prev => ({ ...prev, customFields: !prev.customFields }))}
            className="w-full px-4 py-3.5 flex items-center justify-between bg-zinc-900/40 text-left border-b border-zinc-850 cursor-pointer"
          >
            <div className="flex flex-col">
              <span className="text-xs font-bold uppercase tracking-wider text-white font-display flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#00ffcc]" />
                Custom Fields
              </span>
              <span className="text-[9px] font-mono text-zinc-500 mt-0.5 ml-6">{selectedFieldsCount} fields selected</span>
            </div>
            {collapsed.customFields ? <ChevronDown className="w-4.5 h-4.5 text-zinc-500" /> : <ChevronUp className="w-4.5 h-4.5 text-zinc-500" />}
          </button>

          <AnimatePresence initial={false}>
            {!collapsed.customFields && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 space-y-4 text-left">
                  
                  {/* Basic section */}
                  <div className="space-y-2">
                    <span className="text-[9px] font-mono font-bold text-zinc-500 tracking-wider uppercase block">Basic Metadata</span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { key: 'dateTime', label: 'Date & Time' },
                        { key: 'venueName', label: 'Venue Name' },
                        { key: 'teamMember', label: 'Team Member' },
                        { key: 'notes', label: 'Notes' },
                      ].map((field, idx) => {
                        const active = (customFields as any)[field.key];
                        return (
                          <button
                            key={`${field.key}-${idx}`}
                            type="button"
                            onClick={() => setCustomFields(prev => ({ ...prev, [field.key]: !active }))}
                            className={`flex items-center gap-2 p-2 px-3 border rounded-xl text-[11px] leading-snug cursor-pointer select-none transition-colors border-zinc-850/60 ${
                              active ? 'bg-zinc-950/40 text-[#00ffcc] font-bold' : 'bg-transparent text-zinc-400 hover:text-zinc-200'
                            }`}
                          >
                            <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${active ? 'border-[#00ffcc] bg-[#00ffcc]/10' : 'border-zinc-700'}`}>
                              {active && <Check className="w-2.5 h-2.5 text-[#00ffcc]" />}
                            </div>
                            <span className="truncate">{field.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Financial section */}
                  <div className="space-y-2">
                    <span className="text-[9px] font-mono font-bold text-zinc-500 tracking-wider uppercase block">Financial Parameters</span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { key: 'totalRevenue', label: 'Total Revenue' },
                        { key: 'paymentMethod', label: 'Payment Method' },
                        { key: 'avgTransaction', label: 'Avg Transaction' },
                        { key: 'profitMargin', label: 'Profit Margin' },
                      ].map((field, idx) => {
                        const active = (customFields as any)[field.key];
                        return (
                          <button
                            key={`${field.key}-${idx}`}
                            type="button"
                            onClick={() => setCustomFields(prev => ({ ...prev, [field.key]: !active }))}
                            className={`flex items-center gap-2 p-2 px-3 border rounded-xl text-[11px] leading-snug cursor-pointer select-none transition-colors border-zinc-850/60 ${
                              active ? 'bg-zinc-950/40 text-[#00ffcc] font-bold' : 'bg-transparent text-zinc-400 hover:text-zinc-200'
                            }`}
                          >
                            <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${active ? 'border-[#00ffcc] bg-[#00ffcc]/10' : 'border-zinc-700'}`}>
                              {active && <Check className="w-2.5 h-2.5 text-[#00ffcc]" />}
                            </div>
                            <span className="truncate">{field.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Sales metrics */}
                  <div className="space-y-2">
                    <span className="text-[9px] font-mono font-bold text-zinc-500 tracking-wider uppercase block">Sales Metrics</span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { key: 'itemsSold', label: 'Items Sold' },
                        { key: 'customerCount', label: 'Customer Count' },
                        { key: 'topProducts', label: 'Top Products' },
                      ].map((field, idx) => {
                        const active = (customFields as any)[field.key];
                        return (
                          <button
                            key={`${field.key}-${idx}`}
                            type="button"
                            onClick={() => setCustomFields(prev => ({ ...prev, [field.key]: !active }))}
                            className={`flex items-center gap-2 p-2 px-3 border rounded-xl text-[11px] leading-snug cursor-pointer select-none transition-colors border-zinc-850/60 ${
                              active ? 'bg-zinc-950/40 text-[#00ffcc] font-bold' : 'bg-transparent text-zinc-400 hover:text-zinc-200'
                            }`}
                          >
                            <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${active ? 'border-[#00ffcc] bg-[#00ffcc]/10' : 'border-zinc-700'}`}>
                              {active && <Check className="w-2.5 h-2.5 text-[#00ffcc]" />}
                            </div>
                            <span className="truncate">{field.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Inventory block */}
                  <div className="space-y-2">
                    <span className="text-[9px] font-mono font-bold text-zinc-500 tracking-wider uppercase block">Inventory status</span>
                    <button
                      type="button"
                      onClick={() => setCustomFields(prev => ({ ...prev, inventoryChanges: !prev.inventoryChanges }))}
                      className={`flex items-center gap-2 p-2 px-3 border rounded-xl text-[11px] leading-snug cursor-pointer w-full select-none transition-colors border-zinc-850/60 ${
                        customFields.inventoryChanges ? 'bg-zinc-950/40 text-[#00ffcc] font-bold' : 'bg-transparent text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${customFields.inventoryChanges ? 'border-[#00ffcc] bg-[#00ffcc]/10' : 'border-zinc-700'}`}>
                        {customFields.inventoryChanges && <Check className="w-2.5 h-2.5 text-[#00ffcc]" />}
                      </div>
                      <span className="truncate">Inventory Changes</span>
                    </button>
                  </div>

                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 3. ADVANCED OPTIONS */}
        <div className="bg-[#111319]/80 border border-zinc-850/70 rounded-2xl overflow-hidden shadow-lg">
          <button 
            onClick={() => setCollapsed(prev => ({ ...prev, advanced: !prev.advanced }))}
            className="w-full px-4 py-3.5 flex items-center justify-between bg-zinc-900/40 text-left border-b border-zinc-850 cursor-pointer"
          >
            <span className="text-xs font-bold uppercase tracking-wider text-white font-display flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#00ffcc]" />
              Advanced Options
            </span>
            {collapsed.advanced ? <ChevronDown className="w-4.5 h-4.5 text-zinc-500" /> : <ChevronUp className="w-4.5 h-4.5 text-zinc-500" />}
          </button>

          <AnimatePresence initial={false}>
            {!collapsed.advanced && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 space-y-4 text-left font-sans">
                  {/* Switch Toggle 1 */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white block">Include Charts & Graphs</span>
                      <span className="text-[10px] text-zinc-500 tracking-tight block">Visual data representation</span>
                    </div>
                    <button 
                      onClick={() => setIncludeCharts(!includeCharts)}
                      className={`w-10 h-6.5 rounded-full p-[3.5px] transition-colors relative cursor-pointer ${includeCharts ? 'bg-[#00ffcc]' : 'bg-zinc-800'}`}
                    >
                      <div 
                        className={`w-3.5 h-3.5 rounded-full bg-black transition-transform ${includeCharts ? 'translate-x-4.5' : 'translate-x-0'}`}
                      />
                    </button>
                  </div>

                  {/* Switch Toggle 2 */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white block">Include Analytics Summary</span>
                      <span className="text-[10px] text-zinc-500 tracking-tight block">Key insights & trends</span>
                    </div>
                    <button 
                      onClick={() => setIncludeAnalytics(!includeAnalytics)}
                      className={`w-10 h-6.5 rounded-full p-[3.5px] transition-colors relative cursor-pointer ${includeAnalytics ? 'bg-[#00ffcc]' : 'bg-zinc-800'}`}
                    >
                      <div 
                        className={`w-3.5 h-3.5 rounded-full bg-black transition-transform ${includeAnalytics ? 'translate-x-4.5' : 'translate-x-0'}`}
                      />
                    </button>
                  </div>

                  {/* Switch Toggle 3 */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white block">White-Label Mode</span>
                      <span className="text-[10px] text-zinc-500 tracking-tight block">Remove Nexus Core branding</span>
                    </div>
                    <button 
                      onClick={() => setWhiteLabel(!whiteLabel)}
                      className={`w-10 h-6.5 rounded-full p-[3.5px] transition-colors relative cursor-pointer ${whiteLabel ? 'bg-[#00ffcc]' : 'bg-zinc-800'}`}
                    >
                      <div 
                        className={`w-3.5 h-3.5 rounded-full bg-black transition-transform ${whiteLabel ? 'translate-x-4.5' : 'translate-x-0'}`}
                      />
                    </button>
                  </div>

                  {/* Currency Picker */}
                  <div className="space-y-1 pt-1.5">
                    <label className="text-[9px] font-mono uppercase tracking-wider text-zinc-500 font-bold block">Currency</label>
                    <select 
                      value={currency} 
                      onChange={e => setCurrency(e.target.value)}
                      className="w-full bg-[#111319] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer focus:border-[#00ffcc]/60"
                    >
                      <option>USD ($)</option>
                      <option>EUR (€)</option>
                      <option>GBP (£)</option>
                      <option>JPY (¥)</option>
                    </select>
                  </div>

                  {/* Group Data By */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono uppercase tracking-wider text-zinc-500 font-bold block">Group Data By</label>
                    <select 
                      value={groupBy} 
                      onChange={e => setGroupBy(e.target.value)}
                      className="w-full bg-[#111319] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer focus:border-[#00ffcc]/60"
                    >
                      <option>No Grouping</option>
                      <option>Group by Date</option>
                      <option>Group by Product Category</option>
                      <option>Group by Payment Method</option>
                    </select>
                  </div>

                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 4. PDF CUSTOMIZATION */}
        <div className="bg-[#111319]/80 border border-zinc-850/70 rounded-2xl overflow-hidden shadow-lg">
          <button 
            onClick={() => setCollapsed(prev => ({ ...prev, pdf: !prev.pdf }))}
            className="w-full px-4 py-3.5 flex items-center justify-between bg-zinc-900/40 text-left border-b border-zinc-850 cursor-pointer"
          >
            <span className="text-xs font-bold uppercase tracking-wider text-white font-display flex items-center gap-2">
              <Palette className="w-4 h-4 text-[#00ffcc]" />
              PDF Customization
            </span>
            {collapsed.pdf ? <ChevronDown className="w-4.5 h-4.5 text-zinc-500" /> : <ChevronUp className="w-4.5 h-4.5 text-zinc-500" />}
          </button>

          <AnimatePresence initial={false}>
            {!collapsed.pdf && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 space-y-4 text-left font-sans">
                  
                  {/* Upload Logo motifs selector */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-widest block">Choose brand logo style</span>
                    <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-3 flex flex-wrap gap-2 items-center justify-around">
                      {[
                        { id: 'crest', label: 'Crest Motif' },
                        { id: 'grid', label: 'Modern Monolith' },
                        { id: 'neon', label: 'Symmetric Crown' },
                        { id: 'none', label: 'No Logo' },
                      ].map((logo, idx) => (
                        <button
                          key={`${logo.id}-${idx}`}
                          type="button"
                          onClick={() => { setLogoOption(logo.id as any); triggerNotification(`Brand logo set to: ${logo.label}`); }}
                          className={`text-[9.5px] p-1.5 px-3 rounded-lg border cursor-pointer select-none transition-all font-mono uppercase ${
                            logoOption === logo.id 
                              ? 'bg-[#25f4d1]/10 border-[#25f4d1] text-[#25f4d1] font-bold shadow-lg shadow-[#25f4d1]/5' 
                              : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-white'
                          }`}
                        >
                          {logo.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Manual trigger upload mock */}
                  <div className="border border-dashed border-zinc-800 rounded-xl p-4.5 flex flex-col items-center justify-center gap-1.5 hover:bg-zinc-950/20 hover:border-zinc-700 cursor-pointer transition-all">
                    <Upload className="w-5 h-5 text-zinc-500" />
                    <div>
                      <span className="text-xs font-bold text-white block text-center">Upload Logo</span>
                      <span className="text-[10px] text-zinc-500 tracking-tight block text-center mt-0.5">Add your brand logo to reports</span>
                    </div>
                  </div>

                  {/* Primary Color input selector */}
                  <div className="space-y-1 pt-1">
                    <label className="text-[9px] font-mono uppercase tracking-wider text-zinc-500 font-bold block">Primary Color</label>
                    <div className="flex gap-2">
                      <div 
                        className="w-10 h-10 rounded-xl border border-zinc-800 shrink-0 transition-colors shadow-md"
                        style={{ backgroundColor: primaryColor }}
                      />
                      <input 
                        type="text"
                        value={primaryColor}
                        onChange={e => setPrimaryColor(e.target.value)}
                        placeholder="#25f4d1"
                        className="flex-1 bg-[#111319] border border-zinc-800 rounded-xl px-3 outline-none text-xs text-white uppercase font-mono tracking-widest focus:border-[#00ffcc]/60"
                      />
                    </div>
                  </div>

                  {/* Footer Text */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono uppercase tracking-wider text-zinc-500 font-bold block">Footer Text</label>
                    <input 
                      type="text"
                      value={footerText}
                      onChange={e => setFooterText(e.target.value)}
                      placeholder="e.g., Confidential - For Internal Use Only"
                      className="w-full bg-[#111319] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#00ffcc]/60"
                    />
                  </div>

                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* CORE BUTTON GROUP ACTION PANELS */}
      <div className="p-5 space-y-4.5 text-center">
        
        {/* BIG EXPORT BUTTON */}
        <button 
          onClick={handleExportSubmit}
          disabled={isExporting}
          className="w-full py-4 bg-[#25f4d1] hover:bg-[#1fd9b7] disabled:bg-zinc-800 disabled:text-zinc-650 rounded-2xl text-black font-semibold font-mono uppercase text-xs tracking-widest font-black flex items-center justify-center gap-2 relative shadow-lg shadow-[#25f4d1]/5 overflow-hidden cursor-pointer"
        >
          {isExporting ? (
            <div className="absolute inset-0 bg-[#0e2724] flex items-center justify-center" style={{ width: '100%' }}>
              <div 
                className="absolute left-0 bottom-0 top-0 bg-[#25f4d1] opacity-20 transition-all duration-150"
                style={{ width: `${exportProgress}%` }}
              />
              <span className="text-[#25f4d1] font-mono font-bold tracking-widest text-[11px] uppercase relative z-10 animate-pulse">
                🔬 COMPILING DELIVERABLE... {exportProgress}%
              </span>
            </div>
          ) : (
            <>
              <Download className="w-4.5 h-4.5" />
              <span>Export Now</span>
            </>
          )}
        </button>

        {/* METRICS ROW TRIO TRIGGERS */}
        <div className="grid grid-cols-3 gap-2 font-mono uppercase text-[9px] font-bold">
          {/* PREVIEW */}
          <button 
            onClick={() => setIsPreviewOpen(true)}
            className="py-3 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-850 hover:border-[#25f4d1]/20 rounded-xl text-zinc-300 hover:text-white transition-all flex flex-col items-center gap-1.5 p-1 pr-1.5 cursor-pointer active:scale-95"
          >
            <Eye className="w-4 h-4 text-[#25f4d1]" />
            <span>Preview</span>
          </button>

          {/* EMAIL */}
          <button 
            onClick={() => setIsEmailOpen(true)}
            className="py-3 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-850 hover:border-[#25f4d1]/20 rounded-xl text-zinc-300 hover:text-white transition-all flex flex-col items-center gap-1.5 p-1 pr-1.5 cursor-pointer active:scale-95"
          >
            <Mail className="w-4 h-4 text-purple-400" />
            <span>Email</span>
          </button>

          {/* SCHEDULE */}
          <button 
            onClick={() => setIsScheduleOpen(true)}
            className="py-3 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-850 hover:border-[#25f4d1]/20 rounded-xl text-zinc-300 hover:text-white transition-all flex flex-col items-center gap-1.5 p-1 pr-1.5 cursor-pointer active:scale-95"
          >
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Schedule</span>
          </button>
        </div>

      </div>

      {/* SCHEDULED EXPORTS COLLAPSIBLE */}
      <div className="px-5 pb-4">
        <div className="bg-[#111319]/85 border border-zinc-850/60 rounded-2xl overflow-hidden shadow-lg">
          <button 
            onClick={() => setCollapsed(prev => ({ ...prev, scheduled: !prev.scheduled }))}
            className="w-full px-4 py-3.5 flex items-center justify-between bg-zinc-900/40 text-left border-b border-zinc-850 cursor-pointer"
          >
            <div className="flex flex-col">
              <span className="text-xs font-bold uppercase tracking-wider text-white font-display flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-400" />
                Scheduled Exports
              </span>
              <span className="text-[9px] font-mono text-zinc-500 mt-0.5 ml-6">{schedules.length} active schedules</span>
            </div>
            {collapsed.scheduled ? <ChevronDown className="w-4.5 h-4.5 text-zinc-500" /> : <ChevronUp className="w-4.5 h-4.5 text-zinc-500" />}
          </button>

          <AnimatePresence initial={false}>
            {!collapsed.scheduled && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 space-y-2 text-left">
                  {schedules.map((sch, idx) => (
                    <div 
                      key={`${sch.id}-${idx}`}
                      className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-900/80 flex items-center justify-between"
                    >
                      <div>
                        <span className="text-xs font-bold text-white block">
                          {sch.name}
                        </span>
                        <span className="text-[9.5px] font-mono text-zinc-400 block mt-0.5">
                          {sch.frequency}
                        </span>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[8.5px] font-mono text-zinc-500 block leading-none">
                            📅 Next run: {sch.nextRun}
                          </span>
                          <span className="text-[8.5px] font-mono text-[#00ffcc] leading-none px-1 bg-[#111319] rounded">
                            ✉️ {sch.recipients} recipient(s)
                          </span>
                        </div>
                      </div>

                      <button 
                        onClick={() => handleDeleteSchedule(sch.id, sch.name)}
                        className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-red-500 cursor-pointer transition-colors"
                        title="Delete scheduling"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* RECENT EXPORTS ACCORDION WITH INTEGRATED POLISH */}
      <div className="px-5 pb-16">
        <div className="bg-[#111319]/85 border border-zinc-850/60 rounded-2xl overflow-hidden shadow-lg">
          <button 
            onClick={() => setCollapsed(prev => ({ ...prev, recent: !prev.recent }))}
            className="w-full px-4 py-3.5 flex items-center justify-between bg-zinc-900/40 text-left border-b border-zinc-850 cursor-pointer"
          >
            <span className="text-xs font-bold uppercase tracking-wider text-white font-display flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-[#00ffcc]" />
              Recent Exports
            </span>
            {collapsed.recent ? <ChevronDown className="w-4.5 h-4.5 text-zinc-500" /> : <ChevronUp className="w-4.5 h-4.5 text-zinc-500" />}
          </button>

          <AnimatePresence initial={false}>
            {!collapsed.recent && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 flex flex-col items-center">
                  
                  {recentExports.length === 0 ? (
                    <div className="text-center py-6 space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center border border-zinc-850 mx-auto select-none opacity-50">
                        <FileText className="w-6 h-6 text-zinc-500" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-zinc-400 block">No exports yet</span>
                        <p className="text-[10px] text-zinc-650 tracking-tight block max-w-xs mt-0.5">Export a report to see it appear in this campaign list</p>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full space-y-2 text-left font-sans">
                      {recentExports.map((exportItem, idx) => (
                        <div 
                          key={`${exportItem.id}-${idx}`}
                          className="p-2.5 rounded-xl border border-zinc-900 bg-zinc-950/40 hover:border-zinc-800 transition-colors flex items-center justify-between text-xs"
                        >
                          <div className="truncate pr-2">
                            <span className="font-bold text-zinc-200 block truncate" title={exportItem.filename}>
                              {exportItem.filename}
                            </span>
                            <span className="text-[9px] font-mono text-zinc-500 mt-1 block">
                              Compiled: {exportItem.date} • {exportItem.size}
                            </span>
                          </div>

                          <span className="text-[9.5px] font-mono uppercase bg-[#111319] px-2 py-0.5 text-zinc-400 rounded shrink-0 flex items-center gap-1 font-bold">
                            {exportItem.format}
                            <Download className="w-3 h-3 text-[#00ffcc]" />
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* MODAL 1: PREVIEW */}
      <AnimatePresence>
        {isPreviewOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-[490px] bg-[#111319] border border-zinc-850 rounded-2xl overflow-hidden shadow-2xl relative max-h-[90vh] flex flex-col text-left"
            >
              {/* Header */}
              <div className="px-4 py-3 border-b border-zinc-850 flex items-center justify-between bg-zinc-950">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-teal-300">🔍 Live Document Preview</span>
                <button 
                  onClick={() => setIsPreviewOpen(false)}
                  className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Generated Content Body */}
              <div className="p-4 overflow-y-auto space-y-4 flex-1 font-sans text-xs bg-white text-zinc-900 selection:bg-emerald-200 selection:text-emerald-990">
                {/* Simulated Document Header */}
                <div className="flex justify-between items-start border-b-2 border-zinc-200 pb-4">
                  <div>
                    {logoOption !== 'none' && (
                      <div className="font-mono text-[9px] font-extrabold uppercase p-1 border inline-block rounded mb-2 leading-none" style={{ borderColor: primaryColor, color: primaryColor, backgroundColor: `${primaryColor}0a` }}>
                        {logoOption === 'crest' ? '✦ Band Crest ✦' : logoOption === 'grid' ? '■ Modern Monolith' : '✸ Symmetric Crown'}
                      </div>
                    )}
                    <h1 className="text-sm font-black uppercase text-zinc-900 tracking-tight leading-none">{bandName} REPORT</h1>
                    <span className="text-[9px] font-mono text-zinc-500 block mt-1">Compiled: {new Date().toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[8px] font-mono text-zinc-400 block">CAMPAIGN SYSTEM</span>
                    <span className="text-xs font-bold uppercase font-mono px-2 py-0.5 rounded" style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}>
                      {reportType.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Simulated Table structure based on Custom Fields Selector */}
                <div className="space-y-3">
                  <span className="text-[8.5px] font-mono font-extrabold text-zinc-400 block uppercase tracking-widest border-b pb-0.5">Parameters Ledger</span>
                  
                  <div className="grid grid-cols-2 gap-3 text-[11px] leading-relaxed">
                    {customFields.dateTime && (
                      <div className="p-2 border border-zinc-100 bg-zinc-50 rounded-lg">
                        <span className="text-[8px] text-zinc-500 font-mono block uppercase">Interval Log time</span>
                        <span className="font-bold font-sans text-zinc-800">{new Date().toDateString()}</span>
                      </div>
                    )}
                    {customFields.venueName && (
                      <div className="p-2 border border-zinc-100 bg-zinc-50 rounded-lg">
                        <span className="text-[8px] text-zinc-500 font-mono block uppercase">Active Show Stop</span>
                        <span className="font-bold text-zinc-800 truncate block">{shows[0]?.festival_name || shows[0]?.name || 'Fort Wayne Stadium'}</span>
                      </div>
                    )}
                    {customFields.totalRevenue && (
                      <div className="p-2 border border-zinc-100 bg-zinc-50 rounded-lg">
                        <span className="text-[8px] text-zinc-500 font-mono block uppercase">Total Aggregated Revenue</span>
                        <span className="font-bold text-emerald-600 block">${sales.reduce((sum, s) => sum + (s.amount * (s.quantity || 1)), 0).toFixed(2)}</span>
                      </div>
                    )}
                    {customFields.itemsSold && (
                      <div className="p-2 border border-zinc-100 bg-zinc-50 rounded-lg">
                        <span className="text-[8px] text-zinc-500 font-mono block uppercase">Physical Turnover Volume</span>
                        <span className="font-bold text-purple-600 block">{sales.reduce((sum, s) => sum + (s.quantity || 1), 0)} items sold</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 p-3 bg-zinc-50 rounded-xl space-y-1 text-[10px]">
                    <span className="font-bold text-zinc-700 block">Include Charts & Graphs: {includeCharts ? 'YES (Embedded Pie & Sparkline)' : 'NO'}</span>
                    <span className="font-bold text-zinc-700 block">White-Label Mode Activated: {whiteLabel ? 'YES' : 'NO'}</span>
                    <span className="font-bold text-zinc-700 block">Grouping Level: {groupBy}</span>
                    <span className="font-bold text-zinc-700 block">Currency Tag: {currency}</span>
                  </div>
                </div>

                {/* Footer simulation */}
                <div className="pt-4 border-t border-zinc-100 text-center text-[8.5px] font-mono text-zinc-400 uppercase tracking-widest mt-6">
                  {footerText || 'Confidential Document'}
                </div>
              </div>

              {/* Action */}
              <div className="p-4 bg-zinc-950 border-t border-zinc-850 flex gap-2">
                <button 
                  onClick={() => setIsPreviewOpen(false)}
                  className="w-full py-2 bg-zinc-800 hover:bg-zinc-750 text-white rounded-xl text-xs font-mono font-bold uppercase cursor-pointer"
                >
                  Close Document View
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: EMAIL */}
      <AnimatePresence>
        {isEmailOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-[#111319] border border-zinc-850 rounded-2xl overflow-hidden shadow-2xl relative text-left"
            >
              {/* Header */}
              <div className="px-4 py-3 border-b border-zinc-850 flex items-center justify-between bg-zinc-950">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-purple-300">✉️ Dispatch Report via Email</span>
                <button 
                  onClick={() => setIsEmailOpen(false)}
                  className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Form Content body */}
              <div className="p-4 space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-mono uppercase tracking-wider text-zinc-500 font-bold block">Recipient Address</label>
                  <input 
                    type="email"
                    value={recipientEmail}
                    onChange={e => setRecipientEmail(e.target.value)}
                    placeholder="e.g., mail@example.com, manager@band.com"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-500/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-mono uppercase tracking-wider text-zinc-500 font-bold block">Subject Header</label>
                  <input 
                    type="text"
                    value={emailSubject}
                    onChange={e => setEmailSubject(e.target.value)}
                    placeholder="Exported Report Payload"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-500/50"
                  />
                </div>

                <div className="p-3 bg-zinc-950/40 rounded-xl border border-zinc-850/40 text-[10px] text-zinc-400 font-mono leading-relaxed">
                  The compiled <span className="text-white font-bold font-sans">{exportFormat} file</span> will be embedded as a secured binary attachment block stream.
                </div>
              </div>

              {/* Action buttons */}
              <div className="p-4 bg-zinc-950 border-t border-zinc-850 flex gap-2">
                <button 
                  onClick={() => setIsEmailOpen(false)}
                  className="flex-1 py-1.5 bg-zinc-850 text-zinc-300 hover:text-white rounded-xl text-xs font-mono font-bold uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    if (!recipientEmail.includes('@')) {
                      triggerNotification('Please enter a valid recipient email address!');
                      return;
                    }
                    addLog(`Drafted and dispatched automated reports pack to ${recipientEmail}`);
                    triggerNotification(`Dispatched! Full pack emailed to ${recipientEmail}`);
                    setIsEmailOpen(false);
                  }}
                  className="flex-1 py-1.5 bg-purple-500 text-black font-semibold rounded-xl text-xs font-mono font-bold uppercase hover:bg-purple-400 cursor-pointer"
                >
                  Dispatch
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: SCHEDULE */}
      <AnimatePresence>
        {isScheduleOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-[#111319] border border-zinc-850 rounded-2xl overflow-hidden shadow-2xl relative text-left"
            >
              {/* Header */}
              <div className="px-4 py-3 border-b border-zinc-850 flex items-center justify-between bg-zinc-950">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-300">📅 Add Automated Schedule Task</span>
                <button 
                  onClick={() => setIsScheduleOpen(false)}
                  className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Form Content body */}
              <form onSubmit={handleAddScheduleSubmit}>
                <div className="p-4 space-y-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono uppercase tracking-wider text-zinc-500 font-bold block">Report Name</label>
                    <input 
                      type="text"
                      value={newScheduleName}
                      onChange={e => setNewScheduleName(e.target.value)}
                      placeholder="e.g., End-of-Week Tax Report"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500/50"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold block">Frequency Interval</label>
                    <select 
                      value={newScheduleFrequency}
                      onChange={e => setNewScheduleFrequency(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer focus:border-amber-500/50"
                    >
                      <option>Every Monday at 9:00 AM</option>
                      <option>1st of every month</option>
                      <option>Daily at midnight (00:00)</option>
                      <option>Every Thursday at 6:00 PM</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-mono uppercase tracking-wider text-zinc-500 font-bold block">Recipient Count</label>
                    <input 
                      type="number"
                      min="1"
                      value={newScheduleRecipients}
                      onChange={e => setNewScheduleRecipients(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500/50"
                      required
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="p-4 bg-zinc-950 border-t border-zinc-850 flex gap-2">
                  <button 
                    type="button"
                    onClick={() => setIsScheduleOpen(false)}
                    className="flex-1 py-1.5 bg-zinc-850 text-zinc-300 hover:text-white rounded-xl text-xs font-mono font-bold uppercase cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-1.5 bg-amber-500 text-black font-semibold rounded-xl text-xs font-mono font-bold uppercase hover:bg-amber-400 cursor-pointer"
                  >
                    Create Task
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
