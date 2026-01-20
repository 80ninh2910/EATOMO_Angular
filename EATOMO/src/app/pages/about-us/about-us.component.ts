import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../shared/header/header.component';
import { FooterComponent } from '../../shared/footer/footer.component';

@Component({
  selector: 'app-about-us',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent],
  templateUrl: './about-us.component.html',
  styleUrl: './about-us.component.css'
})
export class AboutUsComponent {
  stats = [
    { number: '100%', label: 'Fresh Ingredients' },
    { number: '90%', label: 'Nutrients Retained' },
    { number: '1000+', label: 'Happy Customers' }
  ];
}
