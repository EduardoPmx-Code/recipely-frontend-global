import { Component } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonBadge, IonButton, IonButtons,
  IonSpinner, IonRefresher, IonRefresherContent, IonIcon,
  IonSegment, IonSegmentButton, IonLabel, IonNote, IonList, IonItem,
  ToastController,
} from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import {
  receiptOutline, checkmarkOutline, closeOutline, restaurantOutline,
  timeOutline, checkmarkCircleOutline, bicycleOutline, alertCircleOutline,
  arrowForwardOutline,
} from 'ionicons/icons';
import { environment } from '../../../environments/environment';

type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';

interface OrderItem {
  productId: string;
  nombre: string;
  cantidad: number;
  precio: number;
  total: number;
}

interface Order {
  uuid: string;
  boardUuid: string;
  sesionBoardUuid: string;
  clienteUuid: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  notas?: string;
  source?: string;
  createdAt: string;
  updatedAt: string;
}

interface Board {
  uuid: string;
  descripcion: string;
  slot: number;
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  preparing: 'Preparando',
  ready: 'Listo',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'warning',
  confirmed: 'primary',
  preparing: 'tertiary',
  ready: 'success',
  delivered: 'medium',
  cancelled: 'danger',
};

const NEXT_ACTIONS: Partial<Record<OrderStatus, { label: string; next: OrderStatus }[]>> = {
  pending: [
    { label: 'Confirmar', next: 'confirmed' },
    { label: 'Cancelar', next: 'cancelled' },
  ],
  confirmed: [
    { label: 'En preparación', next: 'preparing' },
    { label: 'Cancelar', next: 'cancelled' },
  ],
  preparing: [{ label: 'Listo para entregar', next: 'ready' }],
  ready: [{ label: 'Entregado', next: 'delivered' }],
};

@Component({
  selector: 'app-pedidos',
  templateUrl: 'pedidos.page.html',
  styleUrls: ['pedidos.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, CurrencyPipe,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonBadge, IonButton, IonButtons,
    IonSpinner, IonRefresher, IonRefresherContent, IonIcon,
    IonSegment, IonSegmentButton, IonLabel, IonNote, IonList, IonItem,
  ],
})
export class PedidosPage {
  private http = inject(HttpClient);
  private toastCtrl = inject(ToastController);
  private readonly api = environment.apiUrl;

  orders: Order[] = [];
  boards: Board[] = [];
  boardMap = new Map<string, string>();
  isLoading = false;
  filter: string = 'active';
  updatingUuid: string | null = null;

  readonly STATUS_LABELS = STATUS_LABELS;
  readonly STATUS_COLORS = STATUS_COLORS;
  readonly NEXT_ACTIONS = NEXT_ACTIONS;

  get filteredOrders(): Order[] {
    if (this.filter === 'active') {
      return this.orders.filter(o => !['delivered', 'cancelled'].includes(o.status));
    }
    if (this.filter === 'pending') return this.orders.filter(o => o.status === 'pending');
    if (this.filter === 'preparing') return this.orders.filter(o => ['confirmed', 'preparing'].includes(o.status));
    if (this.filter === 'ready') return this.orders.filter(o => o.status === 'ready');
    if (this.filter === 'done') return this.orders.filter(o => ['delivered', 'cancelled'].includes(o.status));
    return this.orders;
  }

  constructor() {
    addIcons({
      receiptOutline, checkmarkOutline, closeOutline, restaurantOutline,
      timeOutline, checkmarkCircleOutline, bicycleOutline, alertCircleOutline,
      arrowForwardOutline,
    });
  }

  ionViewWillEnter() {
    this.load();
  }

  load(event?: any) {
    this.isLoading = !event;
    this.http.get<Board[]>(`${this.api}qrs/boards`).subscribe({
      next: (boards) => {
        this.boards = boards;
        this.boardMap.clear();
        boards.forEach(b => this.boardMap.set(b.uuid, b.descripcion || `Mesa ${b.slot}`));
      },
    });

    this.http.get<Order[]>(`${this.api}restaurant-admin/orders`).subscribe({
      next: (data) => {
        this.orders = data;
        this.isLoading = false;
        event?.target?.complete();
      },
      error: async () => {
        this.isLoading = false;
        event?.target?.complete();
        const t = await this.toastCtrl.create({ message: 'Error al cargar pedidos', duration: 2000, color: 'danger' });
        t.present();
      },
    });
  }

  doRefresh(event: any) {
    this.load(event);
  }

  getBoardName(boardUuid: string): string {
    return this.boardMap.get(boardUuid) ?? boardUuid.slice(0, 8) + '…';
  }

  getActions(status: OrderStatus) {
    return NEXT_ACTIONS[status] ?? [];
  }

  async updateStatus(order: Order, newStatus: OrderStatus) {
    this.updatingUuid = order.uuid;
    this.http.patch(`${this.api}orders/${order.uuid}/status`, { status: newStatus }).subscribe({
      next: async () => {
        order.status = newStatus;
        this.updatingUuid = null;
        const t = await this.toastCtrl.create({
          message: `Pedido → ${STATUS_LABELS[newStatus]}`,
          duration: 1500,
          color: 'success',
        });
        t.present();
      },
      error: async () => {
        this.updatingUuid = null;
        const t = await this.toastCtrl.create({ message: 'Error al actualizar pedido', duration: 2000, color: 'danger' });
        t.present();
      },
    });
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleString('es-MX', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
    });
  }

  getStatusIcon(status: OrderStatus): string {
    const icons: Record<OrderStatus, string> = {
      pending: 'time-outline',
      confirmed: 'checkmark-outline',
      preparing: 'restaurant-outline',
      ready: 'checkmark-circle-outline',
      delivered: 'bicycle-outline',
      cancelled: 'close-outline',
    };
    return icons[status] ?? 'receipt-outline';
  }
}
