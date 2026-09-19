import { Injectable, OnDestroy, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { StaffWebsocketService } from './staff-websocket.service';

export interface OrderCreatedPayload {
  orderUuid: string;
  boardUuid: string;
  sesionBoardUuid: string;
  localUuid: string;
  totalAmount: number;
  itemCount: number;
}

export interface OrderStatusChangedPayload {
  orderUuid: string;
  boardUuid: string;
  sesionBoardUuid: string;
  localUuid: string;
  status: string;
}

@Injectable({ providedIn: 'root' })
export class KitchenWebsocketService implements OnDestroy {
  private readonly staffSocket = inject(StaffWebsocketService);
  readonly orderCreated$: Observable<OrderCreatedPayload> = this.staffSocket.orderCreated$.pipe(
    map((event) => ({ ...event, localUuid: event.localUuid ?? '', totalAmount: event.totalAmount ?? event.total ?? 0 })),
  );
  readonly orderStatusChanged$: Observable<OrderStatusChangedPayload> = this.staffSocket.orderStatusChanged$.pipe(
    map((event) => ({ ...event, localUuid: event.localUuid ?? '', status: event.status ?? '' })),
  );

  connect(): void {
    this.staffSocket.connect();
  }

  disconnect(): void {
    this.staffSocket.disconnect();
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
