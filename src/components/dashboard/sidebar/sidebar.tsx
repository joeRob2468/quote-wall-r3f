import { SidebarFooter } from "@/components/dashboard/sidebar/sidebar-footer";
import { SidebarHeader } from "@/components/dashboard/sidebar/sidebar-header";
import { SidebarNavigation } from "@/components/dashboard/sidebar/sidebar-navigation";
import { dashboardNavigation } from "@/config/navigation";

export const Sidebar = () => {
  return (
    <aside
      className="fixed z-20 top-16 h-[calc(100vh - 4rem)] w-64 overflow-y-auto"
      aria-label="Sidebar"
    >
      <div className="h-full py-12 flex-1 flex flex-col">
        <SidebarHeader />
        <SidebarNavigation items={dashboardNavigation} />
        <SidebarFooter />
      </div>
    </aside>
  );
};
