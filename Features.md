# StudySphere — Feature List

## Core Study Pack Features

1. **Smart Summaries** — AI reads your uploaded material and generates a concise, hierarchical summary with topic outlines you can review at a glance.
2. **Topic Breakdown** — Automatically extracts and organizes the key topics from your document into a structured list with descriptions.
3. **Spaced Repetition Flashcards** — AI generates flashcards from your material and schedules them using the SM-2 algorithm, adapting intervals based on how you rate each card (Again / Hard / Good / Easy).
4. **Adaptive Quiz** — AI generates multiple-choice quiz questions from your material, tracks which ones you get wrong, and identifies weak areas for targeted review.
5. **Fill-in-the-Blank (Cloze Questions)** — AI creates fill-in-the-blank exercises that test active recall of key terms and concepts from your study pack.
6. **Matching Game** — AI generates matching pairs of terms and definitions from your material for an interactive drag-and-drop review exercise.
7. **Mind Map** — Auto-generates an interactive tree and flowchart visualization showing how topics and subtopics connect within your document.
8. **Text-to-Speech on Flashcards** — Reads flashcard questions and answers aloud using your browser's speech synthesis, with a toggle button on each card.

## AI-Powered Features

9. **AI Tutor (Chat)** — A persistent chat assistant that has read every word of your uploaded material. Ask questions and get grounded answers in context. Supports ELI5 mode (Explain Like I'm 5), persistent chat threads per study pack, and voice input/output for hands-free tutoring.
10. **AI Study Plan Generator** — Set your exam date and available hours per day; AI generates a personalized day-by-day study schedule with calendar events auto-created.
11. **AI Exam Simulator** — A proctored, timed exam with fullscreen lockdown, tab-switch warnings, and auto-submit on time expiry to simulate real test conditions.
12. **Practice Essays + AI Grading** — Write essay answers to a prompt; AI scores them on Accuracy, Depth, Clarity, and Critical Thinking with detailed written feedback.
13. **Cheat Sheet Generator** — Select any study pack and a page count (1–4 pages); AI generates a condensed, exam-ready cheat sheet viewable in-app and exportable as a Markdown file.
13a. **Cheat Sheet PPTX Export** — Export any cheat sheet as a PowerPoint presentation with a dark-themed slide deck, amber section titles, and bulleted content slides generated server-side via `pptxgenjs`.
13b. **Cheat Sheet PDF Print** — Open any cheat sheet in a print-optimized layout that auto-triggers the browser print dialog, producing a clean PDF with Georgia serif typography and proper page-break rules.
14. **Weak Area Detection** — After every quiz attempt, AI automatically analyzes your answers and identifies exactly which topics need more attention, surfacing them for prioritized review.
15. **AI Weekly Report** — Automatically generated at the end of each week with performance trends, strengths, weak spots, study habit insights, and personalized recommendations.
16. **Smart Reminders** — AI generates study alert messages delivered as browser push notifications so you never miss a scheduled review session.
17. **AI Goal Suggestions** — When setting goals, AI recommends achievable targets based on your current study pace and history.
18. **Knowledge Graph** — A force-directed, interactive visualization that maps all topics across your entire study library as nodes with orbital rings, breathing auras, and pulsing cores. Click any node to see its connections, cross-pack bridges, and jump directly to related flashcards or quizzes.
19. **Knowledge Graph Mastery Overlay** — Toggle a color overlay on the Knowledge Graph that colors each topic node green/yellow/red/gray based on your quiz performance history across all study packs.
20. **Knowledge Graph Insights Panel** — Displays real-time graph statistics including the most-connected hub topic, the number of cross-pack bridge connections, and isolated topic count to help identify knowledge gaps.

## Import & Document Management

21. **PDF Upload** — Upload any PDF file; the app extracts all text (with page markers) and stores it as a document ready for AI study pack generation.
22. **Plain Text Upload** — Paste or upload raw text directly to create a document without needing a file.
23. **PowerPoint / Slides Import** — Upload any `.pptx` file; the app parses the ZIP archive, extracts text from each slide (with slide titles as section headers), and imports the content as a structured document ready for AI study pack generation.
24. **YouTube URL Import** — Paste a YouTube video link; the app fetches the video's captions using the YouTube InnerTube API and imports the transcript as a document.
25. **Google Docs Import** — Paste a Google Docs share link; the app exports the document as plain text and imports it directly (document must be set to "Anyone with the link can view").
26. **Google Drive File Import** — Paste a Google Drive file share link; the app downloads and imports the file, supporting PDF and plain text formats.
27. **Web URL Import** — Paste any public webpage URL; the app scrapes the page, strips navigation/scripts/ads, and imports the readable text content with SSRF protection (private IP blocklist + DNS pre-resolution).
28. **Notion Import** — Provide a Notion integration token and page ID; the app fetches the page content via the Notion API and imports it as a document.
29. **Document Viewer** — Read your imported documents in-app with in-line highlighting and margin annotations.
30. **Document Annotations** — Add and save margin notes directly on your uploaded documents while reading.
31. **Study Pack Export (CSV / Text)** — Export any study pack's flashcards or quiz questions as a CSV or plain text file for use in other tools.
32. **Study Pack Sharing** — Publish a study pack to the Study Exchange so other students can discover and clone it into their own library.

## Tracking & Analytics

32. **Analytics Dashboard** — Visual charts showing study streaks, quiz scores over time, flashcard accuracy, weak area heatmaps, and total study time distribution.
33. **Study History** — A complete chronological log of every quiz attempt, exam session, focus session, essay submission, and flashcard review with scores and timestamps.
34. **Goal Tracking** — Set study goals with a target type (flashcards reviewed, quiz score, study minutes, etc.), a target value, and an optional deadline. Track progress with a visual progress bar and mark goals complete or abandoned.
35. **Study Calendar** — A visual monthly/weekly calendar where study events are displayed. View and manage scheduled sessions alongside auto-created study plan events.
36. **Grade Calculator** — Enter completed assignment names, weights, and scores alongside upcoming assignments and their weights. Set a target course grade and the calculator instantly shows what score you need on remaining work, plus a what-if slider to explore different scenarios.

## Focus & Productivity

37. **Focus Mode (Pomodoro)** — A Pomodoro timer with animated circular arc, configurable work and break intervals, AI-generated micro-goals per session, phase tracking (work / short break / long break), and a session recap summary.
37a. **Lo-Fi Beats Music Player** — An embedded YouTube Lo-Fi music player inside Focus Mode. Users can toggle it on/off to play a continuous Lo-Fi Girl 24/7 stream while studying. Features animated equalizer bars when playing, smooth expand/collapse via AnimatePresence, and music state that persists across setup→active phase transitions.
38. **Audio Study Mode** — Converts your study material to speech using text-to-speech synthesis. Includes playback controls, adjustable speed (0.5×–2×), and multiple voice options for hands-free studying.
39. **Cornell Notes (Notebooks)** — A rich text editor (TipTap) organized into the Cornell note format with a cue column, main notes area, and summary section. Notes auto-save on every keystroke.
40. **Command Palette** — Press Cmd+K (or Ctrl+K) anywhere in the app to instantly search and navigate to any page, tool, or feature without using the sidebar.
41. **Global Search** — Search across all your documents, study packs, notebooks, and flashcards from the command palette.

## Collaboration & Community

42. **Study Exchange** — A shared library where students can browse publicly shared study packs from other users and clone them into their own account with one click.

## Personalization & Settings

43. **Dark / Light Theme** — Toggle between dark and light mode; preference is persisted across sessions.
44. **Profile & Achievements** — View your study streak, total study time, longest streak, and unlocked achievement badges based on your activity milestones.
45. **Smart Reminders Configuration** — Create, view, and delete AI-generated or custom study reminders with browser notification support.
46. **Exam Countdown** — Set an exam date on any study pack to display a live countdown timer showing days remaining until the exam.
