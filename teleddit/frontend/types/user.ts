export interface User {
  id: string;
  email: string;
  username: string;
  avatarUrl?: string;
  isAdmin?: boolean;
  isBanned?: boolean;
  status?: string;
  createdAt: string;
}
