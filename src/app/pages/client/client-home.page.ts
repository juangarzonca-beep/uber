import { CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonItem,
  IonInput,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonRefresher,
  IonRefresherContent,
  AlertController,
} from '@ionic/angular';

import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { STATUS } from '../../core/labels';
import { UiService } from '../../core/ui.service';

@Component({
  selector: 'app-client-home',
  standalone: true,
  imports: [
    CurrencyPipe,
    FormsModule,
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonItem,
    IonInput,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonRefresher,
    IonRefresherContent,
  ],
  template: ` <ion-header
      ><ion-toolbar color="dark">
        <ion-title>Pedir viaje</ion-title>
        <ion-buttons slot="end">
          <ion-button routerLink="/client/history">Historial</ion-button>
          <ion-button (click)="auth.logout()">Salir</ion-button>
        </ion-buttons>
      </ion-toolbar></ion-header
    >

    <ion-content class="ion-padding">
      <ion-refresher slot="fixed" (ionRefresh)="refresh($event)"
        ><ion-refresher-content></ion-refresher-content
      ></ion-refresher>

      @if (active) {
        <ion-card>
          <ion-card-header>
            <ion-card-subtitle>{{ label(d.status) }}</ion-card-subtitle>
            <ion-card-title>{{ active.type === 'trip' ? 'Tu viaje' : 'Buscando conductor...' }}</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <p>
              Tarifa estimada: <b>{{ d.estimated_fare | currency: 'COP' : 'symbol-narrow' : '1.0-0' }}</b>
            </p>
            @if (active.type === 'trip') {
              <p>
                Conductor: <b>{{ d.driver?.user?.name }}</b> · {{ d.driver?.rating_average }} ★
              </p>
              <p>
                Teléfono: <a [href]="'tel:' + d.driver?.user?.phone">{{ d.driver?.user?.phone }}</a>
              </p>
              <p>
                Vehículo: {{ d.vehicle?.brand }} {{ d.vehicle?.model }} · {{ d.vehicle?.color }} ·
                <b>{{ d.vehicle?.plate }}</b>
              </p>
              @if (loc) {
                <a [href]="'https://www.google.com/maps?q=' + loc.latitude + ',' + loc.longitude" target="_blank"
                  >Ver al conductor en el mapa</a
                >
              }
            }
            @if (d.status !== 'in_progress') {
              <ion-button color="danger" fill="outline" expand="block" class="ion-margin-top" (click)="cancel()"
                >Cancelar</ion-button
              >
            }
          </ion-card-content>
        </ion-card>
      } @else {
        <ion-item
          ><ion-input label="Origen (nombre)" labelPlacement="floating" [(ngModel)]="f.origin_name"></ion-input
        ></ion-item>
        <ion-item
          ><ion-input
            type="number"
            label="Latitud origen"
            labelPlacement="floating"
            [(ngModel)]="f.origin_latitude"
          ></ion-input
        ></ion-item>
        <ion-item
          ><ion-input
            type="number"
            label="Longitud origen"
            labelPlacement="floating"
            [(ngModel)]="f.origin_longitude"
          ></ion-input
        ></ion-item>
        <ion-button size="small" fill="outline" (click)="here()">Usar mi ubicación</ion-button>

        <ion-item class="ion-margin-top"
          ><ion-input label="Destino (nombre)" labelPlacement="floating" [(ngModel)]="f.destination_name"></ion-input
        ></ion-item>
        <ion-item
          ><ion-input
            type="number"
            label="Latitud destino"
            labelPlacement="floating"
            [(ngModel)]="f.destination_latitude"
          ></ion-input
        ></ion-item>
        <ion-item
          ><ion-input
            type="number"
            label="Longitud destino"
            labelPlacement="floating"
            [(ngModel)]="f.destination_longitude"
          ></ion-input
        ></ion-item>

        <ion-button expand="block" fill="outline" class="ion-margin-top" (click)="estimate()" [disabled]="busy"
          >Calcular tarifa</ion-button
        >
        @if (est) {
          <ion-card
            ><ion-card-content>
              {{ est.distance_km }} km · {{ est.duration_min }} min ·
              <b>{{ est.estimated_fare | currency: 'COP' : 'symbol-narrow' : '1.0-0' }}</b>
            </ion-card-content></ion-card
          >
        }
        <ion-button expand="block" (click)="request()" [disabled]="busy">Solicitar viaje</ion-button>
      }
    </ion-content>`,
})
export class ClientHomePage {
  auth = inject(AuthService);
  private api = inject(ApiService);
  private ui = inject(UiService);
  private alert = inject(AlertController);
  private router = inject(Router);

  active: any = null;
  est: any = null;
  busy = false;
  private timer: any;
  f: any = {
    origin_name: '',
    origin_latitude: null,
    origin_longitude: null,
    destination_name: '',
    destination_latitude: null,
    destination_longitude: null,
  };

  label = (s: string): string => STATUS[s] ?? s;
  get d(): any {
    return this.active?.data;
  }
  get loc(): any {
    return this.d?.driver?.latest_location;
  }

  ionViewWillEnter(): void {
    this.load();
    this.timer = setInterval(() => this.load(true), 5000);
  }
  ionViewWillLeave(): void {
    clearInterval(this.timer);
  }
  refresh(ev: any): void {
    this.load();
    setTimeout(() => ev.target.complete(), 600);
  }

  load(silent = false): void {
    this.api.clientActive().subscribe({
      next: (r) => {
        const wasTrip = this.active?.type === 'trip';
        this.active = r.has_active ? r : null;
        if (wasTrip && !this.active) {
          this.ui.toast('Tu viaje terminó. Puedes calificarlo en el historial.', 'success');
          this.router.navigateByUrl('/client/history');
        }
      },
      error: (e) => {
        if (!silent) this.ui.err(e);
      },
    });
  }

  here(): void {
    navigator.geolocation.getCurrentPosition(
      (p) => {
        this.f.origin_latitude = +p.coords.latitude.toFixed(6);
        this.f.origin_longitude = +p.coords.longitude.toFixed(6);
        if (!this.f.origin_name) this.f.origin_name = 'Mi ubicación actual';
      },
      () => this.ui.toast('No se pudo obtener tu ubicación', 'warning'),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  private body(): any {
    const f = this.f;
    const nums = [f.origin_latitude, f.origin_longitude, f.destination_latitude, f.destination_longitude];
    if (nums.some((n) => n === null || n === '' || isNaN(Number(n)))) {
      this.ui.toast('Completa las coordenadas de origen y destino', 'warning');
      return null;
    }
    return {
      origin_name: f.origin_name,
      origin_latitude: +f.origin_latitude,
      origin_longitude: +f.origin_longitude,
      destination_name: f.destination_name,
      destination_latitude: +f.destination_latitude,
      destination_longitude: +f.destination_longitude,
    };
  }

  estimate(): void {
    const b = this.body();
    if (!b) return;
    this.busy = true;
    this.api.estimate(b).subscribe({
      next: (r) => {
        this.busy = false;
        this.est = r.estimate;
      },
      error: (e) => {
        this.busy = false;
        this.ui.err(e);
      },
    });
  }

  request(): void {
    const b = this.body();
    if (!b) return;
    if (!b.origin_name || !b.destination_name) {
      this.ui.toast('Escribe el nombre del origen y del destino', 'warning');
      return;
    }
    this.busy = true;
    this.api.requestRide(b).subscribe({
      next: (r) => {
        this.busy = false;
        this.est = null;
        this.ui.toast(r.message, 'success');
        this.load();
      },
      error: (e) => {
        this.busy = false;
        this.ui.err(e);
        if (e.status === 400) this.load();
      },
    });
  }

  async cancel(): Promise<void> {
    const a = await this.alert.create({
      header: 'Cancelar viaje',
      inputs: [{ name: 'reason', placeholder: 'Motivo (opcional)' }],
      buttons: [
        { text: 'Volver', role: 'cancel' },
        {
          text: 'Cancelar viaje',
          role: 'destructive',
          handler: (v: any) => this.doCancel(v.reason || 'Cancelado por el usuario'),
        },
      ],
    });
    a.present();
  }

  private doCancel(reason: string): void {
    const id = this.d.request_id ?? this.d.id;
    this.api.cancel(id, reason).subscribe({
      next: (r) => {
        this.ui.toast(r.message, 'success');
        this.load();
      },
      error: (e) => this.ui.err(e),
    });
  }
}
