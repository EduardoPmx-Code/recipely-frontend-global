import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';

export interface StaffOrderEvent {
  orderUuid: string;
  boardUuid: string;
  sesionBoardUuid: string;
  localUuid?: string;
  total?: number;
  totalAmount?: number;
  itemCount: number;
  status?: string;
}

export interface StaffWaiterCallEvent {
  callUuid: string;
  boardUuid: string;
  sesionBoardUuid: string;
  tipo: string;
  createdAt: string;
}

export interface SessionClosedEvent {
  sesionBoardUuid: string;
  reason: string;
}

@Injectable({ providedIn: 'root' })
export class StaffWebsocketService implements OnDestroy {
  private socket: Socket | null = null;
  private readonly orderCreated = new Subject<StaffOrderEvent>();
  private readonly orderStatusChanged = new Subject<StaffOrderEvent>();
  private readonly waiterCall = new Subject<StaffWaiterCallEvent>();
  private readonly sessionClosed = new Subject<SessionClosedEvent>();

  readonly orderCreated$: Observable<StaffOrderEvent> = this.orderCreated.asObservable();
  readonly orderStatusChanged$: Observable<StaffOrderEvent> = this.orderStatusChanged.asObservable();
  readonly waiterCall$: Observable<StaffWaiterCallEvent> = this.waiterCall.asObservable();
  readonly sessionClosed$: Observable<SessionClosedEvent> = this.sessionClosed.asObservable();

  connect(): void {
    if (this.socket?.connected || this.socket?.active) return;
    this.socket?.removeAllListeners();
    this.socket?.disconnect();
    const token = localStorage.getItem('staff_access_token');
    if (!token) return;
    this.socket = io(`${environment.wsUrl}/ws`, {
      path: '/socket.io',
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 15,
      extraHeaders: { 'ngrok-skip-browser-warning': 'true' },
    });
    this.socket.on('connect', () => this.socket?.emit('join:local'));
    this.socket.on('order:created', (event: StaffOrderEvent) => this.orderCreated.next(event));
    this.socket.on('order:status_changed', (event: StaffOrderEvent) => this.orderStatusChanged.next(event));
    this.socket.on('waiter:call', (event: StaffWaiterCallEvent) => this.waiterCall.next(event));
    this.socket.on('session:closed', (event: SessionClosedEvent) => this.sessionClosed.next(event));
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  ngOnDestroy(): void { this.disconnect(); }
}
