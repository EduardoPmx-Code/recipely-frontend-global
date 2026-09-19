import { Injectable, OnDestroy, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { StaffWebsocketService } from './staff-websocket.service';

export interface OrderCreatedEvent { orderUuid: string; boardUuid: string; sesionBoardUuid: string; total: number; itemCount: number; }
export interface OrderStatusEvent { orderUuid: string; boardUuid: string; sesionBoardUuid: string; status: string; }
export interface WaiterCallEvent { callUuid: string; boardUuid: string; sesionBoardUuid: string; tipo: string; createdAt: string; }

@Injectable({ providedIn: 'root' })
export class WaiterWebsocketService implements OnDestroy {
  private readonly staffSocket = inject(StaffWebsocketService);
  readonly orderCreated$: Observable<OrderCreatedEvent> = this.staffSocket.orderCreated$.pipe(
    map((event) => ({ ...event, total: event.total ?? event.totalAmount ?? 0 })),
  );
  readonly orderStatusChanged$: Observable<OrderStatusEvent> = this.staffSocket.orderStatusChanged$.pipe(
    map((event) => ({ ...event, status: event.status ?? '' })),
  );
  readonly waiterCall$: Observable<WaiterCallEvent> = this.staffSocket.waiterCall$;

  connect(): void { this.staffSocket.connect(); }
  disconnect(): void {}
  ngOnDestroy(): void {}
}
