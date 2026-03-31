import { useState, useCallback, useEffect } from "react";
import { folderApi } from "@/lib/api/folder";
import type { FolderItem } from "@/types/folder";
import { DEFAULT_FOLDERS } from "@/lib/mock/communities";

export function useFolders(requireAuth: boolean = true) {
  const [folders, setFolders] = useState<FolderItem[]>(DEFAULT_FOLDERS);
  const [loading, setLoading] = useState(false);

  const fetchFolders = useCallback(async () => {
    if (!requireAuth && typeof window !== "undefined" && !localStorage.getItem("access_token")) return;
    try {
      setLoading(true);
      const data = await folderApi.getFolders();
      const userFolders = data.map((f: any) => ({
        id: f.id, label: f.label, emoji: f.emoji || "", color: f.color || "",
        communityIds: f.spaceIds || [], order: f.order, isSystem: false
      }));
      setFolders([...DEFAULT_FOLDERS.filter(df => df.isSystem), ...userFolders]);
    } catch (err) {
      console.error("Fetch folders failed", err);
    } finally {
      setLoading(false);
    }
  }, [requireAuth]);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  const saveFolder = useCallback(async (f: FolderItem) => {
    try {
      const payload: any = {
        label: f.label,
        emoji: f.emoji,
        color: f.color,
        spaceIds: f.communityIds || [],
      };
      
      // Determine if create or update
      if (f.id && !f.id.toString().startsWith("new-") && !f.id.toString().startsWith("folder-")) {
        await folderApi.updateFolder(f.id, payload);
      } else {
        await folderApi.createFolder(payload);
      }
      await fetchFolders(); // refresh
    } catch(err: any) {
      alert("Failed to save folder: " + err.message);
    }
  }, [fetchFolders]);

  const deleteFolder = useCallback(async (id: string) => {
    try {
      await folderApi.deleteFolder(id);
      await fetchFolders();
    } catch (err: any) {
      alert("Failed to delete folder: " + err.message);
    }
  }, [fetchFolders]);

  const addSpaceToFolder = useCallback(async (communityId: string, folderId: string) => {
    const target = folders.find(f => f.id === folderId);
    if (!target) return;
    if (target.communityIds.includes(communityId)) return;
    
    try {
      await folderApi.updateFolder(folderId, {
        spaceIds: [...target.communityIds, communityId] as any
      });
      await fetchFolders();
    } catch (err: any) {
      console.error(err);
    }
  }, [folders, fetchFolders]);

  const removeSpaceFromFolder = useCallback(async (communityId: string, folderId: string) => {
    const target = folders.find(f => f.id === folderId);
    if (!target) return;
    
    try {
      await folderApi.updateFolder(folderId, {
        spaceIds: target.communityIds.filter(x => x !== communityId) as any
      });
      await fetchFolders();
    } catch (err: any) {
      console.error(err);
    }
  }, [folders, fetchFolders]);

  return { folders, loading, saveFolder, deleteFolder, addSpaceToFolder, removeSpaceFromFolder };
}
