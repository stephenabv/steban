import type { ReactNode } from "react";
import Link from "next/link";
import { Icon } from "@/components/icons/Icon";
import styles from "./AdminPage.module.less";

export interface AdminPageHeaderProps {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  /** Parent page link for nested screens (e.g. Projects › New). */
  back?: { href: string; label: string };
}

export function AdminPageHeader({ title, description, actions, back }: AdminPageHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.headerText}>
        {back && (
          <Link href={back.href} className={styles.back}>
            <Icon name="arrow-left" size={14} />
            {back.label}
          </Link>
        )}
        <h1 className={styles.title}>{title}</h1>
        {description && <p className={styles.subtitle}>{description}</p>}
      </div>
      {actions && <div className={styles.headerActions}>{actions}</div>}
    </header>
  );
}
