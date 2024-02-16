import { Button } from "@/components/ui/button";
import Link from "next/link";

interface ErrorWrapperProps {
  description: string;
  children?: React.ReactNode;
  heading?: string;
  buttonLabel?: string;
  buttonHref?: string;
}
export const ErrorWrapper = ({
  description,
  children,
  heading,
  buttonLabel,
  buttonHref,
}: ErrorWrapperProps) => {
  return (
    <>
      <div className="flex flex-col space-y-4">
        <div className="space-y-2">
          <h1 className="text-xl font-bold md:text-2xl">
            {heading || "Something went wrong."}
          </h1>
          {description && <p>{description}</p>}
        </div>

        <div>{children}</div>

        {buttonHref && (
          <div>
            <Button variant="outline" asChild>
              <Link href={buttonHref}>{buttonLabel || "Go Back"}</Link>
            </Button>
          </div>
        )}
      </div>
    </>
  );
};
