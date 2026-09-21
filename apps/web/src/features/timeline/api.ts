import type { TimelineDraft, TimelineItem } from "@atlas/shared";
import { deleteJson, getJson, patchJson, postJson } from "../../shared/api/client";

export const listTimeline = () => getJson<TimelineItem[]>("/api/timeline");

export const createTimeline = (draft: TimelineDraft) =>
  postJson<TimelineItem>("/api/timeline", draft);

export const updateTimeline = (id: string, draft: TimelineDraft) =>
  patchJson<TimelineItem>(`/api/timeline/${id}`, draft);

export const removeTimeline = (id: string) => deleteJson<{ ok: true }>(`/api/timeline/${id}`);