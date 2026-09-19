import { Component, inject, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonRefresher, IonRefresherContent,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonSkeletonText,
  IonList, IonItem, IonLabel, IonBadge, IonButton, IonIcon, IonFab, IonFabButton,
  IonInput, IonTextarea, IonModal, IonButtons, AlertController, ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, createOutline, trashOutline, closeOutline, checkmarkOutline } from 'ionicons/icons';
import { environment } from '../../environments/environment';

interface Product {
  uuid: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  active: boolean;
}

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  imports: [
    CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, IonContent,
    IonRefresher, IonRefresherContent, IonCard, IonCardHeader, IonCardTitle,
    IonCardContent, IonSkeletonText, IonList, IonItem, IonLabel, IonBadge,
    IonButton, IonIcon, IonFab, IonFabButton, IonInput, IonTextarea,
    IonModal, IonButtons,
  ],
})
export class Tab3Page implements OnInit {
  products: Product[] = [];
  isLoading = true;
  showForm = false;
  editingProduct: Product | null = null;

  form = { name: '', description: '', price: 0, category: '' };

  private http = inject(HttpClient);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);
  private baseUrl = environment.apiUrl;

  constructor() {
    addIcons({ addOutline, createOutline, trashOutline, closeOutline, checkmarkOutline });
  }

  ngOnInit() {
    this.loadProducts();
  }

  ionViewWillEnter() {
    this.loadProducts();
  }

  loadProducts(event?: any) {
    if (!event) this.isLoading = true;

    this.http.get<Product[]>(`${this.baseUrl}restaurant-admin/products`).subscribe({
      next: (products) => {
        this.products = products.filter((p) => p.active !== false);
        this.isLoading = false;
        event?.target?.complete();
      },
      error: () => {
        this.isLoading = false;
        event?.target?.complete();
      },
    });
  }

  openCreate() {
    this.editingProduct = null;
    this.form = { name: '', description: '', price: 0, category: '' };
    this.showForm = true;
  }

  openEdit(product: Product) {
    this.editingProduct = product;
    this.form = {
      name: product.name,
      description: product.description || '',
      price: product.price,
      category: product.category || '',
    };
    this.showForm = true;
  }

  closeForm() {
    this.showForm = false;
    this.editingProduct = null;
  }

  saveProduct() {
    if (!this.form.name || this.form.price <= 0) return;

    const body = { ...this.form, price: Number(this.form.price) };

    if (this.editingProduct) {
      this.http
        .patch(`${this.baseUrl}restaurant-admin/products/${this.editingProduct.uuid}`, body)
        .subscribe({
          next: () => {
            this.closeForm();
            this.loadProducts();
            this.showToast('Producto actualizado');
          },
        });
    } else {
      this.http.post(`${this.baseUrl}restaurant-admin/products`, body).subscribe({
        next: () => {
          this.closeForm();
          this.loadProducts();
          this.showToast('Producto creado');
        },
      });
    }
  }

  async confirmDelete(product: Product) {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar producto',
      message: `¿Deseas eliminar "${product.name}"?`,
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

  deleteProduct(product: Product) {
    this.http
      .delete(`${this.baseUrl}restaurant-admin/products/${product.uuid}`)
      .subscribe({
        next: () => {
          this.products = this.products.filter((p) => p.uuid !== product.uuid);
          this.showToast('Producto eliminado');
        },
      });
  }

  private async showToast(message: string) {
    const toast = await this.toastCtrl.create({ message, duration: 2000, position: 'bottom' });
    await toast.present();
  }
}
