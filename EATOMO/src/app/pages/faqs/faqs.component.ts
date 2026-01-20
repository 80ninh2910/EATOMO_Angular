import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../shared/header/header.component';
import { FooterComponent } from '../../shared/footer/footer.component';

interface FAQ {
  question: string;
  answer: string | string[];
  category: 'menu' | 'food' | 'delivery' | 'payment';
  isOpen: boolean;
}

@Component({
  selector: 'app-faqs',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent],
  templateUrl: './faqs.component.html',
  styleUrl: './faqs.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FaqsComponent {
  activeTab: 'menu' | 'food' | 'delivery' | 'payment' = 'menu';
  readonly objectTypeOf = (obj: any) => typeof obj;

  faqs: FAQ[] = [
    {
      question: 'How does the menu work?',
      answer: 'With Soumaki\'s menu, you have the flexibility to mix and match different items to create your unique, healthy bowls. You can either enjoy our Sou-made bowls (predesigned bowls) or Build your own healthy bowl out of our fresh ingredients and tasty sauces. Over 100 combinations of the macronutrients (protein, carbs, fat) are awaiting!',
      category: 'menu',
      isOpen: false
    },
    {
      question: 'How do I place my order?',
      answer: ['You can drop by to dine in, pick up your bowls, or order via delivery apps:', 'Our store for dine-in and pick-up: SOUMAKI, 42 Ly Tu Trong, Ben Nghe ward, District 1.', 'Contact us on Facebook, IG, Zalo, or via our hotline 0326238700 from 10 AM to 9 PM, every day', 'We are also available on Grabfood, Shopeefood, and GoFood (10:00 AM – 8:45 PM) for your convenience.'],
      category: 'menu',
      isOpen: false
    },
    {
      question: 'Who can eat Soumaki food?',
      answer: 'Absolutely everyone can benefit from our bowls – whether you\'re looking to lose weight, stay fit, or simply lead a healthier lifestyle. want to have a healthier lifestyle.',
      category: 'menu',
      isOpen: false
    },
    {
      question: 'Do you create weekly meal plans?',
      answer: 'Yes! Our flexible weekly meal plan is customized based on your unique calories and diet requirements. Please contact us for detailed consultancy!',
      category: 'menu',
      isOpen: false
    },
    {
      question: 'Is Soumaki food suitable for weight loss and muscle gain?',
      answer: 'Yes. Our food is suitable for any fitness purpose. But don\'t forget that consistency is key to any goals.',
      category: 'menu',
      isOpen: false
    },
    {
      question: 'Do I have to choose from all the steps?',
      answer: 'Of course not. You can freely mix and match the items of your choice. However, the suggested steps may help build a balanced meal with ideal macronutrients (protein, fat, and carbs).',
      category: 'menu',
      isOpen: false
    },
    {
      question: 'How can I count calories and the macronutrients in my food?',
      answer: 'You can visit the menu Build your own to pick the items and let us calculate the calories and macronutrients of your bowl.',
      category: 'menu',
      isOpen: false
    },
    {
      question: 'Are the information on calories and macronutrients trustworthy? Where can I research them myself?',
      answer: 'Our nutrition information is carefully calculated based on reliable sources and verified by nutrition experts.',
      category: 'menu',
      isOpen: false
    },
    {
      question: 'Do you have any Vegan options?',
      answer: ['We have some vegan bowls that are carefully selected, or you can customize your own by omitting the protein and selecting your favorite carbs and veggies.', 'Regarding the sauce, all are vegan-friendly, except the ones with mayo (which are egg-mixed and dairy-free) and Thai chilli sauce.'],
      category: 'food',
      isOpen: false
    },
    {
      question: 'How many items in each step can I choose?',
      answer: 'You can choose as many as you can handle, however the portion is quite large. Our tip is to notice the grams in each portion so as not to overload the bowl. \'3-5 items total\' is most picked.',
      category: 'food',
      isOpen: false
    },
    {
      question: 'Can I choose the pre-designed bowl but remove and add on something?',
      answer: 'Yes, you can. The curated bowl then becomes the Build you own bowl, in which you can freely put items in and out.',
      category: 'food',
      isOpen: false
    },
    {
      question: 'Do you use oil to cook?',
      answer: 'Most of our food doesn\'t contain oil, while the baked items are added very little oil.',
      category: 'food',
      isOpen: false
    },
    {
      question: 'How long can I keep my food?',
      answer: 'The food is best used after delivery and in good quality at most 2 days with proper storage in the fridge.',
      category: 'food',
      isOpen: false
    },
    {
      question: 'Is the food container reheatable/microwavable?',
      answer: 'Yes, the food container is made from kraft paper, eco-friendly, and microwavable. Remember to take the plastic lid off first.',
      category: 'food',
      isOpen: false
    },
    {
      question: 'Do you have gluten-free food?',
      answer: ['Yes, we do. There are some items such as Spinach, pasta, soba, black fungus, honey soy sauce, and wasabi soy sauce you may avoid. The rest are safe for Gluten-free customers.', 'Try our Plan your bowls tool to get the bowls based on your physique and dietary.'],
      category: 'food',
      isOpen: false
    },
    {
      question: 'I\'m following a special diet due to a health concern. Would it be possible to customize a meal for me?',
      answer: 'Yes, we can customize meals for special dietary needs. Please contact us directly to discuss your requirements.',
      category: 'food',
      isOpen: false
    },
    {
      question: 'What kind of seasoning do you marinate the food?',
      answer: 'Mostly salt and pepper, herbs, minimum sugar, oil and no artificial additives.',
      category: 'food',
      isOpen: false
    },
    {
      question: 'Is the portion on the menu weighed before or after cooking?',
      answer: 'The meats are weighed before cooking and the rest is weighed after cooking.',
      category: 'food',
      isOpen: false
    },
    {
      question: 'Why is your chicken breast pink sometimes?',
      answer: 'Young chickens, due to less myoglobin (muscle protein), can appear pink even when fully cooked. We ensure all our chicken is cooked to safe temperatures.',
      category: 'food',
      isOpen: false
    },
    {
      question: 'What delivery services do you use?',
      answer: 'We are available on Grabfood, Shopeefood, and GoFood from 10:00 AM – 8:45 PM for your convenience.',
      category: 'delivery',
      isOpen: false
    },
    {
      question: 'Do you deliver to my area?',
      answer: 'Please check our delivery coverage on Grab, Shopee, or GoFood apps. We are constantly expanding our delivery zones.',
      category: 'delivery',
      isOpen: false
    },
    {
      question: 'How long does delivery take?',
      answer: 'Delivery time typically ranges from 30-45 minutes depending on your location and traffic conditions.',
      category: 'delivery',
      isOpen: false
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept cash, credit/debit cards, and all major e-wallets including Momo, ZaloPay, and bank transfers.',
      category: 'payment',
      isOpen: false
    },
    {
      question: 'Can I pay online?',
      answer: 'Yes! You can pay through delivery apps or directly via bank transfer. Contact us for payment details.',
      category: 'payment',
      isOpen: false
    },
    {
      question: 'Do you offer any discounts or promotions?',
      answer: 'Yes! Follow us on Facebook and Instagram for regular promotions, discount codes, and special offers.',
      category: 'payment',
      isOpen: false
    }
  ];

  toggleFaq(faq: FAQ): void {
    faq.isOpen = !faq.isOpen;
  }

  switchTab(tab: 'menu' | 'food' | 'delivery' | 'payment'): void {
    this.activeTab = tab;
  }

  getFilteredFaqs(): FAQ[] {
    return this.faqs.filter(faq => faq.category === this.activeTab);
  }
}
