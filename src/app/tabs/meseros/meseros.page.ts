import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonList, IonItem, IonLabel,
  IonButton, IonIcon, IonFab, IonFabButton, IonRefresher, IonRefresherContent,
  IonBadge, IonButtons,
  ModalController, AlertController, ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, createOutline, trashOutline, personOutline } from 'ionicons/icons';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';
import { StaffFormModal } from './staff-form.modal';

interface StaffMember {
  uuid: string;
  name: string;
  email: string;
  role: 'WAITER' | 'ADMIN' | 'MANAGER' | 'KITCHEN';
  active: boolean;
}

const ROLE_LABELS: Record<string, string> = {
  WAITER: 'Mesero',
  KITCHEN: 'Cocina',
  MANAGER: 'Gerente',
  ADMIN: 'Administrador',
};

const ROLE_COLORS: Record<string, string> = {
  WAITER: 'primary',
  KITCHEN: 'warning',
  MANAGER: 'tertiary',
  ADMIN: 'danger',
};

@Component({
  selector: 'app-meseros',
  templateUrl: './meseros.page.html',
  styleUrls: ['./meseros.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonList, IonItem, IonLabel,
    IonButton, IonIcon, IonFab, IonFabButton, IonRefresher, IonRefresherContent,
    IonBadge, IonButtons,
  ],
})
export class MeserosPage {
  staff: StaffMember[] = [];
  readonly roleLabels = ROLE_LABELS;
  readonly roleColors = ROLE_COLORS;

  private readonly api = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
  ) {
    addIcons({ addOutline, createOutline, trashOutline, personOutline });
  }

  ionViewWillEnter() {
    this.loadStaff();
  }

  loadStaff(event?: any) {
    this.http.get<StaffMember[]>(`${this.api}staff`).subscribe({
      next: (data) => {
        this.staff = data.filter((s) => s.active !== false);
        event?.target?.complete();
      },
      error: async () => {
        event?.target?.complete();
        this.showToast('Error al cargar el personal', 'danger');
      },
    });
  }

  async openCreateModal() {
    const modal = await this.modalCtrl.create({
      component: StaffFormModal,
      componentProps: { staff: null },
    });
    await modal.present();
    const { data, role } = await modal.onWillDismiss();
    if (role === 'save' && data) {
      const staffInfo = this.authService.getStaffInfo();
      const body = { ...data, localUuid: staffInfo?.localUuid };
      this.http.post<StaffMember>(`${this.api}staff`, body).subscribe({
        next: async () => {
          this.loadStaff();
          this.showToast('Mesero creado exitosamente', 'success');
        },
        error: async (err) => {
          this.showToast(err?.error?.message || 'Error al crear mesero', 'danger');
        },
      });
    }
  }

  async openEditModal(member: StaffMember) {
    const modal = await this.modalCtrl.create({
      component: StaffFormModal,
      componentProps: { staff: member },
    });
    await modal.present();
    const { data, role } = await modal.onWillDismiss();
    if (role === 'save' && data) {
      this.http.patch<StaffMember>(`${this.api}staff/${member.uuid}`, data).subscribe({
        next: async () => {
          this.loadStaff();
          this.showToast('Mesero actualizado', 'success');
        },
        error: async (err) => {
          this.showToast(err?.error?.message || 'Error al actualizar', 'danger');
        },
      });
    }
  }

  async confirmDeactivate(member: StaffMember) {
    const alert = await this.alertCtrl.create({
      header: 'Desactivar mesero',
      message: `¿Desactivar a "${member.name}"? El mesero perderá acceso al sistema.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Desactivar',
          role: 'destructive',
          handler: () => this.deactivateStaff(member),
        },
      ],
    });
    await alert.present();
  }

  private deactivateStaff(member: StaffMember) {
    this.http.delete(`${this.api}staff/${member.uuid}`).subscribe({
      next: async () => {
        this.staff = this.staff.filter((s) => s.uuid !== member.uuid);
        this.showToast('Mesero desactivado', 'warning');
      },
      error: async () => {
        this.showToast('Error al desactivar mesero', 'danger');
      },
    });
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({ message, duration: 2500, color, position: 'bottom' });
    await toast.present();
  }
}
