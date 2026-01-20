import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../shared/header/header.component';
import { FooterComponent } from '../../shared/footer/footer.component';

@Component({
  selector: 'app-faqs',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent],
  templateUrl: './faqs.component.html',
  styleUrl: './faqs.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FaqsComponent {
  faqs = [
    {
      question: 'What are your operating hours?',
      answer: 'We are open from 10AM to 9PM every day.',
      isOpen: false
    },
    {
      question: 'Do you offer delivery?',
      answer: 'Yes, we are available on Grab, Now, and Baemin.',
      isOpen: false
    },
    {
      question: 'Are your ingredients fresh?',
      answer: 'Yes, we hand-pick fresh produce daily.',
      isOpen: false
    }
  ];

  toggleFaq(faq: any): void {
    faq.isOpen = !faq.isOpen;
  }
}
