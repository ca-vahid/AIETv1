The AIET Intake App is basically a friendly, multilingual chat portal that lets anyone at BGC yell,
“Hey, this task is brutal—can AI fix it?”
Instead of sending random emails, staff talk to a smart bot that gathers every detail AIET needs to judge the idea, rank it, and—if it looks juicy—turn it into an automation project.

How it feels to an employee 🚀
Single-click sign-in

You hit intake.bgce.ai, get bounced through Azure AD, and land back in the chat.

The bot already knows your name, job title, department, office, preferred language, etc. (pulled from AAD).

“Is this info right?”

If anything’s missing or wrong, the bot politely asks just for that bit—no giant form.

Conversational interview

In English, French, or Spanish (auto-detected), the bot asks:

What exact task bugs you?

Why is it painful—time, errors, boredom, cost?

How often and how long does it take?

Which tools/people are involved?

If we automated it, how big a deal would that be (1-5) and how many hours/week would we save?

Got a sample file or screenshot? Upload away.

If your answer’s vague, the bot follows up (“When you say ‘reports’, do you mean monthly safety reports or soil-sample reports?”).

Stuck? It offers examples that fit your department.

Recap & submit

The bot shows a neat summary. You edit anything that’s off, hit Confirm, and get a “Thanks—we’ll get back to you within 1 business day” message (plus a geology dad-joke Easter egg).

What happens behind the curtain 🛠️
Step	Behind-the-scenes logic
1. Profile grab	After AAD login, the server pulls claims like jobTitle, department, etc. and stashes them in Firestore (users collection).
2. LLM session	The backend spins up GPT-4 with a system prompt that says: “You’re AIET-IntakeBot. Fill this JSON schema. Ask only for missing data. Speak in user’s language.”
3. Chat logging	Each turn (user + bot) is appended to the conversation array in a draft Firestore doc.
4. Validation	When the bot sends its final fenced JSON, a Cloud Function checks it matches the schema—no missing keys, correct types. If it fails, the bot auto-corrects.
5. Storage & notify	The validated request moves to requests/{id}; Cloud Function fires a Teams card to the AIET channel with a summary + link.
6. Auto-triage	Same function calls GPT-4 again (cheap “flash” model) to tag complexity (low/med/high) and possible departments, so the dashboard shows priorities at a glance.

How AIET works a request 📋
Dashboard view – The team sees new items sorted by impact score or complexity.

Click into details – Full chat transcript, attached files, and the JSON summary are right there.

Assign & track – Change status (New → In Review → Pilot → Completed), assign an analyst, add comments. The submitter auto-gets an email each time the status moves.

Metrics – Built-in charts show total hours saved, requests per department, average impact, etc., perfect for quarterly CIO updates.

Why the workflow makes sense
Zero duplication – Pulls profile data instead of asking again.

Adaptive Q&A – The bot only digs deeper when answers are fuzzy, so power users aren’t bored and newbies aren’t lost.

Multilingual out of the box – Nobody in Montréal or Santiago feels second-class.

Structured JSON – Every submission lands in exactly the same format, so scoring and reporting are trivial.

Security-first – Azure AD for auth, Firestore rules lock data to owners + AIET, all traffic over HTTPS.

Scales effortlessly – Firebase + Vercel auto-scale; GPT-4o handles dozens of concurrent chats.

In one sentence
The app is a multilingual AI concierge that turns messy “can you automate this?” conversations into clean, prioritized work items for the AI Efficiency Team—without wasting anyone’s time.






You said:
now write the program in the format of PRD using .md


ChatGPT said:
md
Copy
Edit
# AIET Intake Application – **Product Requirements Document (PRD)**  
Version 1.0 • Prepared for: BGC Engineering CIO & AI Efficiency Team • Author: _Vahid / ChatGPT_  
_Last updated: 30 Apr 2025_

---

## 1 . Purpose
Create a **multilingual, chatbot-driven web app** that lets every BGC employee/contractor submit automation/AI ideas in a structured, low-friction way.  
The app will gather rich, consistent data, route it to the **AI Efficiency Team (AIET)** for triage, and track each request through pilot, implementation, and measurable business impact.

---

## 2 . Background
* BGC (~900 employees, 100 contractors) is launching AIET to streamline repetitive tasks and unlock new capabilities with AI.  
* Manual email/word-of-mouth idea intake is noisy and inconsistent.  
* Azure AD already holds rich user metadata; OpenAI LLMs offer adaptive, multilingual conversation.  
* A lightweight, Firebase-powered app can be built and iterated quickly by the IT Manager (1 day/week allocation).

---

## 3 . Goals & Success Metrics

| Goal | KPI / Target |
|------|--------------|
| Make idea submission effortless | ≥ 35 % of workforce submits ≥ 1 idea in first 12 months |
| Capture high-quality, structured data | 100 % of submissions valid against JSON schema (auto-validated) |
| Accelerate AI project pipeline | ≥ 15 high-impact pilots launched in Year 1 |
| Demonstrate ROI | ≥ 5,000 staff-hours saved (aggregate) in Year 1 |
| Delight users | CSAT ≥ 4 / 5 on post-submission survey |

---

## 4 . Target Audience

* **Primary:** Engineers, scientists, analysts, HR, accounting, IT, legal, marketing staff across Canada, USA, Chile.  
* **Secondary:** Contractors & co-ops (EITs, students).  
* **Admin users:** AIET members (~3–5), CIO observers.

> **Languages supported:** English 🇨🇦, French (Montréal) 🇫🇷, Spanish (Chile) 🇨🇱.

---

## 5 . User Stories

| ID | As a… | I want… | So that… |
|----|-------|---------|----------|
| U1 | Field engineer | to tell a bot about my 3-hour data entry pain | AIET can automate it |
| U2 | HR specialist (French) | to submit my idea in French | I’m not forced into English |
| U3 | Mining PM (Spanish) | to upload sample CSVs | the team sees real data |
| U4 | AIET lead | to score and assign new requests | we work on the biggest wins first |
| U5 | CIO | a dashboard of hours saved | I see real ROI |

---

## 6 . Requirements

### 6.1 Functional

1. **Azure AD SSO** with profile claim extraction (`displayName`, `jobTitle`, `department`, `officeLocation`, `preferredLanguage`, etc.).  
2. **Adaptive Chatbot** (GPT-4o via Azure OpenAI):  
   * Multilingual EN/FR/ES; auto-detect + fallback.  
   * Only asks for missing profile fields.  
   * Six-step Task-Discovery flow (process, pain, frequency, tools, impact, attachments) with real-time clarifications.  
   * Produces final JSON per schema; validates before save.  
3. **Attachments** ≤ 10 MB types: pdf/xlsx/doc/png/jpg; stored in Firebase Storage.  
4. **Firestore Persistence**: `users`, `requests`, `attachments`, `assignments`.  
5. **Admin Dashboard**: list, filters, status change, assignment, metrics, CSV export.  
6. **Notifications**: Teams webhook on create; email on status change.  
7. **Auto-classification**: Cloud Function tags complexity & keywords via GPT-4 “flash”.  

### 6.2 Non-Functional

| Area | Requirement |
|------|-------------|
| Performance | Bot reply < 5 s P95 |
| Scalability | 50 concurrent sessions |
| Availability | 99.9 % uptime |
| Security | HTTPS, Firestore rules, least-privileged RBAC |
| Accessibility | WCAG 2.1 AA |
| Localization | UI & bot fully translated EN/FR/ES |

---

## 7 . User Flow (Happy Path)

1. **Login** → Azure AD.  
2. **Profile confirmation** (bot shows known data, asks to correct if wrong).  
3. **Conversational interview** (six steps, adaptive follow-ups).  
4. **Summary & confirm** → user edits if needed → “Submit”.  
5. **Success screen** with SLA & joke.  
6. **Backend** saves JSON, fires Teams alert, tags complexity.  
7. **Dashboard**: AIET triages, assigns, tracks to completion.

*(See mermaid state diagram in spec for full edge-cases.)*

---

## 8 . UX / UI Guidelines

* **Clean chat UI** (Next.js + Tailwind) with department-aware hints.  
* Progress bar “Step 3 / 6”.  
* Language toggle dropdown.  
* Accessible colours, focus rings.  
* Admin dashboard uses simple DataGrid with status pill colours.

---

## 9 . Technical Architecture

| Layer | Tech |
|-------|------|
| Frontend | Next.js (React 18), Tailwind CSS, TypeScript |
| Auth | NextAuth.js + Azure AD provider |
| Backend | Next.js API routes (Vercel Edge) & Firebase Functions |
| Database | Firebase Firestore (multi-region) |
| Storage | Firebase Storage |
| AI | GPT-4o (Azure OpenAI) primary, GPT-3.5 fallback |
| Notifications | MS Teams Webhook, SendGrid |

*See data-flow diagram in spec.*

---

## 10 . Analytics & Metrics

* `requests` count per dept/day.  
* Avg `impactScore`.  
* Summed `hoursSavedPerWeek` (when moves to Completed).  
* Dashboard charts using Firebase + React Chart.js.

---

## 11 . Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| LLM hallucination | Wrong data captured | JSON schema + user confirmation |
| Data privacy | PII leakage | Firestore rules + redaction filter |
| Language quality | Poor FR/ES | Use vetted translation & review by bilingual staff |
| Adoption apathy | Low submissions | Roadshows, office hours, executive endorsement |

---

## 12 . Timeline / Milestones

| Week | Deliverable |
|------|-------------|
| 1-2 | Repo setup, AD SSO working |
| 3-4 | Chat UI + EN flow draft |
| 5-6 | Firestore save, Teams notifications |
| 7-8 | Multilingual, attachments |
| 9 | Security rules, CI/CD |
| 10 | Admin dashboard MVP |
| 11 | Pilot with 10 users |
| 12 | Go-live company-wide |

---

## 13 . Open Questions

1. Will HR supply bilingual reviewers for FR/ES prompt QA?  
2. Do we want reCAPTCHA for outside contractors?  
3. Preferred data-residency region (`us-central1` vs `northamerica-northeast1`)?  
4. Integration with Power BI for advanced metrics?

---
