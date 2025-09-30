import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../app/environments/environment';

/* ====== Modelos ====== */
export interface Cliente {
  id: number;
  primer_nombre: string;
  segundo_nombre?: string | null;
  primer_apellido: string;
  segundo_apellido?: string | null;
  correo: string;
  direccion?: string | null;
  zona?: number | null;
  colonia?: string | null;
  id_departamento?: number | null;
  id_municipio?: number | null;
  id_estado?: number;
  Telefono: string;
  created_at?: string;
  updated_at?: string;

  // UI
  nombre_completo?: string;
  municipio_nombre?: string;
}

export interface Departamento {
  id: number;
  nombre: string;
}

export interface Municipio {
  id: number;
  nombre: string;
  id_departamento: number;
}

/* ====== Service ====== */
@Injectable({ providedIn: 'root' })
export class ClientesService {
  private base     = `${environment.apiUrl}/clientes`;        // e.g. http://localhost:3001/api/clientes
  private depBase  = `${environment.apiUrl}/departamentos`;   // TC_DEPARTAMENTOS
  private muniBase = `${environment.apiUrl}/municipios`;      // TC_MUNICIPIOS

  constructor(private http: HttpClient) {}

  /* ---- Clientes ---- */
  listar(): Observable<Cliente[]> {
    return this.http.get<Cliente[] | { items: Cliente[] }>(this.base).pipe(
      map(r => Array.isArray(r) ? r : (r?.items ?? []))
    );
  }

  obtener(id: number): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.base}/${id}`);
  }

  crear(body: Partial<Cliente>): Observable<Cliente> {
    return this.http.post<Cliente>(this.base, body);
  }

  actualizar(id: number, body: Partial<Cliente>): Observable<Cliente> {
    return this.http.put<Cliente>(`${this.base}/${id}`, body);
  }

  eliminar(id: number, hard = false): Observable<{ ok: boolean; hard: boolean }> {
    const params = hard ? new HttpParams().set('hard','1') : undefined;
    return this.http.delete<{ ok: boolean; hard: boolean }>(`${this.base}/${id}`, { params });
  }

  /* ---- Catálogos: Departamentos & Municipios ---- */

departamentosListar() {
  return this.http.get<Departamento[]>(`${environment.apiUrl}/departamentos`);
}
municipiosPorDepartamento(id: number) {
  return this.http.get<Municipio[]>(`${environment.apiUrl}/municipios/por-departamento/${id}`);
}
municipioById(id: number) {
  return this.http.get<Municipio>(`${environment.apiUrl}/municipios/${id}`);
}

  /* ---- Utilidades existentes (si las usas en otros lados) ---- */

  /** Búsqueda libre de municipios (por nombre). */
  municipiosBuscar(q: string): Observable<Municipio[]> {
    const params = new HttpParams().set('q', q ?? '');
    return this.http.get<Municipio[] | { items: Municipio[] }>(`${this.muniBase}/buscar`, { params }).pipe(
      map(r => Array.isArray(r) ? r : (r as any)?.items ?? [])
    );
  }

  /** Crea un municipio (si permites alta desde UI). */
  municipioCrear(nombre: string): Observable<Municipio> {
    return this.http
      .post<{ id: number; nombre: string; id_departamento?: number }>(`${this.muniBase}/crear`, { nombre })
      .pipe(map(r => ({ id: r.id, nombre: r.nombre, id_departamento: r.id_departamento ?? 0 } as Municipio)));
  }
}



// import { Injectable } from '@angular/core';
// import { HttpClient, HttpParams } from '@angular/common/http';
// import { Observable, map } from 'rxjs';
// import { environment } from '../../app/environments/environment'; // ajusta si usas alias

// export interface Cliente {
//   id: number;
//   primer_nombre: string;
//   segundo_nombre?: string | null;
//   primer_apellido: string;
//   segundo_apellido?: string | null;
//   correo: string;
//   direccion?: string | null;
//   zona?: number | null;
//   colonia?: string | null;
//   id_municipio?: number | null;
//   id_estado?: number;
//   Telefono: string;
//   created_at?: string;
//   updated_at?: string;

//   // para el UI
//   nombre_completo?: string;
//   municipio_nombre?: string;
// }

// export interface Municipio { id: number; nombre: string; }

// @Injectable({ providedIn: 'root' })
// export class ClientesService {
//   private base = `${environment.apiUrl}/clientes`;     // -> http://localhost:3001/api/clientes
//   private muniBase = `${environment.apiUrl}/municipios`;

//   constructor(private http: HttpClient) {}

//   // GET /api/clientes  -> { items, total, page, pageSize }
//   listar(): Observable<Cliente[]> {
//     return this.http.get<{ items: Cliente[] }>(this.base).pipe(
//       map(r => r?.items ?? [])
//     );
//   }

//   // GET /api/clientes/:id
//   obtener(id: number): Observable<Cliente> {
//     return this.http.get<Cliente>(`${this.base}/${id}`);
//   }

//   // POST /api/clientes
//   crear(body: Partial<Cliente>): Observable<Cliente> {
//     return this.http.post<Cliente>(this.base, body);
//   }

//   // PUT /api/clientes/:id
//   actualizar(id: number, body: Partial<Cliente>): Observable<Cliente> {
//     return this.http.put<Cliente>(`${this.base}/${id}`, body);
//   }

//   // DELETE /api/clientes/:id   (soft delete: id_estado=3)
//   eliminar(id: number, hard = false): Observable<{ok:boolean; hard:boolean}> {
//     const params = hard ? new HttpParams().set('hard','1') : undefined;
//     return this.http.delete<{ ok: boolean; hard: boolean }>(`${this.base}/${id}`, { params });
//   }

//   // ===== Municipios =====
//   // GET /api/municipios/buscar?q=
//   municipiosBuscar(q: string): Observable<Municipio[]> {
//     const params = new HttpParams().set('q', q ?? '');
//     return this.http.get<Municipio[]>(`${this.muniBase}/buscar`, { params });
//   }

//   // POST /api/municipios/crear
//   municipioCrear(nombre: string): Observable<Municipio> {
//     return this.http
//       .post<{ id: number; nombre: string }>(`${this.muniBase}/crear`, { nombre })
//       .pipe(map(r => ({ id: r.id, nombre: r.nombre })));
//   }
// }
