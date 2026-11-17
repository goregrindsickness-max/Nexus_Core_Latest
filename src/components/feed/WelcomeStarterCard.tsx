import React from 'react';
import {
  OnboardingChecklist,
  type OnboardingChecklistProps,
  resolveOnboardingChecklistSteps,
  calculateChecklistSummary,
  isIndustryChecklistRole,
  getChecklistPersistedState,
  setChecklistMinimized,
  dismissChecklistConfirmed,
  setShowSetupChecklist,
  hasScenePioneerBadge,
  SCENE_PIONEER_BADGE_LABEL,
} from '../OnboardingChecklist';

export type WelcomeStarterCardProps = OnboardingChecklistProps;

export const WelcomeStarterCard: React.FC<WelcomeStarterCardProps> = (props) => {
  return <OnboardingChecklist {...props} />;
};

export {
  OnboardingChecklist,
  resolveOnboardingChecklistSteps,
  calculateChecklistSummary,
  isIndustryChecklistRole,
  getChecklistPersistedState,
  setChecklistMinimized,
  dismissChecklistConfirmed,
  setShowSetupChecklist,
  hasScenePioneerBadge,
  SCENE_PIONEER_BADGE_LABEL,
};

export default WelcomeStarterCard;
