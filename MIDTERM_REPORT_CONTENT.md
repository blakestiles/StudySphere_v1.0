# StudySphere: An AI-Powered Adaptive Study Companion

**By**
Sainath Gandhe

A PROJECT REPORT SUBMITTED IN PARTIAL FULFILLMENT OF THE REQUIREMENTS FOR THE COURSE
CPSC-597: Project (Seminar) Master of Science in Computer Science

CALIFORNIA STATE UNIVERSITY, FULLERTON

May, 2026

**SUPERVISOR**
Dr. Paul Inventado Salvador

---

## ABSTRACT

Modern students face an overwhelming volume of study material across multiple courses, yet lack personalized tools that adapt to their unique learning styles, knowledge gaps, and schedules. StudySphere is an AI-powered adaptive study companion that transforms passive study documents into interactive, personalized learning experiences. Built as a full-stack web application using Next.js, TypeScript, and the Anthropic Claude API, StudySphere automatically processes uploaded documents (PDFs and text files) to generate comprehensive study packs consisting of summaries, topic breakdowns, flashcards, quiz questions, mind maps, and practice essay prompts.

The system employs several evidence-based learning techniques including SM-2 spaced repetition for flashcard review scheduling, Pomodoro-based focus sessions for time management, and AI-graded practice essays for written comprehension assessment. A conversational AI tutor provides on-demand explanations with features such as ELI5 (Explain Like I'm Five) mode, voice input, and voice output. StudySphere further enhances the learning workflow through an AI-generated study plan system that creates personalized schedules based on study intensity and deadlines, a comprehensive analytics dashboard for tracking study streaks and performance trends, and a knowledge graph that visualizes topic relationships across multiple study packs.

By integrating large language model capabilities with established cognitive science principles such as active recall, spaced repetition, and interleaved practice, StudySphere offers students a unified platform that not only organizes their study material but actively optimizes their learning process. The application demonstrates how modern AI can be practically applied to education technology to create adaptive, engaging, and effective study tools.

**Key Words:** AI-Powered Education; Spaced Repetition; Large Language Models; Adaptive Learning; Study Companion; Next.js; Claude API; Active Recall.

---

## Chapter 1: Introduction

### The Challenge of Modern Student Learning

The landscape of higher education demands that students efficiently absorb, retain, and apply large volumes of information across multiple disciplines. Traditional study methods — re-reading textbooks, passive highlighting, and unstructured note-taking — have been shown by cognitive science research to be among the least effective learning strategies. Despite decades of research demonstrating the superiority of techniques like active recall, spaced repetition, and elaborative interrogation, most students continue to rely on these suboptimal methods due to the significant effort required to implement evidence-based strategies manually.

A student preparing for a midterm examination, for example, must read through lecture notes, identify key topics, create flashcards for active recall practice, generate practice questions for self-testing, schedule review sessions at optimal intervals, and track their progress to identify weak areas. Each of these steps requires substantial manual effort, and most students lack the discipline or time to execute them consistently. The result is a gap between what learning science recommends and what students actually practice.

### The Promise of AI in Education

The emergence of Large Language Models (LLMs) such as Anthropic's Claude, OpenAI's GPT series, and Google's Gemini has opened new possibilities for bridging this gap. These models demonstrate remarkable capabilities in text comprehension, summarization, question generation, and conversational explanation — precisely the skills needed to automate the creation of effective study materials. When combined with web technologies that provide interactive, accessible user interfaces, LLMs can serve as the backbone of intelligent tutoring systems that were previously only theoretical.

However, most existing AI-powered educational tools address only a narrow slice of the study workflow. Some generate flashcards but lack spaced repetition scheduling. Others offer AI chat functionality but do not connect it to the student's actual study materials. Few, if any, provide a unified platform that covers the entire study lifecycle from document ingestion to adaptive review scheduling. StudySphere addresses this fragmentation by integrating multiple AI-powered features into a cohesive, full-stack application.

### Project Scope and Contributions

StudySphere is designed as a comprehensive AI-powered study companion that automates and enhances the entire study workflow. The primary contributions of this project are:

1. **Automated Study Material Generation:** An end-to-end pipeline that processes uploaded documents through the Claude API to generate summaries, topic breakdowns, flashcards, quiz questions, mind maps, and essay prompts — all from a single document upload.

2. **Evidence-Based Learning Integration:** Implementation of the SM-2 spaced repetition algorithm for flashcard scheduling, Pomodoro technique for focus session management, and structured quiz assessments with weak area identification.

3. **Adaptive AI Tutoring:** A conversational AI tutor that maintains persistent chat threads, provides context-aware explanations tied to the student's study materials, and supports multiple interaction modes including text, voice input, voice output, and simplified explanations.

4. **Intelligent Study Planning:** An AI-powered study plan generator that creates personalized study schedules based on the student's available study packs, preferred study intensity, and target deadlines, with automatic integration into a calendar system.

5. **Comprehensive Analytics and Visualization:** A dashboard that tracks study minutes, cards reviewed, quiz scores, study streaks, and milestone achievements, along with a knowledge graph that visualizes topic relationships across study packs.

---

## Chapter 2: Motivation and Objectives

### Motivation

The motivation for StudySphere arises from three converging observations:

**The Forgetting Curve Problem.** Hermann Ebbinghaus's research on the forgetting curve, first published in 1885 and validated by numerous subsequent studies, demonstrates that humans forget approximately 70% of newly learned information within 24 hours without active reinforcement. Spaced repetition — reviewing material at increasing intervals — is one of the most effective techniques to combat this natural memory decay. Yet implementing spaced repetition manually requires meticulous scheduling and tracking that most students find impractical. StudySphere automates this process entirely through its SM-2 algorithm implementation, calculating optimal review intervals for each flashcard based on the student's self-assessed recall quality.

**The Active Recall Gap.** Research by Karpicke and Blunt (2011) demonstrated that retrieval practice (active recall) produces significantly better long-term retention than elaborative study methods. Generating practice questions, flashcards, and quiz items from study material is the cornerstone of active recall. However, creating high-quality practice materials manually is time-consuming and cognitively demanding — students often produce shallow or repetitive questions. LLMs excel at generating diverse, high-quality questions and flashcards that cover material comprehensively, making them an ideal tool for automating active recall material creation.

**The Fragmented Tool Landscape.** Current study tools exist in isolation. Students might use Anki for flashcards, Quizlet for practice quizzes, a Pomodoro timer app for focus sessions, Google Calendar for scheduling, and ChatGPT for explanations. Switching between these disconnected tools introduces friction, breaks study flow, and prevents holistic tracking of learning progress. StudySphere consolidates all these capabilities into a single integrated platform where document upload, study material generation, practice, scheduling, and analytics are seamlessly connected.

### Objectives

The objectives of this project are:

1. **Design and implement a full-stack web application** using Next.js (App Router), TypeScript, Tailwind CSS, and MongoDB that serves as a unified study companion platform.

2. **Develop an AI-powered document processing pipeline** that leverages the Anthropic Claude API to automatically generate comprehensive study packs (summaries, topics, flashcards, quiz questions, mind maps) from uploaded PDF and text documents.

3. **Implement the SM-2 spaced repetition algorithm** for flashcard review scheduling, enabling adaptive review intervals based on individual card recall performance.

4. **Build an interactive quiz system** with automatic grading, detailed results analysis, and weak area identification to support active recall practice.

5. **Create a conversational AI tutor** with persistent chat history, context-aware responses tied to study materials, and multimodal interaction (text, voice input, voice output, ELI5 mode).

6. **Develop an AI-powered study plan generator** that creates personalized study schedules and integrates them with a calendar system for organized study session management.

7. **Implement a comprehensive analytics dashboard** that visualizes study activity, performance trends, streaks, and milestone achievements to promote consistent study habits.

8. **Build a Pomodoro-based focus mode** with configurable work/break durations and session tracking for structured study time management.

9. **Create practice essay functionality with AI grading** that evaluates student writing on accuracy, depth, clarity, and critical thinking criteria.

10. **Develop visualization features** including mind maps for individual study packs and a knowledge graph for cross-pack topic relationship exploration.

---

## Chapter 3: Literature Review

### AI in Education Technology

The application of artificial intelligence to education, broadly termed AI in Education (AIEd), has evolved significantly over the past decade. Early intelligent tutoring systems (ITS) such as Carnegie Learning's MATHia and AutoTutor relied on rule-based expert systems and predefined knowledge graphs to provide adaptive instruction. While effective in narrow domains, these systems required extensive manual knowledge engineering and could not generalize across subjects.

The advent of deep learning-based language models transformed the landscape. Brown et al. (2020) demonstrated with GPT-3 that large language models could perform diverse language tasks with minimal task-specific training, opening the door to more flexible educational AI. Subsequent models, including Anthropic's Claude (2023) and OpenAI's GPT-4 (2023), showed further improvements in reasoning, instruction-following, and factual accuracy — capabilities directly applicable to educational content generation and tutoring.

Kasneci et al. (2023) conducted a comprehensive review of ChatGPT's potential in education, identifying strengths in personalized tutoring, content generation, and assessment, while noting challenges in accuracy, academic integrity, and pedagogical alignment. Their work highlighted the need for purpose-built educational applications that harness LLM capabilities within structured pedagogical frameworks — precisely the approach StudySphere takes.

### Spaced Repetition and the SM-2 Algorithm

Spaced repetition systems (SRS) are grounded in the spacing effect, a robust memory phenomenon documented across hundreds of studies. The SM-2 algorithm, developed by Piotr Wozniak in 1987 for the SuperMemo software, remains one of the most widely used scheduling algorithms in SRS applications. The algorithm adjusts review intervals based on a per-item "easiness factor" that adapts to the learner's performance.

The SM-2 algorithm operates as follows: after each review, the learner rates their recall quality on a scale (typically 0-5). Items rated below a threshold are reset to the initial learning stage. Items rated above the threshold have their interval multiplied by the easiness factor, which itself is adjusted based on the quality rating. This produces an exponentially increasing review schedule for well-known items while ensuring difficult items are reviewed more frequently.

Settles and Meeder (2016) at Duolingo demonstrated that spaced repetition models could be further enhanced by incorporating additional features such as time-of-day effects and lexeme difficulty. However, for general-purpose study applications, the SM-2 algorithm provides an effective balance of simplicity and adaptability. StudySphere implements a 4-rating variant (Again, Hard, Good, Easy) that maps to the SM-2 quality scale, tracking ease factor, interval, repetition count, and next review date for each flashcard.

### Active Recall and Retrieval Practice

The testing effect — the finding that retrieving information from memory strengthens long-term retention more effectively than re-studying — is one of the most replicated findings in cognitive psychology. Roediger and Butler (2011) provided a comprehensive review establishing that retrieval practice enhances learning across diverse materials, age groups, and retention intervals.

Importantly, the benefits of retrieval practice extend beyond simple recall. McDaniel et al. (2007) demonstrated that practicing retrieval with short-answer questions improved performance on both practiced and related but unpracticed questions, suggesting that retrieval practice promotes deeper conceptual understanding. This finding supports StudySphere's approach of generating diverse question types (multiple choice, short answer) and essay prompts from study materials.

### LLMs for Educational Content Generation

Several recent studies have examined the use of LLMs specifically for generating educational content. Elkins et al. (2023) evaluated GPT-4's ability to generate multiple-choice questions and found that LLM-generated questions were comparable in quality to expert-authored questions, with the advantage of being generated in seconds rather than hours. Dijkstra et al. (2022) demonstrated that AI-generated flashcards could be effective for vocabulary learning when combined with spaced repetition scheduling.

Moore et al. (2023) explored the use of LLMs as conversational tutors and found that while LLMs could provide helpful explanations, their effectiveness improved significantly when grounded in specific source material — supporting StudySphere's approach of tying AI tutor responses to the student's uploaded documents rather than relying solely on the model's parametric knowledge.

### Existing Study Platforms

Several existing platforms address parts of the study workflow that StudySphere aims to unify:

**Anki** is the most widely used open-source spaced repetition application. It implements the SM-2 algorithm (with modifications) and supports rich card formats. However, Anki requires manual card creation, has no AI-powered content generation, and provides no integrated quiz, essay, or tutoring functionality.

**Quizlet** offers flashcard creation and practice with a modern interface and recently added AI-powered card generation. However, it lacks spaced repetition scheduling, focus session management, study planning, and comprehensive analytics.

**Notion AI** provides AI-powered note-taking and organization but does not offer structured study features like flashcards, quizzes, spaced repetition, or performance analytics.

**ChatGPT and Claude** (as standalone chat interfaces) can generate study materials on demand but lack persistence, structured scheduling, progress tracking, and integration with the broader study workflow.

StudySphere differentiates itself by combining AI-powered content generation with structured learning methodologies (spaced repetition, active recall, Pomodoro technique) in a single integrated platform, addressing the fragmentation that characterizes the current educational tool landscape.

---

## Chapter 4: Methodology

### System Architecture Overview

StudySphere is built as a modern full-stack web application using the following technology stack:

- **Frontend Framework:** Next.js 16 with App Router, providing server-side rendering, API routes, and file-based routing
- **Language:** TypeScript for type-safe development across both client and server code
- **Styling:** Tailwind CSS v4 with the shadcn/ui component library for consistent, accessible UI components
- **Authentication:** NextAuth.js v5 (Auth.js) with a credentials provider, bcrypt password hashing, and JWT-based sessions
- **Database:** MongoDB with Mongoose ODM, providing flexible document storage for 15 data models
- **AI Integration:** Anthropic Claude API (claude-sonnet-4-20250514) for all AI-powered features
- **Deployment Target:** Vercel (Next.js native hosting platform)

The application follows a monolithic architecture where the Next.js server handles both page rendering and API endpoints. This approach simplifies deployment and eliminates the need for a separate backend server while still maintaining clean separation between client components, server components, and API route handlers.

### Authentication and User Management

Authentication is implemented using NextAuth.js v5 with a split configuration pattern to handle environment constraints:

- **auth.config.ts:** Contains edge-compatible configuration (providers, callbacks, page routes) that can run in Next.js middleware and Edge Runtime environments.
- **auth.ts:** Extends the edge-safe config with Node.js-specific adapters (MongoDB/Mongoose connection, bcrypt password verification) that require the Node.js runtime.

User registration includes server-side validation using Zod v4 schemas, password hashing with bcrypt (12 salt rounds), and duplicate email detection. Sessions are managed via JSON Web Tokens (JWT) with user ID and email embedded in the token payload.

### Document Processing Pipeline

The document upload and processing pipeline operates as follows:

1. **Upload:** Users upload PDF or plain text files through a drag-and-drop interface. PDF files are parsed on the server using the pdf-parse library to extract raw text content.

2. **Storage:** The extracted text content, along with file metadata (name, type, size), is stored in the Document model in MongoDB. The original file binary is not retained; only the extracted text is persisted.

3. **Study Pack Generation:** When a user initiates study pack generation from an uploaded document, the system sends the document text to the Claude API with a structured prompt requesting:
   - A concise summary of the document
   - A list of key topics with descriptions
   - Flashcard pairs (front/back) for active recall practice
   - Multiple-choice and short-answer quiz questions with correct answers and explanations
   - A hierarchical mind map structure in JSON format

4. **Structured Storage:** The Claude API response is parsed, and the generated content is distributed across the appropriate Mongoose models (StudyPack, Topic, Flashcard, QuizQuestion), all linked by reference IDs for efficient querying.

### SM-2 Spaced Repetition Implementation

Each flashcard in the system tracks the following SM-2 parameters:

- **easeFactor:** A multiplier (initialized at 2.5) that adjusts based on recall quality
- **interval:** The number of days until the next scheduled review
- **repetitions:** The count of consecutive successful recalls
- **nextReview:** The calculated date for the next review session

When a user reviews a flashcard, they provide a quality rating mapped to the SM-2 scale:

| Rating | Label | SM-2 Quality | Effect |
|--------|-------|-------------|--------|
| 1 | Again | 1 | Reset to initial learning stage |
| 2 | Hard | 3 | Reduce ease factor, shorter interval |
| 3 | Good | 4 | Maintain ease factor, standard interval |
| 4 | Easy | 5 | Increase ease factor, longer interval |

The algorithm then recalculates the interval: for the first successful review, interval = 1 day; for the second, interval = 6 days; for subsequent reviews, interval = previous interval x easeFactor. The ease factor is adjusted by the formula: EF' = EF + (0.1 - (5 - q) x (0.08 + (5 - q) x 0.02)), where q is the quality rating, with a minimum floor of 1.3.

### Quiz System and Weak Area Analysis

The quiz system presents questions generated during study pack creation in a randomized order. After completion, the system calculates:

- **Overall score** as a percentage of correct answers
- **Per-topic performance** by grouping questions by their associated topic
- **Weak areas** identified as topics where the score falls below a configurable threshold (default: 70%)

Weak areas are stored in a dedicated WeakArea model and surfaced on the dashboard, encouraging students to focus their review on areas of deficiency.

### AI Tutor Architecture

The AI tutor maintains persistent conversation threads stored in ChatThread and ChatMessage models. Each message exchange follows this flow:

1. The user sends a message (via text input or voice transcription using the Web Speech API's SpeechRecognition interface).
2. The system constructs a prompt that includes the relevant study pack context, conversation history, and the user's message.
3. If ELI5 mode is enabled, the system prompt is modified to instruct Claude to provide explanations suitable for a young child.
4. The Claude API response is streamed back and rendered with Markdown formatting (via react-markdown with remark-gfm).
5. Optionally, the response is read aloud using the Web Speech API's SpeechSynthesis interface.

### Study Plan Generation

The study plan generator collects three inputs from the user:

1. **Selected study packs** to include in the plan
2. **Study intensity** (light: 1-2 hours/day, moderate: 2-4 hours/day, intensive: 4+ hours/day)
3. **Target deadline** for completing the study plan

These inputs are sent to the Claude API with instructions to generate a structured study schedule. The AI distributes study sessions across available days, balancing topics to implement interleaved practice (mixing different subjects within a study period), which research has shown to improve long-term retention compared to blocked practice. The generated schedule is parsed and automatically created as StudyEvent entries linked to the user's calendar.

### Pomodoro Focus Mode

The focus mode implements the Pomodoro technique with three configurable phases:

- **Work phase:** Default 25 minutes of focused study
- **Short break:** Default 5 minutes after each work session
- **Long break:** Default 15 minutes after every 4 work sessions

The timer uses an SVG arc animation for visual feedback. Completed focus sessions are logged in the FocusSession model with duration and timestamp, contributing to the analytics dashboard's study minutes tracking.

### Practice Essay and AI Grading

The practice essay feature allows students to write essays on topics from their study packs. Submitted essays are sent to the Claude API with a grading rubric that evaluates four criteria on a scale of 1-10:

1. **Accuracy:** Factual correctness relative to the source material
2. **Depth:** Thoroughness of coverage and detail
3. **Clarity:** Quality of writing, organization, and coherence
4. **Critical Thinking:** Evidence of analysis, synthesis, and original insight

The AI returns scores for each criterion along with detailed written feedback. Results are stored in the EssayAttempt model for historical tracking.

### Analytics and Visualization

The analytics dashboard aggregates data from multiple models to present:

- **Study minutes over time:** Line chart from FocusSession data (using Recharts)
- **Cards reviewed:** Bar chart from ReviewStats data
- **Quiz score trends:** Line chart from QuizAttempt data
- **Study streak:** Consecutive days with logged activity
- **Milestone progress:** Achievement tracking (e.g., "Review 100 cards," "Complete 10 quizzes")

The knowledge graph visualization reads topic data across all of a user's study packs and renders an SVG-based node-link diagram showing topic relationships and shared concepts.

### Database Schema

The application uses 15 Mongoose models organized as follows:

| Model | Purpose | Key Fields |
|-------|---------|------------|
| User | Account data | name, email, passwordHash |
| Document | Uploaded files | userId, title, content, fileType |
| StudyPack | Generated study sets | userId, documentId, summary, mindMapData |
| Topic | Subject breakdowns | studyPackId, name, description |
| Flashcard | Active recall cards | studyPackId, front, back, easeFactor, interval, nextReview |
| QuizQuestion | Assessment items | studyPackId, topicId, question, options, correctAnswer |
| QuizAttempt | Test results | userId, studyPackId, score, answers |
| FocusSession | Pomodoro logs | userId, duration, completedAt |
| WeakArea | Identified gaps | userId, topicId, score |
| EssayAttempt | Written practice | userId, studyPackId, essay, scores, feedback |
| StudyEvent | Calendar entries | userId, title, date, color, completed |
| ChatThread | Tutor conversations | userId, studyPackId, title |
| ChatMessage | Chat messages | threadId, role, content |
| Annotation | Document highlights | userId, documentId, type, text, position |
| ReviewStats | Daily review data | userId, date, cardsReviewed, minutesStudied |

---

## References

1. Brown, T. B., et al. (2020). "Language Models are Few-Shot Learners." *Advances in Neural Information Processing Systems*, 33, 1877-1901.

2. Dijkstra, R.,";";";"; (2022). "Reading Comprehension Quiz Generation using Generative Pre-trained Transformers." *Proceedings of the ACM Conference on Learning at Scale*.

3. Ebbinghaus, H. (1885). *Memory: A Contribution to Experimental Psychology*. Teachers College, Columbia University (English translation, 1913).

4. Elkins, S., et al. (2023). "How Useful Are Educational Questions Generated by Large Language Models?" *Proceedings of the International Conference on Artificial Intelligence in Education*.

5. Karpicke, J. D., & Blunt, J. R. (2011). "Retrieval Practice Produces More Learning than Elaborative Studying with Concept Mapping." *Science*, 331(6018), 772-775.

6. Kasneci, E., et al. (2023). "ChatGPT for Good? On Opportunities and Challenges of Large Language Models for Education." *Learning and Individual Differences*, 103, 102274.

7. McDaniel, M. A., Anderson, J. L., Derbish, M. H., & Morrisette, N. (2007). "Testing the Testing Effect in the Classroom." *European Journal of Cognitive Psychology*, 19(4-5), 494-513.

8. Moore, S., et al. (2023). "Empowering Education with LLMs — The Next-Gen Interface and Content Generation." *Proceedings of the AAAI Conference on Artificial Intelligence*.

9. Roediger, H. L., & Butler, A. C. (2011). "The Critical Role of Retrieval Practice in Long-Term Retention." *Trends in Cognitive Sciences*, 15(1), 20-27.

10. Settles, B., & Meeder, B. (2016). "A Trainable Spaced Repetition Model for Language Learning." *Proceedings of the 54th Annual Meeting of the Association for Computational Linguistics*, 1848-1858.

11. Wozniak, P. A. (1990). "Optimization of Learning: Application of the SuperMemo Method." *Master's thesis, University of Technology in Poznan*.

---

*Note: This midterm report covers approximately 60% of the final report. The remaining sections to be added for the final submission include: Chapter 5 (Implementation Details with code samples and screenshots), Chapter 6 (Testing and Results), Chapter 7 (Discussion and Future Work), and Chapter 8 (Conclusion).*
