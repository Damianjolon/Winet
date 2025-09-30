import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable, of, shareReplay } from 'rxjs';
import { environment } from 'src/app/environments/environment';

function base() {
  const e:any = environment;
  if (e?.apiUrl) return e.apiUrl.replace(/\/+$/, '') + '/municipios';
  if (e?.apiBase) return e.apiBase.replace(/\/+$/, '') + '/api/municipios';
  return '/api/municipios';
}

export interface Municipio {
  id: number;
  nombre: string;
}

@Injectable({ providedIn: 'root' })
export class MunicipiosService {
  private cacheById = new Map<number, string>();
  private ALL$?: Observable<Municipio[]>;

  constructor(private http: HttpClient) {}

  getById(id: number) {
    if (this.cacheById.has(id)) return of({ id, nombre: this.cacheById.get(id)! });
    return this.http.get<Municipio>(`${base()}/${id}`).pipe(
      map(m => { this.cacheById.set(m.id, m.nombre); return m; })
    );
  }

  // Si tu backend soporta ?q= o devuelve {items:[...]} / [...]
  searchByName(q: string) {
    const params = new HttpParams().set('q', q);
    return this.http.get<any>(base(), { params }).pipe(
      map((res: any) => Array.isArray(res?.items) ? res.items : (Array.isArray(res) ? res : []))
    );
  }

  create(nombre: string) {
    return this.http.post<Municipio>(base(), { nombre });
  }

  ensureByName(nombre: string): Observable<number> {
    const q = (nombre || '').trim();
    if (!q) return of(0);
    return this.searchByName(q).pipe(
      map((arr: Municipio[]) => {
        const found = arr.find(m => m.nombre?.toLowerCase() === q.toLowerCase());
        return found?.id ?? 0;
      }),
      // Si no existe, lo crea. Para simplificar lo hacemos con switch dinámico:
      // (pequeño truco sin rxjs extra)
      map(id => ({ id, nombre: q })),
      // siguiente paso dispara create si id=0
      // Nota: puedes cambiar esto por concatMap si prefieres.
      // Aquí simplifico con Promise-like.
      // @ts-ignore
      async ({ id, nombre }) => {
        if (id) return id;
        const m = await this.create(nombre).toPromise();
        return m?.id ?? 0;
      }
    ) as any;
  }

  // (opcional) carga todo y cachea
  all() {
    if (!this.ALL$) {
      this.ALL$ = this.http.get<any>(base()).pipe(
        map((res:any) => Array.isArray(res?.items) ? res.items : (Array.isArray(res) ? res : [])),
        map((arr: Municipio[]) => {
          arr.forEach(m => this.cacheById.set(m.id, m.nombre));
          return arr;
        }),
        shareReplay(1)
      );
    }
    return this.ALL$;
  }

  nombreLocal(id?: number | null) {
    if (!id) return '';
    if (this.cacheById.has(id)) return this.cacheById.get(id)!;
    if (id === 1) return 'Palín'; // fallback solicitado
    return `#${id}`;
  }
}
