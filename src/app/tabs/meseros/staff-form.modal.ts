import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalController } from '@ionic/angular/standalone';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonButton, IonInput, IonItem, IonButtons, IonSelect, IonSelectOption,
} from '@ionic/angular/standalone';

export interface StaffForm {
  name: string;
  email: string;
  password: string;
  role: 'WAITER' | 'ADMIN' | 'MANAGER' | 'KITCHEN';
}

@Component({
  selector: 'app-staff-form',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonButton, IonInput, IonItem, IonButtons, IonSelect, IonSelectOption,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-button (click)="dismiss()">Cancelar</ion-button>
        </ion-buttons>
        <ion-title>{{ isEdit ? 'Editar Mesero' : 'Nuevo Mesero' }}</ion-title>
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
          placeholder="Nombre completo"
        ></ion-input>
      </ion-item>
      <ion-item>
        <ion-input
          label="Correo electrónico *"
          labelPlacement="floating"
          type="email"
          [(ngModel)]="form.email"
          placeholder="correo@restaurante.com"
        ></ion-input>
      </ion-item>
      <ion-item>
        <ion-input
          label="{{ isEdit ? 'Nueva contraseña (opcional)' : 'Contraseña *' }}"
          labelPlacement="floating"
          type="password"
          [(ngModel)]="form.password"
          placeholder="Mínimo 6 caracteres"
        ></ion-input>
      </ion-item>
      <ion-item>
        <ion-select
          label="Rol *"
          labelPlacement="floating"
          [(ngModel)]="form.role"
          interface="popover"
        >
          <ion-select-option value="WAITER">Mesero</ion-select-option>
          <ion-select-option value="KITCHEN">Cocina</ion-select-option>
          <ion-select-option value="MANAGER">Gerente</ion-select-option>
          <ion-select-option value="ADMIN">Administrador</ion-select-option>
        </ion-select>
      </ion-item>
    </ion-content>
  `,
})
export class StaffFormModal implements OnInit {
  @Input() staff: any = null;

  get isEdit() {
    return !!this.staff;
  }

  form: StaffForm = { name: '', email: '', password: '', role: 'WAITER' };

  constructor(private modalCtrl: ModalController) {}

  ngOnInit() {
    if (this.staff) {
      this.form = {
        name: this.staff.name ?? '',
        email: this.staff.email ?? '',
        password: '',
        role: this.staff.role ?? 'WAITER',
      };
    }
  }

  dismiss() {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  save() {
    if (!this.form.name || !this.form.email) return;
    if (!this.isEdit && !this.form.password) return;
    const payload: any = {
      name: this.form.name,
      email: this.form.email,
      role: this.form.role,
    };
    if (this.form.password) payload.password = this.form.password;
    this.modalCtrl.dismiss(payload, 'save');
  }
}
