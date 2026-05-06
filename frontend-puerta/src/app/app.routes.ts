import { Routes } from '@angular/router';
import { PedidosListComponent } from './admin/pedidos-list/pedidos-list.component';
import { PedidoFormComponent } from './admin/pedido-form/pedido-form.component';
import { RastreoComponent } from './public/rastreo/rastreo.component';
import { CotizacionComponent } from './public/cotizacion/cotizacion.component';
import { HomeComponent } from './public/home/home.component';

export const routes: Routes = [
  { path: 'cotizacion', component: CotizacionComponent },
  { path: 'rastreo', component: RastreoComponent },
  { path: 'admin/pedidos', component: PedidosListComponent },
  { path: 'admin/pedidos/nuevo', component: PedidoFormComponent },
  { path: '', component: HomeComponent }
];
