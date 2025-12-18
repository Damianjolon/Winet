
// // src/app/auth/auth.service.ts
// import { Injectable } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { map, Observable } from 'rxjs';

// @Injectable({ providedIn: 'root' })
// export class AuthService {
//   private apiUrl = 'http://localhost:3001/api/auth'; // tu endpoint real

//   constructor(private http: HttpClient) {}

//   // ⛳️ Tu login normal (backend) debe seguir funcionando
//   login(usuario: string, password: string): Observable<boolean> {
//     return this.http.post<any>(`${this.apiUrl}/login`, { usuario, password })
//       .pipe(
//         map(res => {
//           // Ajusta a tu respuesta real
//           if (res?.ok) {
//             // Guarda sesión "real"
//             localStorage.setItem('isLoggedIn', 'true');
//             if (res.token) localStorage.setItem('token', res.token);
//             if (res.user)  localStorage.setItem('user', JSON.stringify(res.user));
//             return true;
//           }
//           return false;
//         })
//       );
//   }

//   // ✅ Lo único que tu guard necesita
//   isAuthenticated(): boolean {
//     // Vale para sesión real (token/isLoggedIn) o la “quemada”
//     return localStorage.getItem('isLoggedIn') === 'true' || !!localStorage.getItem('token');
//   }

//   // (Opcional) por si quieres centralizar el set de la sesión quemada
//   setFakeSession(payload: { usuario: string; rol?: string }) {
//     localStorage.setItem('isLoggedIn', 'true');
//     localStorage.setItem('token', 'FAKE_TOKEN'); // por si tu interceptor lo espera
//     localStorage.setItem('user', JSON.stringify({ ...payload, origen: 'hardcoded' }));
//   }

//   logout() {
//     localStorage.removeItem('isLoggedIn');
//     localStorage.removeItem('token');
//     localStorage.removeItem('user');
//   }

//   getToken(): string | null {
//     return localStorage.getItem('token');
//   }

//   getUser(): any {
//     const u = localStorage.getItem('user');
//     try { return u ? JSON.parse(u) : null; } catch { return null; }
//   }
// }


import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, tap } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { environment } from '../environments/environment';

export interface AuthLoginResponse {
  ok: boolean;
  token?: string;
  user?: any;
  message?: string;
}

export interface ApiResult {
  ok: boolean;
  message?: string;
  [k: string]: any;
}

export interface ChangePasswordDTO {
  usuario: string;
  oldPassword: string;
  newPassword: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  /**
   * Si tienes base en env (p. ej. http://host/api/webapi/), se normaliza y se le añade /auth.
   * Si no hay env, usa '/auth' (compatible con proxy.conf).
   */
  private base: string;

  constructor(private http: HttpClient) {
    const api = (environment as any)?.restApiServiceBaseUri as string | undefined;
    // normaliza para evitar dobles slashes
    this.base = api ? `${api.replace(/\/+$/, '')}/auth` : '/auth';
  }

  login(usuario: string, password: string, remember = false): Observable<boolean> {
    return this.http.post<AuthLoginResponse>(`${this.base}/login`, { usuario, password, remember }).pipe(
      tap((resp: AuthLoginResponse) => {
        if (resp?.ok && resp.token) {
          localStorage.setItem('token', resp.token);
          localStorage.setItem('user', JSON.stringify(resp.user ?? null));
          localStorage.setItem('isLoggedIn', 'true');
        }
      }),
      map((resp: AuthLoginResponse) => !!resp?.ok)
    );
  }

  me(): Observable<ApiResult> {
    return this.http.get<ApiResult>(`${this.base}/me`);
  }

  logout(): Observable<boolean> {
    const hasToken = !!localStorage.getItem('token');
    if (!hasToken) {
      this.clearLocal();
      return of(true);
    }
    return this.http.post<ApiResult>(`${this.base}/logout`, {}).pipe(
      tap(() => this.clearLocal()),
      map(() => true)
    );
  }

  forgotPassword(usuarioOrEmail: string): Observable<ApiResult> {
    return this.http.post<ApiResult>(`${this.base}/forgot-password`, { usuarioOrEmail });
  }

  resetPassword(token: string, newPassword: string): Observable<ApiResult> {
    return this.http.post<ApiResult>(`${this.base}/reset-password`, { token, newPassword });
  }

  changePassword(body: ChangePasswordDTO): Observable<ApiResult> {
    // Ajusta la ruta si tu backend usa otra (p. ej. '/usuarios/change-password')
    return this.http.post<ApiResult>(`${this.base}/change-password`, body);
  }

  // Helpers opcionales
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  get isLoggedIn(): boolean {
    return localStorage.getItem('isLoggedIn') === 'true';
  }

  private clearLocal(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('isLoggedIn');
  }
}



//TODO Este es de la PC Personal
// import { Injectable } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { map } from 'rxjs/operators';
// import { Observable, throwError } from 'rxjs';
// import { environment } from '../environments/environment';

// interface LoginResponse {
//   ok: boolean;
//   message?: string;
//   error?: string;
//   user?: { id: number; usuario: string; rol?: any; id_rol?: any };
//   token?: string;
// }

// @Injectable({ providedIn: 'root' })
// export class AuthService {
//   private apiUrl = `${environment.apiUrl}/auth`;
//   private loggedIn = false;

//   constructor(private http: HttpClient) {}

//   login(usuario: string, password: string): Observable<boolean> {
//     return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { usuario, password })
//       .pipe(
//         map(resp => {
//           if (resp && resp.ok) {
//             this.loggedIn = true; // sin token por ahora
//             return true;
//           }
//           // Si el backend respondiera 200 con ok:false, opcionalmente:
//           throw new Error(resp?.error || 'Credenciales inválidas');
//         })
//       );
//   }

//   logout() { this.loggedIn = false; }
//   isAuthenticated(): boolean { return this.loggedIn; }
// }

