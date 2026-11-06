import { inject } from '@angular/core';
import type { CanActivateFn } from '@angular/router';
import { Router } from '@angular/router';

import type { Role } from './auth.service';
import { AuthService } from './auth.service';

export const roleGuard =
  (role: Role): CanActivateFn =>
  () => {
    const auth = inject(AuthService);
    const u = auth.user();
    return u && auth.token && u.role === role ? true : inject(Router).createUrlTree(['/login']);
  };
