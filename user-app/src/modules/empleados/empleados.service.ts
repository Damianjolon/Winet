import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Empleado, Tarea } from './modelos';

/** Tipos auxiliares que usa el formulario */
export interface Municipio {
  id: number;
  nombre: string;
}

export interface EmpleadoCreate {
  id?: number;
  primer_nombre: string;
  segundo_nombre?: string;
  primer_apellido: string;
  segundo_apellido?: string;
  DPI: string;
  puesto: string;
  salario: number;
  fecha_ingreso: string;     // yyyy-MM-dd (input type="date")
  telefono?: string;
  direccion?: string;
  zona?: string;
  colonia?: string;
  id_municipio: number;
  id_estado: string;         // 'ACTIVO' al crear
}

@Injectable({ providedIn: 'root' })
export class EmpleadosService {
  /** Ajusta a tu backend (o usa environment.apiUrl) */
  private base = 'http://localhost:3001/api/empleados';
  private municipiosBase = '/api/municipios';
  actualizarEmpleado: any;

  constructor(private http: HttpClient) {}

  /* ================== EMPLEADOS (listado demo) ================== */

listar(): Observable<Empleado[]> {
  return this.http.get<Empleado[]>(`${this.base}/listar`)
    .pipe(catchError(this.handle));
}

  obtener(id:number): Observable<Empleado> {
    // return this.http.get<Empleado>(`${this.base}/${id}`)
    return of({ id, primer_nombre:'Demo', primer_apellido:'User', email:'demo@acme.com', puesto:'Soporte', estado:'ACTIVO' } as Empleado);
  }

  /** Crear (legacy). Lo dejo para compatibilidad con tu código actual. */
  crear(dto: Partial<Empleado> | EmpleadoCreate): Observable<any> {
    // return this.http.post(this.base, dto).pipe(catchError(this.handle));
    return of(true);
  }

  actualizar(id:number, dto: Partial<Empleado> | EmpleadoCreate): Observable<any> {
    // return this.http.put(`${this.base}/${id}`, dto).pipe(catchError(this.handle));
    return of(true);
  }

  eliminar(id:number): Observable<any> {
    // return this.http.delete(`${this.base}/${id}`).pipe(catchError(this.handle));
    return of(true);
  }

  /* ================== ALIAS coherente para el form ================== */

  /**
   * crearEmpleado: alias explícito para el formulario de creación.
   * Internamente llama a `crear(...)` para no romper compatibilidad.
   */
  crearEmpleado(body: EmpleadoCreate): Observable<any> {
    // Si prefieres pegar directo al backend, descomenta:
    // return this.http.post(`${this.base}`, body).pipe(catchError(this.handle));
    return this.crear(body);
  }

  /* ================== MUNICIPIOS (dinámico) ================== */

  listarMunicipios(): Observable<Municipio[]> {
    // Llama a la API real:
    // return this.http.get<Municipio[]>(this.municipiosBase).pipe(catchError(this.handle));

    // Fallback demo (elimínalo cuando tengas backend):
    return of<Municipio[]>([
      { id: 1, nombre: 'Guatemala' },
      { id: 2, nombre: 'Mixco' },
      { id: 3, nombre: 'Villa Nueva' },
      { id: 4, nombre: 'Santa Catarina Pinula' },
    ]);
  }

  /* ================== TAREAS (stubs) ================== */

  listarTareas(): Observable<Tarea[]> { return of([]); }
  listarTareasPorEmpleado(id:number): Observable<Tarea[]> { return of([]); }
  asignarTarea(t:Partial<Tarea>): Observable<any> { return of(true); }


listarEstados(): Observable<{ id: number, nombre: string }[]> {
  return this.http.get<{ id: number, nombre: string }[]>(`/api/estados`)
    .pipe(catchError(this.handle));
}


  /* ================== Manejo de errores ================== */

  private handle = (err: any) => {
    console.error('[EmpleadosService]', err);
    return throwError(() => err);
  };
}
