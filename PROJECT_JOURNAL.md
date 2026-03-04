# StudySphere - Project Journal

**Student:** Sainath Gandhe
**Course:** CPSC 589 - California State University, Fullerton
**Project:** StudySphere - AI-Powered Study Companion
**Date:** March 1, 2026

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

### Weeks 9-10 (Partial): UI Redesign & Full Feature Parity (Completed Mar. 1, 2026)

After completing the core study workflow, I undertook a major expansion to bring the application to full feature parity with a professional study companion platform. This was the largest development phase, adding 5 new database models (15 total), 9 new pages (17 total), 12 new API routes (29 total), and significant UI/UX improvements.

**Dark/light theme and UI overhaul:** I integrated `next-themes` with a `ThemeProvider` and added a toggle button to the Navbar. All components respect the active theme via Tailwind CSS dark mode classes. I also implemented a global command palette using the `cmdk` library (activated via Cmd+K / Ctrl+K) that provides fuzzy search navigation to all 17 pages. The sidebar was completely rebuilt — it's now collapsible on desktop and slides in as an overlay on mobile, with navigation expanded from 5 items to 13 covering every page in the application.

**SM-2 spaced repetition for flashcards:** I extended the Flashcard model with SM-2 parameters (easeFactor, interval, repetitions, nextReview) and built a review API endpoint (`PATCH /api/flashcards/[id]/review`). Users rate each card as Again/Hard/Good/Easy, which maps to SM-2 quality scores. The algorithm adjusts the ease factor and interval accordingly — "Again" resets the card to the initial learning stage, while successful recalls produce exponentially increasing review intervals. I also added browser-native text-to-speech (SpeechSynthesis) so users can listen to flashcard content.

**Pomodoro focus mode:** I replaced the simple countdown timer from Week 8 with a full Pomodoro implementation. The timer now cycles through work phases (25 min default), short breaks (5 min), and long breaks (15 min after every 4 work sessions) with auto-transitions between phases. An SVG arc animation provides visual feedback of remaining time.

**Practice essays with AI grading:** I built a new `/practice-essay` page where users select a study pack and write essays on topics from their materials. Submitted essays are sent to Claude with a structured rubric that evaluates four criteria on a 1-10 scale: accuracy, depth, clarity, and critical thinking. The AI returns per-criterion scores plus detailed written feedback. Results are stored in a new `EssayAttempt` model. The API has two routes: `POST /api/essays/submit` for grading and `GET /api/essays` for history.

**Calendar and study events:** I created a monthly calendar view (`/calendar`) with previous/next month navigation and color-coded event indicators. Users can create, edit, and delete study events on any day, and mark events as complete. The `StudyEvent` model stores userId, title, date, color, completed status, and notes. Two API routes handle CRUD operations.

**AI study plan generator:** The `/study-plan` page lets users select study packs, choose an intensity level (light/moderate/intensive), and set a target deadline. These inputs are sent to Claude, which generates a structured study schedule distributing sessions across available days with interleaved topics. The generated plan is automatically created as `StudyEvent` entries, appearing immediately on the calendar.

**Analytics dashboard:** I built a comprehensive `/analytics` page using the Recharts library. It displays three charts — study minutes over time (line chart from FocusSession data), cards reviewed (bar chart from ReviewStats data), and quiz score trends (line chart from QuizAttempt data). The page also shows a study streak counter (consecutive days with activity) and milestone progress bars tracking achievements like "Review 100 cards" and "Complete 10 quizzes." Two API routes (`/api/analytics/summary` and `/api/analytics/charts`) aggregate data from multiple models.

**Document viewer with annotations:** I created a full document viewer (`/documents/[id]`) that renders the complete extracted text with line numbers. Users can select text and add three types of annotations: highlight (yellow), underline (blue), or note (with comment text). Annotations are persisted to a new `Annotation` model and loaded when the document is opened. A documents list page (`/documents`) provides an overview of all uploaded documents.

**Enhanced AI tutor:** The AI tutor was significantly expanded from the Week 8 version. Conversations are now stored in persistent `ChatThread` and `ChatMessage` models, allowing users to create, switch between, and continue previous conversations. I added an ELI5 mode toggle that modifies the system prompt to use child-friendly explanations, voice input via the SpeechRecognition API, voice output via SpeechSynthesis, and proper markdown rendering of AI responses using `react-markdown` with `remark-gfm`. The standalone `/chat` page has four API routes for thread and message CRUD.

**Mind maps and knowledge graph:** Study pack generation now includes mind map JSON in the Claude prompt. Each study pack's detail page has a new "Mind Map" tab (6 tabs total) with two SVG visualization modes: tree view (hierarchical) and flowchart view (horizontal). I also built a cross-pack knowledge graph page (`/knowledge-graph`) that renders an SVG node-link diagram showing topic relationships across all study packs.

**History page:** I created a `/history` page that shows a chronological log of all user activities — quiz attempts, essay submissions, and focus sessions. Each entry displays a type icon, title, date, and score/duration, with expandable details revealing full results. The `GET /api/history` endpoint aggregates data from QuizAttempt, EssayAttempt, and FocusSession models.

---

## 2. Challenges

**NextAuth.js v5 middleware compatibility:** NextAuth.js v5 requires that the middleware configuration only uses edge-compatible code, but the Credentials provider needs Node.js-only dependencies (bcrypt for password comparison and Mongoose for database queries). I resolved this by splitting the auth configuration into two files — `auth.config.ts` with only the route authorization logic (edge-safe), and `auth.ts` that extends it with the Credentials provider and callbacks (Node.js runtime). The middleware imports only the edge-safe config.

**pdf-parse v2 API changes:** The `pdf-parse` library v2 introduced a breaking API change from v1. It no longer has a default export, and the usage pattern changed to `new PDFParse({ data: Uint8Array })` followed by `getText()`. I also had to configure `serverExternalPackages: ["pdf-parse"]` in `next.config.ts` because the library uses native Node.js modules that cannot be bundled by Next.js.

**Server vs. client component boundary on the dashboard:** The dashboard page is a server component (for direct MongoDB access), but the document delete functionality requires click handlers and state management which need a client component. I resolved this by extracting the document list into a separate `RecentDocuments` client component that receives serialized data as props. Mongoose lean documents contain non-serializable types (`ObjectId`, `Date`), so I had to convert `_id` to string and dates to ISO strings before passing them as props.

**shadcn/ui component selection:** The shadcn/ui `toast` component was deprecated in favor of `sonner`. I switched to using the Sonner library directly with `toast.success()` and `toast.error()` calls, and added the `<Toaster>` component to the root layout for app-wide notifications.

**Claude API model availability:** The initial model ID used for the Claude API (`claude-sonnet-4-5-20250929`) was invalid and returned 404 errors from the Anthropic API. After testing multiple model IDs, I identified that `claude-sonnet-4-20250514` was available on the API key and updated both the study pack generator and the tutor chat endpoint accordingly. I also added an early validation check for the API key to provide clear error messages instead of cryptic API failures.

**AI response parsing reliability:** Claude's responses sometimes include markdown code fences around the JSON output (e.g., ` ```json...``` `). I added regex-based stripping of these fences before JSON parsing. I also added structural validation of the parsed response to catch cases where the AI produces valid JSON but missing required fields, and wrapped the `JSON.parse` call in a try-catch with a descriptive error message.

**Responsive sidebar behavior:** Building a sidebar that works well on both desktop and mobile required careful state management. The desktop version needed to be collapsible (toggle between full width and icon-only) while the mobile version needed to slide in from the left with a backdrop overlay that closes on tap. I handled this with separate rendering paths and a resize listener to switch between modes.

**SM-2 algorithm edge cases:** Implementing SM-2 required careful handling of the "Again" rating, which resets repetitions to 0 and interval to 1 day while preserving the adjusted ease factor. I also had to ensure the minimum ease factor floor of 1.3 was enforced to prevent cards from becoming unreviewable due to extremely low ease values.

**Recharts and server components:** Recharts components use browser APIs and cannot render in Next.js server components. I had to ensure all chart containers were marked as client components with `"use client"` and that data fetching happened server-side before being passed as props, or via client-side `fetch` calls to the analytics API.

**Mind map and knowledge graph layout:** Positioning nodes in SVG without a physics engine required manual layout algorithms. For mind maps, I used a recursive tree layout that calculates node positions based on depth and sibling count. For the knowledge graph, I implemented a simplified force-directed-style placement algorithm. Both handle variable node counts and text lengths.

---

## 3. Blockers

None. All Week 5-10 deliverables are fully implemented and functional. The application is feature-complete with 15 models, 17 pages, and 29 API routes. Users can register, upload documents, generate AI study packs (with summaries, topics, flashcards, quizzes, and mind maps), review flashcards with spaced repetition, take quizzes with weak area analysis, use Pomodoro focus mode, chat with the AI tutor (with voice and ELI5 mode), write practice essays with AI grading, manage study events on a calendar, generate AI study plans, track analytics and streaks, annotate documents, and explore topic relationships via the knowledge graph.

---

## 4. TODO

**Weeks 10-11 — Testing & Refinement (target: Mar. 16, 2026)**
- Unit and integration testing for all 29 API routes
- End-to-end testing for critical user flows (register → upload → generate → quiz → review weak areas → focus session → tutor chat → essay → analytics)
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
