import {
  BabyBottleIcon, BlisterIcon, CapsuleIcon, CrossIcon, FirstAidIcon, GlucoseIcon, HeartIcon, LeafIcon, LotionIcon, MortarIcon,
  PrescriptionIcon, ShieldIcon, StethoscopeIcon, SyrupIcon, ThermometerIcon,
} from "./index";
import type { IconProps } from "./IconBase";
import type { ComponentType } from "react";

/** Icons a category (or product illustration) can use — chosen in Admin › Categories / Products. */
export const ICONS: Record<string, { label: string; Icon: ComponentType<IconProps> }> = {
  prescription: { label: "Prescription", Icon: PrescriptionIcon },
  capsule: { label: "Capsule", Icon: CapsuleIcon },
  blister: { label: "Tablet strip", Icon: BlisterIcon },
  syrup: { label: "Syrup bottle", Icon: SyrupIcon },
  baby: { label: "Baby bottle", Icon: BabyBottleIcon },
  glucose: { label: "Glucose drop", Icon: GlucoseIcon },
  lotion: { label: "Lotion", Icon: LotionIcon },
  mortar: { label: "Mortar & pestle", Icon: MortarIcon },
  stethoscope: { label: "Stethoscope", Icon: StethoscopeIcon },
  thermometer: { label: "Thermometer", Icon: ThermometerIcon },
  firstaid: { label: "First-aid kit", Icon: FirstAidIcon },
  heart: { label: "Heart", Icon: HeartIcon },
  leaf: { label: "Leaf", Icon: LeafIcon },
  shield: { label: "Shield", Icon: ShieldIcon },
  cross: { label: "Medical cross", Icon: CrossIcon },
};
export { ICON_KEYS } from "./keys";

export const iconFor = (key: string): ComponentType<IconProps> => ICONS[key]?.Icon ?? CapsuleIcon;
