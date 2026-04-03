# StudySphere - Project Journal

**Student:** Sainath Gandhe
**Course:** CPSC 589 - California State University, Fullerton
**Project:** StudySphere - AI-Powered Study Companion
**Date:** April 2, 2026

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

### Week 10: Nine New Features, Knowledge Graph Enhancements & UX Polish (Completed Mar. 4, 2026)

After achieving full feature parity in Weeks 9-10, I continued expanding the application with 8 major new features, bringing the total to 21 Mongoose models, 23 pages, and 42 API routes. I also added 3 new npm packages (@dnd-kit for drag-and-drop, TipTap for rich text editing) and made significant UX improvements.

**AI Exam Simulator with proctored mode:** I built a full exam simulation system (`/exam-simulator`) where users select a study pack and configure exam parameters. The `POST /api/exams/generate` endpoint sends the study pack content to Claude to generate a timed exam. The standout feature is the proctored mode, which enforces fullscreen via the Fullscreen API and monitors for tab switches using the `visibilitychange` event. Each violation triggers a warning overlay, and after 3 violations the exam auto-submits. Results are stored in the `ExamAttempt` model with violation count and time taken, and the `ExamResults` component provides a detailed post-exam review.

**Smart Reminders with notification bell:** I built an AI-powered reminder system that analyzes the user's study activity (upcoming events, due flashcards, quiz performance, goals) through `POST /api/reminders/generate` and generates personalized study alerts using Claude. The `NotificationBell` component sits in the Navbar and shows an unread count badge. Clicking it opens the `ReminderPanel` dropdown listing all active reminders. Users can dismiss reminders via `PATCH /api/reminders/[id]`. The system also requests browser notification permission for native push notifications on urgent reminders.

**Cornell Notes with TipTap editor:** I implemented a full notebook system with two pages: a notebook list (`/notebooks`) showing a grid of cards with titles and last-modified dates, and a Cornell-style note editor (`/notebooks/[id]`) built with the TipTap rich text editor (`@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-placeholder`). The Cornell layout includes sections for main notes, a cue column, and a summary area. Auto-save periodically persists content via `PATCH /api/notebooks/[id]`.

**Goal Setting & Tracking:** I built a goal management page (`/goals`) where users create study goals with titles, descriptions, target values, and deadlines. The `GoalTracker` component displays each goal with a progress bar, deadline countdown, and completion status. Users can update progress or delete goals via `PATCH/DELETE /api/goals/[id]`. I also added an AI goal suggestion feature (`POST /api/goals/progress`) that analyzes the user's study patterns and recommends personalized goals.

**Matching Game:** I built an interactive matching game using `@dnd-kit/core` and `@dnd-kit/sortable` for accessible drag-and-drop interactions. Users match flashcard fronts (questions) to their corresponding backs (answers) by dragging. The game includes a timer, accuracy-based scoring, and visual feedback for correct matches (green) and incorrect attempts (red shake). Rather than a standalone page, this is integrated as a tab directly inside the study pack detail viewer (`MatchingTab.tsx`), using the pack's own flashcards — no separate API route required.

**Fill-in-the-Blank Quiz:** I added a cloze deletion quiz type integrated directly into study pack generation. The `generateStudyPack` prompt now instructs Claude to produce `clozeQuestions` for each topic — sentences with key terms replaced by `{{BLANK_1}}`, `{{BLANK_2}}`, etc., along with the correct answers in order. These are saved as `ClozeQuestion` records alongside the other pack content. The `ClozeTab.tsx` component presents questions one at a time with text input fields and provides instant feedback. It appears as a dedicated tab inside the study pack detail viewer; there is no separate generation route.

**Audio Study Mode:** I built a dedicated audio study page (`/audio-study`) with the `AudioStudyPlayer` component that uses the browser `SpeechSynthesis` API. It reads study pack content (summaries, topic descriptions, flashcard content) aloud with full playback controls: play, pause, stop, skip forward/backward, speed control (0.5x to 2x), and voice selection from available system voices. Users can select which sections to include, and the player auto-advances through content with configurable pauses.

**AI Weekly Report:** I created a weekly performance report page (`/weekly-report`) where `POST /api/weekly-report/generate` aggregates the user's past 7 days of activity (focus sessions, quiz attempts, flashcard reviews, essays, goals) and sends a comprehensive summary to Claude. The AI generates a structured report with study time trends, identified strengths, areas needing improvement, personalized recommendations, and motivational insights. Reports are stored in the `WeeklyReport` model and can be retrieved historically via `GET /api/weekly-report` for week-over-week comparisons.

**Knowledge graph enhancements:** I significantly improved the knowledge graph visualization. The physics simulation now uses better repulsion forces between nodes, jitter, and organic movement for more natural positioning. Nodes feature a visually striking design with orbital rings, breathing auras, pulsing cores, and energy flow dots, all color-coded by study pack.

**Global loading skeleton:** I added a `loading.tsx` file in the `(main)` route group that provides instant visual feedback during page transitions with pulsing skeleton placeholders, preventing layout shift.

**Navigation updates:** The sidebar was updated to cover all 23 pages. The command palette (Cmd+K) was updated with all new pages. The auth config was extended to protect all new routes. The `NotificationBell` component was added to the Navbar.

### Week 11: UI Redesign Sprint, Knowledge Graph Enhancements & Profile Overhaul (Completed Apr. 2, 2026)

With all features implemented and functional, I undertook a comprehensive UI redesign sprint to establish a consistent design system across every page in the application and add meaningful new functionality to the Knowledge Graph and Profile sections.

**Design system standardization:** I identified and eliminated all dark-mode-only third-party components that were inconsistent with the light/dark theme toggle — specifically `SparklesText`, `ShineBorder`, `Meteors`, `GlowingStarsBackgroundCard`, `AnimatedGenerateButton`, `BlurFade`, `ShimmerButton`, `SlideButton`, `TextGenerateEffect`, and `DisplayCards`. These were replaced with a unified amber-based design language across all 24 pages. The standard now is: `rounded-2xl border border-border/60 bg-card` card shell, `h-[2px] bg-gradient-to-r from-amber-500 via-orange-400 to-transparent` top accent bar, amber gradient buttons with oklch-based glow shadows, Lucide icons throughout (no more custom SVG components), theme-aware color pairs (e.g., `text-emerald-600 dark:text-emerald-400`), and `motion/react` for stagger animations and `AnimatePresence` transitions. All inputs are native `<input>`/`<textarea>` with `focus:border-amber-500/40 focus:ring-2 focus:ring-amber-500/10` styling instead of shadcn `Input`/`Textarea`.

**Pages redesigned:** Analytics, Calendar, Study Plan, Weekly Report, History, Notebooks, Goals, Knowledge Graph, and Profile — all now use the consistent design system.

**Knowledge Graph enhancements:** I added three major new features to the Knowledge Graph page. First, a **Mastery Overlay** toggle button in the toolbar — when activated, it fetches the user's quiz history from `/api/history`, maps attempts to packs by title, computes average scores per pack, and re-colors all nodes: green (≥80%), yellow (60–79%), red (<60%), or gray (no attempts). A mastery legend card appears in the sidebar. Second, a **Graph Insights panel** that automatically computes hub analysis and isolation statistics after the graph loads — it shows the most-connected topic (clickable to pan and select), the count of cross-pack bridge topics, and isolated topics (topics with no cross-pack links) with an amber warning if any exist. Third, **Quick Study Actions** in the node detail panel — "Flashcards" and "Take Quiz" buttons give users a direct path from discovering a topic in the graph to studying it, alongside the existing "Open Study Pack" button which now has an `ArrowRight` icon.

**Profile overhaul:** I completely rebuilt the Profile page, replacing all dark-only components with a design-system-compliant layout. The new profile header uses an amber-gradient avatar with an emerald online indicator dot, inline edit mode with `AnimatePresence` for smooth transitions, and a member-since chip alongside an active-streak badge. A new **streak hero strip** shows the current streak (with an orange flame icon and glow), total study time, and longest streak in a horizontal layout. The stats grid was reorganized from a mixed 3-column layout (which embedded a `GlowingStarsBackgroundCard` in the center) into a clean 4-column grid with color-coded top bar gradients per metric. The achievements section replaced emoji icons and `BlurFade` animations with Lucide icons in amber-accented badge cards — unlocked achievements get an amber glow border and a thin amber light streak at the top; locked ones show a padlock icon. The security section uses native inputs with a `Shield` accent. The page now has a `TextShimmer` title matching all other pages.

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

**Mind map and knowledge graph layout:** Positioning nodes in SVG without a physics engine required manual layout algorithms. For mind maps, I used a recursive tree layout that calculates node positions based on depth and sibling count. For the knowledge graph, I implemented a simplified force-directed-style placement algorithm. Both handle variable node counts and text lengths. Enhancing the knowledge graph with organic movement (jitter, breathing auras, orbital rings) required careful animation tuning to avoid performance issues — I used `requestAnimationFrame` with throttled updates.

**Fullscreen API and proctoring enforcement:** Implementing the proctored exam mode required handling cross-browser inconsistencies with the Fullscreen API (`requestFullscreen` vs. `webkitRequestFullscreen`). The `visibilitychange` event fires reliably for tab switches, but I had to handle edge cases like the browser's DevTools being opened (which also triggers a visibility change). I settled on a 3-strike system with clear warnings rather than immediate termination, balancing strictness with user experience.

**TipTap rich text editor integration:** Integrating TipTap with Next.js required ensuring the editor component was client-side only (`"use client"`) since TipTap depends on browser APIs. The auto-save implementation needed debouncing to avoid excessive API calls — I used a timer that resets on each keystroke and only saves after 2 seconds of inactivity.

**@dnd-kit drag-and-drop accessibility:** The matching game required careful implementation to ensure drag-and-drop was accessible. @dnd-kit provides built-in keyboard navigation and screen reader announcements, but I had to configure proper ARIA labels for each draggable item and drop zone to make the game usable without a mouse.

**SpeechSynthesis cross-browser quirks:** The Audio Study Mode revealed that the `SpeechSynthesis` API has significant cross-browser differences. Chrome requires a user gesture before speaking, Safari has different voice availability, and the `voiceschanged` event fires at unpredictable times. I added a voice loading callback and fallback defaults to handle cases where preferred voices aren't available.

---

## 3. Blockers

None. All Week 5-10 deliverables are fully implemented and functional. The application is feature-complete with 21 models, 23 pages, and 42 API routes. Users can register, upload documents, generate AI study packs (with summaries, topics, flashcards, quizzes, cloze questions, and mind maps), review flashcards with spaced repetition, take quizzes with weak area analysis, use Pomodoro focus mode, chat with the AI tutor (with voice and ELI5 mode), write practice essays with AI grading, manage study events on a calendar, generate AI study plans, track analytics and streaks, annotate documents, explore topic relationships via the knowledge graph, take proctored AI-generated exams, receive smart AI-generated study reminders, take Cornell-style notes with a rich text editor, set and track study goals with AI suggestions, play the flashcard matching game, complete fill-in-the-blank quizzes — both integrated directly inside the study pack detail page — listen to study material via audio mode, and review AI-generated weekly performance reports.

---

## 4. TODO

**Week 11 — UI Redesign Sprint & Feature Enhancements (COMPLETED Apr. 2, 2026)**
- ✅ Established unified amber design system across all 24 pages
- ✅ Removed all dark-only third-party components (SparklesText, ShineBorder, Meteors, etc.)
- ✅ Redesigned Analytics, Calendar, Study Plan, Weekly Report, History, Notebooks, Goals, Knowledge Graph, Profile pages
- ✅ Added Knowledge Graph Mastery Overlay (quiz-performance node coloring)
- ✅ Added Knowledge Graph Insights panel (hub topics, isolated topics, cross-pack bridges)
- ✅ Added Knowledge Graph Quick Study Actions (Flashcards + Take Quiz buttons in node panel)
- ✅ Rebuilt Profile page with streak hero, 4-column stats grid, redesigned achievements, amber design language

**Weeks 11-12 — Testing & Refinement (target: Apr. 6, 2026)**
- End-to-end testing for critical user flows (register → upload → generate → quiz → review weak areas → focus session → tutor chat → essay → exam → matching game tab → fill-in-blank tab → goals → weekly report → analytics)
- Performance optimization (database query indexing, response payload optimization)
- Final bug fixes from testing pass
- **Evaluation:** No critical bugs, response times acceptable under normal load.
- **Deliverables:** Bug fixes, code pushed to GitHub

**Week 12 — Deployment & Documentation (target: Apr. 6, 2026)**
- Deploy to Vercel with production environment configuration
- Configure production MongoDB Atlas cluster with proper access controls
- Set up environment variables (MONGODB_URI, NEXTAUTH_SECRET, ANTHROPIC_API_KEY)
- Write user documentation and project setup guide
- **Evaluation:** Application accessible via public URL, all features work in production.
- **Deliverables:** Live deployment URL, documentation, code pushed to GitHub

**Week 13 — Final Submission (target: Apr. 6, 2026)**
- Final testing in production environment
- Project presentation preparation
- Submit final deliverables and documentation
- **Evaluation:** Presentation complete, all deliverables submitted on time.
- **Deliverables:** Final presentation, project report, source code, live deployment

---

## 5. Checkpoint Meeting Notes

*(To be filled in after the checkpoint meeting with the professor.)*
