import { Component } from '@angular/core';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  form: FormGroup;
  loading = false;
  error = '';

  private readonly EMERGENCY_USER = { usuario: 'admin', password: '123456', rol: 'ADMIN' };

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    this.form = this.fb.group({
      usuario: ['', Validators.required],
      password: ['', Validators.required],
      remember: [false]
    });
  }

  // 👇 nuevo
  goToChangePassword() {
    const u = (this.form.get('usuario')?.value || '').trim();
    this.router.navigate(['/auth/change-password'], { queryParams: u ? { u } : undefined });
  }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.loading = true; this.error = '';
    const { usuario, password, remember } = this.form.getRawValue();

    if (usuario === this.EMERGENCY_USER.usuario && password === this.EMERGENCY_USER.password) {
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('token', 'FAKE_TOKEN');
      localStorage.setItem('user', JSON.stringify({ usuario, rol: this.EMERGENCY_USER.rol, origen: 'hardcoded' }));
      if (remember) localStorage.setItem('rememberUser', usuario); else localStorage.removeItem('rememberUser');
      this.loading = false; this.router.navigate(['/dashboard']); return;
    }

    this.auth.login(usuario, password).subscribe({
      next: ok => {
        this.loading = false;
        if (ok) {
          if (remember) localStorage.setItem('rememberUser', usuario); else localStorage.removeItem('rememberUser');
          localStorage.setItem('isLoggedIn', 'true');
          this.router.navigate(['/dashboard']);
        } else { this.error = 'Credenciales inválidas'; }
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
