export const siteConfig = {
  name: "DevFlow",
  description:
    "A modern developer workflow management platform for agile teams.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ogImage: "/og.png",
  version: "1.0.0",
  links: {
    github: "https://github.com/yourusername/devflow",
    docs: "https://docs.devflow.app",
  },
} as const;

export type SiteConfig = typeof siteConfig;
