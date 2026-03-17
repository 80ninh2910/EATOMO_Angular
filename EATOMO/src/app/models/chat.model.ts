export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
  timestamp: string;
}

export interface BuildYourOwnPreset {
  protein: string;
  carbs: string;
  side: string;
  sauce: string;
}

export interface RecommendedBowl {
  _id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  price: number;
  category: string;
  image?: string;
}

export interface ChatResponseData {
  buildYourOwnPreset?: BuildYourOwnPreset;
  recommendedBowls?: RecommendedBowl[];
  [key: string]: unknown;
}

export interface ChatAskResponse {
  success: boolean;
  intent: string;
  reply: string;
  suggestions?: string[];
  requiresAuth?: boolean;
  action?: string;
  data?: ChatResponseData;
  message?: string;
}
