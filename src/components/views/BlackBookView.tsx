import React from 'react';
import BaseBlackBookView from '../portals/Band/BlackBookView';
import { UserProfile, Offer, UserReview } from '../../types';

export interface BlackBookViewProps {
  onBack: () => void;
  triggerNotification: (msg: string) => void;
  userProfile: UserProfile | null;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  activeBandName: string;
  offers: Offer[];
  onUpdateOffer: (offer: Offer) => void;
  userReviews: UserReview[];
  venues: any[];
  setVenues: React.Dispatch<React.SetStateAction<any[]>>;
}

export const BlackBookView: React.FC<BlackBookViewProps> = ({
  onBack,
  triggerNotification,
  userProfile,
  setUserProfile,
  activeBandName,
  offers,
  onUpdateOffer,
  userReviews,
  venues,
  setVenues,
}) => {
  return (
    <div className="flex-grow overflow-hidden">
      <BaseBlackBookView
        onBack={onBack}
        triggerNotification={triggerNotification}
        userProfile={userProfile}
        setUserProfile={setUserProfile}
        activeBandName={activeBandName}
        offers={offers}
        onUpdateOffer={onUpdateOffer}
        userReviews={userReviews}
        venues={venues}
        setVenues={setVenues}
      />
    </div>
  );
};

export default BlackBookView;
