import { fetchApi } from "./client";

export interface CreatePostPayload {
  title: string;
  content: string;
  contentType: "text" | "media" | "link";
  communityId: string;
  tagIds: string[];
  isDraft: boolean;
  coverUrl?: string;
  mediaUrls?: string[];
  linkUrl?: string;
}

export const createPost = (data: CreatePostPayload) => {
  return fetchApi<any>("/posts", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export interface LinkMeta {
  title: string;
  description?: string;
  image?: string;
  domain: string;
}

export const getLinkPreview = async (url: string): Promise<LinkMeta> => {
  return fetchApi<LinkMeta>("/posts/link-preview", {
    method: "POST",
    body: JSON.stringify({ url }),
  });
};
