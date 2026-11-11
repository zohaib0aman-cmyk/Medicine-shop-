import type { ArtKind, CategoryId } from "@/data/catalog";
import {
  BabyBottleIcon, BlisterIcon, CapsuleIcon, FirstAidIcon, GlucoseIcon, LotionIcon, MortarIcon,
  PrescriptionIcon, StethoscopeIcon, SyrupIcon, ThermometerIcon,
} from "./index";
import type { IconProps } from "./IconBase";
import type { ComponentType } from "react";

export const categoryIcon: Record<CategoryId, ComponentType<IconProps>> = {
  prescription: PrescriptionIcon,
  otc: CapsuleIcon,
  baby: BabyBottleIcon,
  diabetes: GlucoseIcon,
  skin: LotionIcon,
  ayurvedic: MortarIcon,
  devices: StethoscopeIcon,
  firstaid: FirstAidIcon,
};

export const artIcon: Record<ArtKind, ComponentType<IconProps>> = {
  blister: BlisterIcon,
  capsule: CapsuleIcon,
  syrup: SyrupIcon,
  lotion: LotionIcon,
  baby: BabyBottleIcon,
  glucose: GlucoseIcon,
  thermometer: ThermometerIcon,
  stethoscope: StethoscopeIcon,
  firstaid: FirstAidIcon,
  mortar: MortarIcon,
};
