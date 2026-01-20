import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Auth Guard - Bảo vệ các routes yêu cầu đăng nhập
 * 
 * Cách dùng trong routes:
 * {
 *   path: 'checkout',
 *   component: CheckoutComponent,
 *   canActivate: [authGuard]
 * }
 */
export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    // User đã đăng nhập, cho phép truy cập
    return true;
  }

  // User chưa đăng nhập
  // Lưu URL hiện tại để redirect lại sau khi login thành công
  authService.setRedirectUrl(state.url);
  
  // Redirect to login page
  router.navigate(['/login'], {
    queryParams: { returnUrl: state.url }
  });
  
  return false;
};

/**
 * Admin Guard - Chỉ cho phép admin truy cập
 */
export const adminGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn() && authService.isAdmin()) {
    return true;
  }

  if (authService.isLoggedIn()) {
    // User đã đăng nhập nhưng không phải admin
    router.navigate(['/']);
    return false;
  }

  // Chưa đăng nhập
  authService.setRedirectUrl(state.url);
  router.navigate(['/login']);
  return false;
};
