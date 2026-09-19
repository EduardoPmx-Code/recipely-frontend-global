import { Component, OnDestroy, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule, AsyncPipe } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonRefresher,
  IonRefresherContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonBadge,
  IonButton,
  IonItem,
  IonLabel,
  IonChip,
  IonIcon,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { alertCircleOutline, checkmarkCircleOutline, waterOutline, receiptOutline, personOutline, notificationsOutline } from 'ionicons/icons';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { WaiterWebsocketService } from '../../../core/services/waiter-websocket.service';
import { WaiterNotificationService, AppNotification } from '../../../core/services/waiter-notification.service';

interface Peticion {
  uuid: string;
  boardUuid: string;
  sesionBoardUuid: string;
  localUuid: string;
  tipo: 'LLAMAR_MESERO' | 'PEDIR_CUENTA' | 'NECESITO_AGUA' | 'OTRO';
  mensaje: string;
  status: 'pending' | 'resolved';
  createdAt: string;
}

const TIPO_LABELS: Record<string, string> = {
  LLAMAR_MESERO: 'Llamar Mesero',
  PEDIR_CUENTA: 'Pedir la Cuenta',
  NECESITO_AGUA: 'Necesito Agua',
  OTRO: 'Otro',
};

const TIPO_ICONS: Record<string, string> = {
  LLAMAR_MESERO: 'person-outline',
  PEDIR_CUENTA: 'receipt-outline',
  NECESITO_AGUA: 'water-outline',
  OTRO: 'alert-circle-outline',
};

const TIPO_COLORS: Record<string, string> = {
  LLAMAR_MESERO: 'warning',
  PEDIR_CUENTA: 'primary',
  NECESITO_AGUA: 'tertiary',
  OTRO: 'medium',
};

@Component({
  selector: 'app-alertas',
  templateUrl: 'alertas.page.html',
  standalone: true,
  imports: [
    CommonModule,
    AsyncPipe,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonRefresher, IonRefresherContent,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonBadge, IonButton, IonItem, IonLabel, IonChip, IonIcon,
  ],
})
export class AlertasPage implements OnDestroy {
  peticiones: Peticion[] = [];
  isLoading = true;
  private readonly destroy$ = new Subject<void>();

  private readonly http = inject(HttpClient);
  private readonly toastCtrl = inject(ToastController);
  private readonly wsService = inject(WaiterWebsocketService);
  readonly notifStore = inject(WaiterNotificationService);

  constructor() {
    addIcons({ alertCircleOutline, checkmarkCircleOutline, waterOutline, receiptOutline, personOutline, notificationsOutline });
  }

  ionViewWillEnter() {
    this.notifStore.markAllRead();
    this.loadPeticiones();
    this.wsService.connect();
    this.wsService.waiterCall$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadPeticiones());
  }

  ionViewWillLeave() {
    this.destroy$.next();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadPeticiones(event?: any) {
    this.http
      .get<Peticion[]>(`${environment.waiterApiUrl}mesero/peticiones`)
      .subscribe({
        next: (data) => {
          this.peticiones = data;
          this.isLoading = false;
          event?.target?.complete();
        },
        error: () => {
          this.isLoading = false;
          event?.target?.complete();
        },
      });
  }

  resolve(peticion: Peticion) {
    this.http
      .patch(`${environment.waiterApiUrl}mesero/peticiones/${peticion.uuid}/resolve`, {})
      .subscribe({
        next: () => {
          this.peticiones = this.peticiones.filter((p) => p.uuid !== peticion.uuid);
          this.showToast('Petición resuelta ✓', 'success');
        },
        error: () => this.showToast('Error al resolver la petición', 'danger'),
      });
  }

  getNotifIcon(type: AppNotification['type']): string {
    const icons: Record<string, string> = {
      order_created: 'receipt-outline',
      order_ready: 'checkmark-circle-outline',
      waiter_call: 'notifications-outline',
    };
    return icons[type] ?? 'alert-circle-outline';
  }

  getNotifColor(type: AppNotification['type']): string {
    const colors: Record<string, string> = {
      order_created: 'warning',
      order_ready: 'success',
      waiter_call: 'danger',
    };
    return colors[type] ?? 'medium';
  }

  getTipoLabel(tipo: string) { return TIPO_LABELS[tipo] ?? tipo; }
  getTipoIcon(tipo: string) { return TIPO_ICONS[tipo] ?? 'alert-circle-outline'; }
  getTipoColor(tipo: string) { return TIPO_COLORS[tipo] ?? 'medium'; }

  getTimeAgo(date: Date | string) {
    const diff = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    return diff < 1 ? 'Hace un momento' : `Hace ${diff} min`;
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({ message, duration: 2000, color, position: 'top' });
    await toast.present();
  }
}
