export const PROMOTER_BILLING_MATRIX = {
  tiers: {
    local_booking_agent: {
      name: 'Local Booking Agent',
      monthlyPrice: 29.99,
      annualMonthlyPrice: 23.99, // 20% savings
      rollingActiveShowLimit: 6,   // Increased headroom for concurrent confirmed dates
      teamSeatLimit: 5,            // Expanded local crew allocation
      features: ['artist_queries', 'basic_contracts']
    },
    regional_talent_buyer: {
      name: 'Regional Talent Buyer',
      monthlyPrice: 74.99,
      annualMonthlyPrice: 59.99, // 20% savings
      rollingActiveShowLimit: 24,  // Expanded rolling live show slots
      teamSeatLimit: 15,           // Full production team capacity
      features: ['artist_queries', 'basic_contracts', 'source_split_settlements', 'geo_push_notifications']
    },
    enterprise_network: {
      name: 'Enterprise Network & Arena Director',
      monthlyPrice: 149.99,
      annualMonthlyPrice: 119.99, // 20% savings
      rollingActiveShowLimit: 99999, // Unlimited
      teamSeatLimit: 99999,          // Unlimited collaborative infrastructure
      features: ['all_features', 'native_festival_planner', 'advanced_analytics']
    }
  },
  oneOffUpgrades: {
    single_festival_pass: {
      name: 'Multi-Day Festival Pass Upgrade',
      price: 29.99,
      lifecycleBound: true // Pass is tied directly to the show lifecycle, NOT an arbitrary time limit
    }
  }
};
