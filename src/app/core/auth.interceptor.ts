import type { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.token;
  const r = req.clone({
    setHeaders: { Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  return next(r).pipe(
    catchError((e) => {
      if (e.status === 401 && !req.url.includes('/auth/login')) auth.clear();
      return throwError(() => e);
    }),
  );
};
