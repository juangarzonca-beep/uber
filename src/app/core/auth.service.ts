import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { type Observable, tap } from 'rxjs';

import { API_URL } from './config';

export type Role = 'admin' | 'client' | 'driver';
export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  status: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  user = signal<User | null>(JSON.parse(localStorage.getItem('user') || 'null'));
  get token(): string | null {
    return localStorage.getItem('token');
  }

  homeOf(role: Role): string {
    return role === 'admin' ? '/admin' : role === 'driver' ? '/driver' : '/client';
  }

  private save(r: any): void {
    localStorage.setItem('token', r.access_token);
    localStorage.setItem('user', JSON.stringify(r.user));
    this.user.set(r.user);
  }

  login(login: string, password: string): Observable<any> {
    return this.http.post<any>(`${API_URL}/auth/login`, { login, password }).pipe(tap((r) => this.save(r)));
  }
  register(body: any): Observable<any> {
    return this.http.post<any>(`${API_URL}/auth/register`, body).pipe(tap((r) => this.save(r)));
  }
  forgot(email: string, new_password: string): Observable<any> {
    return this.http.post<any>(`${API_URL}/auth/forgot-password`, { email, new_password });
  }
  logout(): void {
    this.http.post(`${API_URL}/auth/logout`, {}).subscribe({ next: () => this.clear(), error: () => this.clear() });
  }
  clear(): void {
    ['token', 'user', 'driver_trip', 'driver_available'].forEach((k) => localStorage.removeItem(k));
    this.user.set(null);
    this.router.navigateByUrl('/login');
  }
}
