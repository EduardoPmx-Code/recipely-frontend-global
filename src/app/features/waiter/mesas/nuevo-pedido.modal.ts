import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import {
  ModalController, ToastController,
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton,
  IonList, IonItem, IonLabel, IonNote, IonTextarea, IonSpinner,
  IonIcon, IonFooter,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addCircleOutline, removeCircleOutline } from 'ionicons/icons';
import { environment } from '../../../../environments/environment';

interface Product {
  uuid: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
}

interface CartItem {
  product: Product;
  cantidad: number;
}

@Component({
  selector: 'app-nuevo-pedido-modal',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton,
    IonList, IonItem, IonLabel, IonNote, IonTextarea, IonSpinner,
    IonIcon, IonFooter,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-button (click)="dismiss()">Cancelar</ion-button>
        </ion-buttons>
        <ion-title>Nuevo Pedido · {{ boardLabel }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      @if (isLoading) {
        <div style="display:flex;justify-content:center;padding:48px;">
          <ion-spinner name="crescent"></ion-spinner>
        </div>
      } @else if (products.length === 0) {
        <div style="text-align:center;padding:48px;color:var(--ion-color-medium);">
          <p>No hay productos disponibles</p>
        </div>
      } @else {
        @if (currentCategory) {
          <div class="category-header">{{ currentCategory }}</div>
        }
        <ion-list>
          @for (product of products; track product.uuid) {
            @if (shouldShowCategoryHeader(product)) {
              <div class="category-header">{{ product.category || 'Sin categoría' }}</div>
            }
            <ion-item>
              <ion-label>
                <h3>{{ product.name }}</h3>
                @if (product.description) {
                  <p>{{ product.description }}</p>
                }
                <ion-note color="primary">{{ product.price | currency:'USD':'symbol':'1.2-2' }}</ion-note>
              </ion-label>
              <div slot="end" class="qty-controls">
                <ion-button fill="clear" size="small" (click)="decrement(product)">
                  <ion-icon name="remove-circle-outline" slot="icon-only"></ion-icon>
                </ion-button>
                <span class="qty-value">{{ getQty(product) }}</span>
                <ion-button fill="clear" size="small" (click)="increment(product)">
                  <ion-icon name="add-circle-outline" slot="icon-only"></ion-icon>
                </ion-button>
              </div>
            </ion-item>
          }
        </ion-list>

        <div class="ion-padding">
          <ion-item>
            <ion-textarea
              label="Notas (opcional)"
              labelPlacement="floating"
              [(ngModel)]="notas"
              placeholder="Alergias, preparación especial..."
              rows="2"
            ></ion-textarea>
          </ion-item>
        </div>
      }
    </ion-content>

    <ion-footer>
      <ion-toolbar>
        <div class="footer-content">
          <div class="order-summary">
            <span>{{ totalItems }} producto(s)</span>
            <strong>{{ totalPrice | currency:'USD':'symbol':'1.2-2' }}</strong>
          </div>
          <ion-button
            expand="block"
            color="success"
            [disabled]="totalItems === 0 || isSubmitting"
            (click)="submitOrder()"
          >
            @if (isSubmitting) {
              <ion-spinner name="crescent" slot="start"></ion-spinner>
            }
            Enviar Pedido
          </ion-button>
        </div>
      </ion-toolbar>
    </ion-footer>
  `,
  styles: [`
    .category-header {
      padding: 8px 16px 4px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--ion-color-medium);
      background: var(--ion-background-color);
      border-bottom: 1px solid var(--ion-color-light);
    }
    .qty-controls {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .qty-value {
      min-width: 24px;
      text-align: center;
      font-weight: 600;
      font-size: 16px;
    }
    .footer-content {
      padding: 8px 16px;
    }
    .order-summary {
      display: flex;
      justify-content: space-between;
      padding: 4px 0 8px;
      font-size: 14px;
    }
  `],
})
export class NuevoPedidoModal implements OnInit {
  @Input() boardUuid!: string;
  @Input() boardLabel = 'Mesa';

  products: Product[] = [];
  cart = new Map<string, CartItem>();
  notas = '';
  isLoading = true;
  isSubmitting = false;

  private renderedCategories = new Set<string>();
  currentCategory = '';

  private readonly api = environment.waiterApiUrl;

  constructor(
    private http: HttpClient,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
  ) {
    addIcons({ addCircleOutline, removeCircleOutline });
  }

  ngOnInit() {
    this.http.get<Product[]>(`${this.api}mesero/products`).subscribe({
      next: (data) => {
        this.products = data;
        this.isLoading = false;
      },
      error: async () => {
        this.isLoading = false;
        const t = await this.toastCtrl.create({
          message: 'Error al cargar el menú',
          duration: 2000,
          color: 'danger',
        });
        t.present();
      },
    });
  }

  shouldShowCategoryHeader(product: Product): boolean {
    const cat = product.category || 'Sin categoría';
    if (!this.renderedCategories.has(cat)) {
      this.renderedCategories.add(cat);
      return true;
    }
    return false;
  }

  getQty(product: Product): number {
    return this.cart.get(product.uuid)?.cantidad ?? 0;
  }

  increment(product: Product) {
    const existing = this.cart.get(product.uuid);
    if (existing) {
      existing.cantidad++;
    } else {
      this.cart.set(product.uuid, { product, cantidad: 1 });
    }
  }

  decrement(product: Product) {
    const existing = this.cart.get(product.uuid);
    if (!existing) return;
    existing.cantidad--;
    if (existing.cantidad <= 0) this.cart.delete(product.uuid);
  }

  get totalItems(): number {
    let total = 0;
    this.cart.forEach((item) => (total += item.cantidad));
    return total;
  }

  get totalPrice(): number {
    let total = 0;
    this.cart.forEach((item) => (total += item.product.price * item.cantidad));
    return total;
  }

  dismiss() {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  submitOrder() {
    if (this.totalItems === 0) return;
    this.isSubmitting = true;

    const items = Array.from(this.cart.values()).map((i) => ({
      productUuid: i.product.uuid,
      cantidad: i.cantidad,
    }));

    const body = { boardUuid: this.boardUuid, items, notas: this.notas || undefined };

    this.http.post(`${this.api}mesero/orders`, body).subscribe({
      next: async () => {
        this.isSubmitting = false;
        await this.modalCtrl.dismiss(null, 'created');
      },
      error: async (err) => {
        this.isSubmitting = false;
        const t = await this.toastCtrl.create({
          message: err?.error?.message || 'Error al crear el pedido',
          duration: 3000,
          color: 'danger',
        });
        t.present();
      },
    });
  }
}
