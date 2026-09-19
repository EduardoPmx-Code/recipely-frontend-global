import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonLabel,
  IonBadge,
  IonRefresher,
  IonRefresherContent,
  IonSkeletonText,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonButtons,
  IonBackButton,
  IonItem,
  IonList,
  IonNote,
} from '@ionic/angular/standalone';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { WaiterWebsocketService, OrderStatusEvent } from '../../../core/services/waiter-websocket.service';

export interface OrderItem {
  nombre: string;
  cantidad: number;
  precio?: number;
  notas?: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered';

export interface Order {
  uuid: string;
  status: OrderStatus;
  items: OrderItem[];
  total?: number;
  notas?: string;
  createdAt?: string;
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  preparing: 'Preparando',
  ready: 'Listo',
  delivered: 'Entregado',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'warning',
  confirmed: 'tertiary',
  preparing: 'primary',
  ready: 'success',
  delivered: 'medium',
};

@Component({
  selector: 'app-pedidos',
  templateUrl: 'pedidos.page.html',
  styleUrls: ['pedidos.page.scss'],
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonLabel,
    IonBadge,
    IonRefresher,
    IonRefresherContent,
    IonSkeletonText,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonButton,
    IonButtons,
    IonBackButton,
    IonItem,
    IonList,
    IonNote,
  ],
})
export class PedidosPage implements OnInit, OnDestroy {
  orders: Order[] = [];
  isLoading = true;
  boardUuid: string | null = null;
  pageTitle = 'Pedidos';
  skeletons = Array(3).fill(0);

  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private wsService = inject(WaiterWebsocketService);
  private baseUrl = environment.waiterApiUrl;
  private destroy$ = new Subject<void>();

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      this.boardUuid = params['boardUuid'] || null;
      this.pageTitle = this.boardUuid ? 'Pedidos de Mesa' : 'Pedidos Pendientes';
    });
  }

  ionViewWillEnter() {
    this.loadOrders();
    this.wsService.connect();
    this.subscribeToWsEvents();
  }

  ionViewWillLeave() {
    this.destroy$.next();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToWsEvents(): void {
    // New order created → reload the list
    this.wsService.orderCreated$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadOrders());

    // Order status changed → update in-place or remove if terminal
    this.wsService.orderStatusChanged$
      .pipe(
        takeUntil(this.destroy$),
        filter((event: OrderStatusEvent) =>
          !this.boardUuid || event.boardUuid === this.boardUuid
        )
      )
      .subscribe((event) => {
        if (event.status === 'delivered' || event.status === 'cancelled') {
          this.orders = this.orders.filter((o) => o.uuid !== event.orderUuid);
          return;
        }
        const existing = this.orders.find((o) => o.uuid === event.orderUuid);
        if (existing) {
          existing.status = event.status as OrderStatus;
        } else {
          this.loadOrders();
        }
      });
  }

  loadOrders(event?: any) {
    if (!event) this.isLoading = true;

    const url = this.boardUuid
      ? `${this.baseUrl}mesero/boards/${this.boardUuid}/orders`
      : `${this.baseUrl}mesero/orders/pending`;

    this.http.get<Order[]>(url).subscribe({
      next: (orders) => {
        this.orders = orders;
        this.isLoading = false;
        event?.target?.complete();
      },
      error: () => {
        this.isLoading = false;
        event?.target?.complete();
      },
    });
  }

  updateStatus(order: Order, status: OrderStatus) {
    this.http
      .patch(`${this.baseUrl}mesero/orders/${order.uuid}/status`, { status })
      .subscribe({
        next: () => {
          order.status = status;
        },
      });
  }

  getStatusLabel(status: string): string {
    return STATUS_LABELS[status] ?? status;
  }

  getStatusColor(status: string): string {
    return STATUS_COLORS[status] ?? 'medium';
  }

  getNextActions(
    status: string,
  ): Array<{ label: string; nextStatus: OrderStatus; color: string }> {
    // El mesero solo puede marcar una orden como entregada (la cocina maneja los demás estados)
    if (status === 'ready')
      return [{ label: 'Marcar Entregado', nextStatus: 'delivered', color: 'medium' }];
    return [];
  }
}
