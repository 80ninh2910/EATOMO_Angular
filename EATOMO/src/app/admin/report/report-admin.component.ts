import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-report-admin',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './report-admin.component.html',
  styleUrl: './report-admin.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportAdminComponent {}
