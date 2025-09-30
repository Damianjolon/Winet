import { Component, OnInit, TrackByFunction } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserService } from '../user.service';
import { Modulo } from '../user.model';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-user-form',
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.scss']
})
export class UserFormComponent implements OnInit {
  userForm: FormGroup;
  roles: any[] = [];
  modulos: Modulo[] = [];
  permisos: any[] = [];
  editMode = false;
  idUsuario!: number;
  trackByModulo: TrackByFunction<Modulo>;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private route: ActivatedRoute,
    private router: Router,
    private dialog: MatDialog,
  private snackBar: MatSnackBar
  ) {
    this.userForm = this.fb.group({
      primer_nombre: ['', Validators.required],
      segundo_nombre: [''],
      primer_apellido: ['', Validators.required],
      segundo_apellido: [''],
      usuario: ['', Validators.required],
      password: ['', Validators.required],   // ← requerido solo en creación
      id_rol: ['', Validators.required],
      modulos: [[]],   // array de IDs
      permisos: [[]],
      estado: [1]
    });

    this.trackByModulo = (_: number, m: Modulo) => m.id;
  }

  ngOnInit(): void {
    // 0) Cargar ROLES
    this.userService.getRoles().subscribe({
      next: (r) => this.roles = r ?? [],
      error: () => this.showMessage('No se pudieron cargar los roles', true)
    });

    // Cargar MÓDULOS
    this.userService.getModulos().subscribe({
      next: (mods) => (this.modulos = mods ?? []),
      error: () => this.showMessage('No se pudieron cargar los módulos', true)
    });

    // Si viene id en ruta → modo edición
    this.idUsuario = Number(this.route.snapshot.paramMap.get('id'));
    if (this.idUsuario) {
      this.editMode = true;

      // 👇 En edición la contraseña es opcional
      const pwdCtrl = this.userForm.get('password');
      pwdCtrl?.clearValidators();
      pwdCtrl?.updateValueAndValidity();

      this.userService.listarUsuarios().subscribe(usuarios => {
        const user: any = usuarios.find(u => u.id === this.idUsuario);
        if (user) {
          this.userForm.patchValue({
            ...user,
            password: '', // 👈 no rellenar para no sobreescribir
            modulos: Array.isArray(user.modulos) ? user.modulos : []
          });
        }
      });
    }
  }

  cancelar(): void { this.router.navigate(['/usuarios']); }

  toggleModulo(moduloId: number, checked: boolean): void {
    const modulos = this.userForm.get('modulos')?.value || [];
    this.userForm.patchValue({
      modulos: checked ? [...modulos, moduloId] : modulos.filter((id: number) => id !== moduloId)
    });
  }

  togglePermiso(permisoId: number, checked: boolean): void {
    const permisos = this.userForm.get('permisos')?.value || [];
    this.userForm.patchValue({
      permisos: checked ? [...permisos, permisoId] : permisos.filter((id: number) => id !== permisoId)
    });
  }

  isModuloSeleccionado(id: number): boolean {
    const mods: number[] = this.userForm.get('modulos')?.value || [];
    return mods.includes(id);
  }

 onSubmit(): void {
  if (this.userForm.invalid) return;

  // Payload normalizado (trim a password)
  const payload: any = { ...this.userForm.value };
  if (typeof payload.password === 'string') {
    payload.password = payload.password.trim();
  }

  if (this.editMode) {
    // 👇 Si password quedó vacío, no la mandes (no se actualiza)
    if (!payload.password) delete payload.password;

    this.userService.actualizarUsuario(this.idUsuario, payload).subscribe({
      next: () => {
        this.showMessage('✅ Usuario actualizado con éxito');
        this.router.navigate(['/usuarios']);
      },
      error: (err) => {
        console.error(err);
        this.showMessage('⚠️ Error al actualizar usuario', true);
      }
    });
  } else {
    // Crear: password debe venir obligatoria (ya está validada)
    if (!payload.password) {
      this.showMessage('La contraseña es obligatoria', true);
      return;
    }

    this.userService.crearUsuario(payload).subscribe({
      next: (res: any) => {
        // Nombre del backend o, si no, del form
        const nombre = (res?.nombre_completo ||
          [payload.primer_nombre, payload.segundo_nombre, payload.primer_apellido, payload.segundo_apellido]
            .filter(Boolean)
            .join(' ')
        ).trim();

        // Módulos del backend (preferido) o seleccionados en el form
        const mods = Array.isArray(res?.modulos)
          ? res.modulos.map((m: any) => m?.nombre).filter(Boolean)
          : this.modulos
              .filter(m => (payload.modulos || []).includes(m.id))
              .map(m => m.nombre);

        // Mensaje moderno con emojis y saltos de línea
        this.showMessage(
          `✨ ¡Usuario creado con éxito!\n` +
          `👤 ${nombre}\n` +
          `🧩 Módulos: ${mods.join(', ') || 'Ninguno'}`
        );

        this.router.navigate(['/usuarios']);
      },
      error: (err) => {
        console.error(err);
        this.showMessage('⚠️ Error al crear usuario', true);
      }
    });
  }
}


  private showMessage(message: string, error: boolean = false): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000, horizontalPosition: 'right', verticalPosition: 'top',
      panelClass: error ? ['error-snackbar'] : ['success-snackbar']
    });
  }
}
