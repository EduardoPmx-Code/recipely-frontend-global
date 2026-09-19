import { Component, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  IonBadge,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonIcon,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  IonTitle,
  IonToolbar,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  chatbubbleOutline,
  checkmarkCircleOutline,
  flameOutline,
  restaurantOutline,
  timeOutline,
} from 'ionicons/icons';
import { Subject, takeUntil } from 'rxjs';
import { Permission, PermissionScope } from '../../core/auth/permissions';
import { AuthService } from '../../core/services/auth.service';
import { KitchenWebsocketService } from '../../core/services/kitchen-websocket.service';
import { environment } from '../../../environments/environment';

type KitchenOrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready';

interface KitchenOrder {
  uuid: string;
  boardUuid: string;
  items: { productId: string; nombre: string; cantidad: number; precio: number }[];
  status: KitchenOrderStatus;
  total: number;
  notas?: string;
  createdAt: string;
}

const statusLabels: Record<KitchenOrderStatus, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  preparing: 'Preparando',
  ready: 'Listo',
};

const statusColors: Record<KitchenOrderStatus, string> = {
  pending: 'warning',
  confirmed: 'primary',
  preparing: 'tertiary',
  ready: 'success',
};

const nextStatuses: Partial<Record<KitchenOrderStatus, KitchenOrderStatus>> = {
  pending: 'confirmed',
  confirmed: 'preparing',
  preparing: 'ready',
};

const nextLabels: Partial<Record<KitchenOrderStatus, string>> = {
  pending: 'Confirmar',
  confirmed: 'Preparar',
  preparing: 'Marcar listo',
};

@Component({
  selector: 'app-kitchen-orders',
  templateUrl: './kitchen-orders.page.html',
  styleUrls: ['./kitchen-orders.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonBadge,
    IonButton,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonContent,
    IonHeader,
    IonIcon,
    IonRefresher,
    IonRefresherContent,
    IonSpinner,
    IonTitle,
    IonToolbar,
  ],
})
export class KitchenOrdersPage implements OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly toastController = inject(ToastController);
  private readonly websocket = inject(KitchenWebsocketService);
  private readonly auth = inject(AuthService);
  private readonly destroy$ = new Subject<void>();

  orders: KitchenOrder[] = [];
  isLoading = false;
  readonly statusGroups: KitchenOrderStatus[] = ['pending', 'confirmed', 'preparing', 'ready'];
  readonly statusLabels = statusLabels;
  readonly statusColors = statusColors;

  constructor() {
    addIcons({ chatbubbleOutline, checkmarkCircleOutline, flameOutline, restaurantOutline, timeOutline });
  }

  ionViewWillEnter(): void {
    this.loadOrders();
    this.websocket.connect();
    this.websocket.orderCreated$.pipe(takeUntil(this.destroy$)).subscribe(() => this.loadOrders());
    this.websocket.orderStatusChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe((event) => this.updateOrderInList(event.orderUuid, event.status));
  }

  ionViewWillLeave(): void {
    this.destroy$.next();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get canUpdateOrders(): boolean {
    return this.auth.hasPermission({
      permission: Permission.KitchenQueueUpdate,
      scope: PermissionScope.Restaurant,
    });
  }

  getOrdersByStatus(status: KitchenOrderStatus): KitchenOrder[] {
    return this.orders.filter((order) => order.status === status);
  }

  getNextAction(order: KitchenOrder): { label: string; nextStatus: KitchenOrderStatus } | null {
    const nextStatus = nextStatuses[order.status];
    return nextStatus ? { label: nextLabels[order.status]!, nextStatus } : null;
  }

  loadOrders(event?: CustomEvent): void {
    this.isLoading = true;
    this.http.get<KitchenOrder[]>(`${environment.apiUrl}cocina/orders`).subscribe({
      next: (orders) => {
        this.orders = orders;
        this.isLoading = false;
        (event?.target as HTMLIonRefresherElement | undefined)?.complete();
      },
      error: async () => {
        this.isLoading = false;
        (event?.target as HTMLIonRefresherElement | undefined)?.complete();
        const toast = await this.toastController.create({
          message: 'No se pudieron cargar las órdenes de cocina.',
          color: 'danger',
          duration: 2500,
        });
        await toast.present();
      },
    });
  }

  updateStatus(order: KitchenOrder, status: KitchenOrderStatus): void {
    this.http.patch(`${environment.apiUrl}cocina/orders/${order.uuid}/status`, { status }).subscribe({
      next: () => {
        this.updateOrderInList(order.uuid, status);
      },
      error: async (error) => {
        const toast = await this.toastController.create({
          message: error?.error?.message ?? 'No se pudo actualizar la orden.',
          color: 'danger',
          duration: 3000,
        });
        await toast.present();
      },
    });
  }

  private updateOrderInList(orderUuid: string, status: string): void {
    if (!this.isKitchenStatus(status)) {
      this.loadOrders();
      return;
    }

    const index = this.orders.findIndex((order) => order.uuid === orderUuid);
    if (index === -1) {
      this.loadOrders();
      return;
    }

    this.orders[index] = { ...this.orders[index], status };
    this.orders = [...this.orders];
  }

  private isKitchenStatus(status: string): status is KitchenOrderStatus {
    return status === 'pending' || status === 'confirmed' || status === 'preparing' || status === 'ready';
  }
}
