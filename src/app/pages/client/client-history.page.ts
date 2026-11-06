import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonBadge,
  AlertController,
} from '@ionic/angular';

import { ApiService } from '../../core/api.service';
import { STATUS, list } from '../../core/labels';
import { UiService } from '../../core/ui.service';

@Component({
  selector: 'app-client-history',
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonButton,
    IonBadge,
  ],
  template: ` <ion-header
      ><ion-toolbar color="dark">
        <ion-buttons slot="start"><ion-back-button defaultHref="/client"></ion-back-button></ion-buttons>
        <ion-title>Mis viajes</ion-title>
      </ion-toolbar></ion-header
    >
    <ion-content>
      <ion-list>
        @for (t of trips; track t.id) {
          <ion-item>
            <ion-label>
              <h2>{{ t.driver?.user?.name || 'Sin conductor' }} · {{ t.vehicle?.plate }}</h2>
              <p>{{ t.completed_at | date: 'medium' }}</p>
              <p>
                <b>{{ t.final_fare | currency: 'COP' : 'symbol-narrow' : '1.0-0' }}</b>
              </p>
            </ion-label>
            <ion-badge slot="end" [color]="t.status === 'completed' ? 'success' : 'medium'">{{
              label(t.status)
            }}</ion-badge>
            @if (t.status === 'completed') {
              <ion-button slot="end" size="small" fill="outline" (click)="rate(t)">Calificar</ion-button>
            }
          </ion-item>
        } @empty {
          <ion-item><ion-label>Aún no tienes viajes.</ion-label></ion-item>
        }
      </ion-list>
    </ion-content>`,
})
export class ClientHistoryPage {
  private api = inject(ApiService);
  private ui = inject(UiService);
  private alert = inject(AlertController);
  trips: any[] = [];
  label = (s: string): string => STATUS[s] ?? s;

  ionViewWillEnter(): void {
    this.api.clientTrips().subscribe({ next: (r) => (this.trips = list(r.trips)), error: (e) => this.ui.err(e) });
  }

  async rate(t: any): Promise<void> {
    const a = await this.alert.create({
      header: 'Calificar viaje',
      inputs: [
        { name: 'score', type: 'number', min: 1, max: 5, placeholder: 'Calificación (1 a 5)' },
        { name: 'comment', type: 'textarea', placeholder: 'Comentario (opcional)' },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Enviar', handler: (v: any) => this.send(t, v, false) },
        { text: 'Reportar incidencia', handler: (v: any) => this.send(t, v, true) },
      ],
    });
    a.present();
  }

  private send(t: any, v: any, has_incident: boolean): boolean {
    const score = Number(v.score);
    if (!(score >= 1 && score <= 5)) {
      this.ui.toast('La calificación debe ser de 1 a 5', 'warning');
      return false;
    }
    this.api.rate(t.id, { score, comment: v.comment || '', has_incident }).subscribe({
      next: (r) => this.ui.toast(r.message, 'success'),
      error: (e) => this.ui.err(e),
    });
    return true;
  }
}
