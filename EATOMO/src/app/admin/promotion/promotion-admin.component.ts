import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-promotion-admin',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './promotion-admin.component.html',
  styleUrl: './promotion-admin.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PromotionAdminComponent {}
