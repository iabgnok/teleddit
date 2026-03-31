import { fetchApi } from "./client";
import type { FolderItem } from "@/types/folder";

export const folderApi = {
  getFolders: () =>
    fetchApi<FolderItem[]>("/folders"),

  createFolder: (data: any) =>
    fetchApi<FolderItem>("/folders", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateFolder: (id: string, data: any) =>
    fetchApi<FolderItem>(`/folders/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteFolder: (id: string) =>
    fetchApi<{ message: string }>(`/folders/${id}`, {
      method: "DELETE",
    }),

  reorderFolders: (folderIds: string[]) =>
    fetchApi<{ message: string }>("/folders/reorder", {
      method: "POST",
      body: JSON.stringify({ folder_ids: folderIds }),
    }),
};
