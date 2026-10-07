import { CustomLeaguePlatformIcon } from "@/components/icons/CustomLeaguePlatformIcon";
import { SleeperPlatformIcon } from "@/components/icons/SleeperPlatformIcon";

export function LeaguePlatformIcon({ platform, className }: { platform: string; className?: string }) {
  if (platform === "SLEEPER") return <SleeperPlatformIcon className={className} />;
  return <CustomLeaguePlatformIcon className={className} />;
}
