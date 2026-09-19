import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonBadge,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  alertCircleOutline,
  checkmarkCircleOutline,
  checkmarkDoneOutline,
  closeCircleOutline,
  cubeOutline,
  flameOutline,
  notificationsOutline,
  trashOutline,
} from 'ionicons/icons';
import {
  KitchenNotification,
  KitchenNotificationService,
} from '../../core/services/kitchen-notification.service';

const statusIcons: Record<string, string> = {
  confirmed: 'checkmark-circle-outline',
  preparing: 'flame-outline',
  ready: 'cube-outline',
  delivered: 'checkmark-done-outline',
  cancelled: 'close-circle-outline',
};

const statusColors: Record<string, string> = {
  new_order: 'warning',
  confirmed: 'primary',
  preparing: 'tertiary',
  ready: 'success',
  delivered: 'medium',
  cancelled: 'danger',
};

@Component({
  selector: 'app-kitchen-notifications',
  templateUrl: './kitchen-notifications.page.html',
  standalone: true,
  imports: [
    CommonModule,
    IonBadge,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonNote,
    IonTitle,
    IonToolbar,
  ],
})
export class KitchenNotificationsPage {
  readonly notifications = inject(KitchenNotificationService);

  constructor() {
    addIcons({
      alertCircleOutline,
      checkmarkCircleOutline,
      checkmarkDoneOutline,
      closeCircleOutline,
      cubeOutline,
      flameOutline,
      notificationsOutline,
      trashOutline,
    });
  }

  ionViewWillEnter(): void {
    this.notifications.markAllRead();
  }

  getIcon(notification: KitchenNotification): string {
    return notification.type === 'new_order'
      ? 'alert-circle-outline'
      : statusIcons[notification.status ?? ''] ?? 'notifications-outline';
  }

  getColor(notification: KitchenNotification): string {
    return notification.type === 'new_order'
      ? statusColors['new_order']
      : statusColors[notification.status ?? ''] ?? 'medium';
  }
}
