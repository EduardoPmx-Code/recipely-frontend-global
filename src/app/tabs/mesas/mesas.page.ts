import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonBadge, IonButton, IonFab, IonFabButton,
  IonSpinner, IonRefresher, IonRefresherContent, IonIcon,
  IonModal, IonItem, IonLabel, IonInput, IonButtons, IonList,
  IonNote,
  AlertController, ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline, trashOutline, gridOutline, peopleOutline, checkmarkCircleOutline,
} from 'ionicons/icons';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';

interface Board {
  uuid: string;
  descripcion: string;
  slot: number;
  hasActiveSession?: boolean;
}

interface ActiveSession {
  uuid: string;
  boardUuid?: string;
  boardIdentifier: string;
  membersCount: number;
  status: 'OPEN' | 'CLOSED';
  createdAt: string;
}

@Component({
  selector: 'app-mesas',
  templateUrl: 'mesas.page.html',
  styleUrls: ['mesas.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonBadge, IonButton, IonFab, IonFabButton,
    IonSpinner, IonRefresher, IonRefresherContent, IonIcon,
    IonModal, IonItem, IonLabel, IonInput, IonButtons, IonList,
    IonNote,
  ],
})
export class MesasPage implements OnInit {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);

  boards: Board[] = [];
  activeSessions: ActiveSession[] = [];
  loading = false;

  showModal = false;
  newDescripcion = '';
  newSlot: number | null = null;
  saving = false;

  constructor() {
    addIcons({ addOutline, trashOutline, gridOutline, peopleOutline, checkmarkCircleOutline });
  }

  ngOnInit() {}

  ionViewWillEnter() {
    this.load();
  }

  load(event?: any) {
    this.loading = true;
    let done = 0;
    const finish = () => {
      done++;
      if (done === 2) {
        this.loading = false;
        event?.target?.complete();
      }
    };

    this.http.get<Board[]>(`${environment.apiUrl}qrs/boards`).subscribe({
      next: (boards) => { this.boards = boards; finish(); },
      error: () => finish(),
    });

    this.http.get<ActiveSession[]>(`${environment.apiUrl}restaurant-admin/sessions?status=OPEN`).subscribe({
      next: (sessions) => { this.activeSessions = sessions; finish(); },
      error: () => finish(),
    });
  }

  handleRefresh(event: any) {
    this.load(event);
  }

  getActiveSession(board: Board): ActiveSession | undefined {
    return this.activeSessions.find(
      s => s.boardIdentifier === (board.descripcion || `Mesa ${board.slot}`)
    );
  }

  openNewBoardModal() {
    this.newDescripcion = '';
    this.newSlot = null;
    this.showModal = true;
  }

  saveBoard() {
    if (!this.newDescripcion.trim() || !this.newSlot) return;
    this.saving = true;
    this.http.post<Board>(`${environment.apiUrl}qrs/boards`, {
      descripcion: this.newDescripcion.trim(),
      slot: Number(this.newSlot),
    }).subscribe({
      next: (board) => {
        this.boards = [...this.boards, board];
        this.showModal = false;
        this.saving = false;
        this.showToast(`Mesa "${board.descripcion}" creada ✅`, 'success');
      },
      error: () => {
        this.saving = false;
        this.showToast('Error al crear la mesa', 'danger');
      },
    });
  }

  async confirmDelete(board: Board) {
    const session = this.getActiveSession(board);
    const alert = await this.alertCtrl.create({
      header: 'Eliminar mesa',
      message: session
        ? `"${board.descripcion}" tiene una sesión activa. ¿Seguro que deseas eliminarla?`
        : `¿Eliminar "${board.descripcion}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Eliminar', role: 'destructive', handler: () => this.deleteBoard(board) },
      ],
    });
    await alert.present();
  }

  deleteBoard(board: Board) {
    this.http.delete(`${environment.apiUrl}qrs/boards/${board.uuid}`).subscribe({
      next: () => {
        this.boards = this.boards.filter(b => b.uuid !== board.uuid);
        this.showToast(`Mesa "${board.descripcion}" eliminada`, 'warning');
      },
      error: () => this.showToast('Error al eliminar la mesa', 'danger'),
    });
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({ message, duration: 2500, color, position: 'bottom' });
    await toast.present();
  }
}
