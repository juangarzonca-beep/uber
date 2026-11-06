import { CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonItem,
  IonToggle,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  AlertController,
} from '@ionic/angular';

import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { STATUS, list } from '../../core/labels';
import { UiService } from '../../core/ui.service';

@Component({
  selector: 'app-driver-home',
  standalone: true,
  imports: [
    CurrencyPipe,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonItem,
    IonToggle,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
  ],
  template: ` <ion-header
      ><ion-toolbar color="dark">
        <ion-title>Conductor</ion-title>
        <ion-buttons slot="end"><ion-button (click)="logout()">Salir</ion-button></ion-buttons>
      </ion-toolbar></ion-header
    >

    <ion-content class="ion-padding">
      <ion-item lines="none">
        <ion-toggle [checked]="available" [disabled]="!!trip" (ionChange)="toggle($event)">{{
          available ? 'En línea' : 'Desconectado'
        }}</ion-toggle>
      </ion-item>

      @if (trip) {
        <ion-card>
          <ion-card-header>
            <ion-card-subtitle>{{ label(trip.status) }}</ion-card-subtitle>
            <ion-card-title>Viaje #{{ trip.id }}</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <p>
              <b>{{ trip.origin_name }}</b> → <b>{{ trip.destination_name }}</b>
            </p>
            @if (trip.client) {
              <p>
                Pasajero: {{ trip.client.name }} · <a [href]="'tel:' + trip.client.phone">{{ trip.client.phone }}</a>
              </p>
            }
            <p>Tarifa estimada: {{ trip.estimated_fare | currency: 'COP' : 'symbol-narrow' : '1.0-0' }}</p>
            <ion-button expand="block" (click)="step()">{{ stepText }}</ion-button>
          </ion-card-content>
        </ion-card>
      } @else if (available) {
        <h3>Solicitudes disponibles</h3>
        @for (r of requests; track r.id) {
          <ion-card>
            <ion-card-header>
              <ion-card-subtitle
                >{{ r.estimated_distance_km }} km ·
                {{ r.estimated_fare | currency: 'COP' : 'symbol-narrow' : '1.0-0' }}</ion-card-subtitle
              >
              <ion-card-title>{{ r.client?.name }}</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <p>{{ r.origin_name }} → {{ r.destination_name }}</p>
              <ion-button expand="block" (click)="accept(r)">Aceptar</ion-button>
            </ion-card-content>
          </ion-card>
        } @empty {
          <p>No hay solicitudes por ahora. Se actualiza solo cada 5 segundos.</p>
        }
      } @else {
        <p>Conéctate para recibir solicitudes. Solo los conductores aprobados por un administrador pueden hacerlo.</p>
      }
    </ion-content>`,
})
export class DriverHomePage {
  private auth = inject(AuthService);
  private api = inject(ApiService);
  private ui = inject(UiService);
  private alert = inject(AlertController);

  available = localStorage.getItem('driver_available') === '1';
  trip: any = JSON.parse(localStorage.getItem('driver_trip') || 'null');
  requests: any[] = [];
  private poll: any;
  private gps: any;

  label = (s: string): string => STATUS[s] ?? s;
  get stepText(): string {
    return (
      (
        {
          assigned: 'Llegué al punto de recogida',
          driver_arrived: 'Iniciar viaje',
          in_progress: 'Finalizar viaje',
        } as any
      )[this.trip.status] ?? ''
    );
  }

  ionViewWillEnter(): void {
    this.start();
  }
  ionViewWillLeave(): void {
    this.stop();
  }

  private start(): void {
    this.stop();
    if (this.available && !this.trip) {
      this.loadRequests();
      this.poll = setInterval(() => this.loadRequests(), 5000);
    }
    if (this.available || this.trip) {
      this.sendGps();
      this.gps = setInterval(() => this.sendGps(), 10000);
    }
  }
  private stop(): void {
    clearInterval(this.poll);
    clearInterval(this.gps);
  }

  private setTrip(t: any): void {
    this.trip = t;
    if (t) {
      localStorage.setItem('driver_trip', JSON.stringify(t));
    } else {
      localStorage.removeItem('driver_trip');
    }
  }
  private setAvailable(v: boolean): void {
    this.available = v;
    localStorage.setItem('driver_available', v ? '1' : '0');
  }

  toggle(ev: any): void {
    const on: boolean = ev.detail.checked;
    if (on === this.available) return;
    this.api.setAvailability(on ? 'available' : 'unavailable').subscribe({
      next: () => {
        this.setAvailable(on);
        this.start();
      },
      error: (e) => {
        this.ui.err(e);
        ev.target.checked = !on;
      },
    });
  }

  loadRequests(): void {
    this.api.driverRequests().subscribe({ next: (r) => (this.requests = list(r.requests)), error: () => {} });
  }

  private sendGps(): void {
    navigator.geolocation.getCurrentPosition(
      (p) =>
        this.api
          .sendLocation({
            latitude: p.coords.latitude,
            longitude: p.coords.longitude,
            heading: p.coords.heading ?? undefined,
            speed: p.coords.speed ?? undefined,
            trip_id: this.trip?.id,
          })
          .subscribe({ error: () => {} }),
      () => {},
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  accept(r: any): void {
    this.api.accept(r.id).subscribe({
      next: (res) => {
        this.setTrip({
          ...res.trip,
          origin_name: r.origin_name,
          destination_name: r.destination_name,
          client: r.client,
          estimated_distance_km: r.estimated_distance_km,
        });
        this.ui.toast(res.message, 'success');
        this.start();
      },
      error: (e) => {
        this.ui.err(e);
        this.loadRequests();
      },
    });
  }

  step(): void {
    const s = this.trip.status;
    if (s === 'assigned') this.call('arrive');
    else if (s === 'driver_arrived') this.call('start');
    else if (s === 'in_progress') this.finish();
  }

  private call(action: 'arrive' | 'start'): void {
    this.api.tripAction(this.trip.id, action).subscribe({
      next: (r) => {
        this.setTrip({ ...this.trip, ...r.trip });
        this.ui.toast(r.message, 'success');
      },
      error: (e) => this.ui.err(e),
    });
  }

  private async finish(): Promise<void> {
    const a = await this.alert.create({
      header: 'Finalizar viaje',
      inputs: [
        { name: 'km', type: 'number', placeholder: 'Distancia real (km)', value: this.trip.estimated_distance_km },
        { name: 'min', type: 'number', placeholder: 'Duración real (min)' },
      ],
      buttons: [
        { text: 'Volver', role: 'cancel' },
        { text: 'Finalizar', handler: (v: any) => this.complete(v) },
      ],
    });
    a.present();
  }

  private complete(v: any): boolean {
    const km = Number(v.km),
      min = Number(v.min);
    if (!(km > 0) || !(min > 0)) {
      this.ui.toast('Ingresa distancia y duración reales', 'warning');
      return false;
    }
    this.api.tripAction(this.trip.id, 'complete', { actual_distance_km: km, actual_duration_min: min }).subscribe({
      next: (r) => {
        this.ui.toast(`${r.message} Tarifa final: $${r.trip.final_fare}`, 'success');
        this.setTrip(null);
        this.setAvailable(true);
        this.start();
      },
      error: (e) => this.ui.err(e),
    });
    return true;
  }

  logout(): void {
    this.stop();
    this.auth.logout();
  }
}
