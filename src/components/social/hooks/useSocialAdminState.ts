import { useState, useRef } from 'react';

export interface UseSocialAdminStateParams {
  userProfile?: any;
}

export function useSocialAdminState({ userProfile }: UseSocialAdminStateParams) {
  // Pro / Label Dashboard Custom Settings & Identity
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState(() => {
    if (userProfile?.email || userProfile?.name) {
      return [{
        id: userProfile?.id || 'tm_owner',
        name: userProfile?.name || 'Account Owner',
        email: userProfile?.email || '',
        role: userProfile?.role || 'Owner / Label Head',
        clearanceLevel: 5,
        permissions: {
          canViewAnalytics: true,
          canEditPrices: true,
          canManageReleases: true,
          canAccessRoyalties: true,
          canToggleVisibility: true
        }
      }];
    }
    return [];
  });
  const [labelHeadquarters, setLabelHeadquarters] = useState(userProfile?.label_headquarters || 'New York, NY');
  const [labelFoundedYear, setLabelFoundedYear] = useState(userProfile?.label_founded_year || '2018');
  const [labelRosterCount, setLabelRosterCount] = useState(userProfile?.label_roster_count || '14');
  const [labelRosterTicker, setLabelRosterTicker] = useState(userProfile?.label_roster_ticker || 'No updates posted yet');
  const [labelPrimaryGenres, setLabelPrimaryGenres] = useState<string[]>(userProfile?.label_genres || ['Death Metal', 'Brutal Death Metal', 'Goregrind', 'Slam']);

  // Label Loyalty program states
  const [loyaltyProgramEnabled, setLoyaltyProgramEnabled] = useState(true);
  const [loyaltyPointMultiplier, setLoyaltyPointMultiplier] = useState('2');
  const [loyaltyCustomTiers, setLoyaltyCustomTiers] = useState([
    { id: 1, name: 'Bronze Supporter', points: 0, reward: '1x point multiplier' },
    { id: 2, name: 'Silver Collector', points: 500, reward: '1.2x points + priority ticket access' },
    { id: 3, name: 'Gold VIP Outer Circle', points: 1500, reward: '1.5x points + exclusive pre-orders' },
    { id: 4, name: 'Platinum Vault Member', points: 4000, reward: '2x points + limited vinyl releases' },
    { id: 5, name: 'TDF Inner Sanctum Elite', points: 10000, reward: '3x points + lifetime show guestlist' }
  ]);
  const [newTierName, setNewTierName] = useState('');
  const [newTierPoints, setNewTierPoints] = useState('');
  const [newTierReward, setNewTierReward] = useState('');

  // Warehouse Ledger state variables
  const [newProdName, setNewProdName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdCategory, setNewProdCategory] = useState<'media' | 'apparel'>('media');
  const [newProdSubcategory, setNewProdSubcategory] = useState('vinyl');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdStock, setNewProdStock] = useState('50');

  // Admin Console States
  const [adminClickCount, setAdminClickCount] = useState(0);
  const [showAdminPINModal, setShowAdminPINModal] = useState(false);
  const [adminPIN, setAdminPIN] = useState('');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [blacklistRecords, setBlacklistRecords] = useState<{ id: string; type: string; value: string; created_at: string }[]>([]);
  const [newBlacklistType, setNewBlacklistType] = useState('email');
  const [newBlacklistValue, setNewBlacklistValue] = useState('');
  const [isBlacklistLoading, setIsBlacklistLoading] = useState(false);
  const adminPINRef = useRef<NodeJS.Timeout | null>(null);

  const [reports, setReports] = useState<{ id: string; reporterId: string; reportedProfileId: string; reportedProfileName: string; reason: string; status: 'pending' | 'resolved'; resolution?: string; timestamp: string }[]>([]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');

  return {
    expandedMemberId,
    setExpandedMemberId,
    teamMembers,
    setTeamMembers,
    labelHeadquarters,
    setLabelHeadquarters,
    labelFoundedYear,
    setLabelFoundedYear,
    labelRosterCount,
    setLabelRosterCount,
    labelRosterTicker,
    setLabelRosterTicker,
    labelPrimaryGenres,
    setLabelPrimaryGenres,

    loyaltyProgramEnabled,
    setLoyaltyProgramEnabled,
    loyaltyPointMultiplier,
    setLoyaltyPointMultiplier,
    loyaltyCustomTiers,
    setLoyaltyCustomTiers,
    newTierName,
    setNewTierName,
    newTierPoints,
    setNewTierPoints,
    newTierReward,
    setNewTierReward,

    newProdName,
    setNewProdName,
    newProdPrice,
    setNewProdPrice,
    newProdCategory,
    setNewProdCategory,
    newProdSubcategory,
    setNewProdSubcategory,
    newProdDesc,
    setNewProdDesc,
    newProdStock,
    setNewProdStock,

    adminClickCount,
    setAdminClickCount,
    showAdminPINModal,
    setShowAdminPINModal,
    adminPIN,
    setAdminPIN,
    isAdminMode,
    setIsAdminMode,
    blacklistRecords,
    setBlacklistRecords,
    newBlacklistType,
    setNewBlacklistType,
    newBlacklistValue,
    setNewBlacklistValue,
    isBlacklistLoading,
    setIsBlacklistLoading,
    adminPINRef,

    reports,
    setReports,
    showReportModal,
    setShowReportModal,
    reportReason,
    setReportReason
  };
}
