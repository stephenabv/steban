"use client";

import { useState } from "react";
import type { WorkMode } from "@/server/domain/coverLetter";
import { fieldErrorsOf, jobApplicationSchema } from "@/server/security/coverLetterSchemas";
import type { JobApplicationFormInput } from "@/server/security/coverLetterSchemas";

type TextField = Exclude<keyof JobApplicationFormInput, "workArrangement" | "tone" | "length">;

/** Server errors are keyed under the `application` object; the form uses bare paths. */
const SERVER_PREFIX = "application.";

/** Form state for a job application, validated with the same schema the server uses. */
export function useJobApplicationForm(initial: JobApplicationFormInput) {
  const [values, setValues] = useState<JobApplicationFormInput>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function update(patch: Partial<JobApplicationFormInput>, clears: string) {
    setValues((current) => ({ ...current, ...patch }));
    setErrors((current) => {
      const next = { ...current };
      delete next[clears];
      return next;
    });
  }

  return {
    values,
    errors,
    setText: (field: TextField, value: string) => update({ [field]: value }, field),
    setTone: (tone: JobApplicationFormInput["tone"]) => update({ tone }, "tone"),
    setLength: (length: JobApplicationFormInput["length"]) => update({ length }, "length"),
    setMode: (mode: WorkMode) =>
      update({ workArrangement: { ...values.workArrangement, mode } }, "workArrangement.mode"),
    setSchedule: (schedule: string) =>
      update(
        { workArrangement: { ...values.workArrangement, schedule } },
        "workArrangement.schedule"
      ),
    /** True when the client-side checks pass; otherwise shows field errors. */
    validate(): boolean {
      const parsed = jobApplicationSchema.safeParse(values);
      setErrors(parsed.success ? {} : fieldErrorsOf(parsed.error));
      return parsed.success;
    },
    showServerErrors(serverErrors: Record<string, string>) {
      setErrors(
        Object.fromEntries(
          Object.entries(serverErrors).map(([path, message]) => [
            path.startsWith(SERVER_PREFIX) ? path.slice(SERVER_PREFIX.length) : path,
            message,
          ])
        )
      );
    },
  };
}
