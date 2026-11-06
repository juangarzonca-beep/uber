import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonContent,
  IonItem,
  IonInput,
  IonButton,
  IonSegment,
  IonSegmentButton,
  IonLabel,
} from '@ionic/angular';

import { AuthService } from '../core/auth.service';
import { UiService } from '../core/ui.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonContent,
    IonItem,
    IonInput,
    IonButton,
    IonSegment,
    IonSegmentButton,
    IonLabel,
  ],
  template: ` <ion-header
      ><ion-toolbar>
        <ion-buttons slot="start"><ion-back-button defaultHref="/login"></ion-back-button></ion-buttons>
        <ion-title>Crear cuenta</ion-title>
      </ion-toolbar></ion-header
    >
    <ion-content class="ion-padding">
      <ion-segment [value]="role" (ionChange)="role = $event.detail.value + ''">
        <ion-segment-button value="client"><ion-label>Pasajero</ion-label></ion-segment-button>
        <ion-segment-button value="driver"><ion-label>Conductor</ion-label></ion-segment-button>
      </ion-segment>

      <ion-item><ion-input label="Nombre" labelPlacement="floating" [(ngModel)]="f.name"></ion-input></ion-item>
      <ion-item
        ><ion-input type="email" label="Correo" labelPlacement="floating" [(ngModel)]="f.email"></ion-input
      ></ion-item>
      <ion-item
        ><ion-input type="tel" label="Teléfono" labelPlacement="floating" [(ngModel)]="f.phone"></ion-input
      ></ion-item>
      <ion-item
        ><ion-input
          type="password"
          label="Contraseña (mín. 8)"
          labelPlacement="floating"
          [(ngModel)]="f.password"
        ></ion-input
      ></ion-item>

      @if (role === 'driver') {
        <ion-item
          ><ion-input label="N° de licencia" labelPlacement="floating" [(ngModel)]="f.license_number"></ion-input
        ></ion-item>
        <ion-item><ion-input label="Placa" labelPlacement="floating" [(ngModel)]="f.plate"></ion-input></ion-item>
        <ion-item><ion-input label="Marca" labelPlacement="floating" [(ngModel)]="f.brand"></ion-input></ion-item>
        <ion-item><ion-input label="Modelo" labelPlacement="floating" [(ngModel)]="f.model"></ion-input></ion-item>
        <ion-item
          ><ion-input type="number" label="Año" labelPlacement="floating" [(ngModel)]="f.year"></ion-input
        ></ion-item>
        <ion-item
          ><ion-input
            type="number"
            label="Capacidad (pasajeros)"
            labelPlacement="floating"
            [(ngModel)]="f.capacity"
          ></ion-input
        ></ion-item>
        <ion-item><ion-input label="Color" labelPlacement="floating" [(ngModel)]="f.color"></ion-input></ion-item>
      }
      <ion-button expand="block" class="ion-margin-top" (click)="submit()" [disabled]="loading">Registrarme</ion-button>
    </ion-content>`,
})
export class RegisterPage {
  private auth = inject(AuthService);
  private router = inject(Router);
  private ui = inject(UiService);
  role = 'client';
  loading = false;
  f: any = {
    name: '',
    email: '',
    phone: '',
    password: '',
    license_number: '',
    plate: '',
    brand: '',
    model: '',
    year: 2024,
    capacity: 4,
    color: '',
  };

  submit(): void {
    const { name, email, phone, password } = this.f;
    const body: any = { name, email, phone, password, role: this.role };
    if (this.role === 'driver') {
      const { license_number, plate, brand, model, color } = this.f;
      Object.assign(body, {
        license_number,
        plate,
        brand,
        model,
        color,
        year: Number(this.f.year),
        capacity: Number(this.f.capacity),
      });
    }
    this.loading = true;
    this.auth.register(body).subscribe({
      next: (r) => {
        this.loading = false;
        this.ui.toast(
          this.role === 'driver' ? 'Cuenta creada. Un administrador debe aprobarte para conectarte.' : r.message,
          'success',
        );
        this.router.navigateByUrl(this.auth.homeOf(r.user.role), { replaceUrl: true });
      },
      error: (e) => {
        this.loading = false;
        this.ui.err(e);
      },
    });
  }
}
