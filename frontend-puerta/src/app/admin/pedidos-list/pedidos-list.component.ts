import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PedidoService } from '../../services/pedido.service';
import { Pedido } from '../../models/pedido.model';

@Component({
  selector: 'app-pedidos-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './pedidos-list.component.html',
  styles: [`
    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: var(--border-radius-pill);
      font-size: 0.85rem;
      font-weight: 600;
    }
    .status-pendiente { background-color: #fef08a; color: #854d0e; }
    .status-entregado { background-color: #bbf7d0; color: #166534; }
    .status-transito { background-color: #bfdbfe; color: #1e40af; }
    .status-default { background-color: #e2e8f0; color: #475569; }
    
    .table-container {
      width: 100%;
      overflow-x: auto;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }
    th {
      padding: 1rem;
      border-bottom: 2px solid var(--border-color);
      color: var(--text-light);
      font-weight: 600;
    }
    td {
      padding: 1rem;
      border-bottom: 1px solid var(--border-color);
      vertical-align: middle;
    }
    tr:hover td {
      background-color: rgba(0,0,0,0.01);
    }
  `]
})
export class PedidosListComponent implements OnInit {
  private pedidoService = inject(PedidoService);
  private cdr = inject(ChangeDetectorRef);
  pedidos: Pedido[] = [];
  loading = true;
  error = '';

  ngOnInit(): void {
    console.log('ngOnInit: Iniciando componente PedidosList...');
    this.cargarPedidos();
  }

  cargarPedidos(): void {
    console.log('cargarPedidos: Pidiendo datos a Flask...');
    this.pedidoService.getPedidos().subscribe({
      next: (data) => {
        console.log('cargarPedidos: ¡Datos recibidos exitosamente!', data);
        this.pedidos = data || [];
        this.loading = false;
        this.cdr.detectChanges(); // Forzar actualización de UI
      },
      error: (err) => {
        console.error('cargarPedidos: ¡Error de HttpClient!', err);
        this.error = 'Error de conexión: ' + err.message;
        this.loading = false;
        this.cdr.detectChanges(); // Forzar actualización de UI
      }
    });
  }

  getStatusClass(estado: string | null | undefined): string {
    if (!estado) return 'status-default';
    const estadoLower = estado.toLowerCase();
    if (estadoLower.includes('pendiente')) return 'status-pendiente';
    if (estadoLower.includes('entregado')) return 'status-entregado';
    if (estadoLower.includes('tránsito') || estadoLower.includes('camino')) return 'status-transito';
    return 'status-default';
  }
}
