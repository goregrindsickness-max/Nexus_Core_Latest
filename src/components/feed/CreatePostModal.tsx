import React, { useEffect } from 'react';
import { CreatePostCard } from '../social/CreatePostCard';

export interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  composerProps: Record<string, any>;
}

/**
 * Full-screen edge-to-edge Create Post Modal (`fixed inset-0 z-50 h-[100dvh] w-full rounded-none bg-zinc-950 flex flex-col`)
 * wrapping `CreatePostCard` with Escape key and body scroll lock handling.
 */
export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  composerProps,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Create Post"
      className="fixed inset-0 z-50 h-[100dvh] w-full rounded-none bg-zinc-950 flex flex-col overflow-hidden"
    >
      <div className="flex-1 min-h-0 w-full flex flex-col">
        <CreatePostCard
          isFullScreenModal={true}
          onCloseModal={onClose}
          {...(composerProps as any)}
        />
      </div>
    </div>
  );
};

export { CreatePostCard };
export default CreatePostModal;
