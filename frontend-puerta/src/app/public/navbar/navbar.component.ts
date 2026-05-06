import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  template: `
    <nav class="navbar-container">
      <!-- Logo -->
      <a routerLink="/" class="navbar-logo">
        <span class="logo-icon">🚛</span>
        <span class="logo-text">Puerta a Puerta</span>
      </a>

      <!-- Enlaces Centrales -->
      <div class="navbar-links">
        <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">Inicio</a>
        <a routerLink="/servicios" routerLinkActive="active">Servicios</a>
        <a routerLink="/cobertura" routerLinkActive="active">Cobertura</a>
        <a routerLink="/cotizacion" routerLinkActive="active">Cotización</a>
        <a routerLink="/rastreo" routerLinkActive="active">Rastreo</a>
        <a routerLink="/reservar" routerLinkActive="active">Reservar</a>
        <a routerLink="/contacto" routerLinkActive="active">Contacto</a>
      </div>

      <!-- Acciones Derecha -->
      <div class="navbar-actions">
        <a routerLink="/admin" class="btn-admin">
          ⚙️ Admin
        </a>
        <button class="btn-logout" title="Cerrar Sesión">
          🚪
        </button>
      </div>
    </nav>
  `
})
export class NavbarComponent {}
