import { Component, OnInit } from '@angular/core';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonGrid, IonRow, IonCol, IonBadge, IonSpinner,
  IonFab, IonFabButton, IonAlert, IonModal,
  IonItem, IonLabel, IonInput, IonButtons, IonList,
  AlertController, ToastController, ModalController
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { addOutline, trashOutline, qrCodeOutline, downloadOutline, restaurantOutline } from 'ionicons/icons';
import { QrService, BoardItem, LocalInfo } from '../core/services/qr.service';
import QRCode from 'qrcode';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  imports: [
    CommonModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonGrid, IonRow, IonCol, IonBadge, IonSpinner,
    IonFab, IonFabButton, IonModal,
    IonItem, IonLabel, IonInput, IonButtons, IonList
  ]
})
export class Tab2Page implements OnInit {
  local: LocalInfo | null = null;
  boards: BoardItem[] = [];
  loading = true;
  localQrUrl = '';

  // Modal nueva mesa
  showModal = false;
  newDescripcion = '';
  newSlot: number | null = null;
  saving = false;

  // QR del local (imagen base64)
  localQrDataUrl = '';
  boardQrMap: Record<string, string> = {};

  // QR en detalle
  selectedBoard: BoardItem | null = null;
  showQrModal = false;
  selectedQrDataUrl = '';

  constructor(
    private qrService: QrService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
  ) {
    addIcons({ addOutline, trashOutline, qrCodeOutline, downloadOutline, restaurantOutline });
  }

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading = true;
    this.qrService.getLocal().subscribe({
      next: (local) => {
        this.local = local;
        this.generateLocalQr(local.localUuid);
        this.loadBoards();
      },
      error: () => { this.loading = false; }
    });
  }

  loadBoards() {
    this.qrService.getBoards().subscribe({
      next: (boards) => {
        this.boards = boards;
        this.loading = false;
        boards.forEach(b => this.generateBoardQr(b));
      },
      error: () => { this.loading = false; }
    });
  }

  private async generateLocalQr(localUuid: string) {
    this.localQrDataUrl = await QRCode.toDataURL(localUuid, { width: 200, margin: 1 });
  }

  private async generateBoardQr(board: BoardItem) {
    this.boardQrMap[board.uuid] = await QRCode.toDataURL(board.uuid, { width: 160, margin: 1 });
  }

  openNewBoardModal() {
    this.newDescripcion = '';
    this.newSlot = null;
    this.showModal = true;
  }

  async saveBoard() {
    if (!this.newDescripcion.trim() || !this.newSlot) return;
    this.saving = true;
    this.qrService.createBoard(this.newDescripcion.trim(), Number(this.newSlot)).subscribe({
      next: (board) => {
        this.boards = [...this.boards, board];
        this.generateBoardQr(board);
        this.showModal = false;
        this.saving = false;
        this.showToast(`Mesa "${board.descripcion}" creada`, 'success');
      },
      error: () => {
        this.saving = false;
        this.showToast('Error al crear la mesa', 'danger');
      }
    });
  }

  async confirmDelete(board: BoardItem) {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar mesa',
      message: `¿Eliminar "${board.descripcion}"? Se borrará el QR y todos los datos asociados.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar', role: 'destructive',
          handler: () => this.deleteBoard(board)
        }
      ]
    });
    await alert.present();
  }

  deleteBoard(board: BoardItem) {
    this.qrService.deleteBoard(board.uuid).subscribe({
      next: () => {
        this.boards = this.boards.filter(b => b.uuid !== board.uuid);
        delete this.boardQrMap[board.uuid];
        this.showToast(`Mesa "${board.descripcion}" eliminada`, 'warning');
      },
      error: () => this.showToast('Error al eliminar la mesa', 'danger')
    });
  }

  openQrDetail(board: BoardItem) {
    this.selectedBoard = board;
    this.selectedQrDataUrl = this.boardQrMap[board.uuid] || '';
    this.showQrModal = true;
  }

  async downloadQr(name: string, dataUrl: string) {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `qr-${name}.png`;
    a.click();
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({ message, duration: 2500, color, position: 'bottom' });
    await toast.present();
  }
}

