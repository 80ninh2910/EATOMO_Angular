import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../shared/header/header.component';
import { FooterComponent } from '../../shared/footer/footer.component';

@Component({
  selector: 'app-build-your-own',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, FooterComponent],
  templateUrl: './build-your-own.component.html',
  styleUrl: './build-your-own.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BuildYourOwnComponent {
  selectedProtein = '';
  selectedCarbs = '';
  selectedVeggies: string[] = [];
  selectedSauce = '';
  
  proteins = [
    { name: 'Chicken Breast', calories: 165, price: 20000 },
    { name: 'Salmon', calories: 280, price: 35000 },
    { name: 'Tuna', calories: 144, price: 30000 },
    { name: 'Beef Steak', calories: 250, price: 40000 },
    { name: 'Tofu', calories: 76, price: 15000 },
    { name: 'Duck Breast', calories: 337, price: 45000 }
  ];

  carbs = [
    { name: 'Brown Rice', calories: 111, price: 10000 },
    { name: 'Pasta', calories: 131, price: 12000 },
    { name: 'Sweet Potato', calories: 86, price: 8000 },
    { name: 'Quinoa', calories: 120, price: 15000 }
  ];

  veggies = [
    { name: 'Broccoli', calories: 34 },
    { name: 'Spinach', calories: 23 },
    { name: 'Carrot', calories: 41 },
    { name: 'Bell Pepper', calories: 31 },
    { name: 'Cucumber', calories: 16 },
    { name: 'Tomato', calories: 18 }
  ];

  sauces = [
    { name: 'Teriyaki', calories: 70, price: 5000 },
    { name: 'Sriracha Mayo', calories: 85, price: 5000 },
    { name: 'Ponzu', calories: 40, price: 5000 },
    { name: 'Sesame Ginger', calories: 90, price: 5000 }
  ];

  toggleVeggie(veggie: string): void {
    const index = this.selectedVeggies.indexOf(veggie);
    if (index > -1) {
      this.selectedVeggies.splice(index, 1);
    } else {
      this.selectedVeggies.push(veggie);
    }
  }

  get totalCalories(): number {
    let calories = 0;
    
    const protein = this.proteins.find(p => p.name === this.selectedProtein);
    if (protein) calories += protein.calories;
    
    const carb = this.carbs.find(c => c.name === this.selectedCarbs);
    if (carb) calories += carb.calories;
    
    this.selectedVeggies.forEach(veggie => {
      const v = this.veggies.find(veg => veg.name === veggie);
      if (v) calories += v.calories;
    });
    
    const sauce = this.sauces.find(s => s.name === this.selectedSauce);
    if (sauce) calories += sauce.calories;
    
    return calories;
  }

  get totalPrice(): number {
    let price = 0;
    
    const protein = this.proteins.find(p => p.name === this.selectedProtein);
    if (protein) price += protein.price;
    
    const carb = this.carbs.find(c => c.name === this.selectedCarbs);
    if (carb) price += carb.price;
    
    const sauce = this.sauces.find(s => s.name === this.selectedSauce);
    if (sauce) price += sauce.price;
    
    return price;
  }

  addToCart(): void {
    if (this.selectedProtein && this.selectedCarbs && this.selectedSauce) {
      const bowl = {
        id: Date.now(),
        name: `Custom Bowl - ${this.selectedProtein}`,
        price: this.totalPrice,
        calories: this.totalCalories,
        protein: this.selectedProtein,
        carbs: this.selectedCarbs,
        veggies: this.selectedVeggies,
        sauce: this.selectedSauce
      };
      
      if (typeof localStorage !== 'undefined') {
        let cart = JSON.parse(localStorage.getItem('cart') || '[]');
        cart.push(bowl);
        localStorage.setItem('cart', JSON.stringify(cart));
      }
      
      alert('Bowl added to cart!');
    } else {
      alert('Please select protein, carbs, and sauce!');
    }
  }
}
