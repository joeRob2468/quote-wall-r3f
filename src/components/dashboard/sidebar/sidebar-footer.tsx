import { SidebarNavigation } from "./sidebar-navigation";
import { SignOutLink } from "@/components/auth/auth-buttons";
import { dashboardUserNavigation } from "@/config/navigation";

export const SidebarFooter = async () => {
  return (
    <div className="flex flex-col mt-4 pt-4">
      <div className="pt-4 space-y-4 border-t border-t-muted">
        <div className="flex flex-col space-y-3">
          <SidebarNavigation items={dashboardUserNavigation} />
          <SignOutLink className="font-medium text-muted-foreground hover:text-foreground" />
        </div>
      </div>
    </div>
  );
};
