import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PedidoService } from '../../services/pedido.service';
import { Pedido } from '../../models/pedido.model';

@Component({
  selector: 'app-rastreo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rastreo.component.html',
  styles: [`
    .tracking-hero {
      background-color: var(--primary-dark);
      color: white;
      padding: 4rem 2rem;
      text-align: center;
      border-radius: var(--border-radius-lg);
      margin-bottom: 2rem;
    }
    .search-box {
      max-width: 600px;
      margin: 2rem auto 0;
      display: flex;
      gap: 1rem;
    }
    .search-box input {
      flex: 1;
      padding: 1rem 1.5rem;
      font-size: 1.1rem;
      border: 2px solid transparent;
      border-radius: 50px;
      outline: none;
      transition: all 0.2s;
    }
    .search-box input:focus {
      border-color: var(--primary-blue);
      box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.2);
    }
    .search-box button {
      border-radius: 50px;
      padding: 1rem 2rem;
      font-size: 1.1rem;
      white-space: nowrap;
    }
    .timeline {
      position: relative;
      padding: 2rem 0;
    }
    .timeline::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 0;
      right: 0;
      height: 4px;
      background-color: var(--border-color);
      transform: translateY(-50%);
      z-index: 1;
    }
    .timeline-steps {
      display: flex;
      justify-content: space-between;
      position: relative;
      z-index: 2;
    }
    .step {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      color: var(--text-light);
    }
    .step.active {
      color: var(--primary-blue);
      font-weight: 600;
    }
    .step-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background-color: var(--bg-light);
      border: 4px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      transition: all 0.3s;
    }
    .step.active .step-icon {
      background-color: var(--primary-blue);
      border-color: var(--primary-blue);
      color: white;
      box-shadow: 0 0 0 5px rgba(37, 99, 235, 0.2);
    }
    @media (max-width: 600px) {
      .search-box { flex-direction: column; }
      .search-box button { width: 100%; }
      .timeline-steps { flex-direction: column; align-items: flex-start; gap: 2rem; }
      .timeline::before { top: 0; bottom: 0; left: 20px; width: 4px; height: auto; transform: none; }
      .step { flex-direction: row; gap: 1rem; }
    }
  `]
})
export class RastreoComponent {
  private pedidoService = inject(PedidoService);
  private cdr = inject(ChangeDetectorRef);

  trackingCode = '';
  loading = false;
  pedido: Pedido | null = null;
  error = '';

  buscarPedido() {
    if (!this.trackingCode.trim()) return;

    this.loading = true;
    this.error = '';
    this.pedido = null;

    this.pedidoService.rastrearPedido(this.trackingCode.trim()).subscribe({
      next: (data) => {
        this.pedido = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        if (err.status === 404) {
          this.error = 'No hemos encontrado ningún pedido con ese código.';
        } else {
          this.error = 'Error de conexión. Intenta nuevamente.';
        }
        this.cdr.detectChanges();
      }
    });
  }

  getStepStatus(stepName: string): boolean {
    if (!this.pedido) return false;
    const currentStatus = (this.pedido.estado || '').toLowerCase();
    
    // Simple state machine simulation
    const states = ['pendiente', 'recogido', 'tránsito', 'destino', 'entregado'];
    
    // Normalize transit names
    let normalizedCurrent = currentStatus;
    if (normalizedCurrent.includes('camino')) normalizedCurrent = 'tránsito';

    const currentIndex = states.findIndex(s => normalizedCurrent.includes(s));
    const stepIndex = states.indexOf(stepName);

    return currentIndex >= stepIndex;
  }
}
