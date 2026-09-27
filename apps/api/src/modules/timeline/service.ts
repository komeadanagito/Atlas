import { listItems } from "./repo";

export const getTimeline = (userId: string) => listItems(userId);