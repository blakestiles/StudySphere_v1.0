# StudySphere - Progress Report

**Student:** Sainath Gandhe
**Course:** CPSC 589 - California State University, Fullerton
**Project:** StudySphere - AI-Powered Study Companion
**Date:** February 9, 2026

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
| AI (planned) | Anthropic Claude API SDK | 0.74.0 |
| Notifications | Sonner (toast library) | 2.0.7 |
| Icons | Lucide React | 0.563.0 |
| Validation (planned) | Zod | 4.3.6 |

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

## Remaining Work (Weeks 6-13)

### Week 6: AI Study Pack Generation
- Integrate the Anthropic Claude API (`@anthropic-ai/sdk` already installed, v0.74.0) into the `/api/study-packs/generate` endpoint (currently returns 501)
- Send the document's `rawText` to Claude with structured prompts to generate:
  - **Short summary** (1-2 paragraphs) and **detailed summary** (comprehensive overview)
  - **Topic breakdown** with hierarchical parent-child relationships
  - **Flashcards** (question/answer pairs) with difficulty ratings per topic
  - **Quiz questions** (multiple-choice with 4 options) with correct answers and explanations
- Store all generated content across the StudyPack, Topic, Flashcard, and QuizQuestion models
- Build the study pack viewer page (`/study-packs/[id]`) to display summaries, topic tree, flashcards, and quiz questions in an organized layout

### Weeks 7-8: Quizzes, Weak Areas, Focus Mode & AI Tutor
- **Quiz System** - Interactive quiz-taking interface, score calculation, response tracking via QuizAttempt model, review mode for incorrect answers with explanations
- **Weak Area Detection** - Analyze quiz attempt data to identify topics where the user scores poorly, store results in the WeakArea model with severity levels (low/medium/high)
- **Focus Mode** - Timed study sessions using the FocusSession model where users set goals, study specific topics, and record session recaps
- **AI Tutor** - Conversational chat interface using Claude API where users can ask questions about their uploaded documents and receive context-aware answers

### Weeks 9-10: Testing & Refinement
- Unit and integration testing for all API routes (registration, login, document CRUD, study pack generation)
- End-to-end testing for critical user flows (register -> upload -> generate -> quiz -> review)
- Performance optimization (database query indexing, response payload optimization)
- UI/UX refinements based on testing feedback and usability review

### Weeks 11-12: Deployment & Documentation
- Deploy to Vercel with production environment configuration
- Configure production MongoDB Atlas cluster with proper access controls
- Set up environment variables (MONGODB_URI, NEXTAUTH_SECRET, ANTHROPIC_API_KEY)
- Write user documentation, API documentation, and project setup guide

### Week 13: Final Submission
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
│   │   │   ├── login/page.tsx              # Login page
│   │   │   └── register/page.tsx           # Registration page
│   │   ├── (main)/
│   │   │   ├── layout.tsx                  # Authenticated layout (Navbar + Sidebar)
│   │   │   ├── dashboard/page.tsx          # Dashboard with stats and recent docs
│   │   │   ├── upload/page.tsx             # Document upload (PDF + text paste)
│   │   │   ├── profile/page.tsx            # Profile editing
│   │   │   └── study-packs/[id]/page.tsx   # Study pack viewer
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── [...nextauth]/route.ts  # NextAuth handlers
│   │   │   │   ├── register/route.ts       # POST registration
│   │   │   │   └── profile/route.ts        # GET/PATCH profile
│   │   │   ├── documents/
│   │   │   │   ├── route.ts                # GET document list
│   │   │   │   ├── upload/route.ts         # POST upload (PDF + text)
│   │   │   │   └── [id]/route.ts           # DELETE with cascade
│   │   │   └── study-packs/
│   │   │       ├── route.ts                # GET study pack list
│   │   │       └── generate/route.ts       # POST generate (stub)
│   │   ├── layout.tsx                      # Root layout (SessionProvider + Toaster)
│   │   ├── globals.css                     # Global styles
│   │   └── page.tsx                        # Public landing page
│   ├── components/
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   │   ├── LoginForm.tsx           # Login form (client)
│   │   │   │   ├── RegisterForm.tsx        # Registration form (client)
│   │   │   │   └── UserButton.tsx          # User menu button
│   │   │   ├── dashboard/
│   │   │   │   ├── DashboardStats.tsx      # Statistics cards
│   │   │   │   ├── RecentDocuments.tsx     # Document list with delete (client)
│   │   │   │   └── StudyPackCard.tsx       # Study pack card
│   │   │   ├── upload/
│   │   │   │   ├── FileUploadZone.tsx      # Drag-drop PDF upload (client)
│   │   │   │   └── TextPasteForm.tsx       # Text paste form (client)
│   │   │   └── profile/
│   │   │       └── ProfileForm.tsx         # Profile edit form (client)
│   │   ├── layout/
│   │   │   ├── Navbar.tsx                  # Top navigation bar
│   │   │   └── Sidebar.tsx                 # Side navigation (client)
│   │   ├── providers/
│   │   │   └── SessionProvider.tsx         # NextAuth SessionProvider wrapper
│   │   └── ui/                             # shadcn/ui components
│   │       ├── alert-dialog.tsx
│   │       ├── badge.tsx
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── progress.tsx
│   │       ├── sonner.tsx
│   │       ├── tabs.tsx
│   │       └── textarea.tsx
│   ├── lib/
│   │   ├── db.ts                           # MongoDB connection (cached singleton)
│   │   ├── pdf.ts                          # PDF text extraction
│   │   └── utils.ts                        # Utility functions (cn)
│   ├── models/
│   │   ├── index.ts                        # Central model exports
│   │   ├── User.ts
│   │   ├── Document.ts
│   │   ├── StudyPack.ts
│   │   ├── Topic.ts
│   │   ├── Flashcard.ts
│   │   ├── QuizQuestion.ts
│   │   ├── QuizAttempt.ts
│   │   ├── FocusSession.ts
│   │   └── WeakArea.ts
│   ├── types/                              # TypeScript type definitions
│   ├── auth.ts                             # NextAuth config (Node.js runtime)
│   ├── auth.config.ts                      # NextAuth config (edge-safe)
│   └── middleware.ts                       # Route protection middleware
├── next.config.ts                          # Next.js configuration
├── components.json                         # shadcn/ui configuration
├── package.json
├── tsconfig.json
└── tailwind.config.ts
```

---

## Summary

All Week 1-5 deliverables are **fully implemented and functional**. The application has a complete authentication system with registration, login, JWT sessions, and profile management. The document upload pipeline supports both PDF files (with server-side text extraction) and pasted text. The dashboard provides an overview of user activity with statistics and a recent documents list including delete functionality with cascade deletion of related data. All 10 database models are defined and ready for the AI-powered features starting in Week 6. The backend API follows RESTful conventions with proper authentication, authorization, input validation, and error handling throughout.
