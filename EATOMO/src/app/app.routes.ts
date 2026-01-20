import { Routes } from '@angular/router';
import { HomeComponent } from './home.component';
import { AboutUsComponent } from './pages/about-us/about-us.component';
import { LoginComponent } from './pages/login/login.component';
import { StoresComponent } from './pages/stores/stores.component';
import { FaqsComponent } from './pages/faqs/faqs.component';
import { StaticPageComponent } from './static-page.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'index', component: HomeComponent },
  { path: 'about-us', component: AboutUsComponent },
  { path: 'login', component: LoginComponent },
  { path: 'stores', component: StoresComponent },
  { path: 'faqs', component: FaqsComponent },
  
  // Temporary routes using StaticPageComponent for pages not yet converted
  { path: 'admin', component: StaticPageComponent, data: { file: 'admin.html' } },
  { path: 'build-your-own', component: StaticPageComponent, data: { file: 'build-your-own.html' } },
  { path: 'order-confirmation', component: StaticPageComponent, data: { file: 'order-confirmation.html' } },
  { path: 'orders', component: StaticPageComponent, data: { file: 'orders.html' } },
  { path: 'our-bowls', component: StaticPageComponent, data: { file: 'our-bowls.html' } },
  { path: 'register', component: StaticPageComponent, data: { file: 'register.html' } },
  { path: 'analytics', component: StaticPageComponent, data: { file: 'pages/analytics.html' } },
  { path: 'customers', component: StaticPageComponent, data: { file: 'pages/customers.html' } },
  { path: 'dashboard', component: StaticPageComponent, data: { file: 'pages/dashboard.html' } },
  { path: 'menu', component: StaticPageComponent, data: { file: 'pages/menu.html' } },
  { path: 'orders-admin', component: StaticPageComponent, data: { file: 'pages/orders.html' } },
  
  { path: '**', redirectTo: '' }
];
