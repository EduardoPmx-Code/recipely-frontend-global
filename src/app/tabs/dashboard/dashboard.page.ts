import { Component } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardContent,
  IonRefresher,
  IonRefresherContent,
  IonGrid,
  IonRow,
  IonCol,
  IonIcon,
  IonButtons,
  IonButton,
  IonBadge,
  IonNote,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  peopleOutline,
  timeOutline,
  receiptOutline,
  cashOutline,
  logOutOutline,
  gridOutline,
  cubeOutline,
  arrowForwardOutline,
} from 'ionicons/icons';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';

interface DashboardData {
  activeSessions: number;
  pendingOrders: number;
  totalOrdersToday: number;
  revenueToday: number;
  totalBoards: number;
  totalProducts: number;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonCard,
    IonCardContent,
    IonRefresher,
    IonRefresherContent,
    IonGrid,
    IonRow,
    IonCol,
    IonIcon,
    IonButtons,
    IonButton,
    IonBadge,
    IonNote,
  ],
})
export class DashboardPage {
  dashboard: DashboardData | null = null;
  isLoading = false;
  private readonly api = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    public router: Router,
    private toastCtrl: ToastController,
  ) {
    addIcons({ peopleOutline, timeOutline, receiptOutline, cashOutline, logOutOutline, gridOutline, cubeOutline, arrowForwardOutline });
  }

  ionViewWillEnter() {
    this.load();
  }

  load(event?: any) {
    this.isLoading = !event;
    this.http
      .get<DashboardData>(`${this.api}restaurant-admin/dashboard`)
      .subscribe({
        next: (data) => {
          this.dashboard = data;
          this.isLoading = false;
          event?.target?.complete();
        },
        error: async () => {
          this.isLoading = false;
          event?.target?.complete();
          const t = await this.toastCtrl.create({
            message: 'Error al cargar el dashboard',
            duration: 2000,
            color: 'danger',
          });
          t.present();
        },
      });
  }

  doRefresh(event: any) {
    this.load(event);
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => {
        this.authService.clearStorage();
        this.router.navigate(['/login']);
      },
    });
  }
}
