import { Injectable, inject } from '@angular/core';
import { ToastController } from '@ionic/angular';

@Injectable({ providedIn: 'root' })
export class UiService {
  private toastCtrl = inject(ToastController);

  async toast(message: string, color = 'dark'): Promise<void> {
    const t = await this.toastCtrl.create({ message, duration: 2800, color, position: 'top' });
    t.present();
  }

  err(e: any): void {
    let msg = e?.error?.message || 'Ocurrió un error inesperado';
    if (e?.status === 0) msg = 'No se pudo conectar con el servidor (20.20.2.171:8000)';
    const errors = e?.error?.errors;
    if (errors) msg = (Object.values(errors).flat() as string[])[0] || msg;
    this.toast(msg, 'danger');
  }
}
