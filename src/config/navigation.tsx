import { Contact, NotepadText, Settings, User } from "@/components/icons";

import type { NavigationItem } from "@/types/navigation";

export const primaryNavigation: NavigationItem[] = [
  {
    title: "Home",
    href: "/",
  },
  {
    title: "Dashboard",
    href: "/dashboard",
  },
];

export const dashboardNavigation: NavigationItem[] = [
  {
    title: "Quotes",
    href: "#",
    icon: NotepadText,
  },
  {
    title: "Authors",
    href: "#",
    icon: Contact,
  },
  {
    title: "Users",
    href: "/dashboard/users",
    icon: User,
    requiresAdminRole: true,
  },
];

export const dashboardUserNavigation: NavigationItem[] = [
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];
