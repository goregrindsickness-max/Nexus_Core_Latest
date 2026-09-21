import React from 'react';
import { DiscoveryZone, DiscoveryZoneProps } from './DiscoveryZone';

export type SuggestedProfile = any;
export type PeopleYouMayKnowProps = DiscoveryZoneProps;

/**
 * Re-exporting DiscoveryZone as PeopleYouMayKnow for complete backwards compatibility.
 * The entire component has been rewritten from scratch with modern styling,
 * named 'Discovery Zone', and backed 100% by real Supabase profiles only.
 */
export const PeopleYouMayKnow: React.FC<PeopleYouMayKnowProps> = (props) => {
  return <DiscoveryZone {...props} />;
};

export default PeopleYouMayKnow;
