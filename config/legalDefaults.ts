import type { LegalDocumentKind } from "@/server/domain/entities";
import { siteConfig } from "./site";

/**
 * Built-in wording shown when no version of a document is published, and the
 * starting point for the first draft in the admin. Written in the lightweight
 * Markdown understood by lib/markup/Markup.ts.
 */
export interface LegalDefault {
  title: string;
  body: string;
  /** ISO date the built-in wording took effect. */
  effectiveDate: string;
}

const owner = siteConfig.name;

const PRIVACY = `This Privacy Policy explains what information this portfolio website collects, how it is used, and the choices you have. The site is a personal portfolio operated by ${owner} ("I", "me").

## Information I collect

**Information you send me.** If you use the [contact form](/contact), I receive your name, email address, subject and message. The IP address your message was sent from is recorded with it and is used to prevent spam and abuse (for example, limiting how many messages can be sent in a short time).

**Analytics.** This site uses Firebase Analytics (Google Analytics 4) to understand how the site is used in aggregate, such as which pages are viewed. Google may collect information such as your browser and device type, approximate location derived from your IP address, and identifiers stored in cookies or similar technologies. This is processed under [Google's Privacy Policy](https://policies.google.com/privacy).

**Technical logs.** The hosting provider automatically processes standard request information (such as IP address, browser and time of request) to deliver and secure the site.

I do not ask for, and ask you not to send, sensitive personal information through the contact form.

## How I use information

- To read and reply to your message.
- To protect the site against spam, abuse and attacks.
- To understand overall site usage and improve the portfolio.

I do not sell your personal information and I do not use it for advertising.

## Sharing

Information is shared only with the service providers needed to run this site (hosting, database and analytics providers), who process it on my behalf, or where disclosure is required by law.

## Cookies

The public site does not set its own tracking cookies. Google Analytics may set cookies or use similar technologies for measurement. You can block or delete cookies in your browser settings, or use tools such as the [Google Analytics opt-out add-on](https://tools.google.com/dlpage/gaoptout). A strictly necessary session cookie is used only when the site owner signs in to the admin area.

## Retention

Contact messages are kept only as long as needed to respond and follow up, and are then deleted. Analytics data is retained according to the provider's retention settings.

## Your rights

Depending on where you live (for example, under the Philippine Data Privacy Act of 2012 or the EU General Data Protection Regulation), you may have the right to access, correct or delete personal information I hold about you, or to object to its processing. To make a request, use the [contact form](/contact).

## Links to other websites

Project pages may link to external websites, repositories and live demos, including demos of my own personal projects. Each of those is a separate website or application with its own privacy practices; this policy covers only this portfolio site, so please review their policies before using them.

## Children

This site is not directed to children and I do not knowingly collect personal information from them.

## Changes to this policy

I may update this policy from time to time. The date at the bottom of this page shows when the current version took effect.

## Contact

Questions about this policy can be sent through the [contact form](/contact).`;

const TERMS = `These Terms & Conditions govern your use of this portfolio website, operated by ${owner} ("I", "me"). By using the site you agree to them. If you do not agree, please do not use the site.

## Purpose of this site

This website is a personal portfolio. It describes my professional experience, skills, the projects I have contributed to for employers and clients, and my own personal projects. It is provided for general information only.

## Ownership of the projects and code shown

This portfolio shows two kinds of work, and ownership differs between them. Each project's description explains the context in which it was built; if you are unsure which category a project falls into, please [ask me](/contact).

### Work for employers, clients and collaborators

**I do not own, and do not claim, any intellectual property rights in work I created for employers or clients, or together with others.**

- These projects were created in the course of employment, client or freelance engagements, academic work or collaboration. All rights in them, including copyright and any other intellectual property rights, belong to their respective owners, such as employers, clients, collaborators or original authors.
- They are shown solely to describe my role and experience. Descriptions, screenshots and code excerpts may be simplified, and confidential details are intentionally left out.

### My personal projects

- Projects I designed and built independently, outside any employment or client engagement, are my own work. Unless a project states otherwise, I retain all rights in them, including copyright.
- Where a personal project's source code is published under an open-source license, you may use that code under the terms of that license.
- The content and design of this website are also my own work unless stated otherwise.

### Third-party names and open-source software

- Product names, company names, logos and trademarks belong to their respective owners. Their appearance on this site does not imply ownership, endorsement or affiliation.
- Third-party libraries, frameworks and open-source projects used in or linked from these projects remain the property of their authors and are governed by their own licenses.

## Using the materials shown

Nothing on this site grants you a license or any other right to use, copy, modify, distribute or commercially exploit the projects, code or materials shown, except where a published open-source license says otherwise.

- For work done for employers, clients or collaborators, please contact the relevant rights holder directly.
- For my personal projects, please [contact me](/contact) to ask for permission.

You may share links to this site and quote brief excerpts with attribution for personal, non-commercial purposes.

## Requests from rights holders

If you are a rights holder and would like any material removed, or its attribution corrected, please get in touch through the [contact form](/contact). I will review and act on your request promptly.

## Acceptable use

You agree not to misuse the site, including by attempting to gain unauthorized access, disrupting its operation, sending spam or unlawful content through the contact form, or scraping it in a way that places an unreasonable load on it.

## External links

The site links to third-party websites and repositories that I do not control. I am not responsible for their content, availability or practices.

## No warranties

The site and its content are provided "as is" and "as available", without warranties of any kind. I try to keep information accurate and up to date, but I do not guarantee that it is complete, current or error-free.

## Limitation of liability

To the fullest extent permitted by law, I am not liable for any loss or damage arising from your use of, or inability to use, this site or any content on it.

## Changes to these terms

I may update these terms from time to time. The date at the bottom of this page shows when the current version took effect. Continued use of the site after a change means you accept the updated terms.

## Contact

Questions about these terms can be sent through the [contact form](/contact).`;

export const LEGAL_DEFAULTS: Record<LegalDocumentKind, LegalDefault> = {
  privacy: { title: "Privacy Policy", body: PRIVACY, effectiveDate: "2026-09-25" },
  terms: { title: "Terms & Conditions", body: TERMS, effectiveDate: "2026-09-25" },
};
