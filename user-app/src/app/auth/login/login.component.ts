import { Component } from '@angular/core';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'] // mantiene tu SCSS
})
export class LoginComponent {
  form: FormGroup;
  loading = false;
  error = '';

  // 🔥 Usuario quemado (solo pruebas frontend)
  private readonly EMERGENCY_USER = {
    usuario: 'admin',
    password: '123456',
    rol: 'ADMIN'
  };

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      usuario: ['', Validators.required],
      password: ['', Validators.required],
      remember: [false]
    });
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = '';

    const { usuario, password, remember } = this.form.getRawValue();

    // ⛳️ ATAJO DE PRUEBA: si coincide con el usuario quemado, entra sin backend
    if (
      usuario === this.EMERGENCY_USER.usuario &&
      password === this.EMERGENCY_USER.password
    ) {
      // Guarda un "estado de sesión" simple para que el AuthGuard te deje pasar
      localStorage.setItem('isLoggedIn', 'true');         // muchos guards miran esta bandera
      localStorage.setItem('token', 'FAKE_TOKEN');        // por si tu interceptor espera algo
      localStorage.setItem('user', JSON.stringify({
        usuario,
        rol: this.EMERGENCY_USER.rol,
        origen: 'hardcoded'
      }));
      if (remember) localStorage.setItem('rememberUser', usuario); else localStorage.removeItem('rememberUser');

      this.loading = false;
      this.router.navigate(['/dashboard']);
      return; // 👈 importante: no llames al backend si ya entraste por el atajo
    }

    // 🔁 Si NO coincide con el usuario quemado, sigue el flujo normal (backend)
    this.auth.login(usuario, password).subscribe({
      next: ok => {
        this.loading = false;
        if (ok) {
          if (remember) localStorage.setItem('rememberUser', usuario); else localStorage.removeItem('rememberUser');
          this.router.navigate(['/dashboard']);
        } else {
          this.error = 'Credenciales inválidas';
        }
      },
      error: err => {
        this.loading = false;
        const e = err?.error;
        this.error = e?.error || e?.message || e?.msg || 'Error de servidor';
        console.error('Login error:', err);
      }
    });
  }
}










//TODO PC PERSONAL
// import { Component } from '@angular/core';
// import { FormBuilder, Validators, FormGroup } from '@angular/forms';
// import { Router } from '@angular/router';
// import { AuthService } from '../auth.service';

// @Component({
//   selector: 'app-login',
//   templateUrl: './login.component.html',
//   styleUrls: ['./login.component.scss'] // mantiene tu SCSS
// })
// export class LoginComponent {
//   form: FormGroup;
//   loading = false;
//   error = '';

//   constructor(
//     private fb: FormBuilder,
//     private auth: AuthService,
//     private router: Router
//   ) {
//     this.form = this.fb.group({
//       usuario: ['', Validators.required],  // 👈 nombre de campo igual al backend
//       password: ['', Validators.required],
//       remember: [false]
//     });
//   }

//   submit() {  // 👈 antes se llamaba login()
//   if (this.form.invalid) {
//     this.form.markAllAsTouched();
//     return;
//   }

//   this.loading = true;
//   this.error = '';

//   const { usuario, password } = this.form.getRawValue();

//   this.auth.login(usuario, password).subscribe({
//     next: ok => {
//       this.loading = false;
//       if (ok) {
//         this.router.navigate(['/dashboard']);
//       } else {
//         this.error = 'Credenciales inválidas';
//       }
//     },
//     error: err => {
//       this.loading = false;
//       const e = err?.error;
//       this.error = e?.error || e?.message || e?.msg || 'Error de servidor';
//       console.error('Login error:', err);
//     }
//   });
// }

// }
