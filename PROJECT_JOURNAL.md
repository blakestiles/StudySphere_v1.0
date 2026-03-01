# StudySphere - Project Journal

**Student:** Sainath Gandhe
**Course:** CPSC 589 - California State University, Fullerton
**Project:** StudySphere - AI-Powered Study Companion
**Date:** February 17, 2026

---

## 1. Progress

### Weeks 1-5: Foundation (Completed Feb. 9, 2026)

I completed the full foundation of the StudySphere application covering authentication, document management, and the dashboard interface, all implemented with Next.js 16 (App Router), TypeScript, Tailwind CSS v4, shadcn/ui, NextAuth.js v5, and MongoDB with Mongoose.

**Authentication system:** I built a complete auth flow including user registration with bcrypt password hashing (salt factor 12), credentials-based login with JWT session strategy, and profile management (edit name and bio). The auth architecture uses a split-config pattern — an edge-safe config (`auth.config.ts`) for the Next.js middleware that handles route protection, and a Node.js config (`auth.ts`) for the Credentials provider that requires bcrypt and Mongoose. Protected routes (`/dashboard`, `/upload`, `/profile`, `/study-packs`) redirect unauthenticated users to `/login`, and authenticated users are redirected away from `/login` and `/register` to `/dashboard`.

**Document upload pipeline:** I implemented a dual-mode upload system within a single API endpoint. Users can either drag-and-drop a PDF file (up to 10MB) or paste text directly. For PDFs, the server extracts text content using the `pdf-parse` library and stores it in MongoDB. The upload page uses a tabbed interface — the PDF tab has a drag-and-drop zone with a progress bar, and the text tab has a form with a live character counter.

**Document management:** I built a document listing API that returns all user documents sorted by upload date (excluding the raw text field to reduce payload size) and a document delete API with cascade deletion. When a document is deleted, the system first finds all related StudyPacks, then deletes their associated Topics, Flashcards, and QuizQuestions in parallel, then deletes the StudyPacks, and finally deletes the document itself. The dashboard displays the 5 most recent documents with a trash icon that opens a confirmation dialog before deletion.

**Dashboard:** I built the main dashboard as a server component that fetches data directly from MongoDB using `Promise.all()` for parallel queries. It shows statistics cards and the recent documents list. The page serializes Mongoose lean documents before passing them to client components.

**Database schema:** I designed and implemented all 10 Mongoose models covering the full data lifecycle — User, Document, StudyPack, Topic (with self-referencing hierarchy), Flashcard (with difficulty levels), QuizQuestion (multiple-choice with explanations), QuizAttempt (with per-question response tracking), FocusSession (with goals and recaps), and WeakArea (with severity levels). These models are interconnected through MongoDB ObjectId references.

**Landing page and layout:** I created a public landing page with a hero section, feature cards, and call-to-action buttons. The authenticated layout includes a sticky top navbar with user account actions and a fixed sidebar with navigation links that highlights the active route.

### Week 6: AI Study Pack Generation (Completed Feb. 17, 2026)

I integrated the Anthropic Claude API to power the core AI features of the application. The study pack generation system takes a user's uploaded document and produces a comprehensive, structured study pack.

**Claude API integration:** I created a singleton Anthropic client (`src/lib/claude.ts`) and a dedicated study pack generator module (`src/lib/study-pack-generator.ts`). The generator sends the document text (truncated to 100,000 characters) to `claude-sonnet-4-20250514` with a detailed prompt that instructs the model to produce a JSON object containing summaries, topics, flashcards, and quiz questions. The response parsing handles markdown code fences, validates the JSON structure, and provides clear error messages for various failure modes (missing API key, empty response, parse failures).

**Generation endpoint:** The `POST /api/study-packs/generate` route creates a StudyPack record with `status: "generating"` before calling the AI, giving users immediate feedback. After successful generation, it creates all Topic, Flashcard, and QuizQuestion records in bulk using `insertMany()`, then updates the pack to `status: "ready"`. If generation fails, it catches the error and sets `status: "error"` while returning a descriptive error message.

**Study pack viewer:** I built a tabbed detail page (`/study-packs/[id]`) with 5 tabs: Summary, Topics, Flashcards, Quiz, and AI Tutor. The page handles generating/error/ready states with appropriate UI. The FlashcardViewer component features a 3D flip animation using CSS transforms, difficulty filtering, and Previous/Next navigation. I also built a study packs listing page (`/study-packs`) with a responsive card grid showing status badges.

**Generate button:** The `GenerateButton` component appears on each document in the dashboard. It conditionally shows "Generate Study Pack" or "View Study Pack" depending on whether a pack already exists for that document. During generation, it shows a spinner with a "this may take a minute" message.

### Weeks 7-8: Quizzes, Weak Areas, Focus Mode & AI Tutor (Completed Feb. 17, 2026)

I implemented the remaining interactive study features to complete the core application functionality.

**Quiz system:** I built an interactive quiz-taking interface (`QuizInterface.tsx`) that presents questions one at a time with A/B/C/D options, a progress bar, and Previous/Next navigation. On submission, answers are sent to `POST /api/study-packs/[id]/quiz` which scores them against the stored correct answers and creates a `QuizAttempt` record. The `QuizResults` component shows the score with color coding (green >80%, yellow >50%, red ≤50%), followed by a detailed question-by-question review showing the correct answer, the user's answer (with strikethrough if wrong), and explanations for incorrect answers. A "Try Again" button resets the quiz.

**Weak area detection:** After each quiz submission, the client triggers `POST /api/weak-areas/analyze` with the attempt ID. The endpoint groups wrong answers by topic, calculates the wrong-answer percentage, and classifies severity as high (>66%), medium (33-66%), or low (≤33%). It upserts `WeakArea` records per topic so repeated quizzes update existing entries. The dashboard's `WeakAreasList` component displays these with color-coded severity badges and links to the relevant study pack.

**Focus mode:** I built a 3-phase focus session system (`FocusMode.tsx`). In the setup phase, users select a study pack, choose a duration (15/30/45/60 minute presets or custom), and define study goals. Starting a session creates a `FocusSession` record via the API. The active phase shows a countdown timer (using `setInterval` with cleanup) and a goal checklist where users can toggle goals as completed. The complete phase shows a goals summary and a recap textarea. Saving the recap sends a `PATCH` request to update the session record with the recap and `completedAt` timestamp.

**AI tutor:** I implemented a conversational AI tutor (`TutorChat.tsx`) that uses Claude with context from the study pack's source document and topics. The `POST /api/tutor/chat` endpoint builds a system prompt that includes the study pack title, a 50,000-character excerpt of the source material, and topic names. It supports multi-turn conversation by sending the full message history to Claude. The chat UI shows suggested starter questions, role-styled message bubbles (blue for user, gray for assistant), an animated loading indicator, and auto-scroll.

**Dashboard updates:** I expanded the dashboard to show 4 stat cards (Documents, Study Packs, Quizzes Taken, Focus Sessions) and added the WeakAreasList component. The sidebar now includes Focus Mode navigation, and the auth config was updated to protect the `/focus` route.

---

## 2. Challenges

**NextAuth.js v5 middleware compatibility:** NextAuth.js v5 requires that the middleware configuration only uses edge-compatible code, but the Credentials provider needs Node.js-only dependencies (bcrypt for password comparison and Mongoose for database queries). I resolved this by splitting the auth configuration into two files — `auth.config.ts` with only the route authorization logic (edge-safe), and `auth.ts` that extends it with the Credentials provider and callbacks (Node.js runtime). The middleware imports only the edge-safe config.

**pdf-parse v2 API changes:** The `pdf-parse` library v2 introduced a breaking API change from v1. It no longer has a default export, and the usage pattern changed to `new PDFParse({ data: Uint8Array })` followed by `getText()`. I also had to configure `serverExternalPackages: ["pdf-parse"]` in `next.config.ts` because the library uses native Node.js modules that cannot be bundled by Next.js.

**Server vs. client component boundary on the dashboard:** The dashboard page is a server component (for direct MongoDB access), but the document delete functionality requires click handlers and state management which need a client component. I resolved this by extracting the document list into a separate `RecentDocuments` client component that receives serialized data as props. Mongoose lean documents contain non-serializable types (`ObjectId`, `Date`), so I had to convert `_id` to string and dates to ISO strings before passing them as props.

**shadcn/ui component selection:** The shadcn/ui `toast` component was deprecated in favor of `sonner`. I switched to using the Sonner library directly with `toast.success()` and `toast.error()` calls, and added the `<Toaster>` component to the root layout for app-wide notifications.

**Claude API model availability:** The initial model ID used for the Claude API (`claude-sonnet-4-5-20250929`) was invalid and returned 404 errors from the Anthropic API. After testing multiple model IDs, I identified that `claude-sonnet-4-20250514` was available on the API key and updated both the study pack generator and the tutor chat endpoint accordingly. I also added an early validation check for the API key to provide clear error messages instead of cryptic API failures.

**AI response parsing reliability:** Claude's responses sometimes include markdown code fences around the JSON output (e.g., ` ```json...``` `). I added regex-based stripping of these fences before JSON parsing. I also added structural validation of the parsed response to catch cases where the AI produces valid JSON but missing required fields, and wrapped the `JSON.parse` call in a try-catch with a descriptive error message.

---

## 3. Blockers

None. All Week 5-8 deliverables are fully implemented and tested. The application is functional end-to-end: users can register, upload documents, generate AI study packs, take quizzes with scoring and weak area analysis, use focus mode with timers and goals, and chat with the AI tutor.

---

## 4. TODO

**Weeks 9-10 — Testing & Refinement (target: Mar. 16, 2026)**
- Unit and integration testing for all API routes (registration, login, document CRUD, study pack generation, quiz submission, weak area analysis, focus sessions, tutor chat)
- End-to-end testing for critical user flows (register -> upload -> generate -> quiz -> review weak areas -> focus session -> tutor chat)
- Performance optimization (database query indexing, response payload optimization)
- UI/UX refinements based on testing feedback and usability review
- **Evaluation:** All tests pass, no critical bugs, response times are acceptable under normal load.
- **Deliverables:** Test suite, performance benchmarks, bug fixes, code pushed to GitHub

**Weeks 11-12 — Deployment & Documentation (target: Mar. 30, 2026)**
- Deploy to Vercel with production environment configuration
- Configure production MongoDB Atlas cluster with proper access controls
- Set up environment variables (MONGODB_URI, NEXTAUTH_SECRET, ANTHROPIC_API_KEY)
- Write user documentation, API documentation, and project setup guide
- **Evaluation:** Application is accessible via a public URL, all features work in the production environment, documentation is clear and complete.
- **Deliverables:** Live deployment URL, documentation, code pushed to GitHub

**Week 13 — Final Submission (target: Apr. 6, 2026)**
- Final testing in production environment
- Project presentation preparation
- Submit final deliverables and documentation
- **Evaluation:** Presentation is complete, all deliverables are submitted on time.
- **Deliverables:** Final presentation, project report, source code, live deployment

---

## 5. Checkpoint Meeting Notes

*(To be filled in after the checkpoint meeting with the professor.)*
