export const LABEL_BILLING_MATRIX = {
  trialPeriodDays: 30, // Full 30-day lifecycle trial to evaluate value tools
  tiers: {
    independent_imprint: {
      name: 'INDEPENDENT LABEL',
      monthlyPrice: 29.99,
      annualMonthlyPrice: 23.99, // ~20% savings, billed annually at $287.90
      annualTotalPrice: 287.90,
      rosterArtistLimit: 10,
      adminSeatLimit: 3,
      features: ['catalog_delivery', 'unified_inventory_sheets', 'basic_metrics']
    },
    underground_syndicate: {
      name: 'UNDERGROUND SYNDICATE',
      monthlyPrice: 59.99,
      annualMonthlyPrice: 47.99, // ~20% savings, billed annually at $575.90
      annualTotalPrice: 575.90,
      rosterArtistLimit: 25,
      adminSeatLimit: 10,
      features: ['catalog_delivery', 'unified_inventory_sheets', 'roster_accounting_analytics', 'global_push_rights', 'tour_coordinator']
    },
    sovereign_record_group: {
      name: 'ELITE RECORD LABEL',
      monthlyPrice: 89.99,
      annualMonthlyPrice: 71.99, // 20% savings, billed annually at $863.88
      annualTotalPrice: 863.88,
      rosterArtistLimit: 99999, // Unlimited
      adminSeatLimit: 99999,     // Unlimited
      features: ['all_features', 'sub_label_clearance', 'priority_geo_targeting', 'bulk_distro_exports']
    }
  }
};
