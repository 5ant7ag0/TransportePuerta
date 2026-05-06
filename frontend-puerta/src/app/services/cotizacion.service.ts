import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CotizacionRequest {
  distancia: number;
  peso: number;
  tipo_servicio: string;
}

export interface CotizacionResponse {
  precio_distancia: number;
  precio_peso: number;
  multiplicador: number;
  precio_total: number;
}

@Injectable({
  providedIn: 'root'
})
export class CotizacionService {
  private apiUrl = 'http://127.0.0.1:5001/api/cotizar';

  constructor(private http: HttpClient) {}

  cotizar(datos: CotizacionRequest): Observable<CotizacionResponse> {
    return this.http.post<CotizacionResponse>(this.apiUrl, datos);
  }
}
