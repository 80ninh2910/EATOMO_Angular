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
      name: 'L1',
      description: 'Half beef steak, sweet potato, cauliflower, pickles',
      calories: 274,
      protein: 25,
      carbs: 27,
      fat: 7,
      image: 'assets/healthy/images/index/L1-bowl.png',
      category: 'low-cal'
    },
    {
      name: 'L2',
      description: 'Salmon, sweet potato, mixed veggies, pak choi',
      calories: 331,
      protein: 24,
      carbs: 26,
      fat: 15,
      image: 'assets/healthy/images/index/L2-bowl.png',
      category: 'low-cal'
    },
    {
      name: 'B3',
      description: 'Prawns, Japanese cold soba, French bean, tofu',
      calories: 435,
      protein: 41,
      carbs: 54,
      fat: 6,
      image: 'assets/healthy/images/index/B3-bowl.png',
      category: 'balanced'
    },
    {
      name: 'B4',
      description: 'Salmon, pasta, spinach, salad and mix nuts',
      calories: 508,
      protein: 31,
      carbs: 42,
      fat: 24,
      image: 'assets/healthy/images/index/B4-bowl.png',
      category: 'balanced'
    },
    {
      name: 'H5',
      description: 'Half beef steak, full chicken breast, donburi brown rice, pumpkin, french bean',
      calories: 720,
      protein: 91,
      carbs: 46,
      fat: 19,
      image: 'assets/healthy/images/index/H5-bowl.png',
      category: 'high-protein'
    },
    {
      name: 'V5',
      description: 'Tofu, pasta, broccoli, edamame, purple cabbage, beetroot',
      calories: 530,
      protein: 33,
      carbs: 85,
      fat: 7,
      image: 'assets/healthy/images/index/V5-bowl.png',
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
