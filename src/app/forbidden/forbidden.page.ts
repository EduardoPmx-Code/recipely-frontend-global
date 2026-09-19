import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { lockClosedOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';

@Component({
  selector: 'app-forbidden',
  templateUrl: './forbidden.page.html',
  styleUrls: ['./forbidden.page.scss'],
  standalone: true,
  imports: [
    RouterLink,
    IonButton,
    IonContent,
    IonHeader,
    IonIcon,
    IonTitle,
    IonToolbar,
  ],
})
export class ForbiddenPage {
  constructor() {
    addIcons({ lockClosedOutline });
  }
}
