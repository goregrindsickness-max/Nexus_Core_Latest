import React from 'react';
import { PostCard } from '../social/timeline/PostCard';

export type FeedPostCardProps = React.ComponentProps<typeof PostCard>;

export const FeedPostCard: React.FC<FeedPostCardProps> = (props) => {
  return <PostCard {...props} />;
};

export { PostCard };
export default FeedPostCard;
