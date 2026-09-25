/** Footer legal links. Each is a site path ("/privacy") or an absolute http(s) URL. */
export interface FooterSettings {
  privacyUrl: string;
  termsUrl: string;
  updatedAt: Date;
}

export type FooterContent = Omit<FooterSettings, "updatedAt">;
