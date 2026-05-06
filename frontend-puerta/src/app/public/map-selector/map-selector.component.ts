import { Component, ElementRef, ViewChild, AfterViewInit, Output, EventEmitter, NgZone, inject, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-map-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './map-selector.component.html',
  styles: [`
    .map-container {
      width: 100%;
      height: 350px;
      border-radius: 8px;
      border: 1px solid #cbd5e1;
      overflow: hidden;
      margin-top: 1rem;
      position: relative;
    }
    .map-wrapper {
      width: 100%;
      height: 100%;
    }
  `]
})
export class MapSelectorComponent implements AfterViewInit, OnChanges {
  @ViewChild('mapElement') mapElement!: ElementRef;

  // Eventos para emitir cuando el pin se arrastre
  @Output() origenChange = new EventEmitter<string>();
  @Output() destinoChange = new EventEmitter<string>();

  // Recibir direcciones si cambiaron por Autocomplete
  @Input() setOrigenPlace: google.maps.places.PlaceResult | null = null;
  @Input() setDestinoPlace: google.maps.places.PlaceResult | null = null;

  private map!: google.maps.Map;
  private directionsService = new google.maps.DirectionsService();
  private directionsRenderer = new google.maps.DirectionsRenderer({
    draggable: true,
    suppressMarkers: false,
    polylineOptions: { strokeColor: '#1e3a8a', strokeWeight: 5 }
  });
  
  private ngZone = inject(NgZone);
  private isInternalUpdate = false;
  private geocoder = new google.maps.Geocoder();

  private origenMarker!: google.maps.Marker;
  private destinoMarker!: google.maps.Marker;

  selectingMode: 'origen' | 'destino' = 'origen';

  private internalOriginLatLng: google.maps.LatLng | null = null;
  private internalDestinationLatLng: google.maps.LatLng | null = null;

  ngAfterViewInit() {
    this.initMap();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.isInternalUpdate) {
      this.isInternalUpdate = false;
      return;
    }

    if (this.map) {
      if ('setOrigenPlace' in changes) {
        this.internalOriginLatLng = this.setOrigenPlace?.geometry?.location || null;
      }
      if ('setDestinoPlace' in changes) {
        this.internalDestinationLatLng = this.setDestinoPlace?.geometry?.location || null;
      }
      this.updateMapState();
    }
  }

  private updateMapState() {
    if (this.internalOriginLatLng && this.internalDestinationLatLng) {
      this.calculateAndDisplayRoute(
        this.internalOriginLatLng,
        this.internalDestinationLatLng
      );
    } else {
      // Limpiar ruta si existía
      this.directionsRenderer.setMap(null);

      // Actualizar marcador de origen
      if (this.internalOriginLatLng) {
        this.origenMarker?.setMap(this.map);
        this.origenMarker?.setPosition(this.internalOriginLatLng);
        this.map.panTo(this.internalOriginLatLng);
        this.map.setZoom(15);
      } else {
        this.origenMarker?.setMap(null);
      }

      // Actualizar marcador de destino
      if (this.internalDestinationLatLng) {
        this.destinoMarker?.setMap(this.map);
        this.destinoMarker?.setPosition(this.internalDestinationLatLng);
        this.map.panTo(this.internalDestinationLatLng);
        this.map.setZoom(15);
      } else {
        this.destinoMarker?.setMap(null);
      }

      // Restaurar mapa por defecto si ambos están vacíos
      if (!this.internalOriginLatLng && !this.internalDestinationLatLng) {
        this.map.setCenter({ lat: -0.180653, lng: -78.467834 });
        this.map.setZoom(13);
      }
    }
  }

  private initMap() {
    const defaultLocation = { lat: -0.180653, lng: -78.467834 }; // Quito

    this.map = new google.maps.Map(this.mapElement.nativeElement, {
      center: defaultLocation,
      zoom: 13,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    });

    this.directionsRenderer.setMap(this.map);

    this.origenMarker = new google.maps.Marker({
      map: null,
      icon: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
      title: 'Origen'
    });

    this.destinoMarker = new google.maps.Marker({
      map: null,
      icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
      title: 'Destino'
    });

    // Evento de Clic para Reverse Geocoding
    this.map.addListener('click', (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        this.onMapClick(e.latLng);
      }
    });

    this.directionsRenderer.addListener('directions_changed', () => {
      const directions = this.directionsRenderer.getDirections();
      if (directions) {
        const route = directions.routes[0];
        if (route && route.legs && route.legs.length > 0) {
          const leg = route.legs[0];
          this.isInternalUpdate = true;
          this.ngZone.run(() => {
            this.origenChange.emit(leg.start_address);
            this.destinoChange.emit(leg.end_address);
          });
        }
      }
    });
  }

  setMode(mode: 'origen' | 'destino') {
    this.selectingMode = mode;
  }

  private onMapClick(latLng: google.maps.LatLng) {
    this.geocoder.geocode({ location: latLng }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const address = results[0].formatted_address;
        
        this.ngZone.run(() => {
          if (this.selectingMode === 'origen') {
            this.internalOriginLatLng = latLng;
            this.origenChange.emit(address);
            // Cambiar automáticamente a destino para que el usuario pueda hacer el segundo clic
            if (!this.internalDestinationLatLng) {
              this.selectingMode = 'destino';
            }
          } else {
            this.internalDestinationLatLng = latLng;
            this.destinoChange.emit(address);
          }
          this.updateMapState();
        });
      }
    });
  }

  private calculateAndDisplayRoute(origin: google.maps.LatLng, destination: google.maps.LatLng) {
    this.directionsService.route(
      {
        origin: origin,
        destination: destination,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (response: any, status: any) => {
        if (status === 'OK' && response) {
          // Ocultar marcadores individuales ahora que la ruta fue exitosa
          this.origenMarker?.setMap(null);
          this.destinoMarker?.setMap(null);
          this.directionsRenderer.setMap(this.map);
          this.directionsRenderer.setDirections(response);
        } else {
          console.warn('No se pudo trazar la ruta: ' + status);
          // Si falla, asegurarnos de que los marcadores originales sigan visibles
          this.origenMarker?.setMap(this.map);
          this.destinoMarker?.setMap(this.map);
          
          if (status === 'REQUEST_DENIED') {
            alert('Error de Google Maps: La "Directions API" no está habilitada en tu cuenta de Google Cloud.');
          }
        }
      }
    );
  }
}
