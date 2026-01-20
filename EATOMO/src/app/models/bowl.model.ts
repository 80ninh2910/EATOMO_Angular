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
  inStock?: boolean; // Chuẩn bị cho backend sau này
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}
