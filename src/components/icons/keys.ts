/** Icon keys a category / product illustration may use (kept free of React so the server can validate input). */
export const ICON_KEYS = ["prescription", "capsule", "blister", "syrup", "baby", "glucose", "lotion", "mortar", "stethoscope", "thermometer", "firstaid", "heart", "leaf", "shield", "cross"] as const;
export type IconKey = (typeof ICON_KEYS)[number];
