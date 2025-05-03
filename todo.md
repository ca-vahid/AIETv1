# AIET Intake App – **Build Tasks Checklist (Code-Only)**  

---

## Phase 0 — Project Bootstrap
- [x] Add `.eslintrc.json`, `.gitignore`, `package.json`, core deps (`next`, `react`, `tailwindcss`, `typescript`, `firebase`, etc.)  
  - _Note: `.nvmrc`, `.editorconfig`, and Prettier config still missing. Using npm (package-lock.json), not yarn._
- [ ] Add `.nvmrc`, `.editorconfig`, `prettier`  
- [ ] Yarn-init (if switching from npm)

---

## Phase 1 — Auth & Profile Layer
- [x] Firebase AuthContext and `useAuth` hook implemented.  
- [x] Implement **NextAuth.js** Azure AD Provider.  
  - _Created `/api/auth/[...nextauth]/route.ts` with Azure AD provider config._
- [x] Create `/api/profile` route:  
  - Call Microsoft Graph `/me?...`  
  - Map to internal `UserProfile` interface; persist/update in Firestore `users/{uid}`.  
  - _Added GET and PUT methods for fetching/updating profiles._
- [x] Add React context `useSessionProfile` to expose profile to components.
  - _Created `SessionProfileContext.tsx` and `useSessionProfile.ts` hook._
- [x] Created profile UI components:
  - `SignInWithAzure.tsx` for authentication
  - `ProfileInfo.tsx` for viewing/editing profile data
  - Updated homepage to display profile info

---

## Phase 2 — Chat UI + Gemini Wiring
- [x] Gemini API route exists (`src/app/api/gemini/route.ts`).  
- [x] Scaffold **ChatWindow** component: scrollable thread, MessageBubble, typing dots.  
  - _Created comprehensive ChatWindow component with streaming support._
- [x] Create `/api/chat/start` → new Firestore draft doc (`status: "draft"`).  
  - _Implemented route to initialize conversation state and create Firestore document._
- [x] Create `/api/chat/message` route:  
  - Accept `conversationId`, `message`.  
  - Build prompt: system + history + new user msg.  
  - Call **Gemini 1.5-Pro** endpoint with streaming.  
  - Stream tokens via TransformStream to client; append to Firestore.
- [x] Added chat page at `/chat` and linked from homepage.

---

## Phase 3 — Adaptive Workflow Logic
- [x] Implement **State Machine** for conversation workflow: `INIT → PROFILE → TASK_LOOP → SUMMARY → SUBMIT`.  
  - _Created `conversationStateMachine.ts` with reducer and state transition types._
- [x] "Profile" state: inspect missing vital claims; craft dynamic prompts.  
  - _Implemented `checkProfileCompleteness` to detect missing fields._
- [x] "Task loop": Six questions workflow (process, pain, frequency, tools, impact, attach).  
  - _Created state-specific prompt generation in `generatePromptForState`._
- [x] Clarification logic:  
  - Implemented `analyzeConversation` to detect when to transition states.
  - Added state-specific follow-up prompts for ambiguous answers.
- [x] Summary state: Assemble JSON summary for user confirmation.  
  - _Added summary formatting in state machine prompt generator._
- [x] Updated `/api/chat/message` to use the state machine.
  - _Added conversation analysis before and after AI response to update state._

---

## Phase 4 — File Attachments
- [ ] Endpoint `/api/attachments/signed-url`:  
  - Verify user owns draft; return Firebase Storage signed URL (10 MB limit, mimetype check).  
- [ ] On frontend, drop-zone component → PUT to signed URL; then POST meta to `/api/attachments`.  
- [ ] Save `attachments/{aid}` doc with Storage path & link to draft.

---

## Phase 5 — Firestore Finalisation Logic
- [ ] Cloud Function `finaliseRequest` triggered by `/api/chat/complete`:  
  - Move draft → `requests/{rid}`; copy profile snapshot & JSON payload.  
  - Add `classification.tags` & `complexity` via secondary **Gemini Flash** call.  
  - Update `status = "New"`; set `createdAt`, `updatedAt`.  
  - Emit Pub/Sub for notifications (handled later).

---

## Phase 6 — Admin Dashboard (Core Features Only)
- [ ] Protected route `/dashboard` (NextAuth role `AIET-Members`).  
- [ ] List view: Firestore `requests` query (cursor-based), DataGrid with columns: ID, dept, impactScore, status, createdAt.  
- [ ] Detail drawer: show profile, JSON pretty-print, attachment links, conversation transcript accordion.  
- [ ] Inline status dropdown; assignee autocomplete (users in AIET group).  
- [ ] Write update back to Firestore (`status`, `assignedTo`, comment).

---

## Phase 7 — Automation Hooks
- [ ] Cloud Function `onRequestCreate`:  
  - Build Teams Adaptive Card JSON; POST to AIET channel webhook.  
- [ ] Cloud Function `onStatusUpdate`:  
  - Compose SendGrid template email to submitter with new status and assignee.

---

## Phase 8 — Multilingual & Accessibility Polish
- [ ] Integrate `next-i18next`; create `en.json`, `fr.json`, `es.json` strings.  
- [ ] Wrap all UI text in `t('key')`.  
- [ ] In `/api/chat/message`, set `targetLanguage` from profile or `Accept-Language`.  
- [ ] Tailwind colour tokens: ensure contrast ≥ 4.5:1; add focus outlines.  

---

**Done!** – At this point the full application logic is written and functional, ready for testing and deployment.
