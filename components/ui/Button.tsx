import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { Icon } from "@/components/icons/Icon";
import type { IconName } from "@/components/icons/Icon";
import { cn } from "@/lib/cn";
import styles from "./Button.module.less";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "dangerSolid" | "link";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonStyleProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Leading icon from the shared registry. */
  icon?: IconName;
  /** Trailing icon from the shared registry. */
  iconRight?: IconName;
  /** Renders a square, icon-only button. `aria-label` becomes required in practice. */
  iconOnly?: boolean;
  fullWidth?: boolean;
  loading?: boolean;
  loadingText?: string;
  children?: ReactNode;
  className?: string;
}

type NativeButtonProps = ButtonStyleProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonStyleProps> & { href?: undefined };

type AnchorProps = ButtonStyleProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof ButtonStyleProps | "href"> & {
    href: string;
    /** Opens in a new tab with a safe `rel`. Inferred for absolute http(s) URLs. */
    external?: boolean;
  };

export type ButtonProps = NativeButtonProps | AnchorProps;

const ICON_SIZE: Record<ButtonSize, number> = { sm: 14, md: 16, lg: 18 };

/** Class list for callers that need button styling on a custom element. */
export function buttonClassName({
  variant = "primary",
  size = "md",
  iconOnly = false,
  fullWidth = false,
  className,
}: Pick<ButtonStyleProps, "variant" | "size" | "iconOnly" | "fullWidth" | "className">): string {
  return cn(
    styles.button,
    styles[variant],
    styles[size],
    iconOnly && styles.iconOnly,
    fullWidth && styles.fullWidth,
    className
  );
}

function isAnchor(props: ButtonProps): props is AnchorProps {
  return typeof props.href === "string";
}

/**
 * Polymorphic button: renders a `<button>`, an internal `<Link>`, or an external
 * `<a>` depending on `href`, with one consistent visual language.
 */
export function Button(props: ButtonProps) {
  const {
    variant = "primary",
    size = "md",
    icon,
    iconRight,
    iconOnly = false,
    fullWidth = false,
    loading = false,
    loadingText,
    children,
    className,
    ...rest
  } = props;

  const classes = buttonClassName({ variant, size, iconOnly, fullWidth, className });
  const iconSize = ICON_SIZE[size];

  const content = (
    <>
      {loading ? (
        <span className={styles.spinner} aria-hidden="true" />
      ) : (
        icon && <Icon name={icon} size={iconSize} />
      )}
      {loading && loadingText ? loadingText : children}
      {!loading && iconRight && <Icon name={iconRight} size={iconSize} />}
    </>
  );

  if (isAnchor(props)) {
    const { href, external, ...anchorRest } = rest as Omit<AnchorProps, keyof ButtonStyleProps>;
    const isExternal = external ?? /^https?:\/\//.test(href);

    if (isExternal || href.startsWith("mailto:")) {
      return (
        <a
          href={href}
          className={classes}
          {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          {...anchorRest}
        >
          {content}
        </a>
      );
    }

    return (
      <Link href={href} className={classes} {...anchorRest}>
        {content}
      </Link>
    );
  }

  const { type = "button", disabled, ...buttonRest } = rest as Omit<
    NativeButtonProps,
    keyof ButtonStyleProps
  >;

  return (
    <button
      type={type}
      className={classes}
      data-icon-only={iconOnly || undefined}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...buttonRest}
    >
      {content}
    </button>
  );
}
