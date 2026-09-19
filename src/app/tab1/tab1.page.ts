import { Component, inject, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonRefresher, IonRefresherContent, IonCard, IonCardHeader,
  IonCardTitle, IonCardContent, IonSkeletonText, IonGrid,
  IonRow, IonCol, IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  peopleOutline, receiptOutline, timeOutline, cashOutline,
  gridOutline, fastFoodOutline,
} from 'ionicons/icons';
import { environment } from '../../environments/environment';

interface Dashboard {
  activeSessions: number;
  totalOrdersToday: number;
  pendingOrders: number;
  revenueToday: number;
  totalBoards: number;
  totalProducts: number;
}

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  imports: [
    CommonModule, IonHeader, IonToolbar, IonTitle, IonContent,
    IonRefresher, IonRefresherContent, IonCard, IonCardHeader,
    IonCardTitle, IonCardContent, IonSkeletonText, IonGrid,
    IonRow, IonCol, IonIcon,
  ],
})
export class Tab1Page implements OnInit {
  dashboard: Dashboard | null = null;
  isLoading = true;

  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  constructor() {
    addIcons({ peopleOutline, receiptOutline, timeOutline, cashOutline, gridOutline, fastFoodOutline });
  }

  ngOnInit() {
    this.loadDashboard();
  }

  ionViewWillEnter() {
    this.loadDashboard();
  }

  loadDashboard(event?: any) {
    if (!event) this.isLoading = true;

    this.http.get<Dashboard>(`${this.baseUrl}restaurant-admin/dashboard`).subscribe({
      next: (data) => {
        this.dashboard = data;
        this.isLoading = false;
        event?.target?.complete();
      },
      error: () => {
        this.isLoading = false;
        event?.target?.complete();
      },
    });
  }
}
