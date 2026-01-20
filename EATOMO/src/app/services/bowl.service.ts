import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Bowl } from '../models/bowl.model';

@Injectable({
  providedIn: 'root'
})
export class BowlService {
  // Mock data - Sau này thay bằng HttpClient để call API
  private bowls: Bowl[] = [
    // Low Calories
    { id: 'L1', name: 'L1', description: 'Half beef steak, sweet potato, cauliflower, pickles', price: 149900, calories: 274, protein: 25, carbs: 27, fat: 7, category: 'low-cal', image: '/assets/healthy/images/index/bowl-b1.jpg', inStock: true },
    { id: 'L2', name: 'L2', description: 'Salmon, sweet potato, mixed veggies, pak choi', price: 154900, calories: 331, protein: 24, carbs: 26, fat: 15, category: 'low-cal', image: '/assets/healthy/images/index/bowl-b2.jpg', inStock: true },
    { id: 'L3', name: 'L3', description: 'Prawns, Japanese cold soba, onsen egg, pickles', price: 169900, calories: 341, protein: 32, carbs: 35, fat: 8, category: 'low-cal', image: '/assets/healthy/images/index/bowl-b3.jpg', inStock: true },
    { id: 'L4', name: 'L4', description: 'Half chicken breast, baby potato, mixed veggies, pak choi', price: 139900, calories: 285, protein: 33, carbs: 23, fat: 7, category: 'low-cal', image: '/assets/healthy/images/index/bowl-b4.jpg', inStock: true },
    { id: 'L5', name: 'L5', description: 'Half cajun chicken, Japanese cold soba, pickles, cauliflower', price: 159900, calories: 351, protein: 39, carbs: 40, fat: 4, category: 'low-cal', image: '/assets/healthy/images/index/bowl-b5.jpg', inStock: true },
    { id: 'L6', name: 'L6', description: 'Tuna, baby potato, sweet corn, mixed veggies', price: 144900, calories: 311, protein: 34, carbs: 32, fat: 5, category: 'low-cal', image: '/assets/healthy/images/index/bowl-b6.jpg', inStock: true },
    { id: 'L7', name: 'L7', description: 'Half cajun chicken breast, brown rice, beetroot, tomato', price: 164900, calories: 373, protein: 35, carbs: 45, fat: 6, category: 'low-cal', image: '/assets/healthy/images/index/bowl-b1.jpg', inStock: true },
    { id: 'L8', name: 'L8', description: 'Basa fish, Japanese cold soba, avocado', price: 179900, calories: 439, protein: 33, carbs: 40, fat: 16, category: 'low-cal', image: '/assets/healthy/images/index/bowl-b2.jpg', inStock: true },
    { id: 'L9', name: 'L9', description: 'Half beef steak, sweet potato, pak choi, broccoli, mix veggies', price: 159900, calories: 341, protein: 27, carbs: 33, fat: 11, category: 'low-cal', image: '/assets/healthy/images/index/bowl-b3.jpg', inStock: true },
    { id: 'L10', name: 'L10', description: 'Duck breast, pumpkin, broccoli, spinach', price: 169900, calories: 351, protein: 35, carbs: 16, fat: 16, category: 'low-cal', image: '/assets/healthy/images/index/bowl-b4.jpg', inStock: true },
    
    // Balanced
    { id: 'B1', name: 'B1', description: 'Tuna, donburi brown rice, beetroot, broccoli', price: 189900, calories: 434, protein: 43, carbs: 48, fat: 8, category: 'balanced', image: '/assets/healthy/images/index/bowl-b5.jpg', inStock: true },
    { id: 'B2', name: 'B2', description: 'Half beef steak, pasta, mushroom, pak choi, pickles, onsen egg', price: 174900, calories: 438, protein: 35, carbs: 38, fat: 16, category: 'balanced', image: '/assets/healthy/images/index/bowl-b6.jpg', inStock: true },
    { id: 'B3', name: 'B3', description: 'Prawns, Japanese cold soba, French bean, tofu', price: 164900, calories: 435, protein: 41, carbs: 54, fat: 6, category: 'balanced', image: '/assets/healthy/images/index/bowl-b1.jpg', inStock: true },
    { id: 'B4', name: 'B4', description: 'Salmon, pasta, spinach, salad and mix nuts', price: 199900, calories: 508, protein: 31, carbs: 42, fat: 24, category: 'balanced', image: '/assets/healthy/images/index/bowl-b2.jpg', inStock: true },
    { id: 'B5', name: 'B5', description: 'Duck breast, donburi brown rice, pickles', price: 189900, calories: 485, protein: 40, carbs: 36, fat: 20, category: 'balanced', image: '/assets/healthy/images/index/bowl-b3.jpg', inStock: true },
    { id: 'B6', name: 'B6', description: 'Salmon, donburi brown rice, spinach', price: 189900, calories: 455, protein: 32, carbs: 38, fat: 20, category: 'balanced', image: '/assets/healthy/images/index/bowl-b4.jpg', inStock: true },
    { id: 'B7', name: 'B7', description: 'Duck breast, donburi white rice, mix veggies, spinach', price: 199900, calories: 586, protein: 42, carbs: 49, fat: 25, category: 'balanced', image: '/assets/healthy/images/index/bowl-b5.jpg', inStock: true },
    { id: 'B8', name: 'B8', description: 'Basa fish, donburi brown rice, spinach, cabbage', price: 179900, calories: 442, protein: 37, carbs: 43, fat: 14, category: 'balanced', image: '/assets/healthy/images/index/bowl-b6.jpg', inStock: true },
    { id: 'B9', name: 'B9', description: 'Half original chicken, prawns, donburi brown rice, French bean', price: 199900, calories: 488, protein: 58, carbs: 39, fat: 11, category: 'balanced', image: '/assets/healthy/images/index/bowl-b1.jpg', inStock: true },
    { id: 'B10', name: 'B10', description: 'Full beef steak, donburi brown rice, cauliflower', price: 219900, calories: 557, protein: 54, carbs: 41, fat: 20, category: 'balanced', image: '/assets/healthy/images/index/bowl-b2.jpg', inStock: true },
    { id: 'B11', name: 'B11', description: 'Tuna, donburi white rice, broccoli, pickles', price: 189900, calories: 437, protein: 42, carbs: 52, fat: 7, category: 'balanced', image: '/assets/healthy/images/index/bowl-b3.jpg', inStock: true },
    { id: 'B12', name: 'B12', description: 'Full cajun chicken, brown rice, sweet corn, tomato', price: 209900, calories: 542, protein: 65, carbs: 52, fat: 8, category: 'balanced', image: '/assets/healthy/images/index/bowl-b4.jpg', inStock: true },
    { id: 'B13', name: 'B13', description: 'Full cajun chicken, baby potato, spinach, broccoli', price: 209900, calories: 440, protein: 64, carbs: 27, fat: 9, category: 'balanced', image: '/assets/healthy/images/index/bowl-b5.jpg', inStock: true },
    { id: 'B14', name: 'B14', description: 'Basa fish, donburi brown rice, cabbage, tomato', price: 179900, calories: 441, protein: 36, carbs: 46, fat: 12, category: 'balanced', image: '/assets/healthy/images/index/bowl-b6.jpg', inStock: true },
    { id: 'B15', name: 'B15', description: 'Half beef steak, prawns, soba, cauliflower, pickles, onsen egg', price: 199900, calories: 515, protein: 55, carbs: 41, fat: 15, category: 'balanced', image: '/assets/healthy/images/index/bowl-b1.jpg', inStock: true },
    
    // High Protein
    { id: 'H1', name: 'H1', description: 'Half original chicken, half beef steak, donburi brown rice, spinach', price: 229900, calories: 562, protein: 62, carbs: 38, fat: 18, category: 'high-protein', image: '/assets/healthy/images/index/bowl-b2.jpg', inStock: true },
    { id: 'H2', name: 'H2', description: 'Half beef steak, prawns, donburi white rice, baby potato, broccoli', price: 239900, calories: 615, protein: 53, carbs: 69, fat: 14, category: 'high-protein', image: '/assets/healthy/images/index/bowl-b3.jpg', inStock: true },
    { id: 'H3', name: 'H3', description: 'Basa fish, Japanese cold soba, avocado, mixed veggies, onsen egg', price: 219900, calories: 560, protein: 39, carbs: 44, fat: 25, category: 'high-protein', image: '/assets/healthy/images/index/bowl-b4.jpg', inStock: true },
    { id: 'H4', name: 'H4', description: 'Duck breast, prawns, sweet potato, edamame, onsen egg', price: 249900, calories: 584, protein: 66, carbs: 33, fat: 21, category: 'high-protein', image: '/assets/healthy/images/index/bowl-b5.jpg', inStock: true },
    { id: 'H5', name: 'H5', description: 'Half beef steak, full chicken breast, donburi brown rice, pumpkin, french bean', price: 269900, calories: 720, protein: 91, carbs: 46, fat: 19, category: 'high-protein', image: '/assets/healthy/images/index/bowl-b6.jpg', inStock: true },
    { id: 'H6', name: 'H6', description: 'Full original chicken, fusilli pasta, avocado, beetroot', price: 249900, calories: 611, protein: 65, carbs: 45, fat: 19, category: 'high-protein', image: '/assets/healthy/images/index/bowl-b1.jpg', inStock: true },
    { id: 'H7', name: 'H7', description: 'Half beef steak, half cajun chicken breast, donburi brown, sweet corn', price: 239900, calories: 583, protein: 62, carbs: 47, fat: 16, category: 'high-protein', image: '/assets/healthy/images/index/bowl-b2.jpg', inStock: true },
    { id: 'H8', name: 'H8', description: 'Full beef steak, donburi brown rice, baby potato, broccoli', price: 259900, calories: 649, protein: 56, carbs: 60, fat: 21, category: 'high-protein', image: '/assets/healthy/images/index/bowl-b3.jpg', inStock: true },
    { id: 'H9', name: 'H9', description: 'Full beef steak, donburi white rice, sweet corn', price: 249900, calories: 611, protein: 54, carbs: 56, fat: 19, category: 'high-protein', image: '/assets/healthy/images/index/bowl-b4.jpg', inStock: true },
    { id: 'H10', name: 'H10', description: 'Half cajun chicken breast, salmon, donburi white rice, tomato', price: 259900, calories: 617, protein: 60, carbs: 50, fat: 20, category: 'high-protein', image: '/assets/healthy/images/index/bowl-b5.jpg', inStock: true },
    
    // Vegetarian
    { id: 'V1', name: 'V1', description: 'Brown rice, cauliflower, mixed veggies, edamame, mushroom', price: 129900, calories: 377, protein: 18, carbs: 55, fat: 10, category: 'vegetarian', image: '/assets/healthy/images/index/bowl-b6.jpg', inStock: true },
    { id: 'V2', name: 'V2', description: 'Japanese cold soba, cabbage, chickpeas, beetroot, avocado', price: 149900, calories: 536, protein: 19, carbs: 74, fat: 18, category: 'vegetarian', image: '/assets/healthy/images/index/bowl-b1.jpg', inStock: true },
    { id: 'V3', name: 'V3', description: 'White rice, sweet potato, avocado, sweet corn, spinach', price: 139900, calories: 520, protein: 11, carbs: 84, fat: 16, category: 'vegetarian', image: '/assets/healthy/images/index/bowl-b2.jpg', inStock: true },
    { id: 'V4', name: 'V4', description: 'Brown rice, chickpeas, tomato, avocado, french bean', price: 139900, calories: 520, protein: 16, carbs: 75, fat: 18, category: 'vegetarian', image: '/assets/healthy/images/index/bowl-b3.jpg', inStock: true },
    { id: 'V5', name: 'V5', description: 'Tofu, pasta, broccoli, edamame, purple cabbage, beetroot', price: 149900, calories: 530, protein: 33, carbs: 85, fat: 7, category: 'vegetarian', image: '/assets/healthy/images/index/bowl-b4.jpg', inStock: true },
  ];

  // Hiện tại: Return mock data
  // Sau này: Uncomment dòng dưới và thay bằng http.get
  // constructor(private http: HttpClient) {}

  getBowls(): Observable<Bowl[]> {
    return of(this.bowls);
    // Sau này: return this.http.get<Bowl[]>('http://yourapi.com/api/bowls');
  }

  getBowlsByCategory(category: string): Observable<Bowl[]> {
    if (category === 'all') {
      return of(this.bowls);
    }
    return of(this.bowls.filter(bowl => bowl.category === category));
    // Sau này: return this.http.get<Bowl[]>(`http://yourapi.com/api/bowls?category=${category}`);
  }

  getBowlById(id: string): Observable<Bowl | undefined> {
    return of(this.bowls.find(bowl => bowl.id === id));
    // Sau này: return this.http.get<Bowl>(`http://yourapi.com/api/bowls/${id}`);
  }

  // Chuẩn bị cho CRUD backend
  updateBowlPrice(id: string, price: number): Observable<Bowl | undefined> {
    const bowl = this.bowls.find(b => b.id === id);
    if (bowl) {
      bowl.price = price;
      bowl.updatedAt = new Date();
    }
    return of(bowl);
    // Sau này: return this.http.patch<Bowl>(`http://yourapi.com/api/bowls/${id}`, { price });
  }

  updateBowlStock(id: string, inStock: boolean): Observable<Bowl | undefined> {
    const bowl = this.bowls.find(b => b.id === id);
    if (bowl) {
      bowl.inStock = inStock;
      bowl.updatedAt = new Date();
    }
    return of(bowl);
    // Sau này: return this.http.patch<Bowl>(`http://yourapi.com/api/bowls/${id}`, { inStock });
  }
}
