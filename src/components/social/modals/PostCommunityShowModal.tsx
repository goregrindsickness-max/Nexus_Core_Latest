import React from 'react';
import { CreateCommunityShowModal, type TourStopItem } from './CreateCommunityShowModal';

export type { TourStopItem };

export interface PostCommunityShowModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSubmit?: (showData: any) => void;
  triggerNotification?: (msg: string) => void;
  initialData?: any;
}

export function PostCommunityShowModal({
  isOpen = true,
  onClose,
  onSubmit,
  triggerNotification,
  initialData,
}: PostCommunityShowModalProps) {
  return (
    <CreateCommunityShowModal
      isOpen={isOpen}
      onClose={onClose || (() => {})}
      onSubmit={onSubmit || (() => {})}
      editingShow={initialData}
      triggerNotification={triggerNotification}
    />
  );
}

export default PostCommunityShowModal;
