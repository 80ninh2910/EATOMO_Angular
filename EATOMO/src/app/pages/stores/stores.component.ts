import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../shared/header/header.component';
import { FooterComponent } from '../../shared/footer/footer.component';

@Component({
  selector: 'app-stores',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent],
  templateUrl: './stores.component.html',
  styleUrl: './stores.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StoresComponent {
  stores = [
    {
      name: 'Main Store',
      address: '669 QL1A, khu phố 6, Thủ Đức, Hồ Chí Minh',
      phone: '0326238700',
      hours: '10AM - 9PM',
      image: 'assets/healthy/images/index/stores.avif'
    }
  ];
}
