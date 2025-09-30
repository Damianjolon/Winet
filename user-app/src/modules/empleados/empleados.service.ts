// src/app/.../empleados.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Empleado, Tarea } from './modelos';
import { environment } from '../../app/environments/environment';

export interface Departamento { id: number; nombre: string; }
export interface Municipio { id: number; nombre: string; id_departamento?: number; }

export interface EmpleadoCreate {
  id?: number;
  primer_nombre: string;
  segundo_nombre?: string;
  primer_apellido: string;
  segundo_apellido?: string;
  DPI: string;
  puesto: string;
  salario: number;
  fecha_ingreso: string;
  telefono?: string;
  direccion?: string;
  zona?: string;
  colonia?: string;
  ubicacion?: string;
  id_municipio: number;
  id_estado: string;
}

@Injectable({ providedIn: 'root' })
export class EmpleadosService {
  /** Usa environment. Ej: 'http://localhost:3001/api'. Si usas proxy, pon '/api'. */
  private api = environment.apiUrl || '/api';

  /** Endpoints base */
  private empleadosBase     = `${this.api}/empleados`;
  private departamentosBase = `${this.api}/departamentos`;
  private municipiosBase    = `${this.api}/municipios`;

  constructor(private http: HttpClient) {}

  /* ===== Normalizadores ===== */
  private normDep = (r: any): Departamento =>
    ({ id: r.id ?? r.ID ?? r.id_departamento ?? r.ID_DEPARTAMENTO, nombre: r.nombre ?? r.NOMBRE });

  private normMun = (r: any, depId?: number): Municipio =>
    ({ id: r.id ?? r.ID ?? r.id_municipio ?? r.ID_MUNICIPIO,
       nombre: r.nombre ?? r.NOMBRE,
       id_departamento: r.id_departamento ?? r.ID_DEPARTAMENTO ?? depId });

  /* ===== Empleados ===== */
  listar(): Observable<Empleado[]> {
    return this.http.get<Empleado[]>(`${this.empleadosBase}/listar`).pipe(catchError(this.handle));
  }

  obtenerPorId(id: number) {
    return this.listar().pipe(map((xs: any[]) => xs.find(e => e.id === id)));
  }

  obtener(id: number): Observable<Empleado> {
    // Cambia a tu endpoint real si ya existe:
    // return this.http.get<Empleado>(`${this.empleadosBase}/${id}`).pipe(catchError(this.handle));
    return of({ id, primer_nombre: 'Demo', primer_apellido: 'User', email: 'demo@acme.com', puesto: 'Soporte', estado: 'ACTIVO' } as Empleado);
  }

  crear(dto: Partial<Empleado> | EmpleadoCreate): Observable<any> {
    // return this.http.post(this.empleadosBase, dto).pipe(catchError(this.handle));
    return of(true);
  }
  crearEmpleado(body: EmpleadoCreate) { return this.crear(body); }

  actualizar(id: number, body: Partial<Empleado>) {
    return this.http.put(`${this.empleadosBase}/cambiar/${id}`, body).pipe(catchError(this.handle));
  }
  eliminar(id: number) {
    return this.http.delete(`${this.empleadosBase}/eliminar/${id}`).pipe(catchError(this.handle));
  }

  /* ===== Catálogos ===== */
  listarDepartamentos(): Observable<Departamento[]> {
    return this.http.get<any[]>(this.departamentosBase).pipe(
      map(rows => (rows || []).map(this.normDep)), catchError(this.handle)
    );
  }

  listarMunicipios(): Observable<Municipio[]> {
    return this.http.get<any[]>(this.municipiosBase).pipe(
      map(rows => (rows || []).map(this.normMun)), catchError(() => of([]))
    );
  }

  listarMunicipiosPorDepartamento(depId: number): Observable<Municipio[]> {
    // Enviamos dos nombres de parámetro por compatibilidad (ajusta si tu backend usa solo uno).
    const params = new HttpParams()
      .set('departamentoId', String(depId))
      .set('id_departamento', String(depId));

    return this.http.get<any[]>(this.municipiosBase, { params }).pipe(
      map(rows => (rows || []).map(r => this.normMun(r, depId))),
      // Fallback si el backend ignora el query param:
      catchError(() =>
        this.listarMunicipios().pipe(
          map(ms => ms.filter(m => Number(m.id_departamento) === Number(depId)))
        )
      )
    );
  }

  listarEstados(): Observable<{ id: number, nombre: string }[]> {
    return this.http.get<{ id: number, nombre: string }[]>(`${this.api}/estados`).pipe(catchError(this.handle));
  }

  /* ===== Errores ===== */
  private handle = (err: any) => { console.error('[EmpleadosService]', err); return throwError(() => err); };
}
