import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AdminAiChatbotComponent } from './shared/admin-ai-chatbot/admin-ai-chatbot.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, AdminAiChatbotComponent],
  template: `
    <router-outlet></router-outlet>
    <app-admin-ai-chatbot></app-admin-ai-chatbot>
  `,
  styleUrl: './app.css'
})
export class App {
}

