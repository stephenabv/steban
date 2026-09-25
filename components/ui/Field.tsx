"use client";

import { createContext, useContext, useId } from "react";
import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { Icon } from "@/components/icons/Icon";
import { cn } from "@/lib/cn";
import styles from "./Field.module.less";

// ─── Context ──────────────────────────────────────────────────────────────────
// A Field owns the ids that connect its label, hint and error to the control,
// so every control rendered inside it is accessible without manual wiring.
interface FieldContextValue {
  id: string;
  describedBy?: string;
  invalid: boolean;
  required: boolean;
}

const FieldContext = createContext<FieldContextValue | null>(null);

function useFieldControl<T extends { id?: string; required?: boolean }>(props: T) {
  const field = useContext(FieldContext);
  return {
    id: props.id ?? field?.id,
    required: props.required ?? field?.required,
    "aria-invalid": field?.invalid || undefined,
    "aria-describedby": field?.describedBy,
  };
}

// ─── Field ────────────────────────────────────────────────────────────────────
export interface FieldProps {
  label: ReactNode;
  children: ReactNode;
  id?: string;
  hint?: ReactNode;
  error?: string | null;
  required?: boolean;
  optional?: boolean;
  /** Current length and limit render a live character counter. */
  count?: { value: number; max: number };
  className?: string;
}

export function Field({
  label,
  children,
  id,
  hint,
  error,
  required = false,
  optional = false,
  count,
  className,
}: FieldProps) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const hintId = hint ? `${controlId}-hint` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;

  const ratio = count ? count.value / count.max : 0;

  return (
    <FieldContext.Provider value={{ id: controlId, describedBy, invalid: Boolean(error), required }}>
      <div className={cn(styles.field, className)}>
        <div className={styles.labelRow}>
          <label className={styles.label} htmlFor={controlId}>
            {label}
            {required && (
              <span className={styles.required} aria-hidden="true">
                *
              </span>
            )}
            {optional && <span className={styles.optional}>(optional)</span>}
          </label>
          {count && (
            <span
              className={cn(styles.counter, ratio > 1 ? styles.over : ratio > 0.9 && styles.near)}
              aria-live="polite"
            >
              {count.value.toLocaleString()}/{count.max.toLocaleString()}
            </span>
          )}
        </div>
        {children}
        {error ? (
          <p id={errorId} className={styles.error}>
            <Icon name="alert" size={14} />
            {error}
          </p>
        ) : (
          hint && (
            <p id={hintId} className={styles.hint}>
              {hint}
            </p>
          )
        )}
      </div>
    </FieldContext.Provider>
  );
}

// ─── Controls ─────────────────────────────────────────────────────────────────
export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  const wiring = useFieldControl(props);
  return <input {...props} {...wiring} className={cn(styles.control, className)} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const wiring = useFieldControl(props);
  return <textarea {...props} {...wiring} className={cn(styles.textarea, className)} />;
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  const wiring = useFieldControl(props);
  return (
    <select {...props} {...wiring} className={cn(styles.select, className)}>
      {children}
    </select>
  );
}

export interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value: string;
  onValueChange: (value: string) => void;
  /** Accessible name when no visible label is present. */
  label: string;
}

export function SearchInput({ value, onValueChange, label, className, ...props }: SearchInputProps) {
  return (
    <div className={cn(styles.inputWrap, className)}>
      <Icon name="search" size={16} />
      <input
        type="search"
        aria-label={label}
        autoComplete="off"
        spellCheck={false}
        {...props}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape" && value) {
            e.preventDefault();
            onValueChange("");
          }
        }}
        className={styles.control}
      />
      {value && (
        <button
          type="button"
          className={styles.clearBtn}
          onClick={() => onValueChange("")}
          aria-label="Clear search"
        >
          <Icon name="close" size={14} />
        </button>
      )}
    </div>
  );
}

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> {
  label: ReactNode;
  description?: ReactNode;
  onCheckedChange: (checked: boolean) => void;
}

/** Native checkbox exposed as role="switch" — keyboard, forms and AT work out of the box. */
export function Switch({ label, description, onCheckedChange, className, disabled, ...props }: SwitchProps) {
  return (
    <label className={cn(styles.switch, disabled && styles.switchDisabled, className)}>
      <input
        type="checkbox"
        role="switch"
        disabled={disabled}
        {...props}
        onChange={(e) => onCheckedChange(e.target.checked)}
      />
      <span className={styles.track} aria-hidden="true" />
      <span className={styles.switchText}>
        <span className={styles.switchLabel}>{label}</span>
        {description && <span className={styles.switchDescription}>{description}</span>}
      </span>
    </label>
  );
}
