import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButton,
  IonInput,
  IonItem,
  IonNote,
  IonSpinner,
} from '@ionic/angular/standalone';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButton,
    IonInput,
    IonItem,
    IonNote,
    IonSpinner,
  ],
})
export class LoginPage {
  email = '';
  password = '';
  errorMessage = '';
  isLoading = false;

  constructor(
    private authService: AuthService,
  ) {}

  onLogin() {
    if (!this.email || !this.password) {
      this.errorMessage = 'Por favor ingresa email y contraseña';
      return;
    }
    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.email, this.password).subscribe({
      next: (res) => {
        this.isLoading = false;
        const defaultRoute = this.authService.getDefaultRoute();
        if (!defaultRoute) {
          this.authService.clearStorage();
          this.errorMessage = 'Tu cuenta no tiene acceso a un módulo disponible.';
          return;
        }
        window.location.assign(defaultRoute);
      },
      error: (err: any) => {
        this.isLoading = false;
        this.errorMessage =
          err?.error?.message || 'Credenciales inválidas. Intenta de nuevo.';
      },
    });
  }
}
