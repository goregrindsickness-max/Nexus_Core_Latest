export const BAND_PORTAL_BILLING = {
  tiers: {
    touring_pro: {
      name: 'Touring Pro',
      monthlyPrice: 19.99,
      annualMonthlyPrice: 15.19, // ~24% savings, billed annually at $182.28
      bandProfileLimit: 2,
      teamSeatLimit: 10,
      monthlyBoostTokens: 2
    },
    touring_pro_plus: {
      name: 'Touring Pro+',
      monthlyPrice: 39.99,
      annualMonthlyPrice: 31.99, // 20% savings, billed annually at $383.88
      bandProfileLimit: 5,
      teamSeatLimit: 20,
      monthlyBoostTokens: 5
    }
  },
  singleUsePasses: {
    per_show: {
      name: 'Per Show Pass',
      price: 5.99,
      showLimit: 1,
      boostTokensIncluded: 0
    },
    per_tour: {
      name: 'Per Tour Pass',
      price: 49.99,
      dateLimit: 35,
      boostTokensIncluded: 0
    }
  },
  onDemandBoosts: {
    show_blast_24h: {
      name: '24-Hour Show Blast',
      tokenCost: 1,
      cashPrice: 3.99
    },
    tour_announcement_72h: {
      name: '72-Hour Tour Announcement',
      tokenCost: 2,
      cashPrice: 7.99
    }
  }
};
