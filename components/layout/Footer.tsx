import Link from "next/link";
import { siteConfig } from "@/config/site";
import { contactNav, legalNav, primaryNav } from "@/config/navigation";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/icons/Icon";
import { Logo } from "./Logo";
import { getSocialItems } from "./SocialLinks";
import styles from "./Footer.module.less";

export function Footer() {
  const year = new Date().getFullYear();
  const [first, last] = siteConfig.name.split(" ");
  const socials = getSocialItems();

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.top}>
          <div className={styles.brand}>
            <Link href="/" className={styles.name} aria-label={`${siteConfig.name} — home`}>
              <Logo size={28} decorative />
              <span>
                {first} <span className={styles.accent}>{last}</span>
              </span>
            </Link>
            <p className={styles.tagline}>{siteConfig.description}</p>
            <Badge tone="success" pulse>
              Available for opportunities
            </Badge>
          </div>

          <nav className={styles.column} aria-labelledby="footer-nav-heading">
            <h2 id="footer-nav-heading" className={styles.columnTitle}>
              Navigate
            </h2>
            <ul role="list">
              {[...primaryNav, contactNav].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className={styles.columnLink}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav className={styles.column} aria-labelledby="footer-connect-heading">
            <h2 id="footer-connect-heading" className={styles.columnTitle}>
              Connect
            </h2>
            <ul role="list">
              {socials.map((item) => (
                <li key={item.platform}>
                  <a
                    href={item.url}
                    className={styles.columnLink}
                    {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  >
                    <Icon name={item.icon} size={16} />
                    {item.label}
                    {item.external && <span className="sr-only">(opens in a new tab)</span>}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className={styles.bottom}>
          <p className={styles.copyright}>
            &copy; {year} {siteConfig.name}. All Rights Reserved.
          </p>
          <ul className={styles.legal} role="list">
            {legalNav.map(({ href, label }) => (
              <li key={href}>
                <Link href={href}>{label}</Link>
              </li>
            ))}
            <li>
              <a href="#main-content" className={styles.backToTop}>
                Back to top
                <Icon name="arrow-up" size={14} />
              </a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
