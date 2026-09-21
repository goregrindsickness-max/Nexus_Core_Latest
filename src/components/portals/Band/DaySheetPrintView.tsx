import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  Printer, 
  X, 
  Calendar, 
  MapPin, 
  Clock, 
  Wifi, 
  Users, 
  Contact, 
  Coins, 
  Layers,
  FileText,
  Download,
  Smartphone
} from 'lucide-react';
import { Show, Sale } from '../../../types';

interface DaySheetPrintViewProps {
  show: Show;
  sales: Sale[];
  activeBandName: string;
  isOpen: boolean;
  onClose: () => void;
  triggerNotification: (msg: string) => void;
}

export default function DaySheetPrintView({
  show,
  sales,
  activeBandName,
  isOpen,
  onClose,
  triggerNotification
}: DaySheetPrintViewProps) {
  const [portalElement, setPortalElement] = useState<HTMLElement | null>(null);
  const [zoomScale, setZoomScale] = useState<number>(0.55);
  const [viewMode, setViewMode] = useState<'mobile' | 'document'>('mobile');

  // Setup Portal container programmatically on the body
  useEffect(() => {
    if (!isOpen) return;

    let el = document.getElementById('print-portal-root');
    if (!el) {
      el = document.createElement('div');
      el.id = 'print-portal-root';
      document.body.appendChild(el);
    }
    setPortalElement(el);

    // Inject temporary styles to styleheet for print layout overriding root limits
    const styleEl = document.createElement('style');
    styleEl.id = 'print-style-rules';
    styleEl.innerHTML = `
      @media print {
        body {
          background: white !important;
          color: black !important;
          font-family: inherit !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        #root {
          display: none !important;
        }
        #print-portal-root {
          display: block !important;
          width: 8.5in !important;
          height: 11.0in !important;
          margin: 0 !important;
          padding: 0.5in !important;
          box-sizing: border-box !important;
          background: white !important;
          color: black !important;
          visibility: visible !important;
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
        }
        .no-print {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(styleEl);

    return () => {
      styleEl.remove();
      // Keep root element ready for portals but do not delete unless needed
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePrint = () => {
    try {
      window.print();
      triggerNotification("Day-Sheet sent to printer / PDF tool!");
    } catch (e) {
      console.error(e);
      triggerNotification("Failed to open system print dialog.");
    }
  };

  const handleDownloadHTML = () => {
    try {
      const dateStr = formattedDate();
      
      const is24Hr = localStorage.getItem('tour_time_is_24h') !== 'false';
      const formatTimePrint = (timeStr?: string) => {
        if (!timeStr) return 'TBD';
        if (is24Hr) return timeStr;
        const [h, m] = timeStr.split(':');
        if (!h || !m) return timeStr;
        const hNum = parseInt(h, 10);
        const ampm = hNum >= 12 ? 'PM' : 'AM';
        const h12 = hNum % 12 || 12;
        return `${h12}:${m} ${ampm}`;
      };

      const guestRows = show.guest_list && show.guest_list.length > 0
        ? show.guest_list.map((guest: any) => `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 4px 8px; font-weight: bold; background: #fafafa;">${guest.name}</td>
            <td style="padding: 4px 8px; color: #475569;">${guest.access_type || 'General'}</td>
            <td style="padding: 4px 8px; text-align: right; font-weight: 800;">+${guest.additional_count}</td>
          </tr>
        `).join('')
        : '<tr><td colspan="3" style="padding: 14px; color: #64748b; font-style: italic; text-align: center;">No attendees registered on guest list.</td></tr>';

      const wifiSectionHtml = show.wifi_network || show.wifi_password
        ? `<div style="background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; font-family: 'JetBrains Mono', monospace; font-size: 11px; margin-top: 6px;">
             ${show.wifi_network ? `<div><span style="color: #64748b;">SSID:</span> <strong style="color: #0f172a;">${show.wifi_network}</strong></div>` : ''}
             ${show.wifi_password ? `<div style="margin-top: 4px;"><span style="color: #64748b;">WPA2:</span> <strong style="color: #0f172a;">${show.wifi_password}</strong></div>` : ''}
           </div>`
        : '<p style="color: #64748b; font-style: italic; font-size: 11px; margin-top: 4px;">No crew WiFi recorded.</p>';

      const supportActsHtml = show.support_lineup && show.support_lineup.length > 0
        ? show.support_lineup.map((band: any) => `
          <div class="matrix-row">
            <span class="matrix-time">${formatTimePrint(band.start_time)} - ${formatTimePrint(band.end_time)}</span>
            <span class="matrix-divider">--</span>
            <span class="matrix-label" style="text-transform: none;">${band.name || 'Support'}</span>
          </div>
        `).join('')
        : `<div class="matrix-row"><span class="matrix-time">TBD - TBD</span><span class="matrix-divider">--</span><span class="matrix-label" style="text-transform: none;">Support (TBD)</span></div>`;

      const fallbackSpecStr = "Standard production / local backline rules apply";
      const techSpecsHtml = `
          <div style="margin-top: 24px;">
            <h4 style="font-family: 'JetBrains Mono', monospace; font-size: 9px; color: #64748b; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.5px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px;">TECHNICAL & PRODUCTION SPECIFICATIONS</h4>
            <div class="columns-2" style="margin-top: 8px; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc; overflow: hidden; padding: 0;">
               <div style="padding: 12px; border-right: 1px dashed #cbd5e1;">
                  <span class="label">AUDIO & PRODUCTION REQUIREMENTS</span>
                  <div style="font-size: 10px; color: #334155; line-height: 1.5; font-family: 'JetBrains Mono', monospace; white-space: pre-wrap;">${show.audio_production_requirements?.trim() || fallbackSpecStr}</div>
               </div>
               <div style="padding: 12px;">
                  <span class="label">STAGE BACKLINE SPECS</span>
                  <div style="font-size: 10px; color: #334155; line-height: 1.5; font-family: 'JetBrains Mono', monospace; white-space: pre-wrap;">${show.stage_backline_requirements?.trim() || fallbackSpecStr}</div>
               </div>
            </div>
          </div>
      `;

      const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tour Day-Sheet: ${show.name} (${dateStr})</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;750;900&family=JetBrains+Mono:wght@400;700&display=swap');
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      background: #f1f5f9;
      font-family: 'Inter', system-ui, sans-serif;
      color: #0f172a;
      padding: 40px 10px;
    }
    
    .sheet-wrapper {
      background: #ffffff;
      width: 7.5in;
      height: 10in;
      margin: 0 auto;
      padding: 0;
      border: 1px solid #e2e8f0;
      box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .mono {
      font-family: 'JetBrains Mono', monospace;
    }

    .header-rule {
      border-bottom: 4px solid #000000;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }

    .grid-3 {
      display: grid;
      grid-template-cols: repeat(3, 1fr);
      gap: 12px;
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px dashed #cbd5e1;
    }
    
    .schedule-matrix-container {
      display: grid;
      grid-template-cols: 1fr 1fr;
      gap: 24px;
      margin-top: 16px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px;
      background: #f8fafc;
    }
    
    .matrix-col {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    
    .matrix-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .matrix-time {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      font-weight: 700;
      color: #64748b;
      min-width: 90px;
    }
    
    .matrix-divider {
      color: #cbd5e1;
    }
    
    .matrix-label {
      font-size: 11px;
      font-weight: 800;
      color: #0f172a;
      text-transform: uppercase;
    }
    
    .left-col {
      border-right: 1px dashed #cbd5e1;
      padding-right: 24px;
    }

    .columns-2 {
      display: grid;
      grid-template-cols: repeat(2, 1fr);
      gap: 32px;
      margin-top: 16px;
    }

    .col-header {
      border-bottom: 2px solid #0f172a;
      padding-bottom: 4px;
      margin-bottom: 8px;
      font-weight: 900;
      text-transform: uppercase;
      font-size: 10px;
      color: #0f172a;
      letter-spacing: 0.5px;
    }

    .info-group {
      margin-bottom: 10px;
    }

    .label {
      font-family: 'JetBrains Mono', monospace;
      font-size: 8px;
      color: #64748b;
      text-transform: uppercase;
      display: block;
      margin-bottom: 2px;
      letter-spacing: 0.5px;
    }

    .desc {
      font-size: 11px;
      font-weight: 700;
      color: #0f172a;
    }

    .details-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
      font-family: 'JetBrains Mono', monospace;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      overflow: hidden;
    }
    
    .details-table th, .details-table td {
      padding: 4px 8px;
    }
    
    .action-bar {
      width: 8.5in;
      margin: 0 auto 16px auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #0f172a;
      color: #ffffff;
      padding: 14px 24px;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
    }
    
    .btn {
      background: #8c52ff;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      font-family: 'Inter', sans-serif;
      font-weight: 700;
      font-size: 11px;
      cursor: pointer;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      transition: background 0.15s;
    }
    .btn:hover {
      background: #7b42ea;
    }
    
    @media print {
      body {
        background: #ffffff !important;
        padding: 0 !important;
      }
      .action-bar {
        display: none !important;
      }
      .sheet-wrapper {
        box-shadow: none !important;
        border: none !important;
        padding: 0 !important;
        width: 100% !important;
      }
    }
  </style>
</head>
<body>

  <div class="action-bar">
    <div style="text-align: left;">
      <span class="mono" style="font-size: 9px; color: #a855f7; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">OFFLINE BYPASS DIRECT</span>
      <h4 style="font-size: 14px; font-weight: 900; margin-top: 2px;">LIVE TOUR DAY-SHEET MODULE</h4>
    </div>
    <div>
      <button class="btn" onclick="window.print()">PRINT / SAVE AS PDF</button>
    </div>
  </div>

  <div class="sheet-wrapper">
    <div>
      <!-- HEADER -->
      <div class="header-rule">
        <div style="display: flex; justify-content: space-between; align-items: start;">
          <div>
            <p class="mono" style="font-size: 9px; color: #8c52ff; font-weight: bold; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.5px;">
              Artist Touring Day-Sheet • Powered by AI Studio Build
            </p>
            <h1 style="font-size: 24px; font-weight: 900; text-transform: uppercase; line-height: 1; letter-spacing: -0.5px;">
              ${activeBandName.toUpperCase()}
            </h1>
            <p style="font-size: 11px; font-weight: 700; color: #475569; margin-top: 4px;">
              ${show.name}
            </p>
          </div>
          <div style="text-align: right;">
            <span class="mono" style="display: inline-block; background: #000000; color: #ffffff; font-size: 9px; font-weight: bold; padding: 3px 8px; border-radius: 4px; letter-spacing: 0.5px;">
              TM DIRECTORY ID: #${show.id.slice(0, 8).toUpperCase()}
            </span>
            <p class="mono" style="font-size: 10px; font-weight: bold; margin-top: 8px; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">
              Status: ${show.status || 'Active'}
            </p>
          </div>
        </div>

        <div class="grid-3">
          <div>
            <span class="mono label">DATE</span>
            <span class="desc">${dateStr}</span>
          </div>
          <div>
            <span class="mono label">CITY / STATE</span>
            <span class="desc">${show.city || 'Unknown City'}${show.state_province ? `, ${show.state_province}` : ''}</span>
          </div>
          <div>
            <span class="mono label">SHOW TYPE</span>
            <span class="desc" style="text-transform: capitalize;">${show.show_type || 'Tour Date'}</span>
          </div>
        </div>
      </div>

      <!-- TIMELINE -->
      <div class="schedule-matrix-container">
        <!-- LEFT COLUMN: MILESTONES -->
        <div class="matrix-col left-col">
          <div class="col-header" style="margin-bottom: 12px; border-bottom: none; font-size: 9px; color: #64748b; letter-spacing: 1px;">CORE MILESTONES</div>
          <div class="matrix-row">
            <span class="matrix-time">${formatTimePrint(show.load_in_time)}</span>
            <span class="matrix-divider">--</span>
            <span class="matrix-label">LOAD-IN</span>
          </div>
          <div class="matrix-row">
            <span class="matrix-time">${formatTimePrint(show.soundcheck_time)}</span>
            <span class="matrix-divider">--</span>
            <span class="matrix-label">SOUNDCHECK</span>
          </div>
          <div class="matrix-row">
            <span class="matrix-time">${formatTimePrint(show.doors_time)}</span>
            <span class="matrix-divider">--</span>
            <span class="matrix-label">DOORS</span>
          </div>
          <div class="matrix-row">
            <span class="matrix-time">${formatTimePrint(show.merch_call_time)}</span>
            <span class="matrix-divider">--</span>
            <span class="matrix-label">MERCH CALL</span>
          </div>
          <div class="matrix-row">
            <span class="matrix-time" style="color: #ef4444;">${formatTimePrint(show.curfew_time)}</span>
            <span class="matrix-divider">--</span>
            <span class="matrix-label" style="color: #ef4444;">CURFEW</span>
          </div>
        </div>

        <!-- RIGHT COLUMN: STAGE SCHEDULE -->
        <div class="matrix-col">
          <div class="col-header" style="margin-bottom: 12px; border-bottom: none; font-size: 9px; color: #64748b; letter-spacing: 1px;">STAGE RUNNING ORDER</div>
          ${supportActsHtml}
          <div class="matrix-row" style="margin-top: 4px; padding-top: 8px; border-top: 1px dashed #cbd5e1;">
            <span class="matrix-time" style="color: #8c52ff;">${formatTimePrint(show.set_time)}</span>
            <span class="matrix-divider">--</span>
            <span class="matrix-label" style="color: #8c52ff;">${activeBandName.toUpperCase()}</span>
          </div>
        </div>
      </div>

      <!-- MAIN DETAILS -->
      <div class="columns-2">
        <!-- LEFT COLUMN -->
        <div>
          <div class="col-header">Venue Address & Contact</div>
          
          <div class="info-group">
            <span class="mono label">VENUE ADDRESS</span>
            <span class="desc" style="display: block; margin-bottom: 2px;">${show.venue_address || 'TBD Street Name'}</span>
            <span style="color: #475569; font-size: 11px;">${show.city || 'TBD City'}${show.state_province ? `, ${show.state_province}` : ''}${show.country ? ` (${show.country})` : ''}</span>
          </div>

          <div class="info-group">
            <span class="mono label">PROMOTER CONTACT</span>
            <span class="desc" style="display: block;">${show.promoter_contact || 'None Recorded on Agenda'}</span>
          </div>

          <div class="info-group">
            <span class="mono label">WIFI LOGINS (BACKSTAGE)</span>
            ${wifiSectionHtml}
          </div>

          <div class="col-header" style="margin-top: 24px;">Financial Settlement Specs</div>
          <div style="display: grid; grid-template-cols: 1fr 1fr; gap: 14px;">
            <div>
              <span class="mono label">GUARANTEE</span>
              <strong style="font-size: 14px; color: #0f172a;">${show.guarantee_amount ? `$${show.guarantee_amount}` : '$0 (TBD)'}</strong>
            </div>
            <div>
              <span class="mono label">MERCH SPACE FEE</span>
              <strong style="font-size: 14px; color: #0f172a;">${show.merch_space_fee ? `$${show.merch_space_fee}` : '$0 / None'}</strong>
            </div>
            <div>
              <span class="mono label">VENUE CUT</span>
              <strong style="font-size: 14px; color: #ef4444;">${show.venue_cut_percentage !== undefined ? show.venue_cut_percentage : 0}%</strong>
            </div>
            <div>
              <span class="mono label">EST. ATTENDANCE</span>
              <span style="font-size: 13px; font-weight: bold; text-transform: capitalize; color: #0f172a;">${show.expected_attendance || 'Not set'}</span>
            </div>
          </div>
        </div>

        <!-- RIGHT COLUMN -->
        <div>
          <div class="col-header">Backstage Logistics</div>
          
          <div style="display: grid; grid-template-cols: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
            <div>
              <span class="mono label">AGE restrictions</span>
              <strong style="text-transform: uppercase;">${ageRestrictionLabel()}</strong>
            </div>
            <div>
              <span class="mono label">SELLER ARRANGEMENTS</span>
              <strong>${show.seller_cost ? `$${show.seller_cost} Crew cost` : 'Band managed'}</strong>
            </div>
          </div>

          <div class="info-group">
            <span class="mono label">SHORE POWER AVAILABLE</span>
            <span style="font-weight: 500; font-size: 12px;">${show.shore_power ? '✓ Dedicated bus shore power hookups provided' : '✗ Bus generator power only (no hookup)'}</span>
          </div>

          <div class="info-group">
            <span class="mono label">PRODUCTION TABLES OVERVIEW</span>
            <span style="font-weight: 500; font-size: 12px;">${show.tables_provided ? '✓ Yes, merch display tables are fully supplied' : '✗ No tables supplied'}</span>
          </div>

          <div class="info-group">
            <span class="mono label">PARKING ARRANGEMENTS</span>
            <p style="color: #475569; font-size: 11px; line-height: 1.4;">${show.parking_arrangements || 'Bus & Trailer lane load zone parking specified.'}</p>
          </div>

          <div class="col-header" style="margin-top: 24px;">Hospitality & Catering</div>
          <div class="info-group">
             <span class="mono label">DINNER ARRANGEMENTS</span>
             <span class="desc" style="display: block;">${show.dinner_arrangements || 'No custom food notes logged for this date'}</span>
          </div>
          <div class="info-group">
             <span class="mono label">LOCAL FOOD & CREW NOTES</span>
             <div style="font-size: 11px; white-space: pre-wrap; margin-top: 2px;">${show.local_food_notes || 'No custom food notes logged for this date'}</div>
          </div>

          <div class="col-header" style="margin-top: 24px;">Emergency & Medical Logistics</div>
          <div class="info-group">
             <span class="mono label">EMERGENCY MEDICAL INFO</span>
             <div style="font-size: 11px; white-space: pre-wrap; margin-top: 2px; color: #ef4444; font-weight: 600;">${show.emergency_medical_info || 'No custom medical notes logged for this date'}</div>
          </div>
          <div class="info-group">
             <span class="mono label">LOCAL PHARMACY INFO</span>
             <div style="font-size: 11px; white-space: pre-wrap; margin-top: 2px;">${show.local_pharmacy_info || 'No custom pharmacy notes logged for this date'}</div>
          </div>

          <div class="col-header" style="margin-top: 24px;">Gate Guest List (${show.guest_list?.length || 0})</div>
          <table class="details-table">
            ${guestRows}
          </table>
        </div>
      </div>
      
      ${techSpecsHtml}
    </div>

    <!-- FOOTER -->
    <div style="border-top: 2px solid #000000; padding-top: 12px; display: flex; justify-content: space-between; align-items: end; font-family: 'JetBrains Mono', monospace; font-size: 9px; color: #64748b; margin-top: 40px;">
      <div>
        <p style="font-weight: bold; color: #000000; text-transform: uppercase;">${activeBandName} Production</p>
        <p>Generated: ${new Date().toLocaleDateString()} @ ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} UTC</p>
      </div>
      <div style="text-align: right;">
        <p style="font-weight: bold; color: #000000;">PAGE 1 OF 1</p>
        <p style="color: #8c52ff; font-size: 8.5px;">8.5x11 Official Standard Document</p>
      </div>
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 450);
    }
  </script>
</body>
</html>`;

      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `daysheet_${show.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${show.date}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      triggerNotification("💾 Day-Sheet downloaded! Open the file to easily print or print to PDF.");
    } catch (e) {
      console.error(e);
      triggerNotification("Failed to package & download Day-Sheet.");
    }
  };

  const formattedDate = () => {
    try {
      return new Date(show.date).toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return show.date;
    }
  };

  const ageRestrictionLabel = () => {
    if (show.age_restriction === 'all') return 'All Ages Allowed';
    if (show.age_restriction === '18') return '18+ Show Only';
    if (show.age_restriction === '21') return '21+ ID Required';
    return 'All Ages';
  };

  // 8.5x11 page layout structure
  const is24Hr = localStorage.getItem('tour_time_is_24h') !== 'false';
  const formatTimePrint = (timeStr?: string) => {
    if (!timeStr) return 'TBD';
    if (is24Hr) return timeStr;
    const [h, m] = timeStr.split(':');
    if (!h || !m) return timeStr;
    const hNum = parseInt(h, 10);
    const ampm = hNum >= 12 ? 'PM' : 'AM';
    const h12 = hNum % 12 || 12;
    return `${h12}:${m} ${ampm}`;
  };

  const pageContent = (
    <div className="bg-white text-black font-sans border border-zinc-200 shadow-2xl flex flex-col justify-between" style={{ width: '7.5in', height: '10.0in', margin: '0 auto', padding: '0', boxSizing: 'border-box' }}>
      <div>
        {/* HEADER */}
        <div className="border-b-4 border-black pb-3">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-mono tracking-widest text-[#8c52ff] font-bold uppercase leading-none mb-1">
                Artist Touring Day-Sheet • Powered by AI Studio Build
              </p>
              <h1 className="text-2xl font-black tracking-tight uppercase leading-none font-display">
                {activeBandName.toUpperCase()}
              </h1>
              <p className="text-[11px] font-bold font-display text-zinc-650 mt-1 leading-none">
                {show.name}
              </p>
            </div>
            <div className="text-right">
              <span className="inline-block bg-black text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded leading-none">
                TM DIRECTORY ID: #{show.id.slice(0, 8).toUpperCase()}
              </span>
              <p className="text-[11px] font-mono font-bold mt-2 text-zinc-600 uppercase">
                Status: {show.status || 'Active'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-dashed border-zinc-300">
            <div>
              <span className="text-[8px] font-mono text-zinc-400 block uppercase leading-none">DATE</span>
              <span className="text-[11px] font-bold leading-tight block text-zinc-800">{formattedDate()}</span>
            </div>
            <div>
              <span className="text-[8px] font-mono text-zinc-400 block uppercase leading-none">CITY / STATE</span>
              <span className="text-[11px] font-bold leading-tight block text-zinc-800">
                {show.city || 'Unknown City'}{show.state_province ? `, ${show.state_province}` : ''}
              </span>
            </div>
            <div>
              <span className="text-[8px] font-mono text-zinc-400 block uppercase leading-none">SHOW TYPE</span>
              <span className="text-[11px] font-bold leading-tight block capitalize text-zinc-800">{show.show_type || 'Tour Date'}</span>
            </div>
          </div>
        </div>

        {/* TIMELINE MATRIX */}
        <div className="mt-4 bg-zinc-50 border border-zinc-200 p-4 rounded-lg grid grid-cols-2 gap-6">
          <div className="flex flex-col gap-1.5 border-r border-dashed border-zinc-300 pr-6">
            <h2 className="text-[10px] font-mono font-black text-zinc-500 uppercase tracking-widest mb-2 border-b border-transparent">
              CORE MILESTONES
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-mono font-bold text-zinc-500 min-w-[70px]">{formatTimePrint(show.load_in_time)}</span>
              <span className="text-zinc-300">--</span>
              <span className="text-[11px] font-bold text-zinc-900 uppercase">LOAD-IN</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-mono font-bold text-zinc-500 min-w-[70px]">{formatTimePrint(show.soundcheck_time)}</span>
              <span className="text-zinc-300">--</span>
              <span className="text-[11px] font-bold text-zinc-900 uppercase">SOUNDCHECK</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-mono font-bold text-zinc-500 min-w-[70px]">{formatTimePrint(show.doors_time)}</span>
              <span className="text-zinc-300">--</span>
              <span className="text-[11px] font-bold text-zinc-900 uppercase">DOORS</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-mono font-bold text-zinc-500 min-w-[70px]">{formatTimePrint(show.merch_call_time)}</span>
              <span className="text-zinc-300">--</span>
              <span className="text-[11px] font-bold text-zinc-900 uppercase">MERCH CALL</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-mono font-bold text-red-500 min-w-[70px]">{formatTimePrint(show.curfew_time)}</span>
              <span className="text-zinc-300">--</span>
              <span className="text-[11px] font-bold text-red-500 uppercase">CURFEW</span>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <h2 className="text-[10px] font-mono font-black text-zinc-500 uppercase tracking-widest mb-2 border-b border-transparent">
              STAGE RUNNING ORDER
            </h2>
            {show.support_lineup && show.support_lineup.length > 0 ? (
              show.support_lineup.map((band: any, i: number) => (
                <div key={`daysheet-person-${i}`} className="flex items-center gap-3">
                  <span className="text-[11px] font-mono font-bold text-zinc-500 min-w-[100px]">{formatTimePrint(band.start_time)} - {formatTimePrint(band.end_time)}</span>
                  <span className="text-zinc-300">--</span>
                  <span className="text-[11px] font-bold text-zinc-900">{band.name || 'Support'}</span>
                </div>
              ))
            ) : (
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-mono font-bold text-zinc-500 min-w-[100px]">TBD - TBD</span>
                  <span className="text-zinc-300">--</span>
                  <span className="text-[11px] font-bold text-zinc-900">Support (TBD)</span>
                </div>
            )}
            <div className="flex items-center gap-3 mt-1 pt-2 border-t border-dashed border-zinc-300">
              <span className="text-[11px] font-mono font-bold text-[#8c52ff] min-w-[100px]">{formatTimePrint(show.set_time)}</span>
              <span className="text-zinc-300">--</span>
              <span className="text-[11px] font-bold text-[#8c52ff] uppercase">{activeBandName.toUpperCase()}</span>
            </div>
          </div>
        </div>

        {/* MAIN DETAILS columns */}
        <div className="grid grid-cols-2 gap-6 mt-4">
          {/* LEFT COLUMN */}
          <div className="space-y-3">
            <div className="border-b border-zinc-300 pb-1">
              <h3 className="text-[10px] font-mono font-black text-zinc-800 uppercase tracking-wide flex items-center gap-1.5 leading-none">
                <MapPin className="w-3.5 h-3.5 text-zinc-650" /> Venue Address & Contact
              </h3>
            </div>
            <div className="space-y-2 text-[11px]">
              <div>
                <span className="text-[8px] font-mono text-zinc-400 block uppercase leading-none">VENUE ADDRESS</span>
                <p className="font-semibold text-zinc-800 leading-tight mt-0.5">
                  {show.venue_address || 'TBD Street Name'}
                </p>
                <p className="text-zinc-600 leading-tight">
                  {show.city || 'TBD City'}{show.state_province ? `, ${show.state_province}` : ''}{show.country ? ` (${show.country})` : ''}
                </p>
              </div>

              <div>
                <span className="text-[8px] font-mono text-zinc-400 block uppercase leading-none">PROMOTER CONTACT</span>
                <p className="font-semibold text-zinc-800 leading-tight mt-0.5">
                  {show.promoter_contact || 'None Recorded on Agenda'}
                </p>
              </div>

              <div>
                <span className="text-[8px] font-mono text-zinc-400 block uppercase leading-none">WIFI LOGINS (BACKSTAGE)</span>
                {show.wifi_network || show.wifi_password ? (
                  <div className="bg-zinc-150 p-2 rounded border border-zinc-200 mt-1 space-y-1 font-mono text-[10px]">
                    {show.wifi_network && (
                      <div>
                        <span className="text-zinc-500">SSID:</span> <span className="font-bold text-zinc-800">{show.wifi_network}</span>
                      </div>
                    )}
                    {show.wifi_password && (
                      <div>
                        <span className="text-zinc-500">WPA2:</span> <span className="font-bold text-zinc-800">{show.wifi_password}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-zinc-500 italic text-[11px] mt-0.5">No crew WiFi recorded in database.</p>
                )}
              </div>
            </div>

            {/* EXPENSES & GUARANTEES */}
            <div className="border-b border-zinc-300 pb-1.5 pt-2">
              <h3 className="text-xs font-mono font-black text-zinc-800 uppercase tracking-wide flex items-center gap-1.5 leading-none">
                <Coins className="w-3.5 h-3.5 text-zinc-650" /> Financial Settlement Specs
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs leading-none">
              <div>
                <span className="text-[8px] font-mono text-zinc-400 block uppercase mb-1">GUARANTEE</span>
                <span className="text-sm font-black text-zinc-800">{show.guarantee_amount ? `$${show.guarantee_amount}` : '$0 (TBD)'}</span>
              </div>
              <div>
                <span className="text-[8px] font-mono text-zinc-400 block uppercase mb-1">MERCH SPACE FEE</span>
                <span className="text-sm font-semibold text-zinc-800">{show.merch_space_fee ? `$${show.merch_space_fee}` : '$0 / None'}</span>
              </div>
              <div>
                <span className="text-[8px] font-mono text-zinc-400 block uppercase mb-1">VENUE CUT</span>
                <span className="text-sm font-bold text-red-600">{show.venue_cut_percentage !== undefined ? show.venue_cut_percentage : 0}%</span>
              </div>
              <div>
                <span className="text-[8px] font-mono text-zinc-400 block uppercase mb-1">EST. ATTENDANCE</span>
                <span className="text-xs font-bold text-zinc-800 capitalize">{show.expected_attendance || 'Not set'}</span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-4">
            <div className="border-b border-zinc-300 pb-1.5">
              <h3 className="text-xs font-mono font-black text-zinc-800 uppercase tracking-wide flex items-center gap-1.5 leading-none">
                <Layers className="w-3.5 h-3.5 text-zinc-650" /> Backstage Logistics
              </h3>
            </div>
            <div className="space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[8px] font-mono text-zinc-400 block uppercase leading-none">AGE RESTRICTIONS</span>
                  <span className="text-xs font-bold text-zinc-800 block mt-0.5">{ageRestrictionLabel()}</span>
                </div>
                <div>
                  <span className="text-[8px] font-mono text-zinc-400 block uppercase leading-none">SELLER ARRANGEMENTS</span>
                  <span className="text-xs font-bold text-zinc-800 block mt-0.5">{show.seller_cost ? `$${show.seller_cost} Crew cost` : 'Band managed'}</span>
                </div>
              </div>

              <div>
                <span className="text-[8px] font-mono text-zinc-400 block uppercase leading-none">SHORE POWER AVAILABLE</span>
                <span className="text-xs font-semibold text-zinc-800 block mt-0.5">{show.shore_power ? '✓ Dedicated bus shore power hookups provided' : '✗ Bus generator power only (no hookup)'}</span>
              </div>

              <div>
                <span className="text-[8px] font-mono text-zinc-400 block uppercase leading-none">PRODUCTION TABLES OVERVIEW</span>
                <span className="text-xs font-semibold text-zinc-800 block mt-0.5">{show.tables_provided ? '✓ Yes, merch display tables are fully supplied' : '✗ No tables supplied (TM pack custom flight cases)'}</span>
              </div>

              <div>
                <span className="text-[8px] font-mono text-zinc-400 block uppercase leading-none">PARKING ARRANGEMENTS</span>
                <p className="text-zinc-600 text-xs leading-tight mt-0.5">
                  {show.parking_arrangements || 'Bus & Trailer lane load zone parking specified.'}
                </p>
              </div>
            </div>

            {/* HOSPITALITY SECTION */}
            <div className="border-b border-zinc-300 pb-1.5 pt-2 mt-4">
              <h3 className="text-xs font-mono font-black text-zinc-800 uppercase tracking-wide flex items-center gap-1.5 leading-none">
                <Users className="w-3.5 h-3.5 text-amber-600" /> Hospitality & Catering
              </h3>
            </div>
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-[8px] font-mono text-zinc-400 block uppercase leading-none">DINNER ARRANGEMENTS</span>
                <span className="text-xs font-bold text-zinc-800 block mt-0.5">{show.dinner_arrangements || 'No custom food notes logged for this date'}</span>
              </div>
              <div>
                <span className="text-[8px] font-mono text-zinc-400 block uppercase leading-none">LOCAL FOOD & CREW NOTES</span>
                <pre className="text-zinc-600 text-xs leading-tight mt-0.5 whitespace-pre-wrap font-sans">{show.local_food_notes || 'No custom food notes logged for this date'}</pre>
              </div>
            </div>

            {/* EMERGENCY SECTION */}
            <div className="border-b border-zinc-300 pb-1.5 pt-2 mt-4">
              <h3 className="text-xs font-mono font-black text-zinc-800 uppercase tracking-wide flex items-center gap-1.5 leading-none">
                <MapPin className="w-3.5 h-3.5 text-rose-600" /> Emergency & Medical Logistics
              </h3>
            </div>
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-[8px] font-mono text-zinc-400 block uppercase leading-none">EMERGENCY MEDICAL INFO</span>
                <pre className="text-red-500 font-semibold text-xs leading-tight mt-0.5 whitespace-pre-wrap font-sans">{show.emergency_medical_info || 'No custom medical notes logged for this date'}</pre>
              </div>
              <div>
                <span className="text-[8px] font-mono text-zinc-400 block uppercase leading-none">LOCAL PHARMACY INFO</span>
                <pre className="text-zinc-600 text-xs leading-tight mt-0.5 whitespace-pre-wrap font-sans">{show.local_pharmacy_info || 'No custom pharmacy notes logged for this date'}</pre>
              </div>
            </div>

            {/* PRE-REGISTERED GUEST LIST SECTION */}
            <div className="border-b border-zinc-300 pb-1.5 pt-2 mt-4">
              <h3 className="text-xs font-mono font-black text-zinc-800 uppercase tracking-wide flex items-center gap-1.5 leading-none">
                <Users className="w-3.5 h-3.5 text-zinc-650" /> Gate Guest List ({show.guest_list?.length || 0})
              </h3>
            </div>
            <div className="space-y-1">
              {!show.guest_list || show.guest_list.length === 0 ? (
                <p className="text-zinc-500 italic text-[11px] leading-snug">No attendees currently registered on the gate guest list.</p>
              ) : (
                <div className="max-h-36 overflow-hidden border border-zinc-200 rounded divide-y divide-zinc-200 text-[10px] font-mono">
                  {show.guest_list.slice(0, 4).map((guest, idx) => (
                    <div key={guest.id || idx} className="flex justify-between items-center py-1 px-2 bg-zinc-50/50">
                      <span className="font-bold text-zinc-800 truncate max-w-[120px]">{guest.name}</span>
                      <span className="text-zinc-500 bg-zinc-200 px-1 rounded text-[8px]">{guest.access_type || 'General'}</span>
                      <span className="font-extrabold text-zinc-900">+{guest.additional_count}</span>
                    </div>
                  ))}
                  {show.guest_list.length > 4 && (
                    <div className="p-1 px-1.5 bg-[#8c52ff]/5 text-center text-[#8c52ff] font-bold text-[8.5px]">
                      + {show.guest_list.length - 4} MORE REGISTERED IN BACKEND DIRECTORY
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* TECHNICAL & PRODUCTION SPECIFICATIONS */}
        <div className="mt-4 pt-1">
          <h4 className="text-[10px] font-mono font-black text-zinc-500 uppercase tracking-widest border-b border-zinc-300 pb-1 flex items-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#8c52ff]"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg> 
            TECHNICAL & PRODUCTION SPECIFICATIONS
          </h4>
          <div className="grid grid-cols-2 mt-2 border border-zinc-200 rounded-lg overflow-hidden bg-zinc-50 shadow-sm">
            <div className="p-3 border-r border-dashed border-zinc-200">
              <span className="text-[8px] font-mono font-bold text-zinc-400 block uppercase leading-none mb-1.5">AUDIO & PRODUCTION REQUIREMENTS</span>
              <p className="text-[10px] font-mono text-zinc-700 leading-normal whitespace-pre-wrap">
                {show.audio_production_requirements?.trim() || "Standard production / local backline rules apply"}
              </p>
            </div>
            <div className="p-3 bg-white">
              <span className="text-[8px] font-mono font-bold text-zinc-400 block uppercase leading-none mb-1.5 flex justify-between">STAGE BACKLINE SPECS</span>
              <p className="text-[10px] font-mono text-zinc-700 leading-normal whitespace-pre-wrap">
                {show.stage_backline_requirements?.trim() || "Standard production / local backline rules apply"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER SIGN OFF */}
      <div className="border-t border-black pt-3 flex justify-between items-end text-[9px] font-mono text-zinc-400 mt-auto">
        <div>
          <p className="font-bold uppercase text-zinc-850 tracking-wide leading-none">{activeBandName} Production</p>
          <p className="leading-none mt-1">Generated: {new Date().toLocaleDateString()} @ {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} UTC</p>
        </div>
        <div className="text-right">
          <p className="leading-none text-zinc-800 font-bold">PAGE 1 OF 1</p>
          <p className="leading-none text-[8.5px] mt-1 text-[#8c52ff]">8.5x11 Official Standard Document</p>
        </div>
      </div>
    </div>
  );

  const mobileContent = (
    <div className="w-full text-left space-y-6 font-sans">
      {/* HEADER HERO */}
      <div className="bg-gradient-to-r from-zinc-900 via-purple-950/25 to-zinc-900 border border-zinc-800 p-5 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-3">
          <span className="bg-purple-900/40 border border-purple-500/30 text-purple-300 font-mono text-[9px] font-black uppercase px-2.5 py-1 rounded">
            {show.show_type || 'Tour Date'}
          </span>
        </div>
        <span className="text-[10px] font-mono tracking-widest text-[#00ffcc] font-black uppercase block mb-1">
          CREW DIRECTIVE DASHBOARD
        </span>
        <h1 className="text-2xl font-black text-white uppercase tracking-tight leading-none mb-1">
          {activeBandName.toUpperCase()}
        </h1>
        <p className="text-sm font-semibold text-zinc-300">
          {show.name}
        </p>
        
        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-zinc-800/80 text-xs">
          <div>
            <span className="text-zinc-500 font-mono uppercase block text-[9px]">Date</span>
            <span className="text-zinc-200 font-semibold">{formattedDate()}</span>
          </div>
          <div>
            <span className="text-zinc-500 font-mono uppercase block text-[9px]">Location</span>
            <span className="text-zinc-200 font-semibold">{show.city || 'Unknown'}{show.state_province ? `, ${show.state_province}` : ''}</span>
          </div>
        </div>
      </div>

      {/* CORE TIMELINE */}
      <div className="bg-zinc-950 border border-zinc-850 p-5 rounded-2xl space-y-4">
        <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider border-b border-zinc-900 pb-2 flex items-center gap-2">
          <Clock className="w-4 h-4 text-purple-400" />
          Core Day Schedule
        </h4>
        <div className="relative border-l-2 border-zinc-900 ml-2.5 pl-5 py-1.5 space-y-5">
          {/* Load-In */}
          <div className="relative">
            <span className="absolute -left-[27px] top-0.5 w-3 h-3 rounded-full bg-zinc-850 border-2 border-zinc-950" />
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 font-mono text-xs uppercase">Load-In</span>
              <span className="font-mono text-sm text-zinc-100 font-bold bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">{formatTimePrint(show.load_in_time)}</span>
            </div>
          </div>
          {/* Soundcheck */}
          <div className="relative">
            <span className="absolute -left-[27px] top-0.5 w-3 h-3 rounded-full bg-zinc-800 border-2 border-zinc-950" />
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 font-mono text-xs uppercase">Soundcheck</span>
              <span className="font-mono text-sm text-zinc-100 font-bold bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">{formatTimePrint(show.soundcheck_time)}</span>
            </div>
          </div>
          {/* Doors */}
          <div className="relative">
            <span className="absolute -left-[27px] top-0.5 w-3 h-3 rounded-full bg-teal-500 border-2 border-zinc-950 animate-pulse" />
            <div className="flex items-center justify-between">
              <span className="text-teal-400 font-mono text-xs uppercase font-bold">Doors Open</span>
              <span className="font-mono text-sm text-teal-300 font-bold bg-teal-950/20 border border-teal-500/30 px-2 py-0.5 rounded">{formatTimePrint(show.doors_time)}</span>
            </div>
          </div>
          
          {/* Support Lineup */}
          {show.support_lineup && show.support_lineup.length > 0 && show.support_lineup.map((band: any, idx: number) => (
            <div className="relative" key={`daysheet-rel-${idx}`}>
              <span className="absolute -left-[27px] top-0.5 w-3 h-3 rounded-full bg-zinc-700 border-2 border-zinc-950" />
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 font-mono text-xs uppercase">Support: {band.name || 'Opening Act'}</span>
                <span className="font-mono text-sm text-zinc-350 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800/60">
                  {formatTimePrint(band.start_time)} - {formatTimePrint(band.end_time)}
                </span>
              </div>
            </div>
          ))}

          {/* Headline Set Time */}
          <div className="relative">
            <span className="absolute -left-[27px] top-0.5 w-3.5 h-3.5 rounded-full bg-purple-500 border-2 border-zinc-950 shadow-[0_0_8px_#8c52ff]" />
            <div className="flex items-center justify-between">
              <span className="text-purple-400 font-mono text-xs uppercase font-black">{activeBandName} Headline</span>
              <span className="font-mono text-sm text-white font-black bg-purple-900/30 border border-purple-500/40 px-2.5 py-0.5 rounded shadow-[0_0_10px_rgba(140,82,255,0.15)]">{formatTimePrint(show.set_time)}</span>
            </div>
          </div>

          {/* Merch Call */}
          <div className="relative">
            <span className="absolute -left-[27px] top-0.5 w-3 h-3 rounded-full bg-zinc-800 border-2 border-zinc-950" />
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 font-mono text-xs uppercase">Merch Call</span>
              <span className="font-mono text-sm text-zinc-100 font-bold bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">{formatTimePrint(show.merch_call_time)}</span>
            </div>
          </div>

          {/* Curfew */}
          <div className="relative">
            <span className="absolute -left-[27px] top-0.5 w-3 h-3 rounded-full bg-red-500 border-2 border-zinc-950 animate-pulse" />
            <div className="flex items-center justify-between">
              <span className="text-red-400 font-mono text-xs uppercase font-bold">Curfew / Load Out</span>
              <span className="font-mono text-sm text-red-300 font-bold bg-red-950/20 border border-red-500/30 px-2 py-0.5 rounded">{formatTimePrint(show.curfew_time)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* WIFI PASSWORDS & PRODUCTION INFO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-zinc-950 border border-zinc-850 p-5 rounded-2xl space-y-3.5">
          <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider border-b border-zinc-900 pb-2 flex items-center gap-2">
            <Wifi className="w-4 h-4 text-emerald-400" />
            Crew WiFi Logins
          </h4>
          {show.wifi_network || show.wifi_password ? (
            <div className="space-y-2 text-xs font-mono">
              {show.wifi_network && (
                <div className="flex justify-between items-center bg-zinc-900/50 p-2.5 rounded border border-zinc-800/80">
                  <span className="text-zinc-500 uppercase text-[9px]">SSID Network</span>
                  <span className="text-emerald-400 font-black tracking-wide select-all cursor-pointer hover:underline" onClick={() => { navigator.clipboard.writeText(show.wifi_network || ''); triggerNotification("Copied WiFi Network name!"); }}>
                    {show.wifi_network}
                  </span>
                </div>
              )}
              {show.wifi_password && (
                <div className="flex justify-between items-center bg-zinc-900/50 p-2.5 rounded border border-zinc-800/80">
                  <span className="text-zinc-500 uppercase text-[9px]">WPA2 Password</span>
                  <span className="text-zinc-100 font-black tracking-wide select-all cursor-pointer hover:underline" onClick={() => { navigator.clipboard.writeText(show.wifi_password || ''); triggerNotification("Copied WiFi Password!"); }}>
                    {show.wifi_password}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-zinc-500 italic py-2 font-mono">No backstage crew WiFi credentials logged for this stop.</p>
          )}
        </div>

        {/* VENUE DETAILS & CONTACT */}
        <div className="bg-zinc-950 border border-zinc-850 p-5 rounded-2xl space-y-3.5">
          <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider border-b border-zinc-900 pb-2 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-400" />
            Venue & Promoter Contact
          </h4>
          <div className="space-y-2 text-xs font-sans">
            <div>
              <span className="text-zinc-500 font-mono uppercase text-[9px] block">Venue Address</span>
              <span className="text-zinc-200 font-semibold block">{show.venue_address || 'TBA Street'}</span>
              <span className="text-zinc-400 text-xs block">{show.city || 'TBD'}{show.state_province ? `, ${show.state_province}` : ''}</span>
              <button 
                onClick={() => {
                  const query = encodeURIComponent(`${show.venue_address || ''} ${show.city || ''} ${show.state_province || ''}`.trim());
                  if (query) {
                    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
                  }
                }}
                className="mt-2 text-[10px] text-blue-400 font-mono uppercase hover:underline flex items-center gap-1 cursor-pointer"
              >
                Open in Maps ➔
              </button>
            </div>
            {show.promoter_contact && (
              <div className="pt-2 border-t border-zinc-900">
                <span className="text-zinc-500 font-mono uppercase text-[9px] block">Promoter Rep / Phone</span>
                <span className="text-zinc-200 font-mono text-[11px] font-bold select-all">{show.promoter_contact}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* BACKSTAGE LOGISTICS */}
      <div className="bg-zinc-950 border border-zinc-850 p-5 rounded-2xl space-y-4">
        <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider border-b border-zinc-900 pb-2 flex items-center gap-2">
          <Layers className="w-4 h-4 text-amber-400" />
          Technical & Show Logistics
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-sans">
          <div className="bg-zinc-900/40 p-3 rounded-xl border border-zinc-900">
            <span className="text-zinc-500 font-mono uppercase text-[9px] block mb-1">Age Limits</span>
            <span className="text-zinc-100 font-bold uppercase">{ageRestrictionLabel()}</span>
          </div>
          <div className="bg-zinc-900/40 p-3 rounded-xl border border-zinc-900">
            <span className="text-zinc-500 font-mono uppercase text-[9px] block mb-1">Shore Power</span>
            <span className={`font-bold ${show.shore_power ? 'text-emerald-400' : 'text-zinc-400'}`}>
              {show.shore_power ? 'Yes (Bus line)' : 'Bus Gen Only'}
            </span>
          </div>
          <div className="bg-zinc-900/40 p-3 rounded-xl border border-zinc-900">
            <span className="text-zinc-500 font-mono uppercase text-[9px] block mb-1">Merch Tables</span>
            <span className="text-zinc-100 font-bold">
              {show.tables_provided ? 'Provided (✓)' : 'Bring Own (✗)'}
            </span>
          </div>
          <div className="bg-zinc-900/40 p-3 rounded-xl border border-zinc-900">
            <span className="text-zinc-500 font-mono uppercase text-[9px] block mb-1">Merch Seller</span>
            <span className="text-zinc-100 font-bold">
              {show.seller_cost ? `$${show.seller_cost} Fee` : 'Band Managed'}
            </span>
          </div>
        </div>

        {show.parking_arrangements && (
          <div className="pt-3 border-t border-zinc-900 text-xs">
            <span className="text-zinc-500 font-mono uppercase text-[9px] block mb-1">Parking & Loading Instructions</span>
            <p className="text-zinc-300 leading-relaxed font-mono text-[11px] bg-zinc-900/30 p-2.5 rounded border border-zinc-900/80">
              {show.parking_arrangements}
            </p>
          </div>
        )}
      </div>

      {/* CATERING & HOSPITALITY */}
      {(show.dinner_arrangements || show.local_food_notes) && (
        <div className="bg-zinc-950 border border-zinc-850 p-5 rounded-2xl space-y-3.5">
          <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider border-b border-zinc-900 pb-2 flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" />
            Hospitality & Catering
          </h4>
          <div className="space-y-3 text-xs font-sans">
            {show.dinner_arrangements && (
              <div>
                <span className="text-zinc-500 font-mono uppercase text-[9px] block">Dinner Arrangements</span>
                <p className="text-zinc-200 font-semibold mt-0.5">{show.dinner_arrangements}</p>
              </div>
            )}
            {show.local_food_notes && (
              <div>
                <span className="text-zinc-500 font-mono uppercase text-[9px] block">Local Food / Buyouts Notes</span>
                <p className="text-zinc-300 leading-relaxed font-mono text-[11px] whitespace-pre-wrap mt-1 bg-zinc-900/30 p-2.5 rounded border border-zinc-900/80">
                  {show.local_food_notes}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TECH REQUIREMENTS */}
      {(show.audio_production_requirements || show.stage_backline_requirements) && (
        <div className="bg-zinc-950 border border-zinc-850 p-5 rounded-2xl space-y-4">
          <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider border-b border-zinc-900 pb-2 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-400" />
            Production & Backline requirements
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {show.audio_production_requirements && (
              <div>
                <span className="text-zinc-500 font-mono uppercase text-[9px] block mb-1">Audio & Production Specs</span>
                <p className="text-zinc-300 font-mono text-[10.5px] leading-relaxed whitespace-pre-wrap bg-zinc-900/30 p-3 rounded-xl border border-zinc-900/80 max-h-[150px] overflow-y-auto">
                  {show.audio_production_requirements}
                </p>
              </div>
            )}
            {show.stage_backline_requirements && (
              <div>
                <span className="text-zinc-500 font-mono uppercase text-[9px] block mb-1">Stage Backline Specs</span>
                <p className="text-zinc-300 font-mono text-[10.5px] leading-relaxed whitespace-pre-wrap bg-zinc-900/30 p-3 rounded-xl border border-zinc-900/80 max-h-[150px] overflow-y-auto">
                  {show.stage_backline_requirements}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FINANCIAL SPECS */}
      <div className="bg-zinc-950 border border-zinc-850 p-5 rounded-2xl space-y-3.5">
        <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider border-b border-zinc-900 pb-2 flex items-center gap-2">
          <Coins className="w-4 h-4 text-[#00ffcc]" />
          Financial Settlement Info
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs">
          <div className="bg-zinc-900/40 p-3 rounded-xl border border-zinc-900">
            <span className="text-zinc-500 uppercase text-[8px] block mb-1">Guarantee</span>
            <span className="text-[#00ffcc] font-bold text-sm block">
              {show.guarantee_amount ? `$${show.guarantee_amount}` : '$0 (TBD)'}
            </span>
          </div>
          <div className="bg-zinc-900/40 p-3 rounded-xl border border-zinc-900">
            <span className="text-zinc-500 uppercase text-[8px] block mb-1">Venue Merch Cut</span>
            <span className="text-red-400 font-bold text-sm block">
              {show.venue_cut_percentage !== undefined ? `${show.venue_cut_percentage}%` : '0%'}
            </span>
          </div>
          <div className="bg-zinc-900/40 p-3 rounded-xl border border-zinc-900">
            <span className="text-zinc-500 uppercase text-[8px] block mb-1">Merch Space Fee</span>
            <span className="text-zinc-300 font-bold text-sm block">
              {show.merch_space_fee ? `$${show.merch_space_fee}` : '$0'}
            </span>
          </div>
          <div className="bg-zinc-900/40 p-3 rounded-xl border border-zinc-900">
            <span className="text-zinc-500 uppercase text-[8px] block mb-1">Expected Attendance</span>
            <span className="text-zinc-300 font-bold text-sm block capitalize">
              {show.expected_attendance || 'Not set'}
            </span>
          </div>
        </div>
      </div>

      {/* GATE GUEST LIST */}
      <div className="bg-zinc-950 border border-zinc-850 p-5 rounded-2xl space-y-3">
        <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider border-b border-zinc-900 pb-2 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Contact className="w-4 h-4 text-purple-400" />
            Gate Guest List
          </span>
          <span className="bg-purple-950/40 border border-purple-500/20 text-purple-300 px-2 py-0.5 rounded text-[10px]">
            {show.guest_list?.length || 0} registered
          </span>
        </h4>
        
        {show.guest_list && show.guest_list.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-zinc-900 bg-zinc-900/20">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-zinc-900/80 border-b border-zinc-850 text-zinc-500 uppercase text-[9px]">
                <tr>
                  <th className="p-2.5">Attendee Name</th>
                  <th className="p-2.5">Pass Access</th>
                  <th className="p-2.5 text-right">Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900 text-zinc-300">
                {show.guest_list.map((guest: any, idx: number) => (
                  <tr key={`daysheet-row-${idx}`} className="hover:bg-zinc-900/40">
                    <td className="p-2.5 font-bold text-white">{guest.name}</td>
                    <td className="p-2.5 text-zinc-400">{guest.access_type || 'General'}</td>
                    <td className="p-2.5 text-right font-black text-purple-400">+{guest.additional_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-zinc-500 italic py-2 font-mono">Guest list is empty for this performance.</p>
        )}
      </div>

      {/* EMERGENCY & MEDICAL */}
      {(show.emergency_medical_info || show.local_pharmacy_info) && (
        <div className="bg-zinc-950 border border-zinc-850 p-5 rounded-2xl space-y-3">
          <h4 className="text-xs font-mono font-bold text-[#ef4444] uppercase tracking-wider border-b border-zinc-900 pb-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            Crew Medical & Emergency Info
          </h4>
          <div className="space-y-3 text-xs">
            {show.emergency_medical_info && (
              <div>
                <span className="text-zinc-500 font-mono uppercase text-[9px] block">Emergency medical / Hospital info</span>
                <p className="text-red-400 leading-relaxed font-mono font-bold bg-red-950/20 border border-red-500/20 p-2.5 rounded-xl mt-1 select-all">
                  {show.emergency_medical_info}
                </p>
              </div>
            )}
            {show.local_pharmacy_info && (
              <div>
                <span className="text-zinc-500 font-mono uppercase text-[9px] block">Nearest Local Pharmacy</span>
                <p className="text-zinc-300 font-mono leading-relaxed bg-zinc-900/30 p-2.5 rounded-xl mt-1 select-all border border-zinc-900">
                  {show.local_pharmacy_info}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto no-print">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity" 
      />

      <div className="flex min-h-full items-center justify-center p-4">
        {/* Modal styling */}
        <div className="relative transform overflow-hidden bg-zinc-950 border border-zinc-800 p-5 rounded-2xl shadow-xl transition-all w-full max-w-4xl flex flex-col items-center">
          
          {/* Header Controls */}
          <div className="flex justify-between items-center w-full pb-4 border-b border-zinc-800/80 mb-4">
            <div className="text-left space-y-0.5 animate-fade-in">
              <h3 className="text-sm font-mono font-bold text-purple-400 uppercase tracking-wider">Day-Sheet Portal</h3>
              <p className="text-[11px] text-zinc-500 font-sans">
                Review day-of-show timeline details, crew passes, backline logistics, and printable PDF formats.
              </p>
            </div>
            <button 
              onClick={onClose}
              className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* VIEW MODE TOGGLE */}
          <div className="flex w-full border border-zinc-850 rounded-xl overflow-hidden p-1 bg-black mb-4 gap-1">
            <button
              onClick={() => {
                setViewMode('mobile');
                triggerNotification("Switched to mobile-friendly day-sheet.");
              }}
              className={`flex-1 py-2.5 text-[10px] sm:text-xs font-mono font-black tracking-wider uppercase rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                viewMode === 'mobile'
                  ? 'bg-[#8c52ff] text-white shadow-lg'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              Simplified Crew Mobile Sheet
            </button>
            <button
              onClick={() => {
                setViewMode('document');
                triggerNotification("Switched to standard 8.5x11 PDF preview.");
              }}
              className={`flex-1 py-2.5 text-[10px] sm:text-xs font-mono font-black tracking-wider uppercase rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                viewMode === 'document'
                  ? 'bg-[#8c52ff] text-white shadow-lg'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              Official 8.5x11 Print Preview
            </button>
          </div>

          {viewMode === 'document' ? (
            <>
              {/* Dynamic Zoom Toolbar */}
              <div className="flex flex-wrap items-center justify-between w-full bg-zinc-900 border border-zinc-800/80 p-2.5 rounded-xl mb-4 gap-2 text-xs font-mono">
                <div className="flex items-center gap-1.5 bg-black/30 px-3 py-1.5 rounded-lg border border-zinc-800">
                  <span className="text-zinc-500 font-bold uppercase text-[9px] tracking-wider">Zoom factor</span>
                  <button
                    onClick={() => setZoomScale(Math.max(0.3, Number((zoomScale - 0.05).toFixed(2))))}
                    className="w-5 h-5 flex items-center justify-center bg-zinc-850 hover:bg-zinc-750 text-zinc-200 rounded border border-zinc-700 font-black cursor-pointer text-xs"
                    title="Zoom Out"
                  >
                    -
                  </button>
                  <span className="font-bold text-purple-400 min-w-10 text-center text-xs">
                    {Math.round(zoomScale * 100)}%
                  </span>
                  <button
                    onClick={() => setZoomScale(Math.min(1.2, Number((zoomScale + 0.05).toFixed(2))))}
                    className="w-5 h-5 flex items-center justify-center bg-zinc-850 hover:bg-zinc-750 text-zinc-200 rounded border border-zinc-700 font-black cursor-pointer text-xs"
                    title="Zoom In"
                  >
                    +
                  </button>
                </div>

                <div className="flex items-center gap-1 bg-black/20 p-1 rounded-lg border border-zinc-800/60">
                  <button
                    onClick={() => setZoomScale(0.4)}
                    className={`px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider rounded transition-all cursor-pointer ${
                      zoomScale === 0.4 ? 'bg-[#8c52ff] text-white shadow-md' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/70'
                    }`}
                  >
                    Tiny (40%)
                  </button>
                  <button
                    onClick={() => setZoomScale(0.55)}
                    className={`px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider rounded transition-all cursor-pointer ${
                      zoomScale === 0.55 ? 'bg-[#8c52ff] text-white shadow-md' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/70'
                    }`}
                  >
                    Fit (55%)
                  </button>
                  <button
                    onClick={() => setZoomScale(0.75)}
                    className={`px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider rounded transition-all cursor-pointer ${
                      zoomScale === 0.75 ? 'bg-[#8c52ff] text-white shadow-md' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/70'
                    }`}
                  >
                    Mid (75%)
                  </button>
                  <button
                    onClick={() => setZoomScale(1.0)}
                    className={`px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider rounded transition-all cursor-pointer ${
                      zoomScale === 1.0 ? 'bg-[#8c52ff] text-white shadow-md' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/70'
                    }`}
                  >
                    Full (100%)
                  </button>
                </div>
              </div>

              {/* Interactive Scaled Piece of Paper */}
              <div className="w-full overflow-auto flex justify-center py-4 bg-zinc-900 border border-zinc-800/50 rounded-xl max-h-[58vh] scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-zinc-900">
                <div 
                  className="flex justify-center items-start origin-top transition-all duration-250 ease-out"
                  style={{
                    width: `${816 * zoomScale}px`,
                    height: `${1056 * zoomScale}px`,
                    overflow: 'hidden'
                  }}
                >
                  <div 
                    style={{
                      transform: `scale(${zoomScale})`,
                      transformOrigin: 'top center',
                      width: '816px',
                      height: '1056px',
                      flexShrink: 0
                    }}
                  >
                    {pageContent}
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Interactive Mobile-Friendly Crew Sheet */
            <div className="w-full overflow-y-auto pr-1 py-1 max-h-[58vh] scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-zinc-900">
              {mobileContent}
            </div>
          )}

          {/* PRINT & CLOSING OPERATIONS PANEL */}
          <div className="w-full flex flex-col sm:flex-row gap-3 pt-5 mt-5 border-t border-zinc-800/80">
            <button
              onClick={handlePrint}
              type="button"
              className="bg-[#181d26] hover:bg-[#212733] border border-zinc-850 text-zinc-300 px-6 py-3.5 transition rounded-xl font-mono text-xs uppercase flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Printer className="w-4 h-4" />
              System Print Dialog
            </button>
            <button
              onClick={handleDownloadHTML}
              type="button"
              className="flex-1 bg-[#8c52ff] hover:bg-[#7b42ea] text-white py-3.5 transition rounded-xl font-display font-black text-xs tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(140,82,255,0.22)]"
            >
              <Download className="w-4.5 h-4.5" />
              DOWNLOAD PRINTABLE DAY-SHEET
            </button>
            <button
              onClick={onClose}
              type="button"
              className="px-6 bg-transparent hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-850 py-3.5 transition rounded-xl font-mono text-xs uppercase cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Actual Hidden Portal target in document body used for the clean window.print override */}
      {portalElement && createPortal(
        <div className="hidden">
          {pageContent}
        </div>,
        portalElement
      )}
    </div>
  );
}
