"use client";

import { useState } from "react";
import { Icon } from "@/components/icons/Icon";
import type { SocialItem } from "@/components/layout/SocialLinks";
import styles from "./ContactChannels.module.less";

interface Props {
  email: string;
  channels: SocialItem[];
}

export function ContactChannels({ email, channels }: Props) {
  const [copied, setCopied] = useState(false);

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked (permissions, insecure context); the mailto link still works.
    }
  }

  return (
    <ul className={styles.list} role="list" aria-label="Contact channels">
      {email && (
        <li className={styles.item}>
          <span className={styles.icon} aria-hidden="true">
            <Icon name="mail" size={18} />
          </span>
          <div className={styles.text}>
            <span className={styles.label}>Email</span>
            <a href={`mailto:${email}`} className={styles.value}>
              {email}
            </a>
          </div>
          <button
            type="button"
            className={styles.copy}
            onClick={copyEmail}
            aria-label="Copy email address"
          >
            <Icon name={copied ? "check" : "copy"} size={16} />
          </button>
          <span className="sr-only" aria-live="polite">
            {copied ? "Email address copied" : ""}
          </span>
        </li>
      )}

      {channels.map((c) => (
        <li key={c.platform} className={styles.item}>
          <span className={styles.icon} aria-hidden="true">
            <Icon name={c.icon} size={18} />
          </span>
          <div className={styles.text}>
            <span className={styles.label}>{c.label}</span>
            <a href={c.url} target="_blank" rel="noopener noreferrer" className={styles.value}>
              {c.url.replace(/^https?:\/\/(www\.)?/, "")}
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </div>
          <Icon name="arrow-up-right" size={16} className={styles.arrow} />
        </li>
      ))}
    </ul>
  );
}
