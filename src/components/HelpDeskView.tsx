import React, { useState } from 'react';
import { motion } from 'motion/react';
import { HelpCircle, ChevronLeft, ChevronRight, CheckCircle, Bug, Lightbulb, MessageSquare, Book, Settings, DollarSign, Package, Calendar, Route, Send, ArrowLeft, Mail, Coins, QrCode, Plane, Music, Lock, Shield, RefreshCw, Users, Building } from 'lucide-react';

interface HelpDeskViewProps {
  onBack: () => void;
  triggerNotification?: (msg: string) => void;
  portalType?: 'band' | 'label' | 'promoter' | 'creative';
}

const LABEL_TOPICS = [
  {
    id: 'roster-mgmt',
    title: 'Roster Signing & Act Onboarding',
    icon: Users,
    color: 'text-indigo-400',
    content: (
      <div className="space-y-3.5 text-xs font-mono text-zinc-400">
        <p className="text-zinc-500 uppercase text-[9px] font-bold tracking-wider border-b border-zinc-800 pb-1.5">Simplified Step-by-Step Walkthrough</p>
        <div className="space-y-2.5">
          <div>
            <strong className="text-indigo-400 font-bold block mb-0.5">Step 1: Onboard Roster Acts</strong>
            <p>From the active Label Console, input comma-separated signed bands or solo acts to associate their records. Bandmates can then be authorized as collaborators with write permissions.</p>
          </div>
          <div>
            <strong className="text-indigo-400 font-bold block mb-0.5">Step 2: Sign Subsidiary Sub-Labels</strong>
            <p>Under corporate registry, you can define sub-labels (e.g. imprint brands) to nest accounts, manage separate release divisions, and assign distinct imprint rosters.</p>
          </div>
          <div>
            <strong className="text-indigo-400 font-bold block mb-0.5">Step 3: Define Roster Tickers</strong>
            <p>Configure the scrolling text marquee ticker in the social feed settings. This serves as a unified corporate broadcast to fans and promoters across the Nexus network.</p>
          </div>
          <div>
            <strong className="text-indigo-400 font-bold block mb-0.5">Step 4: Audit Live Act Status</strong>
            <p>Monitor signed bands' current subscription tier, active tour tracks, collaborators count, and regional activity records directly within your main control console.</p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'catalog-mgmt',
    title: 'Catalog & Global Release Schedules',
    icon: Music,
    color: 'text-pink-400',
    content: (
      <div className="space-y-3.5 text-xs font-mono text-zinc-400">
        <p className="text-zinc-500 uppercase text-[9px] font-bold tracking-wider border-b border-zinc-800 pb-1.5">Simplified Step-by-Step Walkthrough</p>
        <div className="space-y-2.5">
          <div>
            <strong className="text-pink-400 font-bold block mb-0.5">Step 1: Release Form Intakes</strong>
            <p>Navigate to "Catalog". Select "Add Release" to input EP/Album titles, track counts, release dates, UPC codes, and assign them to signed roster artists.</p>
          </div>
          <div>
            <strong className="text-pink-400 font-bold block mb-0.5">Step 2: Track Split Registrations</strong>
            <p>Specify contract mechanical & master royalty share values (e.g., 50/50, 70/30) directly during track intake to automate digital storefront distribution payouts.</p>
          </div>
          <div>
            <strong className="text-pink-400 font-bold block mb-0.5">Step 3: Digital Asset Uploads</strong>
            <p>Associate digital audio formats (wav/mp3) and 1:1 high-resolution album cover artwork assets with your releases to feed the direct-to-fan storefront catalogs.</p>
          </div>
          <div>
            <strong className="text-pink-400 font-bold block mb-0.5">Step 4: Launch Digital Distribution</strong>
            <p>Lock and publish releases to push them to the label's storefront catalog instantly. Sub-labels automatically sync with the master catalog list.</p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'royalty-distributions',
    title: 'Royalty Distributions & Artist Splits',
    icon: Coins,
    color: 'text-amber-400',
    content: (
      <div className="space-y-3.5 text-xs font-mono text-zinc-400">
        <p className="text-zinc-500 uppercase text-[9px] font-bold tracking-wider border-b border-zinc-800 pb-1.5">Simplified Step-by-Step Walkthrough</p>
        <div className="space-y-2.5">
          <div>
            <strong className="text-amber-400 font-bold block mb-0.5">Step 1: Aggregate Storefront Sales</strong>
            <p>The label accounting system aggregates digital store credit card processing, local POS touring merch sales, and physical album distributions into a unified treasury.</p>
          </div>
          <div>
            <strong className="text-amber-400 font-bold block mb-0.5">Step 2: Run Automated Royalty Split Calculators</strong>
            <p>The system reviews release-specific contracts and automates splits. It divides physical manufacturing wholesale cost offsets and deducts promoter settlement cuts before calculating payout splits.</p>
          </div>
          <div>
            <strong className="text-amber-400 font-bold block mb-0.5">Step 3: Process Direct payouts</strong>
            <p>Directly transfer due balances to artist/band cash accounts. Choose "Cash Transfer" or utilize connected digital balance APIs under the "Finance" tab.</p>
          </div>
          <div>
            <strong className="text-amber-400 font-bold block mb-0.5">Step 4: Export Master Financial Ledgers</strong>
            <p>Save and export full corporate ledger breakdowns, including processing fees, state tax allocations, shipping costs, and remaining label net profits for corporate tax reviews.</p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'merchant-processor',
    title: 'Merchant Gateway & Payment Processors',
    icon: DollarSign,
    color: 'text-emerald-400',
    content: (
      <div className="space-y-3.5 text-xs font-mono text-zinc-400">
        <p className="text-zinc-500 uppercase text-[9px] font-bold tracking-wider border-b border-zinc-800 pb-1.5">Simplified Step-by-Step Walkthrough</p>
        <div className="space-y-2.5">
          <div>
            <strong className="text-emerald-400 font-bold block mb-0.5">Step 1: Connect Stripe & PayPal OAuth</strong>
            <p>Under "Merchant Settings", click to initiate Stripe or PayPal OAuth verification. This links the label's corporate checking accounts to accept real-world credit cards and mobile QR checkout scans.</p>
          </div>
          <div>
            <strong className="text-emerald-400 font-bold block mb-0.5">Step 2: Define Flat & Percent Surcharges</strong>
            <p>Configure custom handling charges or payment gateway fee buffers (e.g. 2.9% + $0.30) to bypass card processor transaction overheads.</p>
          </div>
          <div>
            <strong className="text-emerald-400 font-bold block mb-0.5">Step 3: Implement Country Taxes</strong>
            <p>Input regional sales tax rates. State and country tax metrics automatically update on physical sales based on customer geolocation during digital storefront checkouts.</p>
          </div>
          <div>
            <strong className="text-emerald-400 font-bold block mb-0.5">Step 4: Enable NFC Reader Proximity Services</strong>
            <p>Tether physical card reader accessories over Bluetooth in the settings portal to accept local contactless tap-to-pay checkouts during physical tour events.</p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'consolidated-inventory',
    title: 'Consolidated Merch & Global Inventory',
    icon: Package,
    color: 'text-blue-400',
    content: (
      <div className="space-y-3.5 text-xs font-mono text-zinc-400">
        <p className="text-zinc-500 uppercase text-[9px] font-bold tracking-wider border-b border-zinc-800 pb-1.5">Simplified Step-by-Step Walkthrough</p>
        <div className="space-y-2.5">
          <div>
            <strong className="text-blue-400 font-bold block mb-0.5">Step 1: Master Style Cataloging</strong>
            <p>Register all physical products, vinyl records, apparel, and merchandise styles within the master catalog. Define wholesale manufacturing costs to correctly capture label margins.</p>
          </div>
          <div>
            <strong className="text-blue-400 font-bold block mb-0.5">Step 2: Track low Stock alerts</strong>
            <p>The label dashboard monitors all active tours' inventories simultaneously. When a specific signed act's tour stock drops below critical levels, alerts flash in the main console.</p>
          </div>
          <div>
            <strong className="text-blue-400 font-bold block mb-0.5">Step 3: Allocate Manufacturing Batches</strong>
            <p>When ordering merchandise reprints, allocate manufactured stock batches directly to active tour stops or transfer them into localized retail hubs.</p>
          </div>
          <div>
            <strong className="text-blue-400 font-bold block mb-0.5">Step 4: Audit Tour Sales Discrepancies</strong>
            <p>Compare physical stock count audits submitted by touring bands against registered digital transactions to instantly flag internal inventory leakage or lost items.</p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'corporate-security',
    title: 'Security Clearances & Corporate Access',
    icon: Shield,
    color: 'text-rose-400',
    content: (
      <div className="space-y-3.5 text-xs font-mono text-zinc-400">
        <p className="text-zinc-500 uppercase text-[9px] font-bold tracking-wider border-b border-zinc-800 pb-1.5">Simplified Step-by-Step Walkthrough</p>
        <div className="space-y-2.5">
          <div>
            <strong className="text-rose-400 font-bold block mb-0.5">Step 1: Configure Role Access PINs</strong>
            <p>Generate distinct 4-digit numeric keys for label staff, road managers, and signed act assistants to authenticate their roles locally.</p>
          </div>
          <div>
            <strong className="text-rose-400 font-bold block mb-0.5">Step 2: Enforce View Lock Modifiers</strong>
            <p>When active, specific modules—such as master finance spreadsheets, tax reports, sub-label corporate configurations, and billing tiers—are hidden behind secure clearance prompts.</p>
          </div>
          <div>
            <strong className="text-rose-400 font-bold block mb-0.5">Step 3: Check Security Clearance Levels</strong>
            <p>The console strictly enforces numeric clearances (Levels 1 to 5). Roster band managers operate at standard levels, while executive label heads access tier Level 5.</p>
          </div>
          <div>
            <strong className="text-rose-400 font-bold block mb-0.5">Step 4: Live Access Log Audits</strong>
            <p>Track which roster acts are logged into local devices and monitor live telemetry dispatches to detect unauthorized administrative attempts.</p>
          </div>
        </div>
      </div>
    )
  }
];

const TOPICS = [
  {
    id: 'sales',
    title: 'The Register & Checkout',
    icon: DollarSign,
    color: 'text-emerald-400',
    content: (
      <div className="space-y-3.5 text-xs font-mono text-zinc-400">
        <p className="text-zinc-500 uppercase text-[9px] font-bold tracking-wider border-b border-zinc-800 pb-1.5">Simplified Step-by-Step Walkthrough</p>
        <div className="space-y-2.5">
          <div>
            <strong className="text-emerald-400 font-bold block mb-0.5">Step 1: Build the Customer Card</strong>
            <p>From the active Register (Home panel), tap any merchandise item or size card to add it to your shopping cart. Tap an item repeatedly to quickly increment or adjust the quantity.</p>
          </div>
          <div>
            <strong className="text-emerald-400 font-bold block mb-0.5">Step 2: Apply Rewards or Promo Codes</strong>
            <p>Click "Loyalty Checkout" to apply lifetime/signup rewards or search reward fan indices. Proximity/NFC tags can also be tapped directly to register member credentials.</p>
          </div>
          <div>
            <strong className="text-emerald-400 font-bold block mb-0.5">Step 3: Setup Orders & Tips</strong>
            <p>Adjust order discounts, set tip percentages directly (10%, 15%, 20%, or custom), or write unique sales memos inside the slide-out drawer list.</p>
          </div>
          <div>
            <strong className="text-emerald-400 font-bold block mb-0.5">Step 4: Seal the Payment</strong>
            <p>Choose "CASH" or "CARD" on compilation. If self-service QR is engaged, customers can securely scan the generated payment QR to complete PayPal checkout on their own mobile devices.</p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'inventory',
    title: 'Merchandise Inventory & Stocking',
    icon: Package,
    color: 'text-blue-400',
    content: (
      <div className="space-y-3.5 text-xs font-mono text-[#a5f3fc]">
        <p className="text-zinc-500 uppercase text-[9px] font-bold tracking-wider border-b border-zinc-800 pb-1.5">Simplified Step-by-Step Walkthrough</p>
        <div className="space-y-2.5 text-zinc-400">
          <div>
            <strong className="text-blue-400 font-bold block mb-0.5">Step 1: Check Alert Levels</strong>
            <p>Review the active stock rails. SKUs that drop below 5 units automatically display an amber alert warning so you can coordinate with suppliers in due time.</p>
          </div>
          <div>
            <strong className="text-blue-400 font-bold block mb-0.5">Step 2: Add New Tour Styles</strong>
            <p>Tap "Add Item" in the corner. Fill in the title, assign dynamic pricing, input manufacturing wholesale costs (to securely lock profit margin calculations), and define stock ranges.</p>
          </div>
          <div>
            <strong className="text-blue-400 font-bold block mb-0.5">Step 3: Submit Inventory Audits</strong>
            <p>At the end of a high-volume tour stop, count your physical display items. Select "Audit" on any item, write physical counts, and the system automatically calculates financial discrepancies and aligns quantities.</p>
          </div>
          <div>
            <strong className="text-blue-400 font-bold block mb-0.5">Step 4: Receive Reprints</strong>
            <p>When custom supplier reprints are shipped to tour stops, select item "Receive Stock" to append incoming batches without disrupting previous historic audits.</p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'cash-drawer',
    title: 'Cash Drawer Audit System',
    icon: Coins,
    color: 'text-amber-400',
    content: (
      <div className="space-y-3.5 text-xs font-mono text-zinc-400">
        <p className="text-zinc-500 uppercase text-[9px] font-bold tracking-wider border-b border-zinc-800 pb-1.5">Simplified Step-by-Step Walkthrough</p>
        <div className="space-y-2.5">
          <div>
            <strong className="text-amber-400 font-bold block mb-0.5">Step 1: Commit Starting Bank</strong>
            <p>Open the Cash Drawer panel. Under "Set Starting Bank", record your initial night's cash float (e.g. $150 or $200 in small bills) to begin with clean telemetry.</p>
          </div>
          <div>
            <strong className="text-amber-400 font-bold block mb-0.5">Step 2: Ring Up cash sales</strong>
            <p>Process cash transactions at the checkout terminal. The app automatically tracks starting floats and appends cumulative cash revenue into your secure running hand-on-hand total.</p>
          </div>
          <div>
            <strong className="text-amber-400 font-bold block mb-0.5">Step 3: Document Payouts & Expenses</strong>
            <p>Paying gas costs, local venue stage crew, buying local meals, or settling artist payouts directly from the drawer? Tap "Record Expense" or "Record Payout" to log the amount and a plain memo.</p>
          </div>
          <div>
            <strong className="text-amber-400 font-bold block mb-0.5">Step 4: Verify Net Drawer Cash</strong>
            <p>Review the primary counter to instantly audit exact cash status: Starting bank + Cash sales - Expenses - Security drops. This ensures your final hand counts match down to the exact penny.</p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'shows',
    title: 'Shows & Day-of-Show Settlements',
    icon: Calendar,
    color: 'text-purple-400',
    content: (
      <div className="space-y-3.5 text-xs font-mono text-zinc-400">
        <p className="text-zinc-500 uppercase text-[9px] font-bold tracking-wider border-b border-zinc-800 pb-1.5">Simplified Step-by-Step Walkthrough</p>
        <div className="space-y-2.5">
          <div>
            <strong className="text-purple-400 font-bold block mb-0.5">Step 1: Register Scheduled Gigs</strong>
            <p>Navigate to "Calendar/Shows" and register tour stops, dates, capacities, and target financial guarantees.</p>
          </div>
          <div>
            <strong className="text-purple-400 font-bold block mb-0.5">Step 2: Initiate Nightly Settlement</strong>
            <p>After closing the merchandise stand, tap the active show card and select "Initiate Settlement". The system automatically collects aggregate sales logged during that specific event duration.</p>
          </div>
          <div>
            <strong className="text-purple-400 font-bold block mb-0.5">Step 3: Account for Venue Cuts & Taxes</strong>
            <p>Write venue cut percentages (e.g., 20% Apparel, 10% Music/Media) and apply state sales taxes. The system automatically subtracts cuts and displays your exact artist payout margin.</p>
          </div>
          <div>
            <strong className="text-purple-400 font-bold block mb-0.5">Step 4: Lock and Archive Reports</strong>
            <p>Approve the breakdown and finalize. This seals the financial reports as "Closed", pushing data arrays to active historians and preventing edits to past shows.</p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'black-book',
    title: 'Black Book & Routing Beacons',
    icon: Route,
    color: 'text-sky-400',
    content: (
      <div className="space-y-3.5 text-xs font-mono text-zinc-400">
        <p className="text-zinc-500 uppercase text-[9px] font-bold tracking-wider border-b border-zinc-800 pb-1.5">Simplified Step-by-Step Walkthrough</p>
        <div className="space-y-2.5">
          <div>
            <strong className="text-sky-400 font-bold block mb-0.5">Step 1: Browse Verified Promoters</strong>
            <p>Browse the curated global tour book table. Access contact cards, verified address indexes, capacity ratings, and reviews from previous touring artists.</p>
          </div>
          <div>
            <strong className="text-sky-400 font-bold block mb-0.5">Step 2: Launch Routing Beacons</strong>
            <p>planning a tour segment? Emit a routing beacon detailing regions (e.g., "Pacific Northwest") and timeline frames to alert regional promoters looking for shows.</p>
          </div>
          <div>
            <strong className="text-sky-400 font-bold block mb-0.5">Step 3: Review incoming offers</strong>
            <p>Promoters reacting to your active beacons can push layout offers containing show dates, flight guarantees, lodging specs, and venue dimensions.</p>
          </div>
          <div>
            <strong className="text-sky-400 font-bold block mb-0.5">Step 4: Lock standard booking agreements</strong>
            <p>Accept the offer, decline, or counter the guarantee numbers. Accepting instantly populates that show details directly into your core tour planner.</p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'promohub',
    title: 'Campaign Promos & Member Loyalty',
    icon: QrCode,
    color: 'text-fuchsia-400',
    content: (
      <div className="space-y-3.5 text-xs font-mono text-zinc-400">
        <p className="text-zinc-500 uppercase text-[9px] font-bold tracking-wider border-b border-zinc-800 pb-1.5">Simplified Step-by-Step Walkthrough</p>
        <div className="space-y-2.5">
          <div>
            <strong className="text-fuchsia-400 font-bold block mb-0.5">Step 1: Launch Campaign Codes</strong>
            <p>Go to the Promotional Hub and spawn promotional codes. You can configure target parameters (e.g. 10% off apparel, or BOGO) to streamline lines at high-volume tour shows.</p>
          </div>
          <div>
            <strong className="text-fuchsia-400 font-bold block mb-0.5">Step 2: Stand Up Self-Checkout Stands</strong>
            <p>Generate self-serve QR signage displays. Fans can scan codes with their devices, access the checkout panel, and pay on their phones to avoid long queue lines.</p>
          </div>
          <div>
            <strong className="text-fuchsia-400 font-bold block mb-0.5">Step 3: Enroll Rewards Members</strong>
            <p>Register fans into the VIP Loyalty system directly under the register checkout. Track purchase points, award free merch tiers, and sync memberships with active user databases.</p>
          </div>
          <div>
            <strong className="text-fuchsia-400 font-bold block mb-0.5">Step 4: Capture Real-time Experience Scores</strong>
            <p>Allow fans to submit simple rating reviews directly. Track live tour Stop Net Promoter Scores (NPS) inside your Campaign Hub to measure engagement and keep sponsors happy.</p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'flights',
    title: 'Flights & Travel Logistics',
    icon: Plane,
    color: 'text-[#00ffcc]',
    content: (
      <div className="space-y-3.5 text-xs font-mono text-zinc-400">
        <p className="text-zinc-500 uppercase text-[9px] font-bold tracking-wider border-b border-zinc-800 pb-1.5">Simplified Step-by-Step Walkthrough</p>
        <div className="space-y-2.5">
          <div>
            <strong className="text-[#00ffcc] font-bold block mb-0.5">Step 1: Input Leg Flights</strong>
            <p>Under the Flights & Logistics workspace, enter flight legs, airline listings, and codes for band members and technical road crew.</p>
          </div>
          <div>
            <strong className="text-[#00ffcc] font-bold block mb-0.5">Step 2: Dynamic Telemetry Handshake</strong>
            <p>Tap the Refresh query action. The system communicates directly with aviation status systems to retrieve real-time alerts, gate numbers, and departure calendars.</p>
          </div>
          <div>
            <strong className="text-[#00ffcc] font-bold block mb-0.5">Step 3: Track Delays</strong>
            <p>Status monitors flash in bright red/amber colors if incoming flights are delayed, warning managers to reschedule soundchecks before gates open.</p>
          </div>
          <div>
            <strong className="text-[#00ffcc] font-bold block mb-0.5">Step 4: Persistent Offline Manifests</strong>
            <p>All compiled flights databases remain securely cached locally, enabling road crews to access gate info and landing matrices during flights with zero Wi-Fi.</p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'music-doors',
    title: 'Guestlist Control & Setlist Curators',
    icon: Music,
    color: 'text-pink-400',
    content: (
      <div className="space-y-3.5 text-xs font-mono text-zinc-400">
        <p className="text-zinc-500 uppercase text-[9px] font-bold tracking-wider border-b border-zinc-800 pb-1.5">Simplified Step-by-Step Walkthrough</p>
        <div className="space-y-2.5">
          <div>
            <strong className="text-pink-400 font-bold block mb-0.5">Step 1: Setup VIP lists</strong>
            <p>Input VIP entries, press credentials, and label comps. You can assign custom badges (e.g. Meet & Greet, Aftershow) for security staff.</p>
          </div>
          <div>
            <strong className="text-pink-400 font-bold block mb-0.5">Step 2: Rapid Door Check-in</strong>
            <p>Arm your venue door assistants with the Guestlist check-in panel. A single click checks in fans instantly, tracking accurate real-time attendance graphs.</p>
          </div>
          <div>
            <strong className="text-pink-400 font-bold block mb-0.5">Step 3: Craft Nightly Setlists</strong>
            <p>Queue performance setlists from your central track library. Rearrange song orders on the fly and track aggregate performance durations in minutes.</p>
          </div>
          <div>
            <strong className="text-pink-400 font-bold block mb-0.5">Step 4: Export to Crew</strong>
            <p>Directly print or transfer finalized setlists to front-of-house sound engineers, lighting operators, and security personnel before downbeat.</p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'lock-safety',
    title: 'Roster PINs & Security Lockdowns',
    icon: Lock,
    color: 'text-zinc-500',
    content: (
      <div className="space-y-3.5 text-xs font-mono text-zinc-400">
        <p className="text-zinc-500 uppercase text-[9px] font-bold tracking-wider border-b border-zinc-800 pb-1.5">Simplified Step-by-Step Walkthrough</p>
        <div className="space-y-2.5">
          <div>
            <strong className="text-zinc-200 font-bold block mb-0.5">Step 1: Set unique personnel PINs</strong>
            <p>From team roster settings, define secure PIN codes (4-digit numeric keys) for specific crew roles and sales assistants.</p>
          </div>
          <div>
            <strong className="text-zinc-200 font-bold block mb-0.5">Step 2: Secure critical modules</strong>
            <p>Toggle "Lock View Modifiers". When active, high-utility modules such as Reports, Shows settlement, or settings are securely password hidden.</p>
          </div>
          <div>
            <strong className="text-zinc-200 font-bold block mb-0.5">Step 3: Keep sales active</strong>
            <p>Staff members can still process register sales, swipe items, and checkout without access to sensitive bank metrics or settlement records.</p>
          </div>
          <div>
            <strong className="text-zinc-200 font-bold block mb-0.5">Step 4: Simulated Offline Modes</strong>
            <p>Turn on simulated network disconnects to test database recoveries. Ensure register queues process sales perfectly even in deep cell dead-zones, with auto-sync when signals revive.</p>
          </div>
        </div>
      </div>
    )
  }
];

export default function HelpDeskView({ onBack, triggerNotification, portalType }: HelpDeskViewProps) {
  const [activeTab, setActiveTab] = useState<'guide' | 'contact'>('guide');
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);

  // Contact form state
  const [ticketType, setTicketType] = useState('question');
  const [ticketMessage, setTicketMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!ticketMessage.trim()) return;

    setIsSubmitting(true);
    // Simulate network delay
    setTimeout(() => {
      setIsSubmitting(false);
      setTicketMessage('');
      triggerNotification?.('Message sent to the developer successfully. We will follow up via email.');
    }, 800);
  };

  return (
    <div className="h-full flex flex-col bg-[#0b0c10] text-zinc-200">
      {/* Floating Back Button */}
      <div className="fixed top-4 left-4 md:top-6 md:left-6 z-[100]">
        <button 
          onClick={onBack}
          className="w-10 h-10 rounded-full border border-red-500/20 hover:border-red-500/50 bg-black/85 flex items-center justify-center transition-all hover:bg-zinc-900 text-red-500 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] cursor-pointer group"
          title="Go Back"
          aria-label="Go Back"
        >
          <ChevronLeft className="w-6 h-6 text-red-500 group-hover:scale-110 transition-transform stroke-[2.5]" />
        </button>
      </div>

      {/* Header */}
      <div className="relative border-b border-zinc-800 pb-6 pt-6 flex flex-col items-center justify-center text-center bg-[#111116] sticky top-0 z-40 gap-4">
        
        {/* Centered Title Lockup */}
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto gap-4">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center"
          >
            <h1 
              className="text-3xl md:text-5xl font-display font-medium tracking-tight text-white uppercase text-center select-text leading-none"
              style={{
                textShadow: '0 0 12px rgba(79, 70, 229, 0.4), 0 0 25px rgba(67, 56, 202, 0.35), 0 0 50px rgba(129, 140, 248, 0.2)',
                letterSpacing: '0.1em',
                fontWeight: 950,
                fontSize: '26px',
                marginLeft: '0px',
                marginTop: '0px'
              }}
            >
              Help Desk
            </h1>
          </motion.div>
          <p 
            className="text-xs md:text-sm text-zinc-400 font-mono tracking-wide max-w-xl leading-relaxed text-center"
            style={{ marginTop: '-6px', fontSize: '11px' }}
          >
            {portalType === 'label'
              ? 'Troubleshoot signed acts, manage catalog distribution registries, consult corporate balance ledgers, and interface with platform developers.'
              : 'Troubleshoot remote systems, access offline protocols, consult database schemas, and interface with tour support services.'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-5 pt-5 pb-2 shrink-0">
        <div className="flex bg-black rounded border border-zinc-800 p-1">
          <button
            onClick={() => setActiveTab('guide')}
            className={`flex-1 py-2 rounded text-[10px] font-bold uppercase tracking-wider font-mono transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'guide' 
                ? 'bg-amber-500/20 text-amber-500' 
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Book className="w-3.5 h-3.5" />
            User Guide
          </button>
          <button
            onClick={() => setActiveTab('contact')}
            className={`flex-1 py-2 rounded text-[10px] font-bold uppercase tracking-wider font-mono transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'contact' 
                ? 'bg-amber-500/20 text-amber-500' 
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Contact Developer
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto px-5 pb-5 mt-2">
        {activeTab === 'guide' ? (
          <div className="space-y-3 pb-8">
            <p className="text-xs text-zinc-400 font-mono mb-4 text-center sm:text-left">
              {portalType === 'label'
                ? 'Select a module below to understand how it operates and fits into your record label operations.'
                : 'Select a module below to understand how it operates and fits into your tour workflow.'}
            </p>
            {(portalType === 'label' ? LABEL_TOPICS : TOPICS).map((topic, tIdx) => (
              <div 
                key={`${topic.id}-${tIdx}`}
                className="bg-black/60 border border-zinc-800 rounded-xl overflow-hidden transition-all hover:border-zinc-700"
              >
                <button
                  onClick={() => setExpandedTopic(expandedTopic === topic.id ? null : topic.id)}
                  className="w-full flex items-center justify-between p-4 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <topic.icon className={`w-5 h-5 ${topic.color}`} />
                    <h3 className="font-display font-bold text-sm text-zinc-200 uppercase tracking-widest text-left">
                      {topic.title}
                    </h3>
                  </div>
                  {expandedTopic === topic.id ? (
                    <ChevronLeft className="w-4 h-4 text-zinc-500 -rotate-90 transition-transform" />
                  ) : (
                    <ChevronLeft className="w-4 h-4 text-zinc-500 rotate-180 transition-transform" />
                  )}
                </button>
                {expandedTopic === topic.id && (
                  <div className="px-4 pb-4 pt-1 bg-black/40 border-t border-zinc-900/50">
                    {topic.content}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full flex flex-col justify-center max-w-md mx-auto py-6">
            <div className="bg-[#111115] border border-zinc-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
              {/* Background accent */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500 opacity-50" />
              
              <div className="text-center mb-6 mt-2">
                <h3 className="font-display font-bold text-lg text-white tracking-widest uppercase">
                  Contact Developer
                </h3>
                <p className="text-[11px] text-zinc-400 font-mono mt-2 leading-relaxed">
                  Have a question? Found a bug? Need a new feature built specifically for your tour workflow? Send a dispatch.
                </p>
              </div>

              <form onSubmit={handleSubmitTicket} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono font-bold block">
                    Message Type
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'question', label: 'Question', icon: HelpCircle, color: 'text-blue-400' },
                      { id: 'feature', label: 'Feature', icon: Lightbulb, color: 'text-amber-400' },
                      { id: 'bug', label: 'Bug Report', icon: Bug, color: 'text-red-400' },
                    ].map((type, idx) => (
                      <button
                        key={`${type.id}-${idx}`}
                        type="button"
                        onClick={() => setTicketType(type.id)}
                        className={`flex flex-col items-center justify-center gap-1.5 p-2 rounded-lg border transition-colors ${
                          ticketType === type.id 
                            ? 'bg-zinc-900 border-zinc-600' 
                            : 'bg-black border-zinc-800 opacity-60 hover:opacity-100 hover:bg-zinc-900/50'
                        }`}
                      >
                        <type.icon className={`w-4 h-4 ${type.color}`} />
                        <span className="text-[9px] uppercase font-bold tracking-wider font-mono">{type.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono font-bold block">
                    Your Message
                  </label>
                  <textarea
                    value={ticketMessage}
                    onChange={(e) => setTicketMessage(e.target.value)}
                    placeholder="Describe your request, issue, or question in detail..."
                    className="w-full h-32 bg-black border border-zinc-800 rounded-lg p-3 text-sm font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/50 resize-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !ticketMessage.trim()}
                  className={`w-full py-3 mt-4 rounded-lg uppercase tracking-widest text-[11px] font-bold font-mono transition-all flex items-center justify-center gap-2 ${
                    isSubmitting 
                      ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                      : !ticketMessage.trim()
                        ? 'bg-zinc-900 text-zinc-600 cursor-not-allowed border border-zinc-800'
                        : 'bg-purple-600 hover:bg-purple-500 text-white cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                  }`}
                >
                  {isSubmitting ? (
                    'Transmitting...'
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Send Dispatch
                    </>
                  )}
                </button>
              </form>
              <div className="mt-6 border-t border-zinc-800/50 pt-4 text-center">
                <a href="mailto:goregrindsickness@gmail.com" className="text-[10px] font-mono text-zinc-500 hover:text-purple-400 transition-colors uppercase tracking-widest flex items-center justify-center gap-1.5 focus:outline-none">
                  <Mail className="w-3 h-3" />
                  Or email directly
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
