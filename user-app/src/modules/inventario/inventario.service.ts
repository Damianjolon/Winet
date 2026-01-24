import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class InventarioService {
  api: any;
  obtenerClientes() {
  return this.http.get<any[]>(`${this.base}/clientes`);
}
  private base = 'http://localhost:3001/api/inventario';
  apiUrl: any;

  constructor(private http: HttpClient) {}

obtenerProductos() {
  return this.http.get<any[]>(`${this.base}/productos`);
}


  listarKardex(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/kardex`);
  }

  alertasStock(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/alertas`);
  }

  registrarMovimiento(data: any): Observable<any> {
  return this.http.post(`${this.base}/movimiento`, data);
}

obtenerDashboard() {
  return this.http.get<any>(`${this.base}/dashboard`);
}

  // Movimientos
  listar() {
    return this.http.get(`${this.api}/`);
  }

  crearMovimiento(data: any) {
    return this.http.post(`${this.api}/crear`, data);
  }

  actualizarMovimiento(id: number, data: any) {
    return this.http.put(`${this.api}/actualizar/${id}`, data);
  }

  eliminarMovimiento(id: number) {
    return this.http.delete(`${this.api}/eliminar/${id}`);
  }

  // Productos
  listarProductos() {
    return this.http.get(`${this.api}/productos`);
  }

}
