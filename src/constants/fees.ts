export const PLATFORM_TRANSACTION_FEES = {
  ticketing: {
    fixed: 0.30,       // Flat currency addition per ticket item
    percentage: 0.03   // 3% platform commission cut on face-value gross
  },
  merchandise: {
    percentage: 0.0777 // Exactly 7.77% platform commission cut on gross merch sales
  }
};
