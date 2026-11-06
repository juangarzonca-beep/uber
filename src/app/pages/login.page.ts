import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonContent, IonItem, IonInput, IonButton, IonSpinner } from '@ionic/angular';

import { AuthService } from '../core/auth.service';
import { UiService } from '../core/ui.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink, IonContent, IonItem, IonInput, IonButton, IonSpinner],
  template: ` <ion-content class="ion-padding">
    <div class="auth">
      <h1>Uber</h1>
      <p>Inicia sesión para continuar</p>
      <ion-item
        ><ion-input label="Correo o teléfono" labelPlacement="floating" [(ngModel)]="login"></ion-input
      ></ion-item>
      <ion-item
        ><ion-input
          type="password"
          label="Contraseña"
          labelPlacement="floating"
          [(ngModel)]="password"
          (keyup.enter)="submit()"
        ></ion-input
      ></ion-item>
      <ion-button expand="block" (click)="submit()" [disabled]="loading || !login || !password">
        @if (loading) {
          <ion-spinner name="dots"></ion-spinner>
        } @else {
          Entrar
        }
      </ion-button>
      <ion-button expand="block" fill="clear" routerLink="/register">Crear cuenta</ion-button>
      <ion-button expand="block" fill="clear" size="small" routerLink="/forgot">¿Olvidaste tu contraseña?</ion-button>
    </div>
  </ion-content>`,
  styles: [
    `
      .auth {
        max-width: 420px;
        margin: 8vh auto 0;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      h1 {
        text-align: center;
        margin: 0;
      }
      p {
        text-align: center;
        color: var(--ion-color-medium);
      }
    `,
  ],
})
export class LoginPage {
  private auth = inject(AuthService);
  private router = inject(Router);
  private ui = inject(UiService);
  login = '';
  password = '';
  loading = false;

  constructor() {
    const u = this.auth.user();
    if (u && this.auth.token) this.router.navigateByUrl(this.auth.homeOf(u.role), { replaceUrl: true });
  }

  submit(): void {
    this.loading = true;
    this.auth.login(this.login.trim(), this.password).subscribe({
      next: (r) => {
        this.loading = false;
        this.router.navigateByUrl(this.auth.homeOf(r.user.role), { replaceUrl: true });
      },
      error: (e) => {
        this.loading = false;
        this.ui.err(e);
      },
    });
  }
}
