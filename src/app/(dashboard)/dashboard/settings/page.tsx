import { Metadata } from "next";
import { PageHeading } from "@/components/layout/page-heading";
import UserSettingsForm from "@/components/dashboard/settings/user-settings-form";

export const metadata: Metadata = {
  title: "Settings",
  description: "Profile settings and user configuration.",
};

export default function SettingsPage() {
  return (
    <>
      <PageHeading
        title="Settings"
        description="Manage your account settings and set e-mail preferences."
      />
      <div className="flex flex-col pt-8">
        <UserSettingsForm />
      </div>
    </>
  );
}
