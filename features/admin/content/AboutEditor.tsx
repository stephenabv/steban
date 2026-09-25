"use client";

import { useEffect, useMemo } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Switch, Textarea } from "@/components/ui/Field";
import { formLayout } from "@/components/ui/formLayout";
import { saveAboutAction } from "../contentActions";
import { CollapsibleSection } from "./CollapsibleSection";
import { ContentEditor } from "./ContentEditor";
import { RepeatableList } from "./RepeatableList";
import { useCollapsibleSections } from "./useCollapsibleSections";
import { useContentForm } from "./useContentForm";
import styles from "./AboutEditor.module.less";

/* Form-side shapes: everything is a string an input can hold ("YYYY-MM" months, years as text). */
export interface SkillForm {
  id: string;
  name: string;
  category: string;
  proficiencyLevel: number;
}
export interface ExperienceForm {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
  technologies: string;
}
export interface EducationForm {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startYear: string;
  endYear: string;
  description: string;
}
export interface CertificationForm {
  id: string;
  name: string;
  issuer: string;
  issuedAt: string;
  expiresAt: string;
  credentialUrl: string;
}
export interface AwardForm {
  id: string;
  title: string;
  issuer: string;
  year: string;
  description: string;
}
export interface AboutFormValues {
  biography: string;
  skills: SkillForm[];
  experience: ExperienceForm[];
  education: EducationForm[];
  certifications: CertificationForm[];
  awards: AwardForm[];
}

const SECTION_KEYS = ["biography", "skills", "experience", "education", "certifications", "awards"] as const;
type SectionKey = (typeof SECTION_KEYS)[number];

const countLabel = (n: number, singular: string, plural = `${singular}s`) => (n === 0 ? "None yet" : `${n} ${n === 1 ? singular : plural}`);

const newId = () => crypto.randomUUID();
const PROFICIENCY = ["Beginner", "Basic", "Intermediate", "Advanced", "Expert"];

async function save(values: AboutFormValues) {
  return saveAboutAction({
    ...values,
    experience: values.experience.map((e) => ({
      ...e,
      technologies: e.technologies.split(",").map((t) => t.trim()).filter(Boolean),
    })),
  });
}

export function AboutEditor({ initial, savedAt }: { initial: AboutFormValues; savedAt: string | null }) {
  const form = useContentForm(initial, savedAt, save, "About page saved.");
  const { values, patch, errors } = form;
  const err = (path: string) => errors[path];

  const sections = useCollapsibleSections(SECTION_KEYS);
  const sectionsWithErrors = useMemo(
    () => SECTION_KEYS.filter((key) => Object.keys(errors).some((path) => path === key || path.startsWith(`${key}.`))),
    [errors]
  );
  // A failed save must never hide the fields that need fixing.
  const { reveal } = sections;
  useEffect(() => reveal(sectionsWithErrors), [reveal, sectionsWithErrors]);

  const summaries: Record<SectionKey, string> = {
    biography: values.biography.trim() ? `${values.biography.trim().split(/\s+/).length} words` : "Empty",
    skills: countLabel(values.skills.length, "skill"),
    experience: countLabel(values.experience.length, "role"),
    education: countLabel(values.education.length, "entry", "entries"),
    certifications: countLabel(values.certifications.length, "certification"),
    awards: countLabel(values.awards.length, "award"),
  };

  return (
    <ContentEditor
      title="About"
      description="Biography, skills, experience, education, certifications and awards on the About page."
      form={form}
    >
      <div className={styles.toolbar}>
        <Button variant="ghost" size="sm" icon="chevrons-down" onClick={() => sections.setAll(true)} disabled={sections.allOpen}>
          Expand all
        </Button>
        <Button variant="ghost" size="sm" icon="chevrons-up" onClick={() => sections.setAll(false)} disabled={sections.allClosed}>
          Collapse all
        </Button>
      </div>
      <div className={styles.sections}>
        <CollapsibleSection
          id="ab-bio"
          title="Biography"
          open={sections.isOpen("biography")}
          onToggle={() => sections.toggle("biography")}
          summary={summaries.biography}
          hasErrors={sectionsWithErrors.includes("biography")}
        >
          <Field
            label="Biography"
            id="ab-bio"
            error={err("biography")}
            hint="Line breaks are kept on the public page."
            count={{ value: values.biography.length, max: 10000 }}
          >
            <Textarea
              value={values.biography}
              onChange={(e) => patch({ biography: e.target.value })}
              rows={8}
              placeholder="Write a professional biography…"
            />
          </Field>
        </CollapsibleSection>

        <CollapsibleSection
          id="ab-skills"
          title="Skills"
          open={sections.isOpen("skills")}
          onToggle={() => sections.toggle("skills")}
          summary={summaries.skills}
          hasErrors={sectionsWithErrors.includes("skills")}
        >
          <p className={styles.hint}>Skills are grouped by category on the public page.</p>
          <RepeatableList
            items={values.skills}
            onChange={(skills) => patch({ skills })}
            getKey={(s) => s.id}
            create={() => ({ id: newId(), name: "", category: values.skills.at(-1)?.category ?? "", proficiencyLevel: 3 })}
            itemLabel={(s, i) => s.name || `Skill ${i + 1}`}
            addLabel="Add skill"
            emptyText="No skills yet."
            max={150}
            renderItem={(s, i, update) => (
              <div className={styles.grid3}>
                <Field label="Skill" id={`sk-${s.id}-name`} required error={err(`skills.${i}.name`)}>
                  <Input value={s.name} onChange={(e) => update({ name: e.target.value })} placeholder="TypeScript" />
                </Field>
                <Field label="Category" id={`sk-${s.id}-cat`} required error={err(`skills.${i}.category`)}>
                  <Input value={s.category} onChange={(e) => update({ category: e.target.value })} placeholder="Languages" />
                </Field>
                <Field label="Proficiency" id={`sk-${s.id}-lvl`}>
                  <Select value={s.proficiencyLevel} onChange={(e) => update({ proficiencyLevel: Number(e.target.value) })}>
                    {PROFICIENCY.map((label, level) => (
                      <option key={label} value={level + 1}>
                        {label}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
            )}
          />
        </CollapsibleSection>

        <CollapsibleSection
          id="ab-exp"
          title="Experience"
          open={sections.isOpen("experience")}
          onToggle={() => sections.toggle("experience")}
          summary={summaries.experience}
          hasErrors={sectionsWithErrors.includes("experience")}
        >
          <p className={styles.hint}>
            The About page lists roles newest first — current roles, then by end date — whatever the order here.
          </p>
          <RepeatableList
            items={values.experience}
            onChange={(experience) => patch({ experience })}
            getKey={(e) => e.id}
            create={() => ({
              id: newId(),
              company: "",
              role: "",
              startDate: "",
              endDate: "",
              current: false,
              description: "",
              technologies: "",
            })}
            itemLabel={(e, i) => (e.role || e.company ? [e.role, e.company].filter(Boolean).join(" · ") : `Position ${i + 1}`)}
            addLabel="Add position"
            emptyText="No experience yet."
            max={50}
            renderItem={(e, i, update) => (
              <div className={formLayout.grid}>
                <Field label="Role" id={`ex-${e.id}-role`} required error={err(`experience.${i}.role`)}>
                  <Input value={e.role} onChange={(ev) => update({ role: ev.target.value })} placeholder="Senior Software Engineer" />
                </Field>
                <Field label="Company" id={`ex-${e.id}-co`} required error={err(`experience.${i}.company`)}>
                  <Input value={e.company} onChange={(ev) => update({ company: ev.target.value })} />
                </Field>
                <Field label="Start" id={`ex-${e.id}-start`} required error={err(`experience.${i}.startDate`)}>
                  <Input type="month" value={e.startDate} onChange={(ev) => update({ startDate: ev.target.value })} />
                </Field>
                <Field label="End" id={`ex-${e.id}-end`} optional error={err(`experience.${i}.endDate`)}>
                  <Input
                    type="month"
                    value={e.current ? "" : e.endDate}
                    disabled={e.current}
                    onChange={(ev) => update({ endDate: ev.target.value })}
                  />
                </Field>
                <div className={formLayout.span2}>
                  <Switch
                    checked={e.current}
                    onCheckedChange={(current) => update({ current, endDate: current ? "" : e.endDate })}
                    label="I currently work here"
                  />
                </div>
                <Field label="Description" id={`ex-${e.id}-desc`} className={formLayout.span2} error={err(`experience.${i}.description`)}>
                  <Textarea rows={4} value={e.description} onChange={(ev) => update({ description: ev.target.value })} />
                </Field>
                <Field
                  label="Technologies"
                  id={`ex-${e.id}-tech`}
                  optional
                  className={formLayout.span2}
                  hint="Comma-separated."
                  error={err(`experience.${i}.technologies`)}
                >
                  <Input value={e.technologies} onChange={(ev) => update({ technologies: ev.target.value })} placeholder="Next.js, PostgreSQL" />
                </Field>
              </div>
            )}
          />
        </CollapsibleSection>

        <CollapsibleSection
          id="ab-edu"
          title="Education"
          open={sections.isOpen("education")}
          onToggle={() => sections.toggle("education")}
          summary={summaries.education}
          hasErrors={sectionsWithErrors.includes("education")}
        >
          <RepeatableList
            items={values.education}
            onChange={(education) => patch({ education })}
            getKey={(e) => e.id}
            create={() => ({ id: newId(), institution: "", degree: "", field: "", startYear: "", endYear: "", description: "" })}
            itemLabel={(e, i) => e.institution || `Education ${i + 1}`}
            addLabel="Add education"
            emptyText="No education yet."
            max={30}
            renderItem={(e, i, update) => (
              <div className={formLayout.grid}>
                <Field label="Institution" id={`ed-${e.id}-inst`} required className={formLayout.span2} error={err(`education.${i}.institution`)}>
                  <Input value={e.institution} onChange={(ev) => update({ institution: ev.target.value })} />
                </Field>
                <Field label="Degree" id={`ed-${e.id}-deg`} required error={err(`education.${i}.degree`)}>
                  <Input value={e.degree} onChange={(ev) => update({ degree: ev.target.value })} placeholder="BS" />
                </Field>
                <Field label="Field of study" id={`ed-${e.id}-field`} required error={err(`education.${i}.field`)}>
                  <Input value={e.field} onChange={(ev) => update({ field: ev.target.value })} placeholder="Computer Engineering" />
                </Field>
                <Field label="Start year" id={`ed-${e.id}-sy`} required error={err(`education.${i}.startYear`)}>
                  <Input type="number" inputMode="numeric" value={e.startYear} onChange={(ev) => update({ startYear: ev.target.value })} />
                </Field>
                <Field label="End year" id={`ed-${e.id}-ey`} optional error={err(`education.${i}.endYear`)}>
                  <Input type="number" inputMode="numeric" value={e.endYear} onChange={(ev) => update({ endYear: ev.target.value })} />
                </Field>
                <Field label="Notes" id={`ed-${e.id}-desc`} optional className={formLayout.span2} error={err(`education.${i}.description`)}>
                  <Textarea rows={3} value={e.description} onChange={(ev) => update({ description: ev.target.value })} />
                </Field>
              </div>
            )}
          />
        </CollapsibleSection>

        <CollapsibleSection
          id="ab-cert"
          title="Certifications"
          open={sections.isOpen("certifications")}
          onToggle={() => sections.toggle("certifications")}
          summary={summaries.certifications}
          hasErrors={sectionsWithErrors.includes("certifications")}
        >
          <RepeatableList
            items={values.certifications}
            onChange={(certifications) => patch({ certifications })}
            getKey={(c) => c.id}
            create={() => ({ id: newId(), name: "", issuer: "", issuedAt: "", expiresAt: "", credentialUrl: "" })}
            itemLabel={(c, i) => c.name || `Certification ${i + 1}`}
            addLabel="Add certification"
            emptyText="No certifications yet. The section is hidden on the public page until you add one."
            max={50}
            renderItem={(c, i, update) => (
              <div className={formLayout.grid}>
                <Field label="Name" id={`ce-${c.id}-name`} required error={err(`certifications.${i}.name`)}>
                  <Input value={c.name} onChange={(ev) => update({ name: ev.target.value })} />
                </Field>
                <Field label="Issuer" id={`ce-${c.id}-iss`} required error={err(`certifications.${i}.issuer`)}>
                  <Input value={c.issuer} onChange={(ev) => update({ issuer: ev.target.value })} />
                </Field>
                <Field label="Issued" id={`ce-${c.id}-at`} required error={err(`certifications.${i}.issuedAt`)}>
                  <Input type="month" value={c.issuedAt} onChange={(ev) => update({ issuedAt: ev.target.value })} />
                </Field>
                <Field label="Expires" id={`ce-${c.id}-exp`} optional error={err(`certifications.${i}.expiresAt`)}>
                  <Input type="month" value={c.expiresAt} onChange={(ev) => update({ expiresAt: ev.target.value })} />
                </Field>
                <Field label="Credential URL" id={`ce-${c.id}-url`} optional className={formLayout.span2} error={err(`certifications.${i}.credentialUrl`)}>
                  <Input type="url" value={c.credentialUrl} onChange={(ev) => update({ credentialUrl: ev.target.value })} placeholder="https://…" />
                </Field>
              </div>
            )}
          />
        </CollapsibleSection>

        <CollapsibleSection
          id="ab-awd"
          title="Awards"
          open={sections.isOpen("awards")}
          onToggle={() => sections.toggle("awards")}
          summary={summaries.awards}
          hasErrors={sectionsWithErrors.includes("awards")}
        >
          <RepeatableList
            items={values.awards}
            onChange={(awards) => patch({ awards })}
            getKey={(a) => a.id}
            create={() => ({ id: newId(), title: "", issuer: "", year: "", description: "" })}
            itemLabel={(a, i) => a.title || `Award ${i + 1}`}
            addLabel="Add award"
            emptyText="No awards yet. The section is hidden on the public page until you add one."
            max={50}
            renderItem={(a, i, update) => (
              <div className={formLayout.grid}>
                <Field label="Title" id={`aw-${a.id}-title`} required className={formLayout.span2} error={err(`awards.${i}.title`)}>
                  <Input value={a.title} onChange={(ev) => update({ title: ev.target.value })} />
                </Field>
                <Field label="Issuer" id={`aw-${a.id}-iss`} required error={err(`awards.${i}.issuer`)}>
                  <Input value={a.issuer} onChange={(ev) => update({ issuer: ev.target.value })} />
                </Field>
                <Field label="Year" id={`aw-${a.id}-year`} required error={err(`awards.${i}.year`)}>
                  <Input type="number" inputMode="numeric" value={a.year} onChange={(ev) => update({ year: ev.target.value })} />
                </Field>
                <Field label="Description" id={`aw-${a.id}-desc`} optional className={formLayout.span2} error={err(`awards.${i}.description`)}>
                  <Textarea rows={3} value={a.description} onChange={(ev) => update({ description: ev.target.value })} />
                </Field>
              </div>
            )}
          />
        </CollapsibleSection>
      </div>
    </ContentEditor>
  );
}
