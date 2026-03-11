export interface Bowl {
  id: string;
  name: string;
  description: string;
  price: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  category: 'low-cal' | 'balanced' | 'high-protein' | 'vegetarian';
  image: string;
  inStock?: boolean;
  isFeatured?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateBowlRequest {
  id: string;
  name: string;
  description: string;
  price: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  category: 'low-cal' | 'balanced' | 'high-protein' | 'vegetarian';
  image: string;
  inStock?: boolean;
  isFeatured?: boolean;
}

export interface UpdateBowlRequest {
  name?: string;
  description?: string;
  price?: number;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  category?: 'low-cal' | 'balanced' | 'high-protein' | 'vegetarian';
  image?: string;
  inStock?: boolean;
  isFeatured?: boolean;
}
