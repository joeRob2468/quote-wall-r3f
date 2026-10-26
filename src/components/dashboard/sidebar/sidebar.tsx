import { MobileSidebar } from "@/components/dashboard/sidebar/mobile-sidebar";
import { SidebarFooter } from "@/components/dashboard/sidebar/sidebar-footer";
import { SidebarNavigation } from "@/components/dashboard/sidebar/sidebar-navigation";
import { dashboardNavigation } from "@/config/navigation";

const SidebarContent = () => (
  <div className="h-full py-12 flex-1 flex flex-col">
    <SidebarNavigation items={dashboardNavigation} />
    <SidebarFooter />
  </div>
);

export const Sidebar = () => {
  return (
    <>
      <aside
        className="hidden md:block fixed z-20 top-16 h-[calc(100vh - 4rem)] w-64 overflow-y-auto"
        aria-label="Sidebar"
      >
        <SidebarContent />
      </aside>
      {/* Below md the sidebar lives in a slide-out drawer instead */}
      <MobileSidebar>
        <SidebarContent />
      </MobileSidebar>
    </>
  );
};
