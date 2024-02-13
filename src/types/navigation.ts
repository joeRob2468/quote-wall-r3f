export interface NavigationItem {
  title: string;
  href: string;
  icon?: any;
  disabled?: boolean;
  external?: boolean;
  requiresAuth?: boolean;
  requiresAdminRole?: boolean;
}
