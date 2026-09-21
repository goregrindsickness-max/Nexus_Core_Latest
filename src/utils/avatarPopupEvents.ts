// Custom window event name string constant
export const OPEN_AVATAR_POPUP_EVENT = 'nexus_open_avatar_popup';

export interface OpenAvatarPopupPayload {
  profileId?: string;
  username: string;
  avatarUrl?: string | null;
  imageUrl?: string | null;
  photoId?: string | null;
  title?: string | null;
  caption?: string | null;
  createdAt?: string | null;
}

/**
 * Global trigger to instantly open the avatar / picture viewer modal from anywhere in the app UI
 */
export const triggerAvatarPopup = (payload: OpenAvatarPopupPayload) => {
  const event = new CustomEvent(OPEN_AVATAR_POPUP_EVENT, { detail: payload });
  window.dispatchEvent(event);
};

/**
 * Alias for general picture/photo viewer modal triggers
 */
export const triggerPictureViewer = (payload: OpenAvatarPopupPayload) => {
  triggerAvatarPopup(payload);
};

