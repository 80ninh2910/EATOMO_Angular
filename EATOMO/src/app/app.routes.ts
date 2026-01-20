import { Routes } from '@angular/router';
import { HomeComponent } from './home.component';
import { AboutUsComponent } from './pages/about-us/about-us.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { StoresComponent } from './pages/stores/stores.component';
import { FaqsComponent } from './pages/faqs/faqs.component';
import { OurBowlsComponent } from './pages/our-bowls/our-bowls.component';
import { BuildYourOwnComponent } from './pages/build-your-own/build-your-own.component';
import { OrdersComponent } from './pages/orders/orders.component';
import { StaticPageComponent } from './static-page.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'index', component: HomeComponent },
  { path: 'about-us', component: AboutUsComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'stores', component: StoresComponent },
  { path: 'faqs', component: FaqsComponent },
  { path: 'our-bowls', component: OurBowlsComponent },
  { path: 'build-your-own', component: BuildYourOwnComponent },
  { path: 'orders', component: OrdersComponent },
  
  // Temporary routes using StaticPageComponent for pages not yet converted
  { path: 'admin', component: StaticPageComponent, data: { file: 'admin.html' } },
  { path: 'order-confirmation', component: StaticPageComponent, data: { file: 'order-confirmation.html' } },
  { path: 'analytics', component: StaticPageComponent, data: { file: 'pages/analytics.html' } },
  { path: 'customers', component: StaticPageComponent, data: { file: 'pages/customers.html' } },
  { path: 'dashboard', component: StaticPageComponent, data: { file: 'pages/dashboard.html' } },
  { path: 'menu', component: StaticPageComponent, data: { file: 'pages/menu.html' } },
  { path: 'orders-admin', component: StaticPageComponent, data: { file: 'pages/orders.html' } },
  
  { path: '**', redirectTo: '' }
];
