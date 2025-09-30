import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean {
    const ok = localStorage.getItem('isLoggedIn') === 'true' && !!localStorage.getItem('token');
    if (!ok) {
      this.router.navigate(['/auth/login']);
      return false;
    }
    return true;
  }
}



// src/app/auth/auth.guard.ts
// import { Injectable } from '@angular/core';
// import { CanActivate, Router } from '@angular/router';
// import { AuthService } from './auth.service';

// @Injectable({ providedIn: 'root' })
// export class AuthGuard implements CanActivate {
//   constructor(private auth: AuthService, private router: Router) {}

//   canActivate(): boolean {
//     if (this.auth.isAuthenticated()) {
//       return true;
//     }
//     this.router.navigate(['/login']);
//     return false;
//   }
// }
