import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalController } from '@ionic/angular/standalone';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonInput,
  IonItem,
  IonButtons,
} from '@ionic/angular/standalone';

export interface ProductForm {
  name: string;
  description: string;
  price: number;
  category: string;
}

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonInput,
    IonItem,
    IonButtons,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-button (click)="dismiss()">Cancelar</ion-button>
        </ion-buttons>
        <ion-title>{{ isEdit ? 'Editar Producto' : 'Nuevo Producto' }}</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="save()" [strong]="true">Guardar</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <ion-item>
        <ion-input
          label="Nombre *"
          labelPlacement="floating"
          [(ngModel)]="form.name"
          placeholder="Nombre del producto"
        ></ion-input>
      </ion-item>
      <ion-item>
        <ion-input
          label="Descripción"
          labelPlacement="floating"
          [(ngModel)]="form.description"
          placeholder="Descripción opcional"
        ></ion-input>
      </ion-item>
      <ion-item>
        <ion-input
          label="Precio *"
          labelPlacement="floating"
          type="number"
          [(ngModel)]="form.price"
          placeholder="0.00"
        ></ion-input>
      </ion-item>
      <ion-item>
        <ion-input
          label="Categoría *"
          labelPlacement="floating"
          [(ngModel)]="form.category"
          placeholder="Ej: Bebidas, Entradas..."
        ></ion-input>
      </ion-item>
    </ion-content>
  `,
})
export class ProductFormModal implements OnInit {
  @Input() product: any = null;

  get isEdit() {
    return !!this.product;
  }

  form: ProductForm = { name: '', description: '', price: 0, category: '' };

  constructor(private modalCtrl: ModalController) {}

  ngOnInit() {
    if (this.product) {
      this.form = {
        name: this.product.name ?? '',
        description: this.product.description ?? '',
        price: this.product.price ?? 0,
        category: this.product.category ?? '',
      };
    }
  }

  dismiss() {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  save() {
    if (!this.form.name || !this.form.category || !this.form.price) {
      return;
    }
    this.modalCtrl.dismiss(this.form, 'save');
  }
}
