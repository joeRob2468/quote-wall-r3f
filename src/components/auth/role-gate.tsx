import { ErrorWrapper } from "@/components/error-wrapper";
import { UserRole } from "@prisma/client";
import { currentRole } from "@/lib/auth";

interface RoleGateProps {
  children: React.ReactNode;
  allowedRole: UserRole;
}

export const RoleGate = async ({ children, allowedRole }: RoleGateProps) => {
  const role = await currentRole();

  if (
    role !== allowedRole ||
    (allowedRole === UserRole.USER && role !== UserRole.ADMIN)
  ) {
    return (
      <ErrorWrapper
        heading="Unauthorized"
        description="You do not have permission to view this content."
      />
    );
  }

  return <>{children}</>;
};
