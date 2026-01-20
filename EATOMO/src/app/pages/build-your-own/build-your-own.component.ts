import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../../shared/header/header.component';
import { FooterComponent } from '../../shared/footer/footer.component';
import { CartService } from '../../services/cart.service';

interface Ingredient {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  image: string;
}

interface SelectedItems {
  protein: Ingredient | null;
  carbs: Ingredient | null;
  side: Ingredient | null;
  sauce: Ingredient | null;
}

@Component({
  selector: 'app-build-your-own',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, FooterComponent],
  templateUrl: './build-your-own.component.html',
  styleUrl: './build-your-own.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BuildYourOwnComponent {
  // Selected items signal
  selectedItems = signal<SelectedItems>({
    protein: null,
    carbs: null,
    side: null,
    sauce: null
  });

  // Computed nutrition totals
  totalCalories = computed(() => {
    const items = this.selectedItems();
    return (items.protein?.calories || 0) +
           (items.carbs?.calories || 0) +
           (items.side?.calories || 0) +
           (items.sauce?.calories || 0);
  });

  totalProtein = computed(() => {
    const items = this.selectedItems();
    return (items.protein?.protein || 0) +
           (items.carbs?.protein || 0) +
           (items.side?.protein || 0) +
           (items.sauce?.protein || 0);
  });

  totalCarbs = computed(() => {
    const items = this.selectedItems();
    return (items.protein?.carbs || 0) +
           (items.carbs?.carbs || 0) +
           (items.side?.carbs || 0) +
           (items.sauce?.carbs || 0);
  });

  totalFat = computed(() => {
    const items = this.selectedItems();
    return (items.protein?.fat || 0) +
           (items.carbs?.fat || 0) +
           (items.side?.fat || 0) +
           (items.sauce?.fat || 0);
  });

  // Ingredients data
  readonly proteins: Ingredient[] = [
    { name: 'Full sous vide top blade beef steak', calories: 250, protein: 30, carbs: 0, fat: 15, image: '/assets/healthy/images/build-your-own/Top-blade-beef-steak-300x300.png' },
    { name: 'Full sous vide original chicken breast', calories: 180, protein: 35, carbs: 0, fat: 5, image: '/assets/healthy/images/build-your-own/Original-chicken-breast-300x300.png' },
    { name: 'Sous vide lemon pepper prawn', calories: 120, protein: 25, carbs: 2, fat: 3, image: '/assets/healthy/images/build-your-own/Lemon-pepper-prawn-300x300.png' },
    { name: 'Sous vide Norwegian salmon', calories: 220, protein: 22, carbs: 0, fat: 14, image: '/assets/healthy/images/build-your-own/Basa-fish-300x300.png' }
  ];

  readonly carbsOptions: Ingredient[] = [
    { name: 'White rice', calories: 150, protein: 3, carbs: 30, fat: 1, image: '/assets/healthy/images/build-your-own/White-Rice-300x300.png' },
    { name: 'Brown rice', calories: 170, protein: 4, carbs: 35, fat: 2, image: '/assets/healthy/images/build-your-own/Brown-Rice--300x300.png' },
    { name: 'Sweet potato', calories: 130, protein: 2, carbs: 25, fat: 0, image: '/assets/healthy/images/build-your-own/Sweet-potato-300x300.png' },
    { name: 'Cold soba', calories: 120, protein: 5, carbs: 24, fat: 1, image: '/assets/healthy/images/build-your-own/Cold-soba-300x300.png' },
    { name: 'Donburi white rice', calories: 120, protein: 5, carbs: 24, fat: 1, image: '/assets/healthy/images/build-your-own/Donburi-white-rice-.png' },
    { name: 'Fusilli pasta', calories: 120, protein: 5, carbs: 24, fat: 1, image: '/assets/healthy/images/build-your-own/Fusilli-pasta--300x300.png' }
  ];

  readonly sides: Ingredient[] = [
    { name: 'Purple cabbage', calories: 30, protein: 1, carbs: 5, fat: 0, image: '/assets/healthy/images/build-your-own/resize_2-06-300x300.png' },
    { name: 'Avocado', calories: 120, protein: 2, carbs: 6, fat: 10, image: '/assets/healthy/images/build-your-own/Avocado-300x300.png' },
    { name: 'Broccoli', calories: 40, protein: 3, carbs: 7, fat: 0, image: '/assets/healthy/images/build-your-own/Broccoli--300x300.png' },
    { name: 'Edamame', calories: 80, protein: 8, carbs: 8, fat: 3, image: '/assets/healthy/images/build-your-own/Edamame-300x300.png' },
    { name: 'Salad and nuts', calories: 80, protein: 8, carbs: 8, fat: 3, image: '/assets/healthy/images/build-your-own/Salad-and-nuts-300x300.png' },
    { name: 'Baked cherry tomato', calories: 80, protein: 8, carbs: 8, fat: 3, image: '/assets/healthy/images/build-your-own/Baked-cherry-tomato-300x300.png' }
  ];

  readonly sauces: Ingredient[] = [
    { name: 'Japanese', calories: 50, protein: 0, carbs: 10, fat: 2, image: '/assets/healthy/images/build-your-own/Japanese-300x300.png' },
    { name: 'Thai sweet chilli', calories: 60, protein: 0, carbs: 15, fat: 0, image: '/assets/healthy/images/build-your-own/Thai-sweet-chilli-300x300.png' },
    { name: 'Wasabi soy', calories: 40, protein: 1, carbs: 8, fat: 1, image: '/assets/healthy/images/build-your-own/Cilantro-lime-300x300 (1).png' },
    { name: 'Honey & soy', calories: 70, protein: 0, carbs: 17, fat: 0, image: '/assets/healthy/images/build-your-own/Honey-soy-300x300.png' },
    { name: 'Vietnamese Sauce', calories: 70, protein: 0, carbs: 17, fat: 0, image: '/assets/healthy/images/build-your-own/Viet-Fish-Sauce-300x300.png' },
    { name: 'Olive oil and herb', calories: 70, protein: 0, carbs: 17, fat: 0, image: '/assets/healthy/images/build-your-own/Olive-oil-herb-300x300.png' }
  ];

  constructor(private cartService: CartService) {}

  /**
   * Select an ingredient
   */
  selectIngredient(category: keyof SelectedItems, ingredient: Ingredient): void {
    this.selectedItems.update(items => ({
      ...items,
      [category]: ingredient
    }));
  }

  /**
   * Check if ingredient is selected
   */
  isSelected(category: keyof SelectedItems, ingredient: Ingredient): boolean {
    return this.selectedItems()[category]?.name === ingredient.name;
  }

  /**
   * Clear all selections
   */
  clearSelections(): void {
    this.selectedItems.set({
      protein: null,
      carbs: null,
      side: null,
      sauce: null
    });
  }

  /**
   * Download recipe (placeholder)
   */
  downloadRecipe(): void {
    alert('Download recipe feature coming soon!');
  }

  /**
   * Add to cart
   */
  addToCart(): void {
    const items = this.selectedItems();
    
    if (!items.protein || !items.carbs || !items.side || !items.sauce) {
      alert('Please select all ingredients before adding to cart');
      return;
    }

    const cartItem = {
      id: `custom-${Date.now()}`,
      name: 'Custom Bowl',
      price: 89000, // Base price for custom bowl
      quantity: 1,
      proteins: [items.protein.name],
      carbs: [items.carbs.name],
      veggies: [items.side.name],
      sauces: [items.sauce.name]
    };

    this.cartService.addToCart(cartItem);
    alert('Added to cart!');
    this.clearSelections();
  }
}
