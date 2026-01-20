import { Component, AfterViewInit, ElementRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../shared/header/header.component';
import { FooterComponent } from '../../shared/footer/footer.component';

interface Store {
  name: string;
  address: string;
  hours: string;
  image: string;
}

@Component({
  selector: 'app-stores',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent],
  templateUrl: './stores.component.html',
  styleUrl: './stores.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StoresComponent implements AfterViewInit {
  constructor(private elementRef: ElementRef) {}
  stores: Store[] = [
    {
      name: 'Soumaki Phu My Hung',
      address: 'S27-1, Sky Garden 1, Tan Hung, Ho Chi Minh City (District 7)',
      hours: '10 A.M – 9 P.M (every day)',
      image: '/assets/healthy/images/stores/Store-nohope_Store_Store-jpg.avif'
    },
    {
      name: 'Soumaki Ly Tu Trong',
      address: '42 Ly Tu Trong, Ben Nghe, Ho Chi Minh City (District 1)',
      hours: '10 A.M – 9 P.M (every day)',
      image: '/assets/healthy/images/stores/Store-web-jpg.avif'
    },
    {
      name: 'Soumaki Nguyen Van Huong',
      address: '250 Nguyen Van Huong, An Khanh Ward, Ho Chi Minh City',
      hours: '10 A.M – 9 P.M (everyday)',
      image: '/assets/healthy/images/stores/10_05_2025_soumaki_3d_concept_page-0002-3-scaled-e1753158565499.avif'
    }
  ];

  ngAfterViewInit(): void {
    const video = this.elementRef.nativeElement.querySelector('.background-video') as HTMLVideoElement;
    if (video) {
      video.muted = true;
      video.volume = 0;
    }
  }
}
