import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../app/environments/environment';

const API = (environment as any)?.apiUrl || 'http://localhost:3001/api';

export interface Servicio {
  id: number; codigo: string; nombre: string;
  descripcion?: string; precio_unitario: number; impuesto_pct: number;
}
export interface Cliente { id: number; nombre: string; Telefono?: string; }

/* Encabezado base */
export interface ReciboHeader {
  id: number; id_cliente: number; fecha: string; id_estado: number;
  numero: number; subtotal: number; estado: string;
  descuento_total: number; impuesto_total: number; total: number; notas: string | null;
}

/* === Tipos para listado/detalle === */
export interface ReciboListItem extends ReciboHeader {
  cliente_nombre?: string | null;
  items_count?: number;
  items_preview?: string;
}
export interface ReciboListResponse {
  items: ReciboListItem[];
  total: number;
  page: number;
  pageSize: number;
}

/* Payload de creación */
export interface ReciboItem {
  servicio_id: number; descripcion: string;
  cantidad: number; precio_unitario: number;
  descuento_pct: number; impuesto_pct: number;
}
export interface ReciboCreate {
  id_cliente: number; numero: number; notas?: string | null; items: ReciboItem[];
}

@Injectable()
export class RecibosApi {
  private base = `${API}/recibos`;
  constructor(private http: HttpClient) {}

  // NUEVO correlativo
  siguienteNumero(){ return this.http.get<{ next:number }>(`${this.base}/siguiente-numero`); }
  // Crear
  crear(data: ReciboCreate){ return this.http.post<ReciboHeader>(this.base, data); }
  // Preview URL
  previewUrl(id:number){ return `${this.base}/${id}/preview`; }
  // Listado
  list(q = '', page = 1, pageSize = 20){
    let params = new HttpParams().set('page', String(page)).set('pageSize', String(pageSize));
    if (q) params = params.set('q', q);
    return this.http.get<ReciboListResponse>(this.base, { params });
  }
}

@Injectable()
export class ClientesApi {
  private base = `${API}/clientes`;
  constructor(private http: HttpClient) {}

  buscar(q: string): Observable<Cliente[]> {
    const params = new HttpParams().set('q', q || '').set('lite', '1');
    return this.http.get<Cliente[]>(this.base, { params });
  }
}

@Injectable()
export class ServiciosApi {
  private base = `${API}/servicios`;
  constructor(private http: HttpClient) {}

  buscar(): Observable<Servicio[]> {
    return this.http.get<Servicio[]>(this.base);
  }
}
