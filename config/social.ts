export const socialLinks = {
  github: {
    label: "GitHub",
    url: "https://github.com/stephenabueva",
    icon: "github",
  },
  linkedin: {
    label: "LinkedIn",
    url: "https://linkedin.com/in/stephenabueva",
    icon: "linkedin",
  },
  facebook: {
    label: "Facebook",
    url: "https://facebook.com/stephenabueva",
    icon: "facebook",
  },
  email: {
    label: "Email",
    url: "mailto:stephen.abueva@gmail.com",
    icon: "mail",
  },
} as const;

export type SocialLinks = typeof socialLinks;
export type SocialPlatform = keyof SocialLinks;
