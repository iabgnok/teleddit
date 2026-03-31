import { fetchApi } from "./client";
import type { CommunityItem } from "@/types/community";

export interface JoinRequest {
  id: number;
  communityId: string;
  userId: string;
  status: string;
  message?: string;
  createdAt: string;
}

export const communityApi = {
  getCommunity: (id: string) => 
    fetchApi<CommunityItem>(`/communities/${id}`, { requireAuth: false }),
    
  updateAdminSettings: (id: string, data: Partial<CommunityItem>) =>
    fetchApi<CommunityItem>(`/communities/${id}/admin/settings`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  getJoinRequests: (id: string) => 
    fetchApi<JoinRequest[]>(`/communities/${id}/requests`),

  approveJoinRequest: (id: string, requestId: number) =>
    fetchApi<{ status: string }>(`/communities/${id}/requests/${requestId}/approve`, {
      method: "POST",
    }),

  rejectJoinRequest: (id: string, requestId: number) =>
    fetchApi<{ status: string }>(`/communities/${id}/requests/${requestId}/reject`, {
      method: "POST",
    }),

  banUser: (id: string, userId: string, reason?: string) => {
    const params = new URLSearchParams({ user_id: userId });
    if (reason) params.append("reason", reason);
    return fetchApi<{ message: string }>(`/communities/${id}/ban?${params.toString()}`, {
      method: "POST",
    });
  },

  updatePreferences: (id: string, prefs: { is_pinned?: boolean; is_muted?: boolean; is_archived?: boolean }) =>
    fetchApi<{ message: string }>(`/communities/${id}/preferences`, {
      method: "PATCH",
      body: JSON.stringify(prefs),
    }),

  leaveCommunity: (id: string) =>
    fetchApi<{ message: string }>(`/communities/${id}/join`, {
      method: "DELETE",
    }),
    
  // 可以补充其他的例如 changeRole 等接口
};
