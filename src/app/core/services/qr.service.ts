import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface BoardItem {
  uuid: string;
  descripcion: string;
  slot: number;
}

export interface LocalInfo {
  localUuid: string;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class QrService {
  private readonly base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getLocal(): Observable<LocalInfo> {
    return this.http.get<LocalInfo>(`${this.base}qrs/local`);
  }

  getBoards(): Observable<BoardItem[]> {
    return this.http.get<BoardItem[]>(`${this.base}qrs/boards`);
  }

  createBoard(descripcion: string, slot: number): Observable<BoardItem> {
    return this.http.post<BoardItem>(`${this.base}qrs/boards`, { descripcion, slot });
  }

  deleteBoard(uuid: string): Observable<void> {
    return this.http.delete<void>(`${this.base}qrs/boards/${uuid}`);
  }
}
