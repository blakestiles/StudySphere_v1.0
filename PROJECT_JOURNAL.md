# StudySphere - Project Journal

**Student:** Sainath Gandhe
**Course:** CPSC 589 - California State University, Fullerton
**Project:** StudySphere - AI-Powered Study Companion
**Date:** February 9, 2026

---

## 1. Progress

I completed the full foundation of the StudySphere application covering authentication, document management, and the dashboard interface, all implemented with Next.js 16 (App Router), TypeScript, Tailwind CSS v4, shadcn/ui, NextAuth.js v5, and MongoDB with Mongoose.

**Authentication system:** I built a complete auth flow including user registration with bcrypt password hashing (salt factor 12), credentials-based login with JWT session strategy, and profile management (edit name and bio). The auth architecture uses a split-config pattern — an edge-safe config (`auth.config.ts`) for the Next.js middleware that handles route protection, and a Node.js config (`auth.ts`) for the Credentials provider that requires bcrypt and Mongoose. Protected routes (`/dashboard`, `/upload`, `/profile`, `/study-packs`) redirect unauthenticated users to `/login`, and authenticated users are redirected away from `/login` and `/register` to `/dashboard`.

**Document upload pipeline:** I implemented a dual-mode upload system within a single API endpoint. Users can either drag-and-drop a PDF file (up to 10MB) or paste text directly. For PDFs, the server extracts text content using the `pdf-parse` library and stores it in MongoDB. The upload page uses a tabbed interface — the PDF tab has a drag-and-drop zone with a progress bar, and the text tab has a form with a live character counter.

**Document management:** I built a document listing API that returns all user documents sorted by upload date (excluding the raw text field to reduce payload size) and a document delete API with cascade deletion. When a document is deleted, the system first finds all related StudyPacks, then deletes their associated Topics, Flashcards, and QuizQuestions in parallel, then deletes the StudyPacks, and finally deletes the document itself. The dashboard displays the 5 most recent documents with a trash icon that opens a confirmation dialog before deletion.

**Dashboard:** I built the main dashboard as a server component that fetches data directly from MongoDB using `Promise.all()` for parallel queries. It shows three statistics cards (document count, study pack count, quiz attempts taken) and the recent documents list. The page serializes Mongoose lean documents before passing them to client components.

**Database schema:** I designed and implemented all 10 Mongoose models covering the full data lifecycle — User, Document, StudyPack, Topic (with self-referencing hierarchy), Flashcard (with difficulty levels), QuizQuestion (multiple-choice with explanations), QuizAttempt (with per-question response tracking), FocusSession (with goals and recaps), and WeakArea (with severity levels). These models are interconnected through MongoDB ObjectId references.

**Landing page and layout:** I created a public landing page with a hero section, feature cards, and call-to-action buttons. The authenticated layout includes a sticky top navbar with user account actions and a fixed sidebar with navigation links (Dashboard, Upload, Study Packs, Profile) that highlights the active route.

---

## 2. Challenges

**NextAuth.js v5 middleware compatibility:** NextAuth.js v5 requires that the middleware configuration only uses edge-compatible code, but the Credentials provider needs Node.js-only dependencies (bcrypt for password comparison and Mongoose for database queries). I resolved this by splitting the auth configuration into two files — `auth.config.ts` with only the route authorization logic (edge-safe), and `auth.ts` that extends it with the Credentials provider and callbacks (Node.js runtime). The middleware imports only the edge-safe config.

**pdf-parse v2 API changes:** The `pdf-parse` library v2 introduced a breaking API change from v1. It no longer has a default export, and the usage pattern changed to `new PDFParse({ data: Uint8Array })` followed by `getText()`. I also had to configure `serverExternalPackages: ["pdf-parse"]` in `next.config.ts` because the library uses native Node.js modules that cannot be bundled by Next.js.

**Server vs. client component boundary on the dashboard:** The dashboard page is a server component (for direct MongoDB access), but the document delete functionality requires click handlers and state management which need a client component. I resolved this by extracting the document list into a separate `RecentDocuments` client component that receives serialized data as props. Mongoose lean documents contain non-serializable types (`ObjectId`, `Date`), so I had to convert `_id` to string and dates to ISO strings before passing them as props.

**shadcn/ui component selection:** The shadcn/ui `toast` component was deprecated in favor of `sonner`. I switched to using the Sonner library directly with `toast.success()` and `toast.error()` calls, and added the `<Toaster>` component to the root layout for app-wide notifications.

---

## 3. Blockers

None. All Week 5 deliverables are fully implemented and the application is functional. The Anthropic Claude API SDK (`@anthropic-ai/sdk` v0.74.0) is already installed as a dependency and ready for integration in Week 6.

---

## 4. TODO

**Week 6 — AI Study Pack Generation (target: Feb. 16, 2026)**
- Implement the `/api/study-packs/generate` endpoint (currently a 501 stub) to send document text to the Anthropic Claude API and generate structured study content
- AI should produce: short summary, detailed summary, topic breakdown with hierarchy, flashcards with difficulty ratings, and multiple-choice quiz questions with explanations
- Store generated content across the StudyPack, Topic, Flashcard, and QuizQuestion models
- Build the study pack viewer page (`/study-packs/[id]`) to display all generated content in an organized tabbed or sectioned layout
- **Evaluation:** A user can upload a document, click "Generate Study Pack," and view the resulting summaries, topics, flashcards, and quiz questions. The generated content should be accurate and relevant to the source material. All data should persist in MongoDB.
- **Deliverables:** Working generate endpoint, study pack viewer page, code pushed to GitHub

**Weeks 7-8 — Quizzes, Weak Areas, Focus Mode & AI Tutor (target: Mar. 2, 2026)**
- Build an interactive quiz-taking interface with score calculation and response tracking using the QuizAttempt model
- Implement weak area detection by analyzing quiz performance to identify topics where the user scores poorly, stored in the WeakArea model with severity levels
- Build a focus mode for timed study sessions with goals and session recaps using the FocusSession model
- Implement a conversational AI tutor chat interface using the Claude API for context-aware Q&A about uploaded documents
- **Evaluation:** A user can take a quiz, see their score, review incorrect answers with explanations, view identified weak areas, start a timed focus session on a weak topic, and ask the AI tutor questions about their material.
- **Deliverables:** Quiz interface, weak area dashboard, focus mode timer, AI tutor chat, code pushed to GitHub

**Weeks 9-10 — Testing & Refinement (target: Mar. 16, 2026)**
- Write unit and integration tests for all API routes
- End-to-end testing for critical user flows (register -> upload -> generate -> quiz -> review)
- Performance optimization (database indexing, query efficiency)
- UI/UX refinements based on testing feedback
- **Evaluation:** All tests pass, no critical bugs, response times are acceptable under normal load.
- **Deliverables:** Test suite, performance benchmarks, bug fixes, code pushed to GitHub

**Weeks 11-12 — Deployment & Documentation (target: Mar. 30, 2026)**
- Deploy to Vercel with production MongoDB Atlas cluster
- Configure environment variables and access controls
- Write user documentation and project setup guide
- **Evaluation:** Application is accessible via a public URL, all features work in the production environment, documentation is clear and complete.
- **Deliverables:** Live deployment URL, documentation, code pushed to GitHub

**Week 13 — Final Submission (target: Apr. 6, 2026)**
- Final production testing, presentation preparation, and submission of all deliverables
- **Evaluation:** Presentation is complete, all deliverables are submitted on time.
- **Deliverables:** Final presentation, project report, source code, live deployment

---

## 5. Checkpoint Meeting Notes

*(To be filled in after the checkpoint meeting with the professor.)*
