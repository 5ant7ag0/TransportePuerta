/// <reference types="@types/google.maps" />
import { Component, inject, OnInit, AfterViewInit, ChangeDetectorRef, ViewChild, ElementRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { CotizacionService, CotizacionResponse } from '../../services/cotizacion.service';
import { MapSelectorComponent } from '../map-selector/map-selector.component';

@Component({
  selector: 'app-cotizacion',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MapSelectorComponent],
  templateUrl: './cotizacion.component.html',
  styles: [`
    .quote-hero {
      background-color: #1a365d;
      background: linear-gradient(to bottom, #1e3a8a, #172554);
      color: white;
      padding: 4rem 2rem;
      text-align: center;
      margin-bottom: 3rem;
    }
    .quote-hero h1 {
      font-size: 2.5rem;
      font-weight: 800;
      margin-bottom: 0.5rem;
    }
    .quote-hero h1 span {
      color: #60a5fa;
    }
    .quote-hero p {
      color: #93c5fd;
      font-size: 1.1rem;
    }
    .main-container {
      max-width: 1100px;
      margin: 0 auto;
      padding: 0 1.5rem 4rem;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
      align-items: start;
    }
    @media (max-width: 768px) {
      .main-container { grid-template-columns: 1fr; }
    }
    .form-card, .info-card {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      border: 1px solid #e2e8f0;
    }
    .card-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 1.5rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      margin-bottom: 1rem;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      margin-bottom: 1rem;
    }
    label {
      font-size: 0.85rem;
      font-weight: 600;
      color: #475569;
    }
    input, select {
      padding: 0.75rem 1rem;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      font-size: 0.95rem;
      color: #334155;
      width: 100%;
      box-sizing: border-box;
    }
    input:focus, select:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
    .btn-submit {
      background-color: #1e3a8a;
      color: white;
      border: none;
      border-radius: 6px;
      padding: 0.85rem;
      font-weight: 600;
      font-size: 1rem;
      width: 100%;
      cursor: pointer;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 0.5rem;
      transition: background-color 0.2s;
      margin-top: 1rem;
    }
    .btn-submit:hover {
      background-color: #172554;
    }
    .btn-submit:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
    .btn-clear {
      background: none;
      border: 1px solid #cbd5e1;
      color: #64748b;
      border-radius: 6px;
      padding: 0.4rem 0.8rem;
      font-size: 0.85rem;
      cursor: pointer;
      margin-left: auto;
      display: flex;
      align-items: center;
      gap: 0.3rem;
    }
    .btn-clear:hover {
      background-color: #f8fafc;
      color: #334155;
    }
    
    /* Info Card Styles */
    .rate-box {
      background-color: #f8fafc;
      border-radius: 8px;
      padding: 1rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
    }
    .rate-icon {
      background-color: #dbeafe;
      color: #2563eb;
      width: 40px;
      height: 40px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
    }
    .rate-title { font-weight: 700; color: #1e293b; font-size: 0.95rem; }
    .rate-desc { color: #64748b; font-size: 0.85rem; }
    
    .multiplier-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 1rem;
    }
    .multiplier-table th {
      text-align: left;
      padding: 0.75rem;
      border-bottom: 1px solid #e2e8f0;
      color: #475569;
      font-size: 0.85rem;
      font-weight: 600;
    }
    .multiplier-table td {
      padding: 0.75rem;
      border-bottom: 1px solid #f1f5f9;
      color: #334155;
      font-size: 0.9rem;
    }
    
    /* Result Styles */
    .result-price {
      font-size: 3.5rem;
      font-weight: 800;
      color: #1e3a8a;
      text-align: center;
      margin: 1.5rem 0;
    }
    .result-row {
      display: flex;
      justify-content: space-between;
      padding: 0.75rem 0;
      border-bottom: 1px dashed #e2e8f0;
      font-size: 0.95rem;
    }
  `]
})
export class CotizacionComponent implements OnInit, AfterViewInit {
  private fb = inject(FormBuilder);
  private cotizacionService = inject(CotizacionService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);

  @ViewChild('origenInput') origenElement!: ElementRef;
  @ViewChild('destinoInput') destinoElement!: ElementRef;

  origenAutocomplete: google.maps.places.Autocomplete | undefined;
  destinoAutocomplete: google.maps.places.Autocomplete | undefined;

  currentOrigenPlace: google.maps.places.PlaceResult | null = null;
  currentDestinoPlace: google.maps.places.PlaceResult | null = null;

  cotizacionForm!: FormGroup;
  resultado: CotizacionResponse | null = null;
  loading = false;
  error = '';

  ngOnInit() {
    this.cotizacionForm = this.fb.group({
      origen: [''],
      destino: [''],
      tipo_servicio: ['paqueteria'],
      distancia: [0, [Validators.min(0)]],
      peso: [0, [Validators.min(0)]]
    });

    // Calcular automáticamente cuando cambien los valores
    this.cotizacionForm.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b))
      )
      .subscribe(() => {
        this.calcular();
      });
  }

  ngAfterViewInit() {
    const options = {
      fields: ['formatted_address', 'geometry', 'name'],
      strictBounds: false
    };

    this.origenAutocomplete = new google.maps.places.Autocomplete(this.origenElement.nativeElement, options);
    this.destinoAutocomplete = new google.maps.places.Autocomplete(this.destinoElement.nativeElement, options);

    this.origenAutocomplete.addListener('place_changed', () => {
      this.ngZone.run(() => {
        const place = this.origenAutocomplete!.getPlace();
        if (place.formatted_address) {
          this.currentOrigenPlace = place;
          this.cotizacionForm.patchValue({ origen: place.formatted_address }, { emitEvent: false });
          this.calcularDistancia();
        }
      });
    });

    this.destinoAutocomplete.addListener('place_changed', () => {
      this.ngZone.run(() => {
        const place = this.destinoAutocomplete!.getPlace();
        if (place.formatted_address) {
          this.currentDestinoPlace = place;
          this.cotizacionForm.patchValue({ destino: place.formatted_address }, { emitEvent: false });
          this.calcularDistancia();
        }
      });
    });
  }

  onMapOrigenChange(address: string) {
    this.cotizacionForm.patchValue({ origen: address });
    this.calcularDistancia();
  }

  onMapDestinoChange(address: string) {
    this.cotizacionForm.patchValue({ destino: address });
    this.calcularDistancia();
  }

  calcularDistancia() {
    const origen = this.cotizacionForm.value.origen;
    const destino = this.cotizacionForm.value.destino;

    if (origen && destino) {
      const service = new google.maps.DistanceMatrixService();
      service.getDistanceMatrix(
        {
          origins: [origen],
          destinations: [destino],
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (response: any, status: any) => {
          if (status === 'OK' && response) {
            const element = response.rows[0].elements[0];
            if (element.status === 'OK') {
              const distanceInKm = Math.round(element.distance.value / 1000);
              
              this.ngZone.run(() => {
                this.cotizacionForm.patchValue({ distancia: distanceInKm });
              });
            } else {
              console.warn('No se pudo calcular la ruta entre estos dos puntos.');
            }
          }
        }
      );
    }
  }

  calcular() {
    if (this.cotizacionForm.invalid) return;
    
    const datos = this.cotizacionForm.value;
    
    if (datos.distancia < 0) datos.distancia = 0;
    if (datos.peso < 0) datos.peso = 0;

    // Si todo está en 0 o vacío, no calculamos para mostrar la tabla informativa
    if (datos.distancia === 0 && datos.peso === 0) {
      this.resultado = null;
      this.cdr.detectChanges();
      return;
    }

    this.loading = true;
    this.error = '';

    this.cotizacionService.cotizar(datos).subscribe({
      next: (res) => {
        this.resultado = res;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error calculando cotización:', err);
        this.error = 'No se pudo contactar al servidor para calcular la cotización.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  limpiar() {
    this.cotizacionForm.reset({
      origen: '',
      destino: '',
      tipo_servicio: 'paqueteria',
      distancia: 0,
      peso: 0
    });
    this.currentOrigenPlace = null;
    this.currentDestinoPlace = null;
    
    // Forzar limpieza de inputs de Autocomplete manualmente (Google Places a veces mantiene estado visual)
    if (this.origenElement) this.origenElement.nativeElement.value = '';
    if (this.destinoElement) this.destinoElement.nativeElement.value = '';

    this.resultado = null;
    this.error = '';
  }
}
