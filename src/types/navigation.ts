export interface NavigationItem {
  title: string;
  href: string;
  icon?: any;
  disabled?: boolean;
  external?: boolean;
  requiresAdminRole?: boolean;
}
