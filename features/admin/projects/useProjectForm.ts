"use client";

import { useCallback, useState } from "react";
import { ProjectFormModel } from "./ProjectFormModel";
import type { ProjectFormValues } from "./ProjectFormModel";

export interface UseProjectForm {
  values: ProjectFormValues;
  setField: <K extends keyof ProjectFormValues>(key: K, value: ProjectFormValues[K]) => void;
  /** Updates the title and, until the slug is edited by hand, derives the slug. */
  setTitle: (title: string) => void;
  setSlug: (slug: string) => void;
  reset: (values: ProjectFormValues, slugLocked: boolean) => void;
  isDirty: boolean;
}

export function useProjectForm(initial: ProjectFormValues, { slugLocked }: { slugLocked: boolean }): UseProjectForm {
  const [baseline, setBaseline] = useState(initial);
  const [values, setValues] = useState(initial);
  const [slugTouched, setSlugTouched] = useState(slugLocked);

  const setField = useCallback(<K extends keyof ProjectFormValues>(key: K, value: ProjectFormValues[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
  }, []);

  const setTitle = useCallback(
    (title: string) => {
      setValues((v) => ({ ...v, title, slug: slugTouched ? v.slug : ProjectFormModel.slugify(title) }));
    },
    [slugTouched]
  );

  const setSlug = useCallback((slug: string) => {
    setSlugTouched(true);
    setValues((v) => ({ ...v, slug: ProjectFormModel.slugify(slug) }));
  }, []);

  const reset = useCallback((next: ProjectFormValues, locked: boolean) => {
    setBaseline(next);
    setValues(next);
    setSlugTouched(locked);
  }, []);

  const isDirty = (Object.keys(values) as (keyof ProjectFormValues)[]).some((k) => values[k] !== baseline[k]);

  return { values, setField, setTitle, setSlug, reset, isDirty };
}
