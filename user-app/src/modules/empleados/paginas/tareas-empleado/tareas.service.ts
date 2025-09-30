// src/app/pages/empleados/tareas-empleado/tareas.service.ts
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, tap } from 'rxjs';
import { environment } from 'src/app/environments/environment';

export type Prioridad = 'BAJA' | 'MEDIA' | 'ALTA';
export type EstadoTarea = 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADA' | 'FINALIZADA';

export interface Tarea {
  id: number | string;
  titulo: string;
  descripcion?: string;
  prioridad: Prioridad;
  fecha: string;      // YYYY-MM-DD
  estado: EstadoTarea;
  asignadoA: number;
  asignadoANombre?: string;
  created_at?: string;
  updated_at?: string;
}

function normalizeBaseUrl(env: any): string {
  // A) apiUrl = 'http://localhost:3001/api'
  // B) apiBase = 'http://localhost:3001', apiPath = '/api'
  const root =
    env.apiUrl ??
    `${env.apiUrl ?? ''}${env.apiPath ?? ''}` ??
    '';

  // quita solo slash final (respeta http://)
  return root.replace(/\/+$/, '');
}

@Injectable({ providedIn: 'root' })
export class TareasService {
  private base = `${normalizeBaseUrl(environment) || ''}/asignaciones`;

  private _tareas$ = new BehaviorSubject<Tarea[]>([]);
  tareas$ = this._tareas$.asObservable();

  private lastFecha?: string;
  private lastAsignadoA?: number;

  constructor(private http: HttpClient) {}

  /** Guarda la última consulta de día para poder refrescar después de crear/patch/delete */
  private remember(fecha?: string, asignadoA?: number) {
    if (fecha) this.lastFecha = fecha;
    if (asignadoA !== undefined) this.lastAsignadoA = asignadoA;
  }
  private refreshIfPossible() {
    if (this.lastFecha) this.listarDelDia(this.lastFecha, this.lastAsignadoA).subscribe();
  }

  crear(payload: Partial<Tarea>) {
    return this.http.post<Tarea>(this.base, payload).pipe(
      tap(() => this.refreshIfPossible())
    );
  }

  listarDelDia(ymd: string, asignadoA?: number) {
    const params: any = { fecha: ymd };
    if (asignadoA) params.asignadoA = asignadoA;
    this.remember(ymd, asignadoA);

    return this.http.get<Tarea[]>(this.base, { params }).pipe(
      tap(lista => this._tareas$.next(lista ?? []))
    );
  }

  actualizarEstado(id: number, estado: EstadoTarea) {
    return this.http.patch<Tarea>(`${this.base}/${id}/estado`, { estado }).pipe(
      tap(() => this.refreshIfPossible())
    );
  }

  getTablero(ymd: string, asignadoA?: number) {
    const params: any = { fecha: ymd };
    if (asignadoA) params.asignadoA = asignadoA;
    return this.http.get<{ fecha: string; asignadoA: number|null; columnas: any }>(
      `${this.base}/tablero`,
      { params }
    );
  }

  listarTodas(filtros?: {
    desde?: string; hasta?: string;
    estado?: 'PENDIENTE'|'EN_PROCESO'|'COMPLETADA'|'FINALIZADA';  // <- incluye FINALIZADA
    asignadoA?: number; q?: string;
  }) {
    const params: any = {};
    if (filtros?.desde) params.desde = filtros.desde;
    if (filtros?.hasta) params.hasta = filtros.hasta;
    if (filtros?.estado) params.estado = filtros.estado;
    if (filtros?.asignadoA) params.asignadoA = filtros.asignadoA;
    if (filtros?.q) params.q = filtros.q;

    return this.http.get<Array<Tarea & { empleado: string; hora: string }>>(
      `${this.base}/listar`, { params }
    );
  }

    finalizar(id: number) {
      return this.http.delete(`${this.base}/${id}`).pipe(
        tap(() => this.refreshIfPossible())  // <- refresca lista del día
      );
    }
}
