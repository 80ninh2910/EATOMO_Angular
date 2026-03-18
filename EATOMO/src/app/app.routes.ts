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
import { VouchersComponent } from './pages/vouchers/vouchers.component';
import { OrderAdminComponent } from './admin/order/order-admin.component';
import { ProductAdminComponent } from './admin/product/product-admin.component';
import { CustomerAdminComponent } from './admin/customer/customer-admin.component';
import { PromotionAdminComponent } from './admin/promotion/promotion-admin.component';
import { ReportAdminComponent } from './admin/report/report-admin.component';
import { authGuard, adminGuard } from './guards/auth.guard';

export const routes: Routes = [
  // ───── Public routes ─────
  { path: '', component: HomeComponent },
  { path: 'index', component: HomeComponent },
  { path: 'about-us', component: AboutUsComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'stores', component: StoresComponent },
  { path: 'faqs', component: FaqsComponent },
  { path: 'our-bowls', component: OurBowlsComponent },
  { path: 'build-your-own', component: BuildYourOwnComponent },

  // ───── User routes (cần đăng nhập) ─────
  { path: 'orders', component: OrdersComponent, canActivate: [authGuard] },
  { path: 'vouchers', component: VouchersComponent },

  // ───── Admin routes (cần admin role) ─────
  {
    path: 'admin',
    canActivate: [adminGuard],
    children: [
      { path: '', component: OrderAdminComponent },
      { path: 'product', component: ProductAdminComponent },
      { path: 'customer', component: CustomerAdminComponent },
      { path: 'promotion', component: PromotionAdminComponent },
      { path: 'report', component: ReportAdminComponent },
    ]
  },

  { path: '**', redirectTo: '' }
];
