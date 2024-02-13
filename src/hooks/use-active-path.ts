import { usePathname } from "next/navigation";

export function useActivePath(): (path: string) => boolean {
  const pathName = usePathname();

  const checkActivePath = (path: string) => {
    if (path === "/" && pathName !== path) {
      return false;
    }
    return pathName.startsWith(path);
  };

  return checkActivePath;
}
