# StudySphere - Progress Report

**Student:** Sainath Gandhe
**Course:** CPSC 589 - California State University, Fullerton
**Project:** StudySphere - AI-Powered Study Companion
**Date:** April 2, 2026

---

## Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.1.6 |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 4.x |
| UI Components | shadcn/ui (Radix UI primitives) | latest |
| Authentication | NextAuth.js (beta) | 5.0.0-beta.30 |
| Database | MongoDB with Mongoose ODM | Mongoose 9.2.0 |
| PDF Parsing | pdf-parse | 2.4.5 |
| AI | Anthropic Claude API SDK | 0.74.0 |
| Notifications | Sonner (toast library) | 2.0.7 |
| Icons | Lucide React | 0.563.0 |
| Validation | Zod | 4.3.6 |
| Charts | Recharts | latest |
| Command Palette | cmdk | latest |
| Markdown Rendering | react-markdown + remark-gfm | latest |
| Date Utilities | date-fns | latest |
| Rich Text Editor | TipTap (@tiptap/react + starter-kit) | 3.20.0 |
| Drag & Drop | @dnd-kit/core + @dnd-kit/sortable | 6.3.1 / 10.0.0 |

---

## Weeks 1-4: Requirements, Design & Data Preparation

### Requirements Gathering
- Defined the core problem: students need a centralized tool to transform raw study materials (PDFs, notes) into structured learning resources (summaries, flashcards, quizzes)
- Identified five major feature areas: document management, AI-powered study pack generation, quiz system with scoring, weak area detection, and focus mode for targeted study

### Database Schema Design
- Designed 10 interconnected Mongoose models covering the full data lifecycle:
  - **User management** (User model)
  - **Content ingestion** (Document model)
  - **AI-generated content** (StudyPack, Topic, Flashcard, QuizQuestion models)
  - **Learning analytics** (QuizAttempt, WeakArea, FocusSession models)
- Established relationships between models using MongoDB ObjectId references (e.g., StudyPack references Document, Topic references StudyPack, Flashcard references both StudyPack and Topic)

### Project Setup & Configuration
- Initialized Next.js 16 project with App Router architecture and TypeScript
- Configured Tailwind CSS v4 with the `@tailwindcss/postcss` plugin and `tw-animate-css` for animations
- Installed and configured shadcn/ui component library (`components.json`) with Radix UI primitives
- Set up path aliases (`@/*` mapped to `./src/*`) in `tsconfig.json` for clean imports
- Configured `next.config.ts` with `serverExternalPackages: ["pdf-parse"]` to handle the native PDF parsing module on the server side
- Organized the project into a clean directory structure with separation of concerns: `app/` (routes), `components/` (UI), `models/` (data), `lib/` (utilities)

---

## Week 5: Authentication, Document Upload & Backend API

### 1. Authentication System

#### 1.1 Auth Architecture
The authentication system uses a split-config pattern required by NextAuth.js v5 for Next.js middleware compatibility:

- **`src/auth.config.ts`** (edge-safe configuration) - Contains route authorization logic without any Node.js-only dependencies. Defines which routes are protected (`/dashboard`, `/upload`, `/profile`, `/study-packs`) and redirects authenticated users away from `/login` and `/register` back to `/dashboard`.

- **`src/auth.ts`** (Node.js configuration) - Extends the edge config with the Credentials provider, bcrypt password verification, and JWT/session callbacks. Uses `bcryptjs` for password comparison and `mongoose` for database queries, both of which require the Node.js runtime.

- **`src/middleware.ts`** - Uses NextAuth's middleware function with the edge-safe config to intercept all non-API, non-static routes and enforce authentication. Route matcher pattern: `["/((?!api|_next/static|_next/image|favicon.ico).*)"]`.

#### 1.2 User Registration (`POST /api/auth/register`)
- Accepts `name`, `email`, and `password` in the request body
- **Server-side validation:** checks for missing required fields, enforces minimum 6-character password length
- **Duplicate detection:** queries MongoDB to check if the email is already registered (returns 409 Conflict if so)
- **Password security:** hashes the password using `bcrypt.hash()` with a salt factor of 12 before storing
- Returns the created user's ID on success (201 Created)

#### 1.3 User Login
- Uses NextAuth.js Credentials provider with email/password authentication
- The `authorize()` callback connects to MongoDB, retrieves the user with `select("+password")` (password field is excluded by default via `select: false` in the User schema), and compares the provided password against the stored hash using `bcrypt.compare()`
- On successful authentication, returns a user object with `id`, `name`, `email`, and `image`
- **Session strategy:** JWT-based (stateless, no server-side session store needed)
- **JWT callback:** embeds the user's MongoDB `_id` into the JWT token
- **Session callback:** exposes the user ID from the token into `session.user.id` for use in API routes

#### 1.4 Login Page (`/login`)
- Client component (`LoginForm.tsx`) with controlled form inputs for email and password
- Calls `signIn("credentials", { email, password, redirect: false })` from `next-auth/react`
- On success: shows a success toast ("Logged in successfully!") and redirects to `/dashboard` with `router.push()` + `router.refresh()`
- On failure: shows an error toast ("Invalid email or password")
- Loading state disables the submit button and shows "Signing in..." text
- Includes a "Don't have an account? Sign up" link to `/register`

#### 1.5 Registration Page (`/register`)
- Client component (`RegisterForm.tsx`) with controlled inputs for name, email, password, and confirm password
- **Client-side validation:** checks that passwords match and password is at least 6 characters before submitting
- Sends a `POST` request to `/api/auth/register` with the form data
- On successful registration, automatically signs the user in using `signIn("credentials")` and redirects to `/dashboard`
- If auto-sign-in fails after registration, falls back to redirecting to `/login`
- Loading state shows "Creating account..." text

#### 1.6 Profile Page (`/profile`)
- **Server component** (`page.tsx`) fetches the user's profile data from MongoDB on the server side using the session's user ID
- Passes `name`, `bio`, and `email` as props to the client-side `ProfileForm.tsx`
- **ProfileForm** (client component) allows editing name and bio (email is displayed but disabled)
- Sends a `PATCH` request to `/api/auth/profile` to update the user record
- After a successful update, calls `useSession().update({ name })` to refresh the client-side session with the new name
- Shows success/error toast notifications

#### 1.7 Profile API (`GET/PATCH /api/auth/profile`)
- **GET**: Authenticates the user via `auth()`, fetches the user document from MongoDB, returns `id`, `name`, `email`, `image`, and `bio`
- **PATCH**: Accepts `name` and `bio` in the request body, uses `findByIdAndUpdate()` with conditional field spreading (only updates fields that are provided), returns the updated user data

#### 1.8 Session Provider
- Root layout (`src/app/layout.tsx`) wraps the entire app in a `SessionProvider` from `next-auth/react` to make session data available to all client components via `useSession()`
- Also includes the `<Toaster>` component from Sonner configured with `richColors` and `position="top-right"` for app-wide toast notifications

### 2. Document Upload System

#### 2.1 Upload API (`POST /api/documents/upload`)
The upload endpoint handles two content types in a single route:

**PDF Upload (multipart/form-data):**
- Extracts the file from `FormData` using `request.formData()`
- **Validation:** checks that a file was provided, file size is within the 10MB limit (`10 * 1024 * 1024` bytes), and MIME type is `application/pdf`
- **Text extraction:** converts the file to a `Buffer` via `file.arrayBuffer()`, then calls `extractTextFromPDF()` which uses the `pdf-parse` library with the pattern `new PDFParse({ data: new Uint8Array(buffer) })` followed by `getText()`
- **Empty PDF check:** if no text could be extracted, returns a 400 error ("Could not extract text from PDF")
- Uses the provided title or falls back to the filename without the `.pdf` extension
- Creates a Document record with `fileType: "pdf"`, the extracted `rawText`, `originalFilename`, and `status: "ready"`

**Text Paste (application/json):**
- Accepts `title` and `content` fields in the JSON body
- **Validation:** checks that both fields are provided and content is at least 10 characters
- Creates a Document record with `fileType: "text"`, the pasted content as `rawText`, and `status: "ready"`

#### 2.2 Upload Page (`/upload`)
- Server component that renders a tabbed interface using shadcn/ui `Tabs` component
- **"Upload PDF" tab:** renders the `FileUploadZone` client component
- **"Paste Text" tab:** renders the `TextPasteForm` client component

#### 2.3 PDF Upload Component (`FileUploadZone.tsx`)
- Implements full drag-and-drop functionality with `onDrop`, `onDragOver`, and `onDragLeave` event handlers
- Visual feedback: border and background change to blue when a file is being dragged over the drop zone
- **Client-side validation:** checks file type (`application/pdf`) and size (10MB limit) before uploading
- Shows a simulated progress bar during upload (10% -> 30% -> 80% -> 100%) using the shadcn `Progress` component
- Displays the filename during upload with a "Uploading {fileName}..." message
- Also supports traditional file selection via a "Browse Files" button with a hidden `<input type="file" accept=".pdf">`

#### 2.4 Text Paste Component (`TextPasteForm.tsx`)
- Form with a title `Input` and a content `Textarea` (12 rows)
- Shows a live character count below the textarea (`{content.length} characters`)
- **Client-side validation:** requires title to be non-empty and content to be at least 10 characters
- Clears the form on successful submission
- Loading state shows "Saving..." text on the submit button

### 3. Document Management

#### 3.1 Document List API (`GET /api/documents`)
- Authenticates the user and returns all their documents sorted by `uploadedAt` in descending order (newest first)
- Excludes the `rawText` field from results using `.select("-rawText")` to reduce response payload size

#### 3.2 Document Delete API (`DELETE /api/documents/[id]`)
- Authenticates the user and verifies document ownership (returns 403 Forbidden if the document belongs to another user)
- **Cascade deletion:** before deleting the document, finds all related StudyPacks, then deletes all Topics, Flashcards, and QuizQuestions associated with those StudyPacks using `deleteMany({ studyPackId: { $in: studyPackIds } })` in parallel with `Promise.all()`, then deletes the StudyPacks themselves, and finally deletes the document
- Returns a success message on completion

#### 3.3 Dashboard Document List (`RecentDocuments.tsx`)
- Client component that receives serialized document data (with `_id` and dates converted to strings) as props from the server component
- Displays each document with a file type icon (PDF or text), title, upload date, and status badge
- **Delete functionality:** each document row has a trash icon button (from Lucide React) that opens a shadcn `AlertDialog` confirmation dialog
- The confirmation dialog warns: "This will permanently delete [title] and all related study packs, flashcards, and quiz questions. This action cannot be undone."
- On confirm: calls `DELETE /api/documents/[id]`, shows a success toast, and calls `router.refresh()` to reload the server-fetched data
- On error: shows an error toast with the error message
- Disables the delete button while a deletion is in progress to prevent double-clicks
- Empty state shows "No documents yet." with a link to the upload page

### 4. Dashboard

#### 4.1 Dashboard Page (`/dashboard`)
- **Server component** that fetches data directly from MongoDB using Mongoose (no API call needed)
- Uses `Promise.all()` to fetch three data points in parallel:
  1. The user's 5 most recent documents (excluding `rawText`, using `.lean()` for plain objects)
  2. Total study pack count via `StudyPack.countDocuments()`
  3. Total quiz attempt count via `QuizAttempt.countDocuments()`
- Serializes Mongoose lean documents to plain objects (converts `_id` to string, `uploadedAt` to ISO string) before passing to the client component
- Shows a welcome message with the user's name
- Includes an "Upload Material" button linking to `/upload`

#### 4.2 Statistics Cards (`DashboardStats.tsx`)
- Displays three stat cards in a responsive 3-column grid:
  - **Documents** - total number of uploaded documents
  - **Study Packs** - total number of generated study packs
  - **Quizzes Taken** - total number of completed quiz attempts
- Each card shows an icon, label, and count value

### 5. Application Layout & Navigation

#### 5.1 Root Layout (`src/app/layout.tsx`)
- Sets the HTML `lang` attribute to "en"
- Loads the Inter font from Google Fonts
- Wraps the app in `SessionProvider` for client-side auth state
- Includes the `<Toaster>` component for app-wide toast notifications
- Sets page metadata: title "StudySphere - AI Powered Study Companion"

#### 5.2 Main Layout (`src/app/(main)/layout.tsx`)
- Wraps all authenticated pages in a consistent layout with:
  - **Navbar** (sticky, top) - displays the StudySphere logo (links to `/dashboard`) and a `UserButton` component for user account actions
  - **Sidebar** (fixed, left, 256px wide, hidden on mobile) - navigation links for Dashboard, Upload, Study Packs, and Profile with active state highlighting (blue background when the current path matches)
  - **Main content area** - renders page content with left margin offset to account for the sidebar on desktop

#### 5.3 Landing Page (`/`)
- Public page (no authentication required) with:
  - **Header** - StudySphere branding with "Sign In" (ghost button) and "Get Started" (primary button) navigation
  - **Hero section** - headline "Your AI-Powered Study Companion", description of the app's value proposition, and a "Start Learning Free" CTA button
  - **Feature cards** - three cards in a responsive grid highlighting: Smart Upload ("Upload PDFs or paste text"), AI Study Packs ("Get summaries, flashcards, quizzes"), and Track Progress ("Identify weak areas, take adaptive quizzes")
  - Gradient background from blue-50 to white

### 6. Database Models (Complete Schema Definitions)

All 10 models are defined in `src/models/` with Mongoose schemas:

| Model | Fields | Relationships |
|-------|--------|---------------|
| **User** | name (required), email (required, unique), password (required, select: false), image, bio (default: "") | timestamps enabled |
| **Document** | userId (ref: User), title (required), originalFilename, fileType (enum: pdf/text), rawText (required), status (enum: processing/ready/error, default: ready), uploadedAt (default: now) | belongs to User |
| **StudyPack** | userId (ref: User), documentId (ref: Document), title (required), summaries.short, summaries.detailed, status (enum: generating/ready/error, default: generating) | belongs to User and Document; timestamps enabled |
| **Topic** | studyPackId (ref: StudyPack), name (required), parentTopicId (ref: Topic, self-referencing for hierarchy), content, order (default: 0) | belongs to StudyPack |
| **Flashcard** | studyPackId (ref: StudyPack), topicId (ref: Topic), question (required), answer (required), difficulty (enum: easy/medium/hard, default: medium) | belongs to StudyPack and Topic |
| **QuizQuestion** | studyPackId (ref: StudyPack), topicId (ref: Topic), question (required), options (array of strings, required), correctAnswer (Number, required), explanation | belongs to StudyPack and Topic |
| **QuizAttempt** | userId (ref: User), studyPackId (ref: StudyPack), score (required), totalQuestions (required), responses (array of: questionId, selectedAnswer, isCorrect), completedAt (default: now) | belongs to User and StudyPack |
| **FocusSession** | userId (ref: User), studyPackId (ref: StudyPack), topicId (ref: Topic), duration (required), goals (array of strings), recap, completedAt | belongs to User, StudyPack, and Topic |
| **WeakArea** | userId (ref: User), topicId (ref: Topic, required), severity (enum: low/medium/high, default: medium), lastUpdated (default: now) | belongs to User and Topic |

### 7. Utility Modules

#### 7.1 Database Connection (`src/lib/db.ts`)
- Implements a cached MongoDB connection using a global singleton pattern to avoid creating multiple connections during development hot reloads
- Reads the `MONGODB_URI` environment variable and throws an error if it is not defined
- Uses `bufferCommands: false` option to fail fast on queries if the connection is not established

#### 7.2 PDF Text Extraction (`src/lib/pdf.ts`)
- Exports `extractTextFromPDF(buffer: Buffer)` function
- Uses the `pdf-parse` v2 API: creates a `new PDFParse({ data: new Uint8Array(buffer) })` instance and calls `getText()` to extract the text content
- Returns the extracted text as a string

---

## Week 6: AI Study Pack Generation

### 1. Claude API Integration

#### 1.1 Anthropic Client (`src/lib/claude.ts`)
- Initializes a singleton Anthropic SDK client using the `ANTHROPIC_API_KEY` environment variable
- Exported as a default module for use across the study pack generator and tutor chat features

#### 1.2 Study Pack Generator (`src/lib/study-pack-generator.ts`)
- Exports the `generateStudyPack(title: string, rawText: string)` function that orchestrates the AI content generation
- **API key validation:** checks that `ANTHROPIC_API_KEY` is set and not a placeholder before making API calls, providing a clear error message if misconfigured
- **Input truncation:** truncates document text to 100,000 characters to stay within Claude's context window
- **Model:** uses `claude-sonnet-4-20250514` for high-quality structured output
- **Prompt engineering:** sends a detailed prompt instructing Claude to generate a JSON object containing:
  - Short summary (2 sentences) and detailed summary (2 paragraphs)
  - 3-8 topics with content explanations
  - 2-5 flashcards per topic with varying difficulty (easy/medium/hard)
  - 2-4 quiz questions per topic with exactly 4 options, 0-based correct answer index, and explanations
- **Response parsing:** safely extracts the text block from Claude's response using `.find()`, strips markdown code fences (`\`\`\`json...\`\`\``) if present, and parses the JSON
- **Validation:** verifies the parsed response contains required fields (summaries, topics array with at least one topic) before returning
- **Error handling:** provides descriptive error messages for missing API key, empty responses, JSON parse failures, and missing fields

#### 1.3 Validation Schema (`src/lib/validations/study-pack.ts`)
- Uses Zod v4 (imported from `"zod/v4"`) to define `generateStudyPackSchema` requiring a non-empty `documentId` string

### 2. Study Pack Generation API (`POST /api/study-packs/generate`)
- Authenticates the user via `auth()` session check
- Validates the request body with `generateStudyPackSchema`
- Verifies the document exists, belongs to the user, and has `status: "ready"`
- **Optimistic creation:** creates a StudyPack record with `status: "generating"` before calling the AI, so the user can see it's in progress
- Calls `generateStudyPack()` with the document's title and raw text
- **Database writes:** after successful generation:
  - Creates Topic documents using `insertMany()` for all topics
  - Maps generated flashcards and quiz questions to their corresponding topic IDs
  - Creates Flashcard and QuizQuestion documents in parallel using `Promise.all()` with `insertMany()`
  - Updates the StudyPack with `status: "ready"` and the generated summaries
- **Error recovery:** if generation fails, catches the error, updates the StudyPack status to `"error"`, and returns the actual error message to the client (not a generic 500)

### 3. Study Pack Listing

#### 3.1 Study Packs List API (`GET /api/study-packs`)
- Returns all study packs for the authenticated user, sorted by creation date (newest first)
- Populates the `documentId` reference with the document's title for display

#### 3.2 Study Packs Page (`/study-packs`)
- Server component that fetches all user study packs with document title population
- Displays study packs in a responsive grid (1/2/3 columns) with cards showing:
  - Title, document reference, creation date
  - Status badge: "ready" (default), "generating" (secondary), or "error" (destructive)
- Each card links to the study pack detail page
- Empty state shows a message with a link to the dashboard

### 4. Study Pack Detail Page (`/study-packs/[id]`)

#### 4.1 Server Component (page.tsx)
- Fetches the study pack, topics, flashcards, and quiz questions in parallel using `Promise.all()` with `.lean()` for performance
- Verifies ownership and redirects to `/study-packs` if not found or unauthorized
- Serializes all Mongoose documents (converts ObjectIds to strings, dates to ISO strings) before passing to the client component

#### 4.2 StudyPackDetail Component (`StudyPackDetail.tsx`)
- Handles three states: generating (spinner with refresh message), error (error badge with retry message), and ready (full content)
- Uses shadcn/ui `Tabs` component with 5 tabs:
  - **Summary** — displays short overview and detailed summary in separate cards
  - **Topics** — ordered list of topic cards with name and content
  - **Flashcards** — interactive `FlashcardViewer` component
  - **Quiz** — interactive `QuizInterface` component
  - **AI Tutor** — conversational `TutorChat` component

#### 4.3 FlashcardViewer Component
- 3D flip animation using CSS `transform: rotateY(180deg)` with `preserve-3d` and `backfaceVisibility: hidden`
- Click to flip between question (front) and answer (back)
- Previous/Next navigation that wraps around
- **Difficulty filter:** buttons to filter by All, Easy, Medium, or Hard with counts
- Color-coded difficulty badges (green/yellow/red)
- Resets to the first card when the filter changes

### 5. Generate Button Component (`GenerateButton.tsx`)
- Conditionally renders based on whether a study pack already exists for the document:
  - If exists: shows a "View Study Pack" outline button linking to the detail page
  - If not: shows a "Generate Study Pack" primary button
- On click: sends POST to `/api/study-packs/generate`, shows a loading spinner with "Generating... (this may take a minute)", and on success redirects to the new study pack's detail page
- Shows toast notifications for success and error states

---

## Weeks 7-8: Quizzes, Weak Areas, Focus Mode & AI Tutor

### 1. Quiz System

#### 1.1 Validation Schema (`src/lib/validations/quiz.ts`)
- Uses Zod v4 to define `submitQuizSchema` requiring an array of answers, each with `questionId` (string) and `selectedAnswer` (number)

#### 1.2 Quiz Questions API (`GET /api/study-packs/[id]/quiz`)
- Authenticates the user and verifies study pack ownership
- Returns all quiz questions for the specified study pack

#### 1.3 Quiz Submission API (`POST /api/study-packs/[id]/quiz`)
- Validates the submitted answers against the `submitQuizSchema`
- Looks up all referenced questions from MongoDB and builds a lookup map
- Compares each submitted answer against the stored `correctAnswer` index to determine correctness
- Calculates the total score (number of correct answers)
- Creates a `QuizAttempt` record with the user ID, study pack ID, score, total questions, and per-question response details (questionId, selectedAnswer, isCorrect)
- Returns the attempt record, score, and total questions count

#### 1.4 QuizInterface Component (`QuizInterface.tsx`)
- Displays one question at a time with multiple-choice options (A, B, C, D)
- Progress bar showing completion percentage using shadcn `Progress` component
- Tracks answered count vs. total questions
- Previous/Next navigation between questions
- Answer selection highlights the chosen option in blue
- Submit button only enabled when all questions are answered
- On submission: sends answers to the quiz API, then triggers weak area analysis in the background
- Passes results to `QuizResults` component after submission

#### 1.5 QuizResults Component (`QuizResults.tsx`)
- Score display with color coding: green (>80%), yellow (>50%), red (≤50%)
- Motivational message based on score range
- **Detailed question review:** shows each question with:
  - Correct/Wrong badge
  - All options with color coding (green for correct answer, red with strikethrough for user's wrong answer)
  - Explanation shown for incorrect answers (yellow background)
- "Try Again" button resets the quiz state for another attempt

### 2. Weak Area Detection

#### 2.1 Weak Areas API (`GET /api/weak-areas`)
- Returns all weak areas for the authenticated user
- Populates the `topicId` reference with the topic's name and studyPackId for navigation

#### 2.2 Weak Areas Analysis API (`POST /api/weak-areas/analyze`)
- Accepts a `attemptId` in the request body
- Retrieves the quiz attempt and verifies ownership
- Identifies all incorrect responses and looks up the corresponding questions to get their topic IDs
- Groups wrong answers by topic and calculates the wrong-answer percentage per topic against total questions for that topic
- **Severity classification:**
  - **High** (>66% wrong) — significant weakness
  - **Medium** (33-66% wrong) — moderate weakness
  - **Low** (≤33% wrong) — minor weakness
- Upserts WeakArea records using `findOneAndUpdate()` with `upsert: true`, updating severity and `lastUpdated` timestamp
- Returns the created/updated weak area records

#### 2.3 WeakAreasList Component (`WeakAreasList.tsx`)
- Displays weak areas on the dashboard with severity badges:
  - **High** — destructive (red) badge
  - **Medium** — yellow outline badge
  - **Low** — secondary badge
- Each weak area shows the topic name (linked to its study pack) and relative time since last updated (just now, Xm ago, Xh ago, Xd ago, Xw ago)
- Empty state: "No weak areas identified yet. Take a quiz to get started!"

### 3. Focus Mode

#### 3.1 Validation Schemas (`src/lib/validations/focus-session.ts`)
- `createFocusSessionSchema`: requires studyPackId (string), duration (1-180 minutes), optional goals array
- `completeFocusSessionSchema`: optional recap string

#### 3.2 Focus Sessions API (`GET/POST /api/focus-sessions`)
- **GET**: returns all focus sessions for the user, sorted newest first, with study pack title populated
- **POST**: validates input, creates a new FocusSession record with userId, studyPackId, duration, and goals

#### 3.3 Focus Session Completion API (`PATCH /api/focus-sessions/[id]`)
- Validates the recap input, verifies session ownership
- Updates the session with the recap text and sets `completedAt` to the current timestamp

#### 3.4 Focus Page (`/focus`)
- Server component that fetches all user study packs with `status: "ready"` for the dropdown
- Renders the `FocusMode` client component with serialized study pack options
- Protected by authentication (redirects to `/login` if unauthenticated)

#### 3.5 FocusMode Component (`FocusMode.tsx`)
- Three-phase state machine: setup → active → complete

- **Setup Phase:**
  - Study pack dropdown selector (only shows packs with "ready" status)
  - Duration presets (15, 30, 45, 60 minutes) as buttons plus a custom number input (5-180 min)
  - Dynamic goal list: add/remove goals with text inputs
  - Start button disabled until a study pack and at least one goal are set
  - Creates a focus session via POST to `/api/focus-sessions`

- **Active Phase:**
  - Large countdown timer display (MM:SS format) using `setInterval` with proper cleanup
  - Goal checklist with toggle checkboxes (green highlight and strikethrough when completed)
  - "Complete Early" button to end the session before the timer expires
  - Timer automatically transitions to complete phase when it reaches zero

- **Complete Phase:**
  - Goals summary showing completed vs. not completed with color coding
  - Completion count (X of Y goals completed)
  - Recap textarea for the user to reflect on the session
  - "Save & Finish" button sends PATCH to `/api/focus-sessions/[id]` with the recap
  - On success: shows toast, resets all state back to setup phase

### 4. AI Tutor

#### 4.1 Validation Schema
- `tutorChatSchema` (in `focus-session.ts`): requires studyPackId and an array of messages with role (user/assistant) and content

#### 4.2 Tutor Chat API (`POST /api/tutor/chat`)
- Validates the API key is configured before making Claude calls
- Retrieves the study pack, its source document (truncated to 50,000 chars), and topic names
- Builds a system prompt that includes the study pack title, source material excerpt, and topic names to provide context
- Sends the full conversation history (user and assistant messages) to Claude for multi-turn conversation support
- Uses `claude-sonnet-4-20250514` with `max_tokens: 2048`
- Safely extracts the text response and returns it as the message

#### 4.3 TutorChat Component (`TutorChat.tsx`)
- Chat interface within a 600px-tall card with scrollable message area
- **Suggested questions** shown on initial load: "Explain the key concepts", "Give me a practice problem", "Summarize the main topics"
- Messages styled by role: user messages (blue, right-aligned), assistant messages (gray, left-aligned)
- Loading indicator with animated bouncing dots while waiting for a response
- Auto-scrolls to the latest message using a ref and `scrollIntoView`
- Input field with Enter to send (Shift+Enter for new line)
- Error handling: shows a friendly error message in the chat if the API call fails

### 5. Dashboard Updates for Weeks 7-8

#### 5.1 Updated Dashboard Page
- Now fetches 5 data points in parallel: recent documents, study packs (for document-to-pack mapping), quiz attempt count, focus session count, and weak areas (with topic population)
- Serializes weak areas with topic details for the WeakAreasList component

#### 5.2 Updated DashboardStats
- Expanded from 3 to 4 stat cards: Documents, Study Packs, Quizzes Taken, Focus Sessions

#### 5.3 Updated Navigation
- Sidebar now includes 5 navigation items: Dashboard, Upload, Study Packs, Focus Mode, Profile
- Auth config updated to protect the `/focus` route alongside other authenticated routes

---

## Weeks 9-10 (Partial): UI Redesign, New Features & Full Feature Parity

Following the completion of the core study workflow (Weeks 5-8), I undertook a major expansion of the application to bring it to full feature parity with a professional study companion platform. This phase added 5 new Mongoose models (15 total), 9 new pages (17 total), 12 new API routes (29 total), and numerous UI/UX improvements.

### 1. Theme System & UI Overhaul

#### 1.1 Dark/Light Theme Toggle
- Integrated `next-themes` with a `ThemeProvider` wrapping the entire application
- Added a theme toggle button to the Navbar that switches between dark and light modes
- All components and pages respect the active theme via Tailwind CSS dark mode classes

#### 1.2 Command Palette (Cmd+K)
- Implemented a global command palette using the `cmdk` library
- Activated via `Cmd+K` (Mac) or `Ctrl+K` (Windows) keyboard shortcut
- Provides quick navigation to all 17 pages in the application with fuzzy search

#### 1.3 Responsive Sidebar Redesign
- Rebuilt the sidebar to be collapsible on desktop and a slide-in overlay on mobile
- Expanded navigation from 5 items to 13 items covering all application pages:
  Dashboard, Upload, Study Packs, Documents, Focus Mode, Practice Essay, Calendar, Study Plan, Analytics, AI Tutor, Knowledge Graph, History, Profile

### 2. SM-2 Spaced Repetition System

#### 2.1 Flashcard Review Tracking
- Extended the Flashcard model with SM-2 parameters: `easeFactor` (default 2.5), `interval` (days), `repetitions` (count), and `nextReview` (date)
- Created a `PATCH /api/flashcards/[id]/review` endpoint that accepts a quality rating and recalculates SM-2 parameters
- The SM-2 algorithm adjusts the ease factor and interval based on the user's self-assessed recall quality

#### 2.2 Four-Rating Review System
- Users rate each flashcard with one of four options: Again (reset), Hard (shorter interval), Good (standard interval), Easy (longer interval)
- Ratings map to SM-2 quality scores (1, 3, 4, 5 respectively)
- Cards rated "Again" are reset to the initial learning stage; all others advance with adjusted intervals

#### 2.3 Text-to-Speech on Flashcards
- Added browser-native `SpeechSynthesis` to read flashcard content aloud
- Available on both the question and answer sides of each flashcard

### 3. Pomodoro Focus Mode

#### 3.1 Enhanced Timer System
- Replaced the simple countdown timer with a full Pomodoro implementation featuring three phases: work (25 min default), short break (5 min), and long break (15 min after every 4 work sessions)
- SVG arc animation provides visual feedback of remaining time
- Auto-transitions between phases with audio/visual notifications

### 4. Practice Essays with AI Grading

#### 4.1 Essay Writing Interface (`/practice-essay`)
- Users select a study pack and write essays on topics from their study materials
- Full-page textarea with word count tracking

#### 4.2 AI Grading System
- Submitted essays are sent to the Claude API with a structured grading rubric
- Claude evaluates on 4 criteria (1-10 scale each): Accuracy, Depth, Clarity, and Critical Thinking
- Returns per-criterion scores plus detailed written feedback
- Results stored in the `EssayAttempt` model for historical tracking

#### 4.3 Essay API Routes
- `POST /api/essays/submit` — submits essay for AI grading
- `GET /api/essays` — retrieves user's essay history

### 5. Calendar & Study Events

#### 5.1 Monthly Calendar View (`/calendar`)
- Interactive monthly calendar with navigation (previous/next month)
- Color-coded event indicators on each day
- Click any day to view, create, edit, or delete study events

#### 5.2 Study Event CRUD
- `POST /api/study-events` — create a new study event with title, date, color, and optional notes
- `GET /api/study-events` — retrieve events for a date range
- Events can be marked as complete with a toggle

#### 5.3 StudyEvent Model
- Fields: userId, title, date, color, completed, notes
- Linked to the user for personalized calendar views

### 6. AI Study Plan Generator

#### 6.1 Study Plan Page (`/study-plan`)
- Users select study packs to include, choose an intensity level (light/moderate/intensive), and set a target deadline
- The system sends these parameters to the Claude API, which generates a structured study schedule

#### 6.2 Auto-Population
- Generated study plan sessions are automatically created as `StudyEvent` entries
- Events appear immediately on the calendar after generation
- `POST /api/study-plan/generate` — handles plan generation and event creation

### 7. Analytics Dashboard (`/analytics`)

#### 7.1 Charts and Metrics
- **Study Minutes Over Time:** Line chart built with Recharts showing daily focus session minutes
- **Cards Reviewed:** Bar chart tracking flashcard review activity
- **Quiz Score Trends:** Line chart plotting quiz attempt scores over time
- All charts use data aggregated from FocusSession, ReviewStats, and QuizAttempt models

#### 7.2 Streak Tracking
- Calculates consecutive days with logged study activity (focus sessions, quiz attempts, or card reviews)
- Displays current streak prominently on the analytics page

#### 7.3 Milestone Progress
- Tracks achievements like "Review 100 cards," "Complete 10 quizzes," "Study for 10 hours"
- Progress bars show completion percentage toward each milestone

#### 7.4 Analytics API Routes
- `GET /api/analytics/summary` — aggregated stats (total study time, cards reviewed, quizzes taken, streak)
- `GET /api/analytics/charts` — time-series data for chart rendering

### 8. Document Viewer with Annotations (`/documents/[id]`)

#### 8.1 Full Document Viewer
- Renders the complete extracted text of uploaded documents in a readable format
- Scrollable view with line numbers for reference

#### 8.2 Annotation System
- Users can highlight, underline, or add notes to specific text selections
- Three annotation types: highlight (yellow), underline (blue), and note (with comment text)
- Annotations are persisted to the database via the `Annotation` model

#### 8.3 Annotation API Routes
- `POST /api/annotations` — create a new annotation with type, text, position, and optional comment
- `GET /api/annotations?documentId=X` — retrieve all annotations for a document

### 9. Enhanced AI Tutor (`/chat`)

#### 9.1 Persistent Chat Threads
- Conversations are stored in `ChatThread` and `ChatMessage` models
- Users can create new threads, switch between existing threads, and continue previous conversations
- Thread list shows titles and last message timestamps

#### 9.2 Multimodal Interaction
- **ELI5 Mode:** Toggle that modifies the system prompt to instruct Claude to explain concepts as if to a five-year-old
- **Voice Input:** Browser `SpeechRecognition` API for hands-free question asking
- **Voice Output:** `SpeechSynthesis` API reads AI responses aloud
- **Markdown Rendering:** AI responses rendered with `react-markdown` and `remark-gfm` for proper formatting of code blocks, lists, tables, etc.

#### 9.3 Chat API Routes
- `POST /api/chat/threads` — create a new chat thread
- `GET /api/chat/threads` — list user's chat threads
- `POST /api/chat/threads/[id]/messages` — send a message and get AI response
- `GET /api/chat/threads/[id]/messages` — retrieve message history for a thread

### 10. Mind Maps & Knowledge Graph

#### 10.1 Mind Maps (per Study Pack)
- Study pack generation now includes a mind map JSON structure in the Claude API prompt
- Two visualization modes: tree view (hierarchical) and flowchart view (horizontal)
- Rendered as interactive SVG with node positioning and connecting lines
- Accessible via the "Mind Map" tab on the study pack detail page (now 6 tabs total)

#### 10.2 Knowledge Graph (`/knowledge-graph`)
- Cross-pack topic visualization showing relationships between topics across all study packs
- SVG-based node-link diagram with force-directed-style layout
- Nodes represent topics, edges represent shared concepts or co-occurrence within documents

### 11. History Page (`/history`)

#### 11.1 Activity Log
- Chronological log of all user activities: quiz attempts, essay submissions, and focus sessions
- Each entry shows type icon, title, date, and score/duration
- Expandable details reveal full results (quiz answers, essay feedback, session recaps)

#### 11.2 History API
- `GET /api/history` — aggregates and returns activity data from QuizAttempt, EssayAttempt, and FocusSession models, sorted by date

### 12. New Database Models

Five new Mongoose models were added to support the expanded features:

| Model | Fields | Purpose |
|-------|--------|---------|
| **EssayAttempt** | userId, studyPackId, topic, essay, scores (accuracy/depth/clarity/criticalThinking), feedback, completedAt | Practice essay submissions and AI grades |
| **StudyEvent** | userId, title, date, color, completed, notes | Calendar study events |
| **ChatThread** | userId, studyPackId, title, createdAt | Persistent AI tutor conversation threads |
| **ChatMessage** | threadId, role (user/assistant), content, createdAt | Individual messages within chat threads |
| **Annotation** | userId, documentId, type (highlight/underline/note), text, position, comment | Document viewer annotations |
| **ReviewStats** | userId, date, cardsReviewed, minutesStudied | Daily review activity tracking for analytics |

### 13. Updated Project File Structure

```
StudySphere/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── (main)/
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── upload/page.tsx
│   │   │   ├── profile/page.tsx
│   │   │   ├── study-packs/page.tsx
│   │   │   ├── study-packs/[id]/page.tsx
│   │   │   ├── focus/page.tsx
│   │   │   ├── documents/page.tsx               # NEW: Document list
│   │   │   ├── documents/[id]/page.tsx          # NEW: Document viewer + annotations
│   │   │   ├── calendar/page.tsx                # NEW: Monthly calendar
│   │   │   ├── analytics/page.tsx               # NEW: Analytics dashboard
│   │   │   ├── practice-essay/page.tsx          # NEW: Essay writing + AI grading
│   │   │   ├── chat/page.tsx                    # NEW: Enhanced AI tutor
│   │   │   ├── study-plan/page.tsx              # NEW: AI study plan generator
│   │   │   ├── knowledge-graph/page.tsx         # NEW: Cross-pack topic visualization
│   │   │   └── history/page.tsx                 # NEW: Activity history log
│   │   ├── api/
│   │   │   ├── auth/ (3 routes)
│   │   │   ├── documents/ (3 routes)
│   │   │   ├── study-packs/ (4 routes)
│   │   │   ├── focus-sessions/ (2 routes)
│   │   │   ├── weak-areas/ (2 routes)
│   │   │   ├── tutor/ (1 route)
│   │   │   ├── flashcards/ (1 route)            # NEW: SM-2 review
│   │   │   ├── essays/ (2 routes)               # NEW: Essay submit + history
│   │   │   ├── study-events/ (2 routes)         # NEW: Calendar CRUD
│   │   │   ├── study-plan/ (1 route)            # NEW: Plan generation
│   │   │   ├── chat/ (4 routes)                 # NEW: Chat threads + messages
│   │   │   ├── annotations/ (2 routes)          # NEW: Document annotations
│   │   │   ├── analytics/ (2 routes)            # NEW: Summary + charts
│   │   │   └── history/ (1 route)               # NEW: Activity log
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   └── page.tsx
│   ├── components/
│   │   ├── features/ (expanded with new feature components)
│   │   ├── layout/
│   │   │   ├── Navbar.tsx                       # Updated: theme toggle added
│   │   │   ├── Sidebar.tsx                      # Updated: 13 nav items, responsive
│   │   │   └── CommandPalette.tsx               # NEW: Cmd+K navigation
│   │   ├── providers/
│   │   │   ├── SessionProvider.tsx
│   │   │   └── ThemeProvider.tsx                # NEW: next-themes provider
│   │   └── ui/ (shadcn/ui components)
│   ├── lib/
│   │   ├── claude.ts
│   │   ├── db.ts
│   │   ├── pdf.ts
│   │   ├── study-pack-generator.ts
│   │   ├── utils.ts
│   │   └── validations/
│   ├── models/ (15 models total)
│   │   ├── User.ts, Document.ts, StudyPack.ts, Topic.ts
│   │   ├── Flashcard.ts, QuizQuestion.ts, QuizAttempt.ts
│   │   ├── FocusSession.ts, WeakArea.ts
│   │   ├── EssayAttempt.ts                     # NEW
│   │   ├── StudyEvent.ts                       # NEW
│   │   ├── ChatThread.ts                       # NEW
│   │   ├── ChatMessage.ts                      # NEW
│   │   ├── Annotation.ts                       # NEW
│   │   └── ReviewStats.ts                      # NEW
│   ├── auth.ts
│   ├── auth.config.ts
│   └── middleware.ts
├── next.config.ts
├── components.json
├── package.json
├── tsconfig.json
└── tailwind.config.ts
```

---

## Week 10: Nine New Features, Knowledge Graph Enhancements & UX Polish

Building on the full feature parity achieved in Weeks 9-10, this phase added 8 major new features, 6 new Mongoose models (21 total), 6 new pages (23 total), 13 new API routes (42 total), and significant UX improvements including a global loading skeleton and enhanced knowledge graph visualization.

### 1. AI Exam Simulator (`/exam-simulator`)

#### 1.1 Exam Generation
- Users select a study pack and configure exam parameters (number of questions, time limit)
- `POST /api/exams/generate` sends the study pack content to Claude, which generates a timed exam with multiple-choice and short-answer questions
- Questions are returned with correct answers and explanations for post-exam review

#### 1.2 Proctored Mode
- Optional fullscreen enforcement using the Fullscreen API — the exam starts in fullscreen and monitors for exits
- Tab-switch detection using `visibilitychange` events — each tab switch triggers a warning overlay
- Auto-submit after 3 violations to simulate real proctoring conditions
- Violation count displayed throughout the exam

#### 1.3 Exam Results
- `POST /api/exams/submit` scores the exam and creates an `ExamAttempt` record
- `ExamResults` component shows overall score, per-question review with correct/incorrect indicators, and explanations
- Results stored with violation count and time taken for analytics

#### 1.4 ExamAttempt Model
- Fields: userId, studyPackId, questions, answers, score, totalQuestions, violations, timeLimit, timeTaken, completedAt

### 2. Smart Reminders with Notification Bell

#### 2.1 AI-Generated Reminders
- `POST /api/reminders/generate` analyzes the user's study activity (upcoming events, due flashcards, quiz performance, goals) and uses Claude to generate personalized study reminders
- Reminders include actionable suggestions like "Review flashcards from [topic] — 15 cards due today" or "You haven't studied [pack] in 3 days"

#### 2.2 Notification Bell (Navbar)
- `NotificationBell` component in the Navbar shows unread reminder count as a badge
- Clicking opens the `ReminderPanel` dropdown with all active reminders
- Users can dismiss individual reminders via `PATCH /api/reminders/[id]`

#### 2.3 Browser Notifications
- Requests browser notification permission and sends native push notifications for urgent reminders
- `GET /api/reminders` retrieves all active reminders for the user

#### 2.4 Reminder Model
- Fields: userId, title, message, type, read, actionUrl, createdAt

### 3. Cornell Notes (`/notebooks`, `/notebooks/[id]`)

#### 3.1 Notebook Management
- `GET /api/notebooks` lists all user notebooks sorted by last modified
- `POST /api/notebooks` creates a new notebook with title
- `NotebookList` component shows a grid of notebook cards with title, preview, and last-modified date

#### 3.2 Cornell Editor
- Full rich text editor using TipTap (`@tiptap/react` with `@tiptap/starter-kit` and `@tiptap/extension-placeholder`)
- Cornell note-taking layout with sections for main notes, cue column, and summary
- Auto-save functionality that periodically sends content to `PATCH /api/notebooks/[id]`
- `DELETE /api/notebooks/[id]` for notebook removal

#### 3.3 Notebook Model
- Fields: userId, title, content (JSON), cues, summary, createdAt, updatedAt

### 4. Goal Setting & Tracking (`/goals`)

#### 4.1 Goal Management
- Users create study goals with title, description, target value, and deadline
- `POST /api/goals` creates a goal; `PATCH /api/goals/[id]` updates progress or details; `DELETE /api/goals/[id]` removes goals
- `GoalTracker` component displays goals with progress bars, deadline countdowns, and completion status

#### 4.2 AI Goal Suggestions
- `POST /api/goals/progress` analyzes the user's study activity and uses Claude to suggest personalized goals based on current performance patterns

#### 4.3 Goal Model
- Fields: userId, title, description, targetValue, currentValue, unit, deadline, completed, createdAt

### 5. Matching Game (Study Pack Tab)

#### 5.1 Integration as Study Pack Tab
- The Matching Game is integrated as a tab (`MatchingTab.tsx`) within the study pack detail page (`/study-packs/[id]`), not a standalone page
- Flashcard pairs for the game are sourced directly from the study pack's existing flashcards — no separate API endpoint required

#### 5.2 Game Mechanics
- Built with `@dnd-kit/core` and `@dnd-kit/sortable` for accessible drag-and-drop
- Users match flashcard fronts (questions) to their corresponding backs (answers) by dragging
- Timer tracks how long the matching takes; score based on accuracy and speed
- Visual feedback for correct matches (green) and incorrect attempts (red shake)
- Completion screen with final score and option to replay

### 6. Fill-in-the-Blank Quiz (Study Pack Tab)

#### 6.1 Auto-Generation with Study Packs
- Cloze (fill-in-the-blank) questions are now generated automatically as part of study pack generation — no separate on-demand API call required
- The study pack generator (`study-pack-generator.ts`) prompts Claude to produce cloze questions alongside flashcards and quiz questions

#### 6.2 Interactive Quiz Tab
- `ClozeTab.tsx` presents cloze questions as a tab within the study pack detail page (`/study-packs/[id]`)
- Text input fields for each blank with instant feedback (correct/incorrect) and the correct answer shown for wrong responses
- `POST /api/cloze/submit` records the attempt with score

#### 6.3 ClozeQuestion Model
- Fields: studyPackId, sentence, blanks (array with position, answer, hint), createdAt

### 7. Audio Study Mode (`/audio-study`)

#### 7.1 Audio Player
- `AudioStudyPlayer` component uses the browser `SpeechSynthesis` API to read study pack content aloud
- Playback controls: play, pause, stop, skip forward/backward between sections
- Speed control (0.5x to 2x) and voice selection from available system voices
- Progress indicator showing current position in the content

#### 7.2 Content Sections
- Reads summaries, topic descriptions, and flashcard content in sequence
- Users can select which sections to include in the audio playback
- Auto-advances through sections with configurable pauses between items

### 8. AI Weekly Report (`/weekly-report`)

#### 8.1 Report Generation
- `POST /api/weekly-report/generate` aggregates the user's activity from the past 7 days (focus sessions, quiz attempts, flashcard reviews, essays, goals) and sends a comprehensive summary to Claude
- Claude analyzes the data and generates a structured weekly report with:
  - Study time summary and trends
  - Strengths identified from quiz and essay performance
  - Areas needing improvement
  - Personalized recommendations for the coming week
  - Motivational insights

#### 8.2 Report Viewer
- `WeeklyReportView` component displays the AI-generated report with formatted sections
- `GET /api/weekly-report` retrieves past weekly reports for comparison
- Historical reports allow tracking improvement over multiple weeks

#### 8.3 WeeklyReport Model
- Fields: userId, weekStartDate, weekEndDate, studyMinutes, quizzesTaken, averageScore, cardsReviewed, essaysWritten, goalsCompleted, aiAnalysis, recommendations, createdAt

### 9. Knowledge Graph Enhancements

#### 9.1 Improved Physics Simulation
- Enhanced the force-directed layout with better repulsion forces between nodes for cleaner spacing
- Added jitter and organic movement for more natural node positioning
- Improved collision detection to prevent node overlap

#### 9.2 Visual Enhancements
- Nodes now feature orbital rings, breathing auras, pulsing cores, and energy flow dots for a visually striking appearance
- Color-coded nodes by study pack for easy identification
- Smoother animations and transitions during graph interaction

### 10. Global Loading Skeleton

#### 10.1 Loading State (`loading.tsx`)
- Added a global `loading.tsx` in the `(main)` route group that provides instant visual feedback during page transitions
- Skeleton UI with pulsing placeholders matching the typical page layout
- Prevents layout shift by maintaining consistent dimensions during loading

### 11. Navigation & Auth Updates

#### 11.1 Sidebar Expansion
- Expanded sidebar navigation from 13 to 19 items covering all 23 pages:
  Dashboard, Upload, Study Packs, Documents, Focus Mode, Practice Essay, Exam Simulator, Audio Study, Cornell Notes, Goals, Calendar, Study Plan, Analytics, AI Tutor, Knowledge Graph, History, Weekly Report, Reminders, Profile

#### 11.2 Command Palette Update
- Added all 6 new pages to the command palette (Cmd+K) for quick navigation

#### 11.3 Auth Config Update
- Extended route protection to cover all new authenticated routes

### 12. New Database Models

Six new Mongoose models were added to support the expanded features:

| Model | Fields | Purpose |
|-------|--------|---------|
| **ExamAttempt** | userId, studyPackId, questions, answers, score, totalQuestions, violations, timeLimit, timeTaken, completedAt | Proctored exam results |
| **Reminder** | userId, title, message, type, read, actionUrl, createdAt | Smart study reminders |
| **Notebook** | userId, title, content, cues, summary, createdAt, updatedAt | Cornell note-taking |
| **Goal** | userId, title, description, targetValue, currentValue, unit, deadline, completed, createdAt | Goal setting and tracking |
| **ClozeQuestion** | studyPackId, sentence, blanks, createdAt | Fill-in-the-blank questions |
| **WeeklyReport** | userId, weekStartDate, weekEndDate, studyMinutes, quizzesTaken, averageScore, cardsReviewed, essaysWritten, goalsCompleted, aiAnalysis, recommendations, createdAt | AI weekly performance reports |

### 13. New API Routes Summary

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/exams/generate` | POST | Generate AI exam from study pack |
| `/api/exams/submit` | POST | Submit and score exam attempt |
| `/api/reminders/generate` | POST | Generate AI study reminders |
| `/api/reminders` | GET | List active reminders |
| `/api/reminders/[id]` | PATCH | Dismiss/mark reminder as read |
| `/api/notebooks` | GET/POST | List and create notebooks |
| `/api/notebooks/[id]` | PATCH/DELETE | Update and delete notebooks |
| `/api/goals` | GET/POST | List and create goals |
| `/api/goals/[id]` | PATCH/DELETE | Update and delete goals |
| `/api/goals/progress` | POST | AI goal suggestions |
| `/api/cloze/submit` | POST | Submit cloze quiz attempt |
| `/api/weekly-report/generate` | POST | Generate AI weekly report |
| `/api/weekly-report` | GET | Retrieve past weekly reports |

---

## Week 11: UI Redesign Sprint, Knowledge Graph Enhancements & Profile Overhaul (Completed Apr. 2, 2026)

With all features implemented, this phase focused on establishing a consistent, production-quality design system across every page and adding meaningful new functionality to the Knowledge Graph and Profile sections.

### 1. Design System Standardization

#### 1.1 Dark-Only Component Removal
All third-party components that only worked correctly in dark mode were identified and replaced across all 24 pages:

| Removed | Replaced With |
|---------|--------------|
| `SparklesText` | Plain `<h1>` or `TextShimmer` |
| `ShineBorder` | `border border-amber-500/20` card with amber top bar |
| `Meteors` | Amber gradient background wash |
| `GlowingStarsBackgroundCard` | Stat cards with colored `h-[2px]` top bar gradients |
| `AnimatedGenerateButton` | Amber gradient `<button>` with `Loader2` spinner |
| `BlurFade` | `motion.div` with `initial/animate` opacity + y stagger |
| `ShimmerButton` / `SlideButton` | Amber gradient `<button>` |
| `TextGenerateEffect` | Plain text with amber accent |
| `DisplayCards` | Amber accent card with feature chips |

#### 1.2 Unified Amber Design Language
Applied consistently across all pages:
- **Card shell:** `rounded-2xl border border-border/60 bg-card`
- **Accent top bar:** `h-[2px] bg-gradient-to-r from-amber-500 via-orange-400 to-transparent`
- **Primary buttons:** `bg-gradient-to-br from-amber-500 to-orange-500` with `shadow-[0_2px_10px_oklch(0.76_0.17_62_/_25%)]`
- **Icons:** Lucide React throughout — no custom SVG components
- **Theme-aware colors:** Always paired (e.g., `text-emerald-600 dark:text-emerald-400`)
- **Animations:** `motion/react` — stagger delays, `AnimatePresence` for state transitions
- **Inputs:** Native `<input>`/`<textarea>` with `focus:border-amber-500/40 focus:ring-2 focus:ring-amber-500/10`

#### 1.3 Pages Redesigned
Analytics, Calendar, Study Plan, Weekly Report, History, Notebooks, Goals, Knowledge Graph, Profile — all now use the unified design system.

### 2. Knowledge Graph Enhancements

#### 2.1 Mastery Overlay
- New `Mastery` toggle button added to the graph toolbar
- On first activation, fetches `/api/history` to retrieve quiz attempt data
- Builds a title → packId reverse map from loaded pack data to match history entries to packs
- Computes per-pack average quiz score from all historical attempts
- Re-colors all canvas nodes: green (≥80% avg), yellow (60–79%), red (<60%), gray (no attempts)
- Canvas draw loop reads `masteryModeRef` and `packMasteryRef` to determine node color at render time
- Mastery legend card appears in the sidebar panel while overlay is active

#### 2.2 Graph Insights Panel
- Computed automatically after graph data loads — no extra fetch required
- Computes node degree (connection count) for all nodes to identify the most-connected hub topic
- Counts topics with at least one cross-pack connection to report bridge count
- Counts isolated topics (topics with zero cross-pack links)
- Displayed in a new `Insights` card that replaces the Tips card when no node is selected:
  - **Most Connected:** clickable card showing the hub topic name, degree count, and pack — clicking pans and selects the node on the canvas
  - **Bridges / Isolated:** 2-column chip grid; amber warning shown if isolated count > 0

#### 2.3 Quick Study Actions
- Added a "Quick Study" section to the node detail panel (shown when a node is selected)
- "Flashcards" and "Take Quiz" buttons link to the study pack page
- "Open Study Pack" button updated with `ArrowRight` icon for visual clarity
- When Mastery overlay is active and a node is selected, a per-pack mastery progress bar is shown in the panel

### 3. Profile Page Overhaul

#### 3.1 Profile Header
- Replaced `ShineBorder` + `Meteors` + `SparklesText` with an amber-accented card
- Avatar is a `rounded-2xl` amber-orange gradient square with an emerald "online" dot indicator
- View mode shows name, email, bio, member-since chip, and active-streak badge inline
- Edit mode slides in with `AnimatePresence` — native inputs with amber focus rings, no shadcn `Input`/`Textarea`

#### 3.2 Streak Hero Strip
- New dedicated horizontal strip between the profile header and stats grid
- Shows current streak (large, with orange flame icon and ambient glow), total study time, and longest streak
- Uses orange gradient accent — replaces the dark-only `GlowingStarsBackgroundCard` that was embedded in the stats grid

#### 3.3 Stats Grid Redesign
- Reorganized from a mixed 3-column layout (with the GlowingStarsCard occupying one cell) to a clean 4-column grid
- Each card has a color-coded `h-[2px]` top bar: blue (Documents), violet (Study Packs), emerald (Quizzes), rose (Focus Sessions)
- `motion.div` stagger animation on each card

#### 3.4 Achievements Redesign
- Replaced emoji icons and `BlurFade` with Lucide icon badges
- Unlocked achievements: amber `border-amber-500/25 bg-amber-500/5` background, amber icon badge, thin amber light streak at the top edge
- Locked achievements: muted background, `Lock` icon replacing the original icon, reduced opacity
- Grid is 3-column on mobile, 5-column on desktop
- `motion.div` scale-in stagger animation

#### 3.5 Security Section
- Replaced shadcn `Input`/`Button` with native inputs and a styled submit button
- Password fields in a 2-column grid on desktop
- Slate color accent (`Shield` icon) to visually differentiate the security section from the rest of the page

#### 3.6 Page-Level Updates
- `src/app/(main)/profile/page.tsx` updated to add `TextShimmer` title and subtitle, matching all other pages in the app

---

## Remaining Work (Weeks 12-13)

### Week 11: UI Redesign Sprint (COMPLETED Apr. 2, 2026)
All pages redesigned with consistent amber design system. Dark-only components removed. Knowledge Graph Mastery Overlay, Insights panel, and Quick Study Actions added. Profile page fully overhauled.

### Weeks 11-12: Testing & Refinement (target: Apr. 6, 2026)
- End-to-end testing for critical user flows (register → upload → generate → quiz → review weak areas → focus session → tutor chat → essay → exam → matching game tab → fill-in-blank tab → goals → weekly report → analytics → knowledge graph)
- Performance optimization (database query indexing, response payload optimization)
- Final bug fixes

### Week 12: Deployment & Documentation (target: Apr. 6, 2026)
- Deploy to Vercel with production environment configuration
- Configure production MongoDB Atlas cluster with proper access controls
- Set up environment variables (MONGODB_URI, NEXTAUTH_SECRET, ANTHROPIC_API_KEY)
- Write user documentation and project setup guide

### Week 13: Final Submission (target: Apr. 6, 2026)
- Final testing in production environment
- Project presentation preparation
- Submit final deliverables and documentation

---

## Project File Structure

```
StudySphere/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── (main)/
│   │   │   ├── layout.tsx                      # Authenticated layout (Navbar + Sidebar)
│   │   │   ├── loading.tsx                     # Global loading skeleton
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── upload/page.tsx
│   │   │   ├── profile/page.tsx
│   │   │   ├── study-packs/page.tsx
│   │   │   ├── study-packs/[id]/page.tsx
│   │   │   ├── focus/page.tsx
│   │   │   ├── documents/page.tsx
│   │   │   ├── documents/[id]/page.tsx
│   │   │   ├── calendar/page.tsx
│   │   │   ├── analytics/page.tsx
│   │   │   ├── practice-essay/page.tsx
│   │   │   ├── chat/page.tsx
│   │   │   ├── study-plan/page.tsx
│   │   │   ├── knowledge-graph/page.tsx
│   │   │   ├── history/page.tsx
│   │   │   ├── exam-simulator/page.tsx         # NEW: Proctored AI exam
│   │   │   ├── audio-study/page.tsx            # NEW: Audio study mode
│   │   │   ├── notebooks/page.tsx              # NEW: Cornell notes list
│   │   │   ├── notebooks/[id]/page.tsx         # NEW: Cornell note editor
│   │   │   ├── goals/page.tsx                  # NEW: Goal tracking
│   │   │   └── weekly-report/page.tsx          # NEW: AI weekly report
│   │   ├── api/
│   │   │   ├── auth/ (3 routes)
│   │   │   ├── documents/ (3 routes)
│   │   │   ├── study-packs/ (4 routes)
│   │   │   ├── focus-sessions/ (2 routes)
│   │   │   ├── weak-areas/ (2 routes)
│   │   │   ├── tutor/ (1 route)
│   │   │   ├── flashcards/ (1 route)
│   │   │   ├── essays/ (2 routes)
│   │   │   ├── study-events/ (2 routes)
│   │   │   ├── study-plan/ (1 route)
│   │   │   ├── chat/ (4 routes)
│   │   │   ├── annotations/ (2 routes)
│   │   │   ├── analytics/ (2 routes)
│   │   │   ├── history/ (1 route)
│   │   │   ├── exams/ (2 routes)               # NEW
│   │   │   ├── reminders/ (3 routes)           # NEW
│   │   │   ├── notebooks/ (2 routes)           # NEW
│   │   │   ├── goals/ (3 routes)               # NEW
│   │   │   ├── cloze/ (1 route)               # NEW: submit only
│   │   │   └── weekly-report/ (2 routes)       # NEW
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   └── page.tsx
│   ├── components/
│   │   ├── features/
│   │   │   ├── auth/ (LoginForm, RegisterForm, UserButton)
│   │   │   ├── dashboard/ (DashboardStats, RecentDocuments)
│   │   │   ├── study-packs/ (StudyPackDetail, FlashcardViewer, GenerateButton)
│   │   │   ├── quiz/ (QuizInterface, QuizResults, WeakAreasList)
│   │   │   ├── focus/ (FocusMode)
│   │   │   ├── tutor/ (TutorChat)
│   │   │   ├── upload/ (FileUploadZone, TextPasteForm)
│   │   │   ├── profile/ (ProfileForm)
│   │   │   ├── mind-map/ (KnowledgeGraph)
│   │   │   ├── command-palette/ (CommandPalette)
│   │   │   ├── exam/ (ExamSimulator, ExamResults)          # NEW
│   │   │   ├── reminders/ (NotificationBell, ReminderPanel) # NEW
│   │   │   ├── notebooks/ (CornellEditor, NotebookList)    # NEW
│   │   │   ├── goals/ (GoalTracker)                        # NEW
│   │   │   ├── matching/ (MatchingTab)                     # NEW: tab in study pack detail
│   │   │   ├── cloze/ (ClozeTab)                           # NEW: tab in study pack detail
│   │   │   ├── audio/ (AudioStudyPlayer)                   # NEW
│   │   │   └── reports/ (WeeklyReportView)                 # NEW
│   │   ├── layout/ (Navbar, Sidebar)
│   │   ├── providers/ (SessionProvider, ThemeProvider)
│   │   └── ui/ (shadcn/ui components)
│   ├── lib/
│   │   ├── claude.ts
│   │   ├── db.ts
│   │   ├── pdf.ts
│   │   ├── study-pack-generator.ts
│   │   ├── utils.ts
│   │   └── validations/
│   │       ├── study-pack.ts, quiz.ts, focus-session.ts
│   │       ├── exam.ts, cloze.ts                           # NEW
│   │       ├── goal.ts, notebook.ts                        # NEW
│   │       ├── reminder.ts, weekly-report.ts               # NEW
│   ├── models/ (21 models total)
│   │   ├── User, Document, StudyPack, Topic, Flashcard
│   │   ├── QuizQuestion, QuizAttempt, FocusSession, WeakArea
│   │   ├── EssayAttempt, StudyEvent, ChatThread, ChatMessage
│   │   ├── Annotation, ReviewStats
│   │   ├── ExamAttempt, Reminder                            # NEW
│   │   ├── Notebook, Goal, ClozeQuestion, WeeklyReport      # NEW
│   │   └── index.ts                                         # Barrel exports
│   ├── auth.ts
│   ├── auth.config.ts
│   └── middleware.ts
├── next.config.ts
├── components.json
├── package.json
├── tsconfig.json
└── tailwind.config.ts
```

---

## Week 12: Security Hardening, PPTX Import, Cheat Sheet Exports & Lo-Fi Focus Music

### 1. Security & Correctness Fixes

#### 1.1 SSRF Protection in URL Import (`POST /api/documents/import-url`)
The URL import endpoint was vulnerable to Server-Side Request Forgery — an attacker could supply an internal URL (e.g., `http://192.168.1.1`) and the server would fetch it. I added a two-stage guard: hostname-level blocking (rejecting `localhost`, `.local`, `.internal` strings before any network call) and DNS pre-resolution using `dns.promises.lookup`. After resolving the hostname to an IP address, `isPrivateIP()` checks against RFC 1918 ranges, the loopback address, link-local range, and IPv6 private prefixes. A known limitation — DNS rebinding attacks — is documented with a comment pointing to `undici` connect hooks as a full mitigation path.

The streaming response reader was also fixed. The original `reduce`-based chunk concatenation was O(n²) — each iteration copied all previous data. The fix pre-tracks `totalBytes` as chunks arrive and allocates a single `Uint8Array` of that exact size for the final merge. An unguarded `res.body?.getReader()` optional chain that could silently produce an empty document string was replaced with an explicit null guard.

#### 1.2 Marketplace N+1 Query and Privacy Fix (`GET /api/marketplace`)
The original implementation called `Topic.countDocuments({ studyPackId: pack._id })` once per study pack in a `.map()` loop — 50 packs meant 50 sequential database round trips. I replaced this with a single MongoDB aggregate pipeline: `$match` to the relevant `studyPackId` set, `$group` by `studyPackId` with `$sum: 1`. Author names are fetched in one batched `User.find()` call. The `shareToken` field was also being included in the response payload; it is now excluded.

#### 1.3 `revalidateTag` Second-Argument Bug (All Import Routes)
`revalidateTag(TAGS.documents(userId), "")` was present in all four import routes (`import-url`, `import-notion`, `import-gdocs`, `upload`). `revalidateTag` accepts exactly one string argument — the extra `""` was a type error silently dropped at runtime in some Next.js versions but incorrect. Fixed across all routes.

### 2. PowerPoint / Slides Import

#### 2.1 PPTX Parser (`src/lib/pptx.ts`)
PPTX files are ZIP archives following the OOXML spec. I used `adm-zip` to extract entries matching `ppt/slides/slideN.xml`, sorted them numerically via a regex capture on the filename, then parsed each slide's XML with two regex passes: one to identify title placeholder elements (`<p:ph type="title|ctrTitle">`), and another to extract all `<a:t>` text run nodes. Each slide becomes a `## Slide N: Title` Markdown header followed by the body text. An `isPPTXBuffer()` guard checks the ZIP magic bytes (`0x50 0x4B 0x03 0x04`) to reject renamed non-PPTX uploads.

#### 2.2 Upload Route Integration (`POST /api/documents/upload`)
The upload API now checks for PPTX by MIME type (`application/vnd.openxmlformats-officedocument.presentationml.presentation`) and `.pptx` extension. The PPTX branch runs `isPPTXBuffer()` before `extractTextFromPPTX()` and saves the document with `fileType: "pptx"`. The `Document` model's `fileType` enum was updated to include `"pptx"`.

#### 2.3 Upload UI (`PptxUploadZone.tsx`, `UploadShell.tsx`)
`PptxUploadZone` is a new drag-and-drop zone mirroring `FileUploadZone` with the same amber design system styling. It accepts only `.pptx` files, validates client-side, and shows upload progress. It appears as a "Slides" tab between the PDF and Photo tabs in `UploadShell`.

### 3. Cheat Sheet Exports

#### 3.1 PPTX Export (`POST /api/cheat-sheets/[id]/export`)
A new server-side route uses `pptxgenjs` to generate a PowerPoint file from any cheat sheet. The Markdown content is parsed into sections — each `##` heading becomes a new slide title, list items become bullet points. The presentation uses a dark background (`#1a1a2e`), amber section titles (`#f59e0b`), and white body text. Slides with more than 12 bullets get an automatic `(cont.)` overflow slide. The binary PPTX data is streamed back with `application/vnd.openxmlformats-officedocument.presentationml.presentation` headers.

#### 3.2 PDF Print (`/cheat-sheets/[id]/print`)
A new server-rendered page fetches the cheat sheet, verifies ownership, and renders the Markdown using `ReactMarkdown` with `remark-gfm`. All styles are inlined in a `<style>` block using Georgia serif typography, proper heading hierarchy, code block styling, and `@media print` rules for page-break control. A `<script>` tag fires `window.print()` via a `DOMContentLoaded` + 300ms delay — this ensures fonts and styles have fully applied before the dialog opens (the earlier `"load"` event approach had a race condition). The cheat sheets page adds "Export PPTX" and "Print PDF" buttons that trigger these endpoints.

### 4. Lo-Fi Beats Music Player in Focus Mode

A `LoFiPlayer` component was added to `FocusMode.tsx` that embeds the Lofi Girl 24/7 YouTube stream (`jfKfPfyJRdk`). The iframe is kept visible in the DOM as required by YouTube's Terms of Service — hidden autoplay is not permitted. The component shows a compact violet-accented card with a Play/Stop toggle button and three animated equalizer bars using CSS keyframe animations with staggered delays. `AnimatePresence` wraps the iframe section for smooth height expand/collapse transitions. A `musicOn` boolean in `FocusMode` state persists across the setup → active phase transition so users can enable music before starting their Pomodoro and have it continue uninterrupted.

---

## Summary

All Week 1-10 deliverables are **fully implemented and functional**. The application has:

- **Complete authentication system** (Weeks 1-5) with registration, login, JWT sessions, profile management, and route protection for all 23 authenticated pages.
- **Document management** (Week 5) with PDF upload (drag-drop, text extraction), text paste, listing, cascade deletion, and a full document viewer with annotations.
- **AI-powered study pack generation** (Week 6) using the Anthropic Claude API (`claude-sonnet-4-20250514`) to produce structured summaries, topics, flashcards, quiz questions, cloze questions, and mind maps from uploaded documents. Includes a study packs listing page and an 8-tab detail viewer (Summary, Mind Map, Topics, Flashcards, Quiz, Fill-in-Blank, Matching, AI Tutor).
- **Interactive quiz system** (Week 7) with multiple-choice questions, score tracking, detailed answer review with explanations, and automatic weak area analysis after each attempt.
- **Weak area detection** (Week 7) that analyzes quiz performance per topic, classifies severity (high/medium/low), and displays results on the dashboard with links to relevant study packs.
- **Pomodoro focus mode** (Weeks 8-9) with work/short break/long break phases, SVG arc timer, auto-transitions, goal tracking, and session recaps.
- **Enhanced AI tutor** (Weeks 8-9) with persistent chat threads, ELI5 mode, voice input (SpeechRecognition), voice output (SpeechSynthesis), and markdown rendering.
- **SM-2 spaced repetition** (Week 9) for flashcards with ease factor, interval, repetition tracking, and a 4-rating review system (Again/Hard/Good/Easy).
- **Practice essays with AI grading** (Week 9) evaluating accuracy, depth, clarity, and critical thinking on a 1-10 scale with detailed feedback.
- **Calendar with study events** (Week 9) featuring monthly view, CRUD operations, color-coded events, and completion tracking.
- **AI study plan generator** (Week 9) that creates personalized study schedules from selected packs, intensity, and deadline, auto-populating the calendar.
- **Analytics dashboard** (Week 9) with Recharts charts (study minutes, cards reviewed, quiz scores), streak tracking, and milestone progress.
- **Mind maps and knowledge graph** (Weeks 9-10) with tree/flowchart SVG views per study pack and enhanced cross-pack topic visualization with orbital rings, breathing auras, and organic physics.
- **Dark/light theme, command palette (Cmd+K), and responsive sidebar** (Week 9) for a polished, professional UI.
- **History page** (Week 9) with chronological activity log and expandable details for quizzes, essays, and focus sessions.
- **AI Exam Simulator** (Week 10) with proctored mode (fullscreen enforcement, tab-switch warnings, auto-submit after 3 violations), timed exams, and detailed results.
- **Smart Reminders** (Week 10) with AI-generated study alerts, notification bell in the Navbar, and browser push notifications.
- **Cornell Notes** (Week 10) with TipTap rich text editor, cue/summary sections, and auto-save functionality.
- **Goal Setting & Tracking** (Week 10) with progress bars, deadlines, completion tracking, and AI-powered goal suggestions.
- **Matching Game** (Week 10) integrated as a tab in the study pack detail page, with drag-and-drop flashcard matching using @dnd-kit, timer, and scoring.
- **Fill-in-the-Blank Quiz** (Week 10) auto-generated with study packs and integrated as a tab in the study pack detail page, with instant feedback and scoring.
- **Audio Study Mode** (Week 10) with SpeechSynthesis playback controls, speed adjustment, voice selection, and section navigation.
- **AI Weekly Report** (Week 10) with comprehensive performance analysis, trend identification, and personalized recommendations.
- **Global loading skeleton** (Week 10) for instant page transition feedback across all routes.

- **Unified amber design system** (Week 11) applied across all 24 pages, eliminating all dark-only third-party components in favor of theme-aware, amber-accented cards, Lucide icons, and `motion/react` animations.
- **Knowledge Graph enhancements** (Week 11) — Mastery Overlay (node color-coded by quiz performance), Graph Insights panel (hub topics, cross-pack bridges, isolated topic warnings), and Quick Study Actions (Flashcards + Take Quiz buttons in the node detail panel).
- **Profile overhaul** (Week 11) — streak hero strip, 4-column stats grid, redesigned achievement badges with Lucide icons, amber glow for unlocked achievements, and a native-input security form.
- **Security hardening** (Week 12) — SSRF protection in URL import (DNS pre-resolution + private IP blocklist), fixed streaming response reader (pre-allocated `Uint8Array`), fixed N+1 marketplace query (MongoDB aggregate), removed `shareToken` privacy leak, fixed `revalidateTag` calls across all import routes.
- **PowerPoint / Slides Import** (Week 12) — `.pptx` upload support using `adm-zip` ZIP extraction and XML regex parsing; slide titles become section headers; magic byte validation; new "Slides" tab in `UploadShell`; `Document` model updated with `"pptx"` fileType.
- **Cheat Sheet PPTX Export** (Week 12) — server-side `pptxgenjs` export with dark background, amber titles, and overflow slides; streamed as binary download.
- **Cheat Sheet PDF Print** (Week 12) — print-optimized server-rendered page with Georgia typography, inline CSS, and auto-triggered `window.print()` via `DOMContentLoaded` + 300ms delay.
- **Lo-Fi Beats music player in Focus Mode** (Week 12) — embedded YouTube iframe (Lofi Girl 24/7 stream), animated equalizer bars, `AnimatePresence` expand/collapse, music state persists across Pomodoro phase transitions.

The application now comprises **21 Mongoose models**, **25 pages**, and **48 API routes**. All routes return correct HTTP status codes. The backend follows RESTful conventions with authentication, authorization, input validation (Zod v4), and descriptive error handling throughout. The frontend is fully theme-aware (dark/light), consistently designed, and production-ready.
