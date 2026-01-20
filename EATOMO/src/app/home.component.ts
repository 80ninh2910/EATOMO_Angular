import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from './shared/header/header.component';
import { FooterComponent } from './shared/footer/footer.component';
import { HttpClient } from '@angular/common/http';

interface Review {
  name: string;
  rating: number;
  comment: string;
  avatar?: string;
}

interface BowlItem {
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  image: string;
  category: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, FooterComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  activeFilter = 'all';
  reviews: Review[] = [];
  
  bowls: BowlItem[] = [
    {
      name: 'B1',
      description: 'Tuna, donburi brown rice, beetroot, broccoli',
      calories: 434,
      protein: 43,
      carbs: 48,
      fat: 8,
      image: 'assets/healthy/images/index/bowl-b1.jpg',
      category: 'low-cal'
    },
    {
      name: 'B2',
      description: 'Half beef steak, pasta, mushroom, pak choi, pickles, onsen egg',
      calories: 438,
      protein: 35,
      carbs: 38,
      fat: 16,
      image: 'assets/healthy/images/index/bowl-b2.jpg',
      category: 'balanced'
    },
    {
      name: 'B3',
      description: 'Prawns, Japanese cold soba, French bean, tofu',
      calories: 435,
      protein: 41,
      carbs: 54,
      fat: 6,
      image: 'assets/healthy/images/index/bowl-b3.jpg',
      category: 'low-cal'
    },
    {
      name: 'B4',
      description: 'Salmon, pasta, spinach, salad and mix nuts',
      calories: 508,
      protein: 31,
      carbs: 42,
      fat: 24,
      image: 'assets/healthy/images/index/bowl-b4.jpg',
      category: 'balanced'
    },
    {
      name: 'B5',
      description: 'Duck breast, donburi brown rice, pickles',
      calories: 485,
      protein: 40,
      carbs: 36,
      fat: 20,
      image: 'assets/healthy/images/index/bowl-b5.jpg',
      category: 'high-protein'
    },
    {
      name: 'B6',
      description: 'Salmon, donburi brown rice, spinach',
      calories: 455,
      protein: 32,
      carbs: 38,
      fat: 20,
      image: 'assets/healthy/images/index/bowl-b6.jpg',
      category: 'vegetarian'
    }
  ];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadReviews();
  }

  loadReviews(): void {
    this.http.get<any>('assets/healthy/json/reviews.json')
      .subscribe({
        next: (data) => {
          this.reviews = data.reviews || [];
        },
        error: () => {
          // Fallback reviews if file doesn't exist
          this.reviews = [
            { name: 'Customer 1', rating: 5, comment: 'Amazing food and great service!' },
            { name: 'Customer 2', rating: 5, comment: 'Healthy and delicious!' }
          ];
        }
      });
  }

  filterBowls(category: string): void {
    this.activeFilter = category;
  }

  get filteredBowls(): BowlItem[] {
    if (this.activeFilter === 'all') {
      return this.bowls;
    }
    return this.bowls.filter(bowl => bowl.category === this.activeFilter);
  }

  downloadRecipe(bowlName: string): void {
    console.log(`Downloading recipe for ${bowlName}`);
    // Implement download logic
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
