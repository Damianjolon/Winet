// user.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Modulo, Usuario } from './user.model';  // 👈 Importa la interfaz

@Injectable({ providedIn: 'root' })
export class UserService {
  api: any;

  private apiUrl = 'http://localhost:3001/api/usuarios';
  private rolesUrl = 'http://localhost:3001/api/roles';
  private modulosUrl = 'http://localhost:3001/api/modulos';
  private permisosUrl = 'http://localhost:3001/api/permisos';

  constructor(private http: HttpClient) {}

    // --- Módulos ---
  getModulos(): Observable<Modulo[]> {
    return this.http.get<Modulo[]>(this.modulosUrl);
  }

  // Obtener un usuario por su ID
  obtenerUsuarioPorId(id: number): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.apiUrl}/${id}`);
  }


  // --- Usuarios ---
  crearUsuario(usuario: Partial<Usuario>): Observable<any> {
    return this.http.post(`${this.apiUrl}/crear`, usuario);
  }

  listarUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.apiUrl}/listar`);
  }

  eliminarUsuario(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/eliminar/${id}`);
  }

  actualizarUsuario(id: number, user: Partial<Usuario>): Observable<any> {
    return this.http.put(`${this.apiUrl}/cambiar/${id}`, user);
  }

  // ---- Roles
  getRoles(): Observable<{id:number; nombre:string}[]> {
    return this.http.get<{id:number; nombre:string}[]>(this.rolesUrl);
  }

cambiarEstadoUsuario(id: number, estado: 1 | 2) {
  return this.http.patch<{ ok: boolean; id: number; estado: number; estado_text: string }>(
    `${this.apiUrl}/${id}/estado`, { estado }
  );
}

toggleEstadoUsuario(id: number) {
  return this.http.post<{ ok: boolean; id: number; estado: number; estado_text: string }>(
    `${this.apiUrl}/${id}/toggle`, {}
  );
}

// (si más adelante implementas roles/permisos)
  // getRoles(): Observable<any[]>    { return this.http.get<any[]>(this.rolesUrl); }
  // getPermisos(): Observable<any[]> { return this.http.get<any[]>(this.permisosUrl);

  // --- Catálogos dinámicos ---
  // getRoles(): Observable<any[]> {
  //   return this.http.get<any[]>(this.rolesUrl);
  // }

  // getModulos(): Observable<any[]> {
  //   return this.http.get<any[]>(this.modulosUrl);
  // }

  // getPermisos(): Observable<any[]> {
  //   return this.http.get<any[]>(this.permisosUrl);
  // }
}
