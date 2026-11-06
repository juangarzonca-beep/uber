import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';

import { API_URL as B } from './config';

const params = (o: any = {}): HttpParams => {
  let p = new HttpParams();
  Object.entries(o).forEach(([k, v]) => {
    if (v !== '' && v != null) p = p.set(k, String(v));
  });
  return p;
};

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  // Cliente
  fare(): Observable<any> {
    return this.http.get<any>(`${B}/fares/active`);
  }
  estimate(b: any): Observable<any> {
    return this.http.post<any>(`${B}/client/estimate-fare`, b);
  }
  requestRide(b: any): Observable<any> {
    return this.http.post<any>(`${B}/client/ride-requests`, b);
  }
  clientActive(): Observable<any> {
    return this.http.get<any>(`${B}/client/active`);
  }
  cancel(id: number, reason: string): Observable<any> {
    return this.http.post<any>(`${B}/client/cancel/${id}`, { reason });
  }
  clientTrips(): Observable<any> {
    return this.http.get<any>(`${B}/client/trips`);
  }
  rate(id: number, b: any): Observable<any> {
    return this.http.post<any>(`${B}/client/trips/${id}/rating`, b);
  }

  // Conductor
  setAvailability(status: 'available' | 'unavailable'): Observable<any> {
    return this.http.put<any>(`${B}/driver/availability`, { status });
  }
  driverRequests(): Observable<any> {
    return this.http.get<any>(`${B}/driver/ride-requests`);
  }
  accept(id: number): Observable<any> {
    return this.http.post<any>(`${B}/driver/ride-requests/${id}/accept`, {});
  }
  tripAction(id: number, action: 'arrive' | 'start' | 'complete', body: any = {}): Observable<any> {
    return this.http.post<any>(`${B}/driver/trips/${id}/${action}`, body);
  }
  sendLocation(b: any): Observable<any> {
    return this.http.post<any>(`${B}/driver/location`, b);
  }

  // Administrador
  dashboard(): Observable<any> {
    return this.http.get<any>(`${B}/admin/dashboard`);
  }
  drivers(approval_status = ''): Observable<any> {
    return this.http.get<any>(`${B}/admin/drivers`, { params: params({ approval_status }) });
  }
  approve(id: number, approval_status: string, admin_notes: string): Observable<any> {
    return this.http.patch<any>(`${B}/admin/drivers/${id}/approval`, { approval_status, admin_notes });
  }
  fares(): Observable<any> {
    return this.http.get<any>(`${B}/admin/fares`);
  }
  createFare(b: any): Observable<any> {
    return this.http.post<any>(`${B}/admin/fares`, b);
  }
  adminTrips(f: any = {}): Observable<any> {
    return this.http.get<any>(`${B}/admin/trips`, { params: params(f) });
  }
  reports(): Observable<any> {
    return this.http.get<any>(`${B}/admin/reports`);
  }
  audit(): Observable<any> {
    return this.http.get<any>(`${B}/admin/audit-logs`);
  }
}
