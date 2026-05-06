import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { PedidoService } from '../../services/pedido.service';
import { Pedido } from '../../models/pedido.model';

@Component({
  selector: 'app-pedido-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './pedido-form.component.html',
  styles: [`
    .form-section {
      margin-bottom: 2rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid var(--border-color);
    }
    .form-section:last-child {
      border-bottom: none;
    }
    .form-section h3 {
      color: var(--primary-dark);
      font-size: 1.1rem;
      margin-bottom: 1rem;
    }
    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }
    @media (max-width: 768px) {
      .form-grid { grid-template-columns: 1fr; }
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    label {
      font-weight: 600;
      font-size: 0.9rem;
      color: var(--text-dark);
    }
    input, select, textarea {
      padding: 0.75rem 1rem;
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-sm);
      font-family: inherit;
      transition: all 0.2s ease;
    }
    input:focus, select:focus, textarea:focus {
      outline: none;
      border-color: var(--primary-blue);
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }
    .error-text {
      color: var(--error);
      font-size: 0.8rem;
      margin-top: 0.25rem;
    }
    .btn-submit {
      width: 100%;
      margin-top: 1rem;
    }
  `]
})
export class PedidoFormComponent {
  private fb = inject(FormBuilder);
  private pedidoService = inject(PedidoService);
  private router = inject(Router);

  loading = false;
  submitError = '';

  pedidoForm = this.fb.group({
    origen: ['', Validators.required],
    destino: ['', Validators.required],
    tipo_servicio: ['paqueteria', Validators.required],
    peso_kg: [0, [Validators.min(0)]],
    distancia_km: [0, [Validators.min(0)]],
    descripcion: [''],
    nombre_remitente: [''],
    telefono_remitente: [''],
    nombre_destinatario: [''],
    telefono_destinatario: ['']
  });

  onSubmit() {
    if (this.pedidoForm.invalid) {
      this.pedidoForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.submitError = '';
    
    const pedidoData = this.pedidoForm.value as Partial<Pedido>;
    this.pedidoService.createPedido(pedidoData).subscribe({
      next: (nuevoPedido) => {
        this.loading = false;
        // Navegar de regreso a la lista de pedidos
        this.router.navigate(['/admin/pedidos']);
      },
      error: (err) => {
        this.loading = false;
        this.submitError = 'Ocurrió un error al crear el pedido. Intenta nuevamente.';
        console.error('Error creating pedido:', err);
      }
    });
  }

  isFieldInvalid(field: string): boolean {
    const control = this.pedidoForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
