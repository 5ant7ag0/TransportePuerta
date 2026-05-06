export interface Pedido {
  id: number;
  tracking_code: string;
  usuario_id: number | null;
  origen: string;
  destino: string;
  descripcion: string | null;
  peso_kg: number;
  distancia_km: number;
  tipo_servicio: string;
  precio_total: number;
  estado: string;
  nombre_remitente: string | null;
  telefono_remitente: string | null;
  nombre_destinatario: string | null;
  telefono_destinatario: string | null;
  fecha_creacion: string;
  fecha_actualizacion: string;
}
