import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonIcon,
  IonBadge,
  IonSegment,
  IonSegmentButton,
  IonRefresher,
  IonRefresherContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonChip,
  IonNote,
  AlertController,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeCircleOutline, peopleOutline, timeOutline, restaurantOutline, chevronDownOutline } from 'ionicons/icons';
import { environment } from '../../../environments/environment';

interface Session {
  uuid: string;
  status: 'OPEN' | 'CLOSED';
  boardIdentifier?: string;
  membersCount?: number;
  createdAt?: string;
}

interface TableGroup {
  boardIdentifier: string;
  openSession: Session | null;
  closedSessions: Session[];
  showHistory: boolean;
}

@Component({
  selector: 'app-sesiones',
  templateUrl: './sesiones.page.html',
  styleUrls: ['./sesiones.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonList,
    IonItem,
    IonLabel,
    IonButton,
    IonIcon,
    IonBadge,
    IonSegment,
    IonSegmentButton,
    IonRefresher,
    IonRefresherContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonChip,
    IonNote,
  ],
})
export class SesionesPage {
  sessions: Session[] = [];
  filter = 'all';
  private readonly api = environment.apiUrl;

  get tableGroups(): TableGroup[] {
    const filtered = this.filter === 'OPEN'
      ? this.sessions.filter(s => s.status === 'OPEN')
      : this.filter === 'CLOSED'
        ? this.sessions.filter(s => s.status === 'CLOSED')
        : this.sessions;

    const map = new Map<string, TableGroup>();

    for (const session of filtered) {
      const key = session.boardIdentifier || 'Sin identificador';
      if (!map.has(key)) {
        map.set(key, { boardIdentifier: key, openSession: null, closedSessions: [], showHistory: false });
      }
      const group = map.get(key)!;
      if (session.status === 'OPEN') {
        group.openSession = session;
      } else {
        group.closedSessions.push(session);
      }
    }

    // Sort: tables with open sessions first
    return Array.from(map.values()).sort((a, b) => {
      if (a.openSession && !b.openSession) return -1;
      if (!a.openSession && b.openSession) return 1;
      return a.boardIdentifier.localeCompare(b.boardIdentifier);
    });
  }

  constructor(
    private http: HttpClient,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
  ) {
    addIcons({ closeCircleOutline, peopleOutline, timeOutline, restaurantOutline, chevronDownOutline });
  }

  ionViewWillEnter() {
    this.loadSessions();
  }

  loadSessions(event?: any) {
    this.http
      .get<Session[]>(`${this.api}restaurant-admin/sessions`)
      .subscribe({
        next: (data) => {
          this.sessions = data;
          event?.target?.complete();
        },
        error: async () => {
          event?.target?.complete();
          const t = await this.toastCtrl.create({
            message: 'Error al cargar sesiones',
            duration: 2000,
            color: 'danger',
          });
          t.present();
        },
      });
  }

  doRefresh(event: any) {
    this.loadSessions(event);
  }

  toggleHistory(group: TableGroup) {
    group.showHistory = !group.showHistory;
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  async confirmClose(session: Session) {
    const alert = await this.alertCtrl.create({
      header: 'Cerrar sesión',
      message: `¿Cerrar la sesión activa de mesa "${session.boardIdentifier}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Cerrar sesión',
          role: 'destructive',
          handler: () => this.closeSession(session),
        },
      ],
    });
    await alert.present();
  }

  private closeSession(session: Session) {
    this.http
      .patch(`${this.api}restaurant-admin/sessions/${session.uuid}/close`, {})
      .subscribe({
        next: async () => {
          this.loadSessions();
          const t = await this.toastCtrl.create({
            message: 'Sesión cerrada',
            duration: 2000,
            color: 'success',
          });
          t.present();
        },
        error: async () => {
          const t = await this.toastCtrl.create({
            message: 'Error al cerrar sesión',
            duration: 2000,
            color: 'danger',
          });
          t.present();
        },
      });
  }
}
