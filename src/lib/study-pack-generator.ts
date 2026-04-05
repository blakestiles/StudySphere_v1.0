import client from "@/lib/claude";

export interface MindMapNode {
  id: string;
  label: string;
  children?: MindMapNode[];
}

export interface GeneratedStudyPack {
  summaries: {
    short: string;
    detailed: string;
  };
  topics: {
    name: string;
    content: string;
    order: number;
    flashcards: {
      question: string;
      answer: string;
      difficulty: "easy" | "medium" | "hard";
      sourcePage: number | null;
    }[];
    quizQuestions: {
      question: string;
      options: string[];
      correctAnswer: number;
      explanation: string;
    }[];
    clozeQuestions: {
      originalText: string;
      blankedText: string;
      answers: string[];
    }[];
  }[];
  mindMap: MindMapNode;
}

export async function generateStudyPack(
  title: string,
  rawText: string
): Promise<GeneratedStudyPack> {
  if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === "your-anthropic-api-key") {
    throw new Error("ANTHROPIC_API_KEY is not configured. Please set a valid API key in .env.local");
  }

  const truncatedText = rawText.slice(0, 100000);

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8192,
    messages: [
      {
        role: "user",
        content: `You are an expert educator. Analyze the following study material and generate a comprehensive study pack in JSON format.

Document Title: ${title}

Study Material:
${truncatedText}

Generate a JSON object with the following structure:
{
  "summaries": {
    "short": "A 2-sentence summary of the material",
    "detailed": "A 2-paragraph detailed summary of the material"
  },
  "topics": [
    {
      "name": "Topic Name",
      "content": "Detailed explanation of the topic",
      "order": 0,
      "flashcards": [
        {
          "question": "Question text",
          "answer": "Answer text",
          "difficulty": "easy" | "medium" | "hard",
          "sourcePage": 3
        }
      ],
      "quizQuestions": [
        {
          "question": "Question text",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswer": 0,
          "explanation": "Why this answer is correct"
        }
      ],
      "clozeQuestions": [
        {
          "originalText": "The original sentence with all terms intact",
          "blankedText": "The sentence with {{BLANK_1}} replacing important term and {{BLANK_2}} replacing another",
          "answers": ["first term", "second term"]
        }
      ]
    }
  ],
  "mindMap": {
    "id": "root",
    "label": "Document Title",
    "children": [
      { "id": "topic-1", "label": "Topic Name", "children": [
        { "id": "sub-1", "label": "Subtopic or Key Concept" }
      ]}
    ]
  }
}

Requirements:
- Create 3-8 topics based on the material
- Each topic should have 2-5 flashcards of varying difficulty
- Each topic should have 2-4 quiz questions with exactly 4 options each
- correctAnswer is the 0-based index of the correct option
- Each topic should have 2-3 cloze (fill-in-the-blank) questions
- For cloze questions: take a key sentence from the material, replace 1-3 important terms with {{BLANK_1}}, {{BLANK_2}}, etc. The answers array must contain the replaced terms in order.
- For each flashcard, include "sourcePage": the page number from [PAGE N] markers where this concept appears, or null if the text has no page markers
- Make questions test understanding, not just memorization
- The mindMap should mirror the topic structure with 2-3 subtopics per topic as children
- Return ONLY valid JSON, no additional text`,
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response received from Claude API");
  }
  const text = textBlock.text;

  // Strip markdown code fences if present
  const cleaned = text.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "");

  let parsed: GeneratedStudyPack;
  try {
    parsed = JSON.parse(cleaned) as GeneratedStudyPack;
  } catch {
    throw new Error("Failed to parse AI response as JSON");
  }

  // Validate basic structure
  if (!parsed.summaries || !parsed.topics || !Array.isArray(parsed.topics) || parsed.topics.length === 0) {
    throw new Error("AI response missing required fields (summaries or topics)");
  }

  return parsed;
}
