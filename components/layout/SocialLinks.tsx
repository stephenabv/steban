import { socialLinks } from "@/config/social";
import type { SocialPlatform } from "@/config/social";
import { Icon } from "@/components/icons/Icon";
import type { IconName } from "@/components/icons/Icon";

export interface SocialItem {
  platform: SocialPlatform;
  label: string;
  url: string;
  icon: IconName;
  external: boolean;
}

const ICON_BY_PLATFORM: Record<SocialPlatform, IconName> = {
  github: "github",
  linkedin: "linkedin",
  facebook: "facebook",
  email: "mail",
};

/** Normalised social links shared by the footer and contact page. */
export function getSocialItems(platforms: readonly SocialPlatform[] = ["github", "linkedin", "facebook", "email"]): SocialItem[] {
  return platforms.map((platform) => ({
    platform,
    label: socialLinks[platform].label,
    url: socialLinks[platform].url,
    icon: ICON_BY_PLATFORM[platform],
    external: !socialLinks[platform].url.startsWith("mailto:"),
  }));
}

export function SocialIcon({ item, size = 18 }: { item: SocialItem; size?: number }) {
  return <Icon name={item.icon} size={size} />;
}
