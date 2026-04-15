import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  FileText,
  FolderOpen,
  ImagePlus,
  LayoutGrid,
  Megaphone,
  MessageCircle,
  Settings,
  ShoppingBag,
  Store,
  UserRound,
  Users,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  BarChart3,
  FileText,
  FolderOpen,
  ImagePlus,
  LayoutGrid,
  Megaphone,
  MessageCircle,
  Settings,
  ShoppingBag,
  Store,
  UserRound,
  Users,
};

export function getSponsorFeatureIcon(iconName?: string | null) {
  if (!iconName) return LayoutGrid;
  return iconMap[iconName] ?? LayoutGrid;
}
