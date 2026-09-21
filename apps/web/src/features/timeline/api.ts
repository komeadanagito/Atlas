import type { TimelineItem } from "@atlas/shared";
import { getJson } from "../../shared/api/client";

export const listTimeline = () => getJson<TimelineItem[]>("/api/timeline");