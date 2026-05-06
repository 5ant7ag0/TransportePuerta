import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  servicios = [
    { title: 'Envío de Paquetes', desc: 'Enviamos tu paquete a cualquier rincón de Ecuador de forma segura y rápida.', price: 'Desde $8.00', icon: 'package' },
    { title: 'Mudanzas', desc: 'Mudanza completa con personal capacitado y vehículos adecuados.', price: 'Cotización personalizada', icon: 'truck' },
    { title: 'Transporte de Personas', desc: 'Viaja cómodo y seguro a cualquier ciudad del país.', price: 'Desde $4.00/km', icon: 'users' },
    { title: 'Mensajería Express', desc: 'Entregas urgentes en el menor tiempo posible. ¡Rápido como el rayo!', price: 'Desde $10.00', icon: 'zap' },
    { title: 'Carga Pesada', desc: 'Transporte de carga pesada con equipos especializados.', price: 'Cotización personalizada', icon: 'heavy' },
    { title: 'Delivery Empresarial', desc: 'Soluciones de entrega para empresas con tarifas preferenciales.', price: 'Planes desde $150/mes', icon: 'building' }
  ];

  beneficios = [
    { title: '24/7 Disponible', desc: 'Trabajamos todos los días, las 24 horas. Siempre listos para servirte.', icon: 'clock' },
    { title: 'Seguridad Garantizada', desc: 'Tu carga está protegida durante todo el trayecto con nuestro seguro.', icon: 'shield' },
    { title: 'Cobertura Nacional', desc: 'Llegamos a las 24 provincias de Ecuador. De puerta a puerta.', icon: 'map' },
    { title: 'Precios Justos', desc: 'Tarifas competitivas y transparentes. Sin costos ocultos.', icon: 'dollar' },
    { title: 'Soporte Directo', desc: 'Comunícate con nosotros por WhatsApp en cualquier momento.', icon: 'headphones' },
    { title: 'Rapidez', desc: 'Entregas en el menor tiempo posible. ¡Rápidos como Flash!', icon: 'zap' }
  ];

  testimonios = [
    { name: 'María García', city: 'Quito', text: 'Excelente servicio. Mi paquete llegó de Quito a Guayaquil en menos de 24 horas. Muy recomendados.', stars: 5 },
    { name: 'Carlos Mendoza', city: 'Cuenca', text: 'Hicieron mi mudanza de forma impecable. Todo llegó en perfecto estado. El equipo fue muy profesional.', stars: 5 },
    { name: 'Ana Rodríguez', city: 'Ambato', text: 'El servicio express es increíble. Necesitaba enviar documentos urgentes y llegaron el mismo día. ¡Gracias!', stars: 4 }
  ];
}
