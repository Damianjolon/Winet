import { Component, OnDestroy } from '@angular/core';
import { FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../auth.service';

function matchValidator(a: string, b: string) {
  return (group: AbstractControl): ValidationErrors | null => {
    const v1 = group.get(a)?.value;
    const v2 = group.get(b)?.value;
    return v1 && v2 && v1 !== v2 ? { mismatch: true } : null;
  };
}

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.css']
})
export class ChangePasswordComponent implements OnDestroy {
  loading = false;
  error = '';
  success = '';

  // ⏱ cuenta regresiva para redirigir
  redirectIn = 0;
  private redirectTimer?: any;

  form = this.fb.group(
    {
      usuario: ['', Validators.required],
      oldPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: matchValidator('newPassword', 'confirmPassword') }
  );

  hideOld = true; hideNew = true; hideConfirm = true;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    // autocompletar usuario si llega como ?u=jperez
    this.route.queryParamMap.subscribe(p => {
      const u = (p.get('u') || '').trim();
      if (u) this.form.patchValue({ usuario: u });
    });
  }

  ngOnDestroy() { if (this.redirectTimer) clearInterval(this.redirectTimer); }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.loading = true; this.error = ''; this.success = '';
    const { usuario, oldPassword, newPassword } = this.form.getRawValue() as any;

    this.auth.changePassword({ usuario, oldPassword, newPassword }).subscribe({
      next: (res) => {
        this.loading = false;
        if (res?.ok) {
          this.success = `✅ ${res.msg} Usuario: ${res.usuario}`;
          // 1) limpia campos y bloquea el form
          this.form.reset();
          this.form.disable();

          // 2) inicia redirección en 10s
          this.startRedirectCountdown(10);
        } else {
          this.error = res?.msg || 'No se pudo actualizar.';
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.msg || 'Error de servidor';
        console.error(err);
      }
    });
  }

  back() { this.router.navigate(['/login']); }

  // 👉 botón "Ir ahora"
  goNow() {
    if (this.redirectTimer) clearInterval(this.redirectTimer);
    this.router.navigate(['/login']);
  }

  private startRedirectCountdown(seconds: number) {
    this.redirectIn = seconds;
    this.redirectTimer = setInterval(() => {
      this.redirectIn--;
      if (this.redirectIn <= 0) {
        clearInterval(this.redirectTimer);
        this.router.navigate(['/login']);
      }
    }, 1000);
  }
}
