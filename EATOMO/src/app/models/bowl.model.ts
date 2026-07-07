export interface Bowl {
  id: string;
  name: string;
  description: string;
  price: number;
  abv?: string; // e.g. "5%"
  volume?: string; // e.g. "330ml"
  flavor?: string; // e.g. "Strawb Smash"
  packType?: 'single' | 'pack-4' | 'pack-6' | 'mix-4' | 'mix-6';
  category: 'single' | 'fixed-pack' | 'build-your-own';
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
  abv?: string;
  volume?: string;
  flavor?: string;
  packType?: 'single' | 'pack-4' | 'pack-6' | 'mix-4' | 'mix-6';
  category: 'single' | 'fixed-pack' | 'build-your-own';
  image: string;
  inStock?: boolean;
  isFeatured?: boolean;
}

export interface UpdateBowlRequest {
  name?: string;
  description?: string;
  price?: number;
  abv?: string;
  volume?: string;
  flavor?: string;
  packType?: 'single' | 'pack-4' | 'pack-6' | 'mix-4' | 'mix-6';
  category?: 'single' | 'fixed-pack' | 'build-your-own';
  image?: string;
  inStock?: boolean;
  isFeatured?: boolean;
}
