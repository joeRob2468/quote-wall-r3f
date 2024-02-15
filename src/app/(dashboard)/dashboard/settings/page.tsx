import { Metadata } from "next";
import UserSettingsForm from "@/components/dashboard/settings/user-settings-form";

export const metadata: Metadata = {
  title: "Settings",
  description: "Profile settings and user configuration.",
};

export default function SettingsPage() {
  return (
    <>
      <h1 className="text-xl font-bold md:text-2xl">Settings</h1>
      <p>Manage your account settings and set e-mail preferences.</p>
      <div className="flex flex-col pt-8">
        <UserSettingsForm />
      </div>
    </>
  );
}
