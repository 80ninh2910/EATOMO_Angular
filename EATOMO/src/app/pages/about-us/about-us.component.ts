import { Component, OnInit, AfterViewInit, ElementRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../../shared/header/header.component';
import { FooterComponent } from '../../shared/footer/footer.component';

@Component({
  selector: 'app-about-us',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, FooterComponent],
  templateUrl: './about-us.component.html',
  styleUrl: './about-us.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AboutUsComponent implements AfterViewInit {
  constructor(private elementRef: ElementRef) {}
  stats = [
    { number: '100%', label: 'Fresh Ingredients' },
    { number: '90%', label: 'Nutrients Retained' },
    { number: '1000+', label: 'Happy Customers' }
  ];

  values = [
    { icon: 'fas fa-seedling', title: 'Fresh & Natural', description: 'We source only the freshest, highest-quality ingredients from trusted local suppliers.' },
    { icon: 'fas fa-heart', title: 'Made with Love', description: 'Every bowl is crafted with care and passion by our dedicated culinary team.' },
    { icon: 'fas fa-bullseye', title: 'Health Focused', description: 'Nutrition is at the heart of everything we do, without compromising on taste.' },
    { icon: 'fas fa-recycle', title: 'Sustainable', description: 'We\'re committed to eco-friendly practices and reducing our environmental impact.' }
  ];

  teamMembers = [
    { name: 'Quách An Ninh', role: 'Head Chef & Co-Founder', image: '/assets/healthy/images/about/Ninh.jpg', instagram: 'niqa0192' },
    { name: 'Đoàn Quốc Vinh', role: 'Chief Nutritionist', image: '/assets/healthy/images/about/Vinh.jpg', instagram: 'qdinnh' },
    { name: 'Nguyễn Quốc Thịnh', role: 'Operations Manager', image: '/assets/healthy/images/about/Thịnh.jpg', instagram: 'qdinnh' },
    { name: 'Ngọc Khuyến', role: 'Chief Nutritionist', image: '/assets/healthy/images/about/Khuyen.jpg', instagram: 'qdinnh' }
  ];

  features = [
    { icon: 'fas fa-thermometer-half', title: 'Precise Temperature', description: 'Controlled cooking for perfect results' },
    { icon: 'fas fa-tint', title: 'Maximum Juiciness', description: 'Locks in moisture and flavor' },
    { icon: 'fas fa-drumstick-bite', title: 'Tender Perfection', description: 'Melt-in-your-mouth texture' }
  ];

  dishes = [
    { id: 1, title: 'Protein powerhouse', description: 'Forget fading energy! Our bowls pack a protein punch, helping you feel stronger and ready to rock your day, yet conquer the gym and gain muscle.' },
    { id: 2, title: 'Veggie wonderland', description: 'Greens aren\'t just good, they\'re digestion-boosting, blood pressure-lowering superheroes. Think glowing skin, a happy gut, and a healthy heart—all thanks to the green goodness.' },
    { id: 3, title: 'Carbs done right', description: 'Carbs get a bad rap, but here\'s the truth: they\'re your body\'s go-to energy source. No need to cut them out entirely, choose the right ones to keep you moving throughout the day.' }
  ];

  activeDish: number | null = null;

  selectDish(id: number): void {
    this.activeDish = this.activeDish === id ? null : id;
  }

  ngAfterViewInit(): void {
    this.initCounterAnimation();
  }

  private initCounterAnimation(): void {
    const statsObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const statNumbers = entry.target.querySelectorAll('.stat-number');
            statNumbers.forEach((stat: Element) => {
              const text = (stat as HTMLElement).textContent || '';
              const isPercentage = text.includes('%');
              const isPlus = text.includes('+');
              const target = parseInt(text);
              this.animateCounter(stat as HTMLElement, target, isPercentage, isPlus);
            });
            statsObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );

    const statsSection = this.elementRef.nativeElement.querySelector('.story-stats');
    if (statsSection) {
      statsObserver.observe(statsSection);
    }
  }

  private animateCounter(element: HTMLElement, target: number, isPercentage: boolean, isPlus: boolean, duration: number = 2000): void {
    let current = 0;
    const increment = target / (duration / 16);
    const suffix = isPercentage ? '%' : (isPlus ? '+' : '');

    const updateCounter = () => {
      current += increment;
      if (current < target) {
        element.textContent = Math.floor(current) + suffix;
        requestAnimationFrame(updateCounter);
      } else {
        element.textContent = target + suffix;
      }
    };

    updateCounter();
  }
}
