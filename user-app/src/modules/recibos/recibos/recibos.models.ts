export interface Servicio {
  id: number; codigo: string; nombre: string;
  descripcion?: string; precio_unitario: number; impuesto_pct: number;
}
export interface Cliente {
  id: number; nombre: string; Telefono?: string;
}
export interface ReciboItem {
  servicio_id: number; descripcion: string;
  cantidad: number; precio_unitario: number;
  descuento_pct: number; impuesto_pct: number;
}
export interface ReciboCreate {
  id_cliente: number; numero: number; notas?: string | null; items: ReciboItem[];
}
export interface ReciboHeader {
  id: number; id_cliente: number; fecha: string; id_estado: number;
  numero: number; subtotal: number; estado: string;
  descuento_total: number; impuesto_total: number; total: number; notas: string | null;
}
