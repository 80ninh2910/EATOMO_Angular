import { Component } from '@angular/core';
import { NgIf } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-static-page',
  standalone: true,
  imports: [NgIf],
  template: `
    <div class="frame-wrapper" *ngIf="safeUrl">
      <iframe class="frame" [src]="safeUrl" title="Static page" loading="lazy"></iframe>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
    }
    .frame-wrapper {
      width: 100%;
      min-height: 100vh;
    }
    .frame {
      width: 100%;
      height: 100vh;
      border: 0;
    }
  `]
})
export class StaticPageComponent {
  protected safeUrl: SafeResourceUrl | null = null;

  constructor(route: ActivatedRoute, sanitizer: DomSanitizer) {
    const file = route.snapshot.data['file'] as string;
    const target = file ? `assets/healthy/html/${file}` : null;
    this.safeUrl = target ? sanitizer.bypassSecurityTrustResourceUrl(target) : null;
  }
}
