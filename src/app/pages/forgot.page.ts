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
} from '@ionic/angular';

import { AuthService } from '../core/auth.service';
import { UiService } from '../core/ui.service';

@Component({
  selector: 'app-forgot',
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
  ],
  template: ` <ion-header
      ><ion-toolbar>
        <ion-buttons slot="start"><ion-back-button defaultHref="/login"></ion-back-button></ion-buttons>
        <ion-title>Recuperar contraseña</ion-title>
      </ion-toolbar></ion-header
    >
    <ion-content class="ion-padding">
      <ion-item
        ><ion-input type="email" label="Correo" labelPlacement="floating" [(ngModel)]="email"></ion-input
      ></ion-item>
      <ion-item
        ><ion-input type="password" label="Nueva contraseña" labelPlacement="floating" [(ngModel)]="pass"></ion-input
      ></ion-item>
      <ion-button expand="block" class="ion-margin-top" (click)="submit()" [disabled]="!email || !pass"
        >Restablecer</ion-button
      >
    </ion-content>`,
})
export class ForgotPage {
  private auth = inject(AuthService);
  private router = inject(Router);
  private ui = inject(UiService);
  email = '';
  pass = '';

  submit(): void {
    this.auth.forgot(this.email.trim(), this.pass).subscribe({
      next: (r) => {
        this.ui.toast(r.message, 'success');
        this.router.navigateByUrl('/login');
      },
      error: (e) => this.ui.err(e),
    });
  }
}
