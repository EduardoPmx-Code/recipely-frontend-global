import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonButton, IonSpinner, IonRefresher, IonRefresherContent, IonIcon,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { downloadOutline, qrCodeOutline, homeOutline } from 'ionicons/icons';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';

interface Board {
  uuid: string;
  descripcion: string;
  slot: number;
}

@Component({
  selector: 'app-qrs',
  templateUrl: 'qrs.page.html',
  styleUrls: ['qrs.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonButton, IonSpinner, IonRefresher, IonRefresherContent, IonIcon,
  ],
})
export class QrsPage implements OnInit {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private toastCtrl = inject(ToastController);

  localUuid = '';
  localQrUrl = '';
  boards: Board[] = [];
  loading = false;

  constructor() {
    addIcons({ downloadOutline, qrCodeOutline, homeOutline });
  }

  ngOnInit() {
    const staff = this.authService.getStaffInfo();
    this.localUuid = staff?.localUuid ?? '';
    this.localQrUrl = this.buildQrUrl(this.localUuid);
  }

  ionViewWillEnter() {
    this.loadBoards();
  }

  loadBoards(event?: any) {
    this.loading = true;
    this.http.get<Board[]>(`${environment.apiUrl}qrs/boards`).subscribe({
      next: (boards) => {
        this.boards = boards;
        this.loading = false;
        event?.target?.complete();
      },
      error: () => {
        this.loading = false;
        event?.target?.complete();
      },
    });
  }

  handleRefresh(event: any) {
    this.loadBoards(event);
  }

  buildQrUrl(data: string, size = 200): string {
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}`;
  }

  downloadQr(data: string, filename: string) {
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&format=png&data=${encodeURIComponent(data)}`;
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.target = '_blank';
    a.click();
  }
}


