import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  IonFab,
  IonFabButton,
  IonRefresher,
  IonRefresherContent,
  IonButtons,
  ModalController,
  AlertController,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, createOutline, trashOutline, fastFoodOutline, cloudUploadOutline } from 'ionicons/icons';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';
import { ProductFormModal } from './product-form.modal';

interface Product {
  uuid: string;
  name: string;
  description: string;
  price: number;
  category: string;
}

@Component({
  selector: 'app-productos',
  templateUrl: './productos.page.html',
  styleUrls: ['./productos.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonList,
    IonItem,
    IonLabel,
    IonButton,
    IonIcon,
    IonFab,
    IonFabButton,
    IonRefresher,
    IonRefresherContent,
    IonButtons,
  ],
})
export class ProductosPage {
  products: Product[] = [];
  isSyncing = false;
  private readonly api = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
  ) {
    addIcons({ addOutline, createOutline, trashOutline, fastFoodOutline, cloudUploadOutline });
  }

  ionViewWillEnter() {
    this.loadProducts();
  }

  syncMenuToRag() {
    this.isSyncing = true;
    this.http.post<{ chunks: number; companyId: string }>(`${this.api}restaurant-admin/ingest-menu`, {}).subscribe({
      next: async (res) => {
        this.isSyncing = false;
        const t = await this.toastCtrl.create({
          message: `Menú sincronizado — ${res.chunks} fragmentos indexados`,
          duration: 3000,
          color: 'success',
        });
        t.present();
      },
      error: async () => {
        this.isSyncing = false;
        const t = await this.toastCtrl.create({
          message: 'Error al sincronizar el menú con RAG',
          duration: 3000,
          color: 'danger',
        });
        t.present();
      },
    });
  }

  loadProducts(event?: any) {
    this.http.get<Product[]>(`${this.api}restaurant-admin/products`).subscribe({
      next: (data) => {
        this.products = data;
        event?.target?.complete();
      },
      error: async () => {
        event?.target?.complete();
        const t = await this.toastCtrl.create({
          message: 'Error al cargar productos',
          duration: 2000,
          color: 'danger',
        });
        t.present();
      },
    });
  }

  doRefresh(event: any) {
    this.loadProducts(event);
  }

  async openCreateModal() {
    const modal = await this.modalCtrl.create({
      component: ProductFormModal,
      componentProps: { product: null },
    });
    await modal.present();
    const { data, role } = await modal.onWillDismiss();
    if (role === 'save' && data) {
      const staff = this.authService.getStaffInfo();
      const body = { ...data, localUuid: staff?.localUuid };
      this.http
        .post<Product>(`${this.api}restaurant-admin/products`, body)
        .subscribe({
          next: async () => {
            this.loadProducts();
            const t = await this.toastCtrl.create({
              message: 'Producto creado',
              duration: 2000,
              color: 'success',
            });
            t.present();
          },
          error: async (err) => {
            const t = await this.toastCtrl.create({
              message: err?.error?.message || 'Error al crear producto',
              duration: 2000,
              color: 'danger',
            });
            t.present();
          },
        });
    }
  }

  async openEditModal(product: Product) {
    const modal = await this.modalCtrl.create({
      component: ProductFormModal,
      componentProps: { product },
    });
    await modal.present();
    const { data, role } = await modal.onWillDismiss();
    if (role === 'save' && data) {
      this.http
        .patch<Product>(
          `${this.api}restaurant-admin/products/${product.uuid}`,
          data,
        )
        .subscribe({
          next: async () => {
            this.loadProducts();
            const t = await this.toastCtrl.create({
              message: 'Producto actualizado',
              duration: 2000,
              color: 'success',
            });
            t.present();
          },
          error: async (err) => {
            const t = await this.toastCtrl.create({
              message: err?.error?.message || 'Error al actualizar',
              duration: 2000,
              color: 'danger',
            });
            t.present();
          },
        });
    }
  }

  async confirmDelete(product: Product) {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar producto',
      message: `¿Eliminar "${product.name}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => this.deleteProduct(product),
        },
      ],
    });
    await alert.present();
  }

  private deleteProduct(product: Product) {
    this.http
      .delete(`${this.api}restaurant-admin/products/${product.uuid}`)
      .subscribe({
        next: async () => {
          this.loadProducts();
          const t = await this.toastCtrl.create({
            message: 'Producto eliminado',
            duration: 2000,
            color: 'success',
          });
          t.present();
        },
        error: async () => {
          const t = await this.toastCtrl.create({
            message: 'Error al eliminar producto',
            duration: 2000,
            color: 'danger',
          });
          t.present();
        },
      });
  }
}
