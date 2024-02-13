import { Icons } from "@/components/icons";
import type { NavigationItem } from "@/types/navigation";

export const primaryNavigation: NavigationItem[] = [
  {
    title: "Home",
    href: "/",
  },
  {
    title: "Dashboard",
    href: "/dashboard",
    requiresAuth: true,
  },
];

export const dashboardNavigation: NavigationItem[] = [
  {
    title: "Quotes",
    href: "#",
    icon: Icons.notepadText,
  },
  {
    title: "Authors",
    href: "#",
    icon: Icons.contact,
  },
  {
    title: "Users",
    href: "#",
    icon: Icons.user,
  },
];

export const dashboardUserNavigation: NavigationItem[] = [
  {
    title: "Settings",
    href: "#",
    icon: Icons.settings,
  },
];
