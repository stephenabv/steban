"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import type {
  GeneratorStrategy,
  LetterLength,
  LetterTone,
  WorkMode,
} from "@/server/domain/coverLetter";
import {
  JOB_APPLICATION_LIMITS as LIMITS,
  DEFAULT_HIRING_MANAGER,
} from "@/server/domain/coverLetter";
import type { JobApplicationFormInput } from "@/server/security/coverLetterSchemas";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { formLayout } from "@/components/ui/formLayout";
import { useToast } from "@/components/ui/ToastProvider";
import { generateCoverLetterAction } from "./coverLetterActions";
import {
  LENGTH_LABELS,
  STRATEGY_LABELS,
  TONE_LABELS,
  WORK_MODE_LABELS,
  optionsOf,
} from "./coverLetterOptions";
import { useJobApplicationForm } from "./useJobApplicationForm";
import styles from "./CoverLetters.module.less";
import pageStyles from "../AdminPage.module.less";

interface NewCoverLetterFormProps {
  basePath: string;
  initialValues: JobApplicationFormInput;
  strategies: readonly GeneratorStrategy[];
}

export function NewCoverLetterForm({
  basePath,
  initialValues,
  strategies,
}: NewCoverLetterFormProps) {
  const router = useRouter();
  const toast = useToast();
  const form = useJobApplicationForm(initialValues);
  const [strategy, setStrategy] = useState<GeneratorStrategy>(strategies[0] ?? "template");
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const { values, errors } = form;
  const listHref = `${basePath}/cover-letters`;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!form.validate()) {
      setError("Please fix the highlighted fields.");
      return;
    }
    setGenerating(true);
    try {
      const result = await generateCoverLetterAction({ application: values, strategy });
      if (!result.ok || !result.data) {
        if (result.fieldErrors) form.showServerErrors(result.fieldErrors);
        setError(result.error ?? "Couldn't generate the letter.");
        return;
      }
      result.data.notices.forEach((notice) => toast.info(notice));
      toast.success("Cover letter generated.");
      router.push(`${listHref}/${result.data.id}`);
    } catch {
      setError("Something went wrong while generating. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <>
      {error && (
        <Alert tone="danger" title="Couldn't generate the letter">
          {error}
        </Alert>
      )}

      <form onSubmit={onSubmit} noValidate className={pageStyles.stack}>
        <Card padding="lg" as="section" aria-labelledby="company-heading">
          <CardHeader id="company-heading" title="Company" />
          <div className={formLayout.grid}>
            <Field label="Company name" required error={errors.companyName}>
              <Input
                value={values.companyName}
                maxLength={LIMITS.companyName}
                onChange={(e) => form.setText("companyName", e.target.value)}
                autoComplete="organization"
              />
            </Field>
            <Field label="Location" optional error={errors.companyLocation}>
              <Input
                value={values.companyLocation}
                maxLength={LIMITS.companyLocation}
                onChange={(e) => form.setText("companyLocation", e.target.value)}
                placeholder="Makati City, Philippines"
              />
            </Field>
            <Field
              label="Hiring manager"
              optional
              hint={`Leave blank to address "${DEFAULT_HIRING_MANAGER}".`}
              error={errors.hiringManager}
            >
              <Input
                value={values.hiringManager}
                maxLength={LIMITS.hiringManager}
                onChange={(e) => form.setText("hiringManager", e.target.value)}
                placeholder={DEFAULT_HIRING_MANAGER}
              />
            </Field>
            <Field
              label="Job posting URL"
              optional
              hint="Saved for your reference only. It is never opened or fetched."
              error={errors.postingUrl}
            >
              <Input
                type="url"
                inputMode="url"
                value={values.postingUrl}
                maxLength={LIMITS.postingUrl}
                onChange={(e) => form.setText("postingUrl", e.target.value)}
                placeholder="https://"
              />
            </Field>
            <Field
              label="Client or industry context"
              optional
              hint="For example, the client an agency is hiring for."
              error={errors.industryContext}
              count={{ value: (values.industryContext ?? "").length, max: LIMITS.industryContext }}
              className={formLayout.span2}
            >
              <Textarea
                rows={2}
                value={values.industryContext}
                maxLength={LIMITS.industryContext}
                onChange={(e) => form.setText("industryContext", e.target.value)}
              />
            </Field>
          </div>
        </Card>

        <Card padding="lg" as="section" aria-labelledby="position-heading">
          <CardHeader id="position-heading" title="Position" />
          <div className={formLayout.grid}>
            <Field label="Position title" required error={errors.positionTitle}>
              <Input
                value={values.positionTitle}
                maxLength={LIMITS.positionTitle}
                onChange={(e) => form.setText("positionTitle", e.target.value)}
              />
            </Field>
            <Field label="Work arrangement" required error={errors["workArrangement.mode"]}>
              <Select
                value={values.workArrangement.mode}
                onChange={(e) => form.setMode(e.target.value as WorkMode)}
              >
                {optionsOf(WORK_MODE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field
              label="Schedule"
              optional
              hint="For example, night shift (US hours) or 3 days in office."
              error={errors["workArrangement.schedule"]}
              className={formLayout.span2}
            >
              <Input
                value={values.workArrangement.schedule}
                maxLength={LIMITS.schedule}
                onChange={(e) => form.setSchedule(e.target.value)}
              />
            </Field>
            <Field
              label="Job description"
              required
              hint="Paste the full posting. It is used only to match your profile."
              error={errors.jobDescription}
              count={{ value: values.jobDescription.length, max: LIMITS.jobDescription }}
              className={formLayout.span2}
            >
              <Textarea
                rows={12}
                value={values.jobDescription}
                maxLength={LIMITS.jobDescription}
                onChange={(e) => form.setText("jobDescription", e.target.value)}
              />
            </Field>
          </div>
        </Card>

        <Card padding="lg" as="section" aria-labelledby="letter-heading">
          <CardHeader id="letter-heading" title="Letter" />
          <div className={styles.choiceGrid}>
            <Field
              label="Date"
              optional
              hint="Defaults to today in Manila."
              error={errors.letterDate}
            >
              <Input
                type="date"
                value={values.letterDate}
                onChange={(e) => form.setText("letterDate", e.target.value)}
              />
            </Field>
            <Field label="Tone" error={errors.tone}>
              <Select
                value={values.tone}
                onChange={(e) => form.setTone(e.target.value as LetterTone)}
              >
                {optionsOf(TONE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Length" error={errors.length}>
              <Select
                value={values.length}
                onChange={(e) => form.setLength(e.target.value as LetterLength)}
              >
                {optionsOf(LENGTH_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
            {strategies.length > 1 && (
              <Field label="Generator" error={errors.strategy}>
                <Select
                  value={strategy}
                  onChange={(e) => setStrategy(e.target.value as GeneratorStrategy)}
                >
                  {strategies.map((value) => (
                    <option key={value} value={value}>
                      {STRATEGY_LABELS[value]}
                    </option>
                  ))}
                </Select>
              </Field>
            )}
          </div>
        </Card>

        <div className={pageStyles.formActions}>
          <span className={pageStyles.formActionsHint}>Fields marked * are required.</span>
          <Button href={listHref} variant="secondary">
            Cancel
          </Button>
          <Button type="submit" icon="sparkle" loading={generating} loadingText="Generating…">
            Generate letter
          </Button>
        </div>
      </form>
    </>
  );
}
