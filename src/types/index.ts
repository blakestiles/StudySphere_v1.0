import { Types } from "mongoose";

export interface IUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  image?: string;
  bio?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDocument {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  originalFilename?: string;
  fileType: "pdf" | "text";
  rawText: string;
  status: "processing" | "ready" | "error";
  uploadedAt: Date;
}

export interface IStudyPack {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  documentId: Types.ObjectId;
  title: string;
  summaries: {
    short: string;
    detailed: string;
  };
  status: "generating" | "ready" | "error";
  createdAt: Date;
  updatedAt: Date;
}

export interface ITopic {
  _id: Types.ObjectId;
  studyPackId: Types.ObjectId;
  name: string;
  parentTopicId?: Types.ObjectId;
  content: string;
  order: number;
}

export interface IFlashcard {
  _id: Types.ObjectId;
  studyPackId: Types.ObjectId;
  topicId?: Types.ObjectId;
  question: string;
  answer: string;
  difficulty: "easy" | "medium" | "hard";
}

export interface IQuizQuestion {
  _id: Types.ObjectId;
  studyPackId: Types.ObjectId;
  topicId?: Types.ObjectId;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface IQuizAttempt {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  studyPackId: Types.ObjectId;
  score: number;
  totalQuestions: number;
  responses: {
    questionId: Types.ObjectId;
    selectedAnswer: number;
    isCorrect: boolean;
  }[];
  completedAt: Date;
}

export interface IFocusSession {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  studyPackId?: Types.ObjectId;
  topicId?: Types.ObjectId;
  duration: number;
  goals: string[];
  recap?: string;
  completedAt?: Date;
}

export interface IWeakArea {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  topicId: Types.ObjectId;
  severity: "low" | "medium" | "high";
  lastUpdated: Date;
}
