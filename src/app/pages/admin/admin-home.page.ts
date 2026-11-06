import { CurrencyPipe, JsonPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonItem,
  IonInput,
  IonLabel,
  IonList,
  IonBadge,
  IonToggle,
  IonSegment,
  IonSegmentButton,
  IonSelect,
  IonSelectOption,
  IonCard,
  IonCardContent,
  IonRefresher,
  IonRefresherContent,
  AlertController,
} from '@ionic/angular';

import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { STATUS, list } from '../../core/labels';
import { UiService } from '../../core/ui.service';

const STAT_LABELS: Record<string, string> = {
  total_clients: 'Clientes',
  total_drivers: 'Conductores',
  pending_drivers: 'Conductores pendientes',
  approved_drivers: 'Conductores aprobados',
  active_trips: 'Viajes activos',
  completed_trips: 'Viajes completados',
  cancelled_trips: 'Viajes cancelados',
  pending_requests: 'Solicitudes pendientes',
  total_revenue: 'Ingresos (COP)',
};

@Component({
  selector: 'app-admin-home',
  standalone: true,
  imports: [
    CurrencyPipe,
    JsonPipe,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonItem,
    IonInput,
    IonLabel,
    IonList,
    IonBadge,
    IonToggle,
    IonSegment,
    IonSegmentButton,
    IonSelect,
    IonSelectOption,
    IonCard,
    IonCardContent,
    IonRefresher,
    IonRefresherContent,
  ],
  template: ` <ion-header>
      <ion-toolbar color="dark">
        <ion-title>Administrador</ion-title>
        <ion-buttons slot="end"><ion-button (click)="auth.logout()">Salir</ion-button></ion-buttons>
      </ion-toolbar>
      <ion-toolbar>
        <ion-segment scrollable [value]="tab" (ionChange)="go($event.detail.value)">
          <ion-segment-button value="dashboard"><ion-label>Resumen</ion-label></ion-segment-button>
          <ion-segment-button value="drivers"><ion-label>Conductores</ion-label></ion-segment-button>
          <ion-segment-button value="fares"><ion-label>Tarifas</ion-label></ion-segment-button>
          <ion-segment-button value="trips"><ion-label>Viajes</ion-label></ion-segment-button>
          <ion-segment-button value="reports"><ion-label>Reportes</ion-label></ion-segment-button>
          <ion-segment-button value="audit"><ion-label>Auditoría</ion-label></ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-refresher slot="fixed" (ionRefresh)="refresh($event)"
        ><ion-refresher-content></ion-refresher-content
      ></ion-refresher>

      @switch (tab) {
        @case ('dashboard') {
          <div class="grid">
            @for (k of statKeys; track k) {
              <ion-card
                ><ion-card-content>
                  <small>{{ statLabel(k) }}</small>
                  <h2>
                    {{ k === 'total_revenue' ? (stats[k] | currency: 'COP' : 'symbol-narrow' : '1.0-0') : stats[k] }}
                  </h2>
                </ion-card-content></ion-card
              >
            }
          </div>
        }

        @case ('drivers') {
          <ion-select
            label="Filtrar"
            [value]="driverFilter"
            (ionChange)="driverFilter = $event.detail.value; loadDrivers()"
          >
            <ion-select-option value="">Todos</ion-select-option>
            <ion-select-option value="pending">Pendientes</ion-select-option>
            <ion-select-option value="approved">Aprobados</ion-select-option>
            <ion-select-option value="suspended">Suspendidos</ion-select-option>
            <ion-select-option value="rejected">Rechazados</ion-select-option>
          </ion-select>
          <ion-list>
            @for (d of drivers; track d.id) {
              <ion-item button (click)="review(d)">
                <ion-label>
                  <h2>{{ d.user?.name }}</h2>
                  <p>{{ d.user?.email }} · Lic. {{ d.license_number }}</p>
                  @for (v of d.vehicles; track v.plate) {
                    <p>{{ v.brand }} {{ v.model }} {{ v.year }} · {{ v.plate }}</p>
                  }
                </ion-label>
                <ion-badge
                  slot="end"
                  [color]="
                    d.approval_status === 'approved'
                      ? 'success'
                      : d.approval_status === 'pending'
                        ? 'warning'
                        : 'danger'
                  "
                  >{{ d.approval_status }}</ion-badge
                >
              </ion-item>
            } @empty {
              <ion-item><ion-label>Sin resultados.</ion-label></ion-item>
            }
          </ion-list>
        }

        @case ('fares') {
          <ion-button expand="block" fill="outline" (click)="showFare = !showFare">{{
            showFare ? 'Cerrar formulario' : 'Nueva tarifa'
          }}</ion-button>
          @if (showFare) {
            <ion-item><ion-input label="Nombre" labelPlacement="floating" [(ngModel)]="nf.name"></ion-input></ion-item>
            <ion-item
              ><ion-input
                type="number"
                label="Tarifa base"
                labelPlacement="floating"
                [(ngModel)]="nf.base_fare"
              ></ion-input
            ></ion-item>
            <ion-item
              ><ion-input
                type="number"
                label="Precio por km"
                labelPlacement="floating"
                [(ngModel)]="nf.price_per_km"
              ></ion-input
            ></ion-item>
            <ion-item
              ><ion-input
                type="number"
                label="Precio por minuto"
                labelPlacement="floating"
                [(ngModel)]="nf.price_per_minute"
              ></ion-input
            ></ion-item>
            <ion-item
              ><ion-input
                type="number"
                label="Tarifa mínima"
                labelPlacement="floating"
                [(ngModel)]="nf.minimum_fare"
              ></ion-input
            ></ion-item>
            <ion-item
              ><ion-input
                type="number"
                label="Multiplicador (surge)"
                labelPlacement="floating"
                [(ngModel)]="nf.surge_multiplier"
              ></ion-input
            ></ion-item>
            <ion-item><ion-toggle [(ngModel)]="nf.active">Activa</ion-toggle></ion-item>
            <ion-button expand="block" (click)="createFare()">Guardar tarifa</ion-button>
          }
          <ion-list>
            @for (f of fares; track f.id) {
              <ion-item>
                <ion-label>
                  <h2>{{ f.name }}</h2>
                  <p>
                    Base {{ f.base_fare | currency: 'COP' : 'symbol-narrow' : '1.0-0' }} · {{ f.price_per_km }}/km ·
                    {{ f.price_per_minute }}/min · mín. {{ f.minimum_fare }} · x{{ f.surge_multiplier }}
                  </p>
                </ion-label>
                @if (f.active) {
                  <ion-badge slot="end" color="success">Activa</ion-badge>
                }
              </ion-item>
            }
          </ion-list>
        }

        @case ('trips') {
          <ion-select label="Estado" [value]="tripStatus" (ionChange)="tripStatus = $event.detail.value; loadTrips()">
            <ion-select-option value="">Todos</ion-select-option>
            <ion-select-option value="assigned">Asignado</ion-select-option>
            <ion-select-option value="in_progress">En viaje</ion-select-option>
            <ion-select-option value="completed">Completado</ion-select-option>
            <ion-select-option value="cancelled">Cancelado</ion-select-option>
          </ion-select>
          <ion-list>
            @for (t of trips; track t.id) {
              <ion-item>
                <ion-label>
                  <h2>Viaje #{{ t.id }} · {{ label(t.status) }}</h2>
                  <p>
                    Cliente {{ t.client?.name ?? t.client_id }} · Conductor {{ t.driver?.user?.name ?? t.driver_id }}
                  </p>
                  <p>{{ t.final_fare ?? t.estimated_fare | currency: 'COP' : 'symbol-narrow' : '1.0-0' }}</p>
                </ion-label>
              </ion-item>
            } @empty {
              <ion-item><ion-label>Sin viajes.</ion-label></ion-item>
            }
          </ion-list>
        }

        @case ('reports') {
          <pre>{{ report | json }}</pre>
        }
        @case ('audit') {
          <pre>{{ logs | json }}</pre>
        }
      }
    </ion-content>`,
  styles: [
    `
      .grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 4px;
      }
      h2 {
        margin: 4px 0 0;
      }
      pre {
        white-space: pre-wrap;
        font-size: 12px;
      }
    `,
  ],
})
export class AdminHomePage {
  auth = inject(AuthService);
  private api = inject(ApiService);
  private ui = inject(UiService);
  private alert = inject(AlertController);

  tab = 'dashboard';
  stats: any = {};
  drivers: any[] = [];
  fares: any[] = [];
  trips: any[] = [];
  report: any = null;
  logs: any = null;
  driverFilter = '';
  tripStatus = '';
  showFare = false;
  nf: any = {
    name: '',
    base_fare: null,
    price_per_km: null,
    price_per_minute: null,
    minimum_fare: null,
    surge_multiplier: 1,
    active: true,
  };

  label = (s: string): string => STATUS[s] ?? s;
  statLabel = (k: string): string => STAT_LABELS[k] ?? k;
  get statKeys(): string[] {
    return Object.keys(this.stats || {});
  }

  ionViewWillEnter(): void {
    this.load();
  }
  go(v: any): void {
    this.tab = String(v);
    this.load();
  }
  refresh(ev: any): void {
    this.load();
    setTimeout(() => ev.target.complete(), 600);
  }

  load(): void {
    const err = (e: any) => this.ui.err(e);
    switch (this.tab) {
      case 'dashboard':
        this.api.dashboard().subscribe({ next: (r) => (this.stats = r.stats), error: err });
        break;
      case 'drivers':
        this.loadDrivers();
        break;
      case 'fares':
        this.api.fares().subscribe({ next: (r) => (this.fares = list(r.fares)), error: err });
        break;
      case 'trips':
        this.loadTrips();
        break;
      case 'reports':
        this.api.reports().subscribe({ next: (r) => (this.report = r), error: err });
        break;
      case 'audit':
        this.api.audit().subscribe({ next: (r) => (this.logs = r), error: err });
        break;
    }
  }

  loadDrivers(): void {
    this.api
      .drivers(this.driverFilter)
      .subscribe({ next: (r) => (this.drivers = list(r.drivers)), error: (e) => this.ui.err(e) });
  }
  loadTrips(): void {
    this.api
      .adminTrips({ status: this.tripStatus })
      .subscribe({ next: (r) => (this.trips = list(r.trips)), error: (e) => this.ui.err(e) });
  }

  async review(d: any): Promise<void> {
    const a = await this.alert.create({
      header: d.user?.name,
      subHeader: 'Estado actual: ' + d.approval_status,
      inputs: [{ name: 'notes', type: 'textarea', placeholder: 'Notas del administrador' }],
      buttons: [
        { text: 'Aprobar', handler: (v: any) => this.setApproval(d, 'approved', v.notes) },
        { text: 'Rechazar', handler: (v: any) => this.setApproval(d, 'rejected', v.notes) },
        { text: 'Suspender', handler: (v: any) => this.setApproval(d, 'suspended', v.notes) },
        { text: 'Cerrar', role: 'cancel' },
      ],
    });
    a.present();
  }

  private setApproval(d: any, status: string, notes: string): void {
    this.api.approve(d.id, status, notes || '').subscribe({
      next: (r) => {
        this.ui.toast(r.message, 'success');
        this.loadDrivers();
      },
      error: (e) => this.ui.err(e),
    });
  }

  createFare(): void {
    const n = this.nf;
    const body = {
      name: n.name,
      base_fare: +n.base_fare,
      price_per_km: +n.price_per_km,
      price_per_minute: +n.price_per_minute,
      minimum_fare: +n.minimum_fare,
      surge_multiplier: +n.surge_multiplier,
      active: !!n.active,
    };
    this.api.createFare(body).subscribe({
      next: (r) => {
        this.ui.toast(r.message, 'success');
        this.showFare = false;
        this.load();
      },
      error: (e) => this.ui.err(e),
    });
  }
}
