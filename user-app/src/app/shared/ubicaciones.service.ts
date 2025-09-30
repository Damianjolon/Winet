import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface Departamento {
  id: number;
  nombre: string;
}

export interface Municipio {
  id: number;
  nombre: string;
  id_departamento?: number;
}

@Injectable({ providedIn: 'root' })
export class UbicacionesService {
  // Ajusta estas rutas para que apunten a TUS endpoints existentes (los mismos que usa Clientes)
  private base = 'http://localhost:3001/api/empleados';
  private departamentosUrl = `${this.base}/departamentos`;
  private municipiosPorDepUrl = `${this.base}/municipios`; // e.g. /municipios?departamentoId=#

  constructor(private http: HttpClient) {}

  listarDepartamentos(): Observable<Departamento[]> {
    return this.http.get<any[]>(this.departamentosUrl).pipe(
      map(rows => (rows || []).map(r => ({
        id: r.id ?? r.ID ?? r.id_departamento ?? r.ID_DEPARTAMENTO,
        nombre: r.nombre ?? r.NOMBRE
      } as Departamento)))
    );
  }

  listarMunicipiosPorDepartamento(idDepartamento: number): Observable<Municipio[]> {
    // Si tu API es /municipios?departamentoId=# usa params; si es /departamentos/:id/municipios, ajusta el URL
    return this.http.get<any[]>(`${this.municipiosPorDepUrl}`, {
      params: { departamentoId: String(idDepartamento) }
    }).pipe(
      map(rows => (rows || []).map(r => ({
        id: r.id ?? r.ID ?? r.id_municipio ?? r.ID_MUNICIPIO,
        nombre: r.nombre ?? r.NOMBRE,
        id_departamento: r.id_departamento ?? r.ID_DEPARTAMENTO ?? idDepartamento
      } as Municipio)))
    );
  }
}
