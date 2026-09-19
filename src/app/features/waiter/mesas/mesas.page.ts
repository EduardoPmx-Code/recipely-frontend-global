import { Component, OnDestroy, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonBadge,
  IonRefresher,
  IonRefresherContent,
  IonSkeletonText,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonGrid,
  IonRow,
  IonCol,
  IonButton,
  IonIcon,
  ModalController,
  ToastController,
  AlertController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addCircleOutline, closeCircleOutline } from 'ionicons/icons';
import { Subject, takeUntil } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { NuevoPedidoModal } from './nuevo-pedido.modal';
import { StaffWebsocketService } from '../../../core/services/staff-websocket.service';

interface BoardDoc {
  uuid: string;
  slot: number;
  descripcion: string;
}

interface SessionInfo {
  uuid: string;
  status: string;
  memberCount: number;
  startedAt: string;
}

interface BoardWithSession {
  board: BoardDoc;
  session: SessionInfo | null;
}

@Component({
  selector: 'app-mesas',
  templateUrl: 'mesas.page.html',
  styleUrls: ['mesas.page.scss'],
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonBadge,
    IonRefresher,
    IonRefresherContent,
    IonSkeletonText,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonGrid,
    IonRow,
    IonCol,
    IonButton,
    IonIcon,
  ],
})
export class MesasPage implements OnDestroy {
  boardItems: BoardWithSession[] = [];
  isLoading = true;
  skeletons = Array(6).fill(0);

  private http = inject(HttpClient);
  private router = inject(Router);
  private modalCtrl = inject(ModalController);
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);
  private wsService = inject(StaffWebsocketService);
  private baseUrl = environment.waiterApiUrl;
  private destroy$ = new Subject<void>();

  constructor() {
    addIcons({ addCircleOutline, closeCircleOutline });
  }

  ionViewWillEnter() {
    this.loadBoards();
    this.wsService.connect();
    // Listen for session closed events
    this.wsService.sessionClosed$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadBoards();
      });
  }

  ionViewWillLeave() {
    this.destroy$.next();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadBoards(event?: any) {
    if (!event) this.isLoading = true;

    this.http.get<BoardWithSession[]>(`${this.baseUrl}mesero/boards`).subscribe({
      next: (items) => {
        this.boardItems = items;
        this.isLoading = false;
        event?.target?.complete();
      },
      error: () => {
        this.isLoading = false;
        event?.target?.complete();
      },
    });
  }

  navigateToPedidos(item: BoardWithSession) {
    this.router.navigate(['/tabs/waiter/pedidos'], {
      queryParams: { boardUuid: item.board.uuid },
    });
  }

  async openNuevoPedido(event: Event, item: BoardWithSession) {
    event.stopPropagation();
    const modal = await this.modalCtrl.create({
      component: NuevoPedidoModal,
      componentProps: {
        boardUuid: item.board.uuid,
        boardLabel: this.getBoardLabel(item),
      },
    });
    await modal.present();
    const { role } = await modal.onWillDismiss();
    if (role === 'created') {
      const toast = await this.toastCtrl.create({
        message: 'Pedido creado exitosamente',
        duration: 2500,
        color: 'success',
        position: 'bottom',
      });
      toast.present();
    }
  }

  isActive(item: BoardWithSession): boolean {
    return item.session?.status === 'active';
  }

  getBoardLabel(item: BoardWithSession): string {
    return item.board.descripcion || `Mesa ${item.board.slot}`;
  }

  async closeSession(event: Event, item: BoardWithSession) {
    event.stopPropagation();
    const alert = await this.alertCtrl.create({
      header: 'Cerrar mesa',
      message: `¿Cerrar ${this.getBoardLabel(item)}? Los clientes serán expulsados.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Cerrar mesa',
          role: 'destructive',
          handler: () => this.doCloseSession(item),
        },
      ],
    });
    await alert.present();
  }

  private doCloseSession(item: BoardWithSession) {
    const sessionUuid = item.session!.uuid;
    this.http.patch(`${environment.apiUrl}sessions/${sessionUuid}/close`, {}).subscribe({
      next: async () => {
        const toast = await this.toastCtrl.create({
          message: `${this.getBoardLabel(item)} cerrada`,
          duration: 2500,
          color: 'success',
          position: 'bottom',
        });
        toast.present();
        this.loadBoards();
      },
      error: async () => {
        const toast = await this.toastCtrl.create({
          message: 'Error al cerrar la mesa',
          duration: 2500,
          color: 'danger',
          position: 'bottom',
        });
        toast.present();
      },
    });
  }
}
