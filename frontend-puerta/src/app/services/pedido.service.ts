import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Pedido } from '../models/pedido.model';

@Injectable({
  providedIn: 'root'
})
export class PedidoService {
  private apiUrl = 'http://127.0.0.1:5001/api/pedidos';

  constructor(private http: HttpClient) {}

  getPedidos(): Observable<Pedido[]> {
    return this.http.get<Pedido[]>(this.apiUrl);
  }

  createPedido(pedido: Partial<Pedido>): Observable<Pedido> {
    return this.http.post<Pedido>(this.apiUrl, pedido);
  }

  rastrearPedido(codigo: string): Observable<Pedido> {
    const rastreoUrl = `http://127.0.0.1:5001/api/rastreo/${codigo}`;
    return this.http.get<Pedido>(rastreoUrl);
  }
}
