"use client";

import type { CSSProperties } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import {
  DEFAULT_GRADIENT_STOPS,
  GRADIENT_STOP_LIMITS,
  gradientStyle,
  isDefaultGradient,
  normalizeHexColor,
} from "@/lib/theme/gradient";
import { saveAppearanceAction } from "../contentActions";
import { ContentEditor } from "./ContentEditor";
import { useContentForm } from "./useContentForm";
import styles from "./AppearanceEditor.module.less";

export interface AppearanceFormValues {
  gradientStops: string[];
}

/** A new stop repeats the last colour (so the gradient barely changes); this covers an invalid last one. */
const FALLBACK_NEW_STOP = "#ffffff";

export function AppearanceEditor({
  initial,
  savedAt,
}: {
  initial: AppearanceFormValues;
  savedAt: string | null;
}) {
  const form = useContentForm(initial, savedAt, saveAppearanceAction, "Gradient saved.");
  const stops = form.values.gradientStops;

  // Preview what will be saved: every stop must be a valid colour, otherwise
  // the preview keeps the last good state of the site (the default).
  const normalized = stops.map(normalizeHexColor);
  const previewStops = normalized.every((c): c is string => c !== null) ? normalized : null;
  const previewStyle = gradientStyle(previewStops) as CSSProperties;
  const isDefault = previewStops !== null && isDefaultGradient(previewStops);

  const setStops = (update: (current: string[]) => string[]) =>
    form.setValues((v) => ({ ...v, gradientStops: update(v.gradientStops) }));

  const move = (index: number, delta: -1 | 1) =>
    setStops((current) => {
      const next = [...current];
      [next[index], next[index + delta]] = [next[index + delta], next[index]];
      return next;
    });

  return (
    <ContentEditor
      title="Appearance"
      description="The decorative gradient used across the public site: the cover wallpaper, story circles, project card tops and the contact band."
      sectionTitle="Gradient colours"
      sectionDescription={`Pick ${GRADIENT_STOP_LIMITS.min} to ${GRADIENT_STOP_LIMITS.max} colours, in order. The gradient is never placed behind text, so any colours are safe for readability.`}
      saveLabel="Save gradient"
      form={form}
    >
      <div className={styles.layout}>
        <div className={styles.preview} style={previewStyle} aria-hidden="true">
          <div className={styles.cover} />
          <div className={styles.previewBody}>
            <span className={styles.ring}>
              <span className={styles.ringInner} />
            </span>
            <div className={styles.card}>
              <span className={styles.line} />
              <span className={`${styles.line} ${styles.lineShort}`} />
            </div>
          </div>
        </div>
        <p className={styles.previewCaption}>
          Preview: cover wallpaper, story circle and project card.{" "}
          {isDefault && "Showing the default colours."}
        </p>

        {form.errors.gradientStops && (
          <p className={styles.listError} role="alert">
            {form.errors.gradientStops}
          </p>
        )}

        <ol role="list" className={styles.stops}>
          {stops.map((stop, index) => {
            const label = `Colour ${index + 1}`;
            const valid = normalized[index];
            return (
              // Stops have no identity beyond their position; inputs are controlled.
              <li key={index} className={styles.stop}>
                <Field
                  label={label}
                  id={`gradient-stop-${index}`}
                  error={form.errors[`gradientStops.${index}`]}
                >
                  <div className={styles.stopControls}>
                    <input
                      type="color"
                      className={styles.swatch}
                      value={valid ?? "#000000"}
                      aria-label={`${label} picker`}
                      onChange={(e) =>
                        setStops((current) =>
                          current.map((c, i) => (i === index ? e.target.value : c))
                        )
                      }
                    />
                    <Input
                      type="text"
                      inputMode="text"
                      spellCheck={false}
                      autoComplete="off"
                      maxLength={7}
                      className={styles.hex}
                      value={stop}
                      aria-invalid={valid === null || undefined}
                      onChange={(e) =>
                        setStops((current) =>
                          current.map((c, i) => (i === index ? e.target.value : c))
                        )
                      }
                    />
                    <div className={styles.stopActions}>
                      <Button
                        variant="ghost"
                        size="sm"
                        iconOnly
                        icon="arrow-up"
                        aria-label={`Move ${label} earlier`}
                        disabled={index === 0}
                        onClick={() => move(index, -1)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        iconOnly
                        icon="arrow-down"
                        aria-label={`Move ${label} later`}
                        disabled={index === stops.length - 1}
                        onClick={() => move(index, 1)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        iconOnly
                        icon="trash"
                        aria-label={`Remove ${label}`}
                        disabled={stops.length <= GRADIENT_STOP_LIMITS.min}
                        onClick={() => setStops((current) => current.filter((_, i) => i !== index))}
                      />
                    </div>
                  </div>
                </Field>
              </li>
            );
          })}
        </ol>

        <div className={styles.actions}>
          <Button
            variant="secondary"
            icon="plus"
            disabled={stops.length >= GRADIENT_STOP_LIMITS.max}
            onClick={() =>
              setStops((current) => [
                ...current,
                normalizeHexColor(current.at(-1) ?? "") ?? FALLBACK_NEW_STOP,
              ])
            }
          >
            Add colour
          </Button>
          <Button
            variant="secondary"
            icon="refresh"
            disabled={isDefault}
            onClick={() => setStops(() => [...DEFAULT_GRADIENT_STOPS])}
          >
            Reset to default
          </Button>
        </div>
      </div>
    </ContentEditor>
  );
}
