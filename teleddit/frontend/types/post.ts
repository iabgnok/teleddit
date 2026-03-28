export interface Post {
  id: string;
  title: string;
  content: string;
  contentType: string;
  authorId: string;
  communityId: string;
  coverUrl?: string;
  mediaUrls: string[];
  linkUrl?: string;
  upvotes: number;
  downvotes: number;
  score: number;
  viewCount: number;
  commentCount: number;
  isDraft: boolean;
  isPinned: boolean;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
  userVoted: number;
  userDownvoted: boolean;
  
  author?: any;      // Will map to nested User response if populated
  community?: any;   // Will map to nested Community response if populated
  tags?: any[];
}
