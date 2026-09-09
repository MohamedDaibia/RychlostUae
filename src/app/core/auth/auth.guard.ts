import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from './auth.service';

// Protects /admin/cms - redirects to login (with a returnUrl) when there's no
// valid token. The CMS page itself also relies on the API rejecting an
// expired/invalid token, so this guard is a UX shortcut, not the only gate.
export const authGuard: CanActivateFn = (_route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/admin/login'], { queryParams: { returnUrl: state.url } });
};
