import type { Routes } from '@angular/router';

import { roleGuard } from './core/guards';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./pages/login.page').then((m) => m.LoginPage) },
  { path: 'register', loadComponent: () => import('./pages/register.page').then((m) => m.RegisterPage) },
  { path: 'forgot', loadComponent: () => import('./pages/forgot.page').then((m) => m.ForgotPage) },
  {
    path: 'client',
    canActivate: [roleGuard('client')],
    loadComponent: () => import('./pages/client/client-home.page').then((m) => m.ClientHomePage),
  },
  {
    path: 'client/history',
    canActivate: [roleGuard('client')],
    loadComponent: () => import('./pages/client/client-history.page').then((m) => m.ClientHistoryPage),
  },
  {
    path: 'driver',
    canActivate: [roleGuard('driver')],
    loadComponent: () => import('./pages/driver/driver-home.page').then((m) => m.DriverHomePage),
  },
  {
    path: 'admin',
    canActivate: [roleGuard('admin')],
    loadComponent: () => import('./pages/admin/admin-home.page').then((m) => m.AdminHomePage),
  },
  { path: '**', redirectTo: 'login' },
];
