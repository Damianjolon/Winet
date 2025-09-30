

import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../user.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmDeleteUserDialogComponent } from '../user-form/confirm-delete-user-dialog.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent implements OnInit {
usuario: any;
onSlideEstado: any;
onToggleEstado(_t66: any,arg1: any) {
throw new Error('Method not implemented.');
}

  usuarios: any[] = [];
  displayedColumns: string[] = ['id', 'nombre_completo', 'usuario', 'rol', 'estado', 'acciones'];

  constructor(
    private userService: UserService,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.cargarUsuarios();
  }

cargarUsuarios(): void {
  this.userService.listarUsuarios().subscribe({
    next: (data: any) => {
      // ✅ Ya viene el campo nombre_completo desde el backend, no lo sobrescribimos
      this.usuarios = data;
      console.log('Usuarios procesados:', this.usuarios);
    },
    error: (err: any) => console.error('Error al cargar usuarios:', err)
  });
}


 eliminar(id: number): void {
  const ref = this.dialog.open(ConfirmDeleteUserDialogComponent, {
    width: '420px',
    maxWidth: '92vw',
    disableClose: true,
    data: { id },
    panelClass: 'dlg-confirm-delete-white' // clase única para el estilo blanco/negro
  });

    ref.afterClosed().subscribe((ok: boolean) => {
    if (!ok) return;
    this.userService.eliminarUsuario(id).subscribe({
      next: () => this.cargarUsuarios(), // ← sin cambiar tu servicio
      error: (err: any) => console.error('Error al eliminar usuario:', err)
    });
  });
}

  editar(usuario: any): void {
    this.router.navigate(['/usuarios/edit', usuario.id]);
  }

alternarEstado(u: any): void {
  const prevNum = u.estado_num != null ? Number(u.estado_num) : (u.estado === 'ACTIVO' ? 1 : 2);
  const next = prevNum === 1 ? 2 : 1;

  // Optimista
  u.estado_num = next;
  u.estado = next === 1 ? 'ACTIVO' : 'INACTIVO';

  this.userService.cambiarEstadoUsuario(u.id, next).subscribe({
    next: (res) => {
      u.estado_num = Number(res.estado);
      u.estado = res.estado_text;
    },
    error: (err) => {
      console.error('Error cambiando estado:', err);
      // rollback
      u.estado_num = prevNum;
      u.estado = prevNum === 1 ? 'ACTIVO' : 'INACTIVO';
      alert('No se pudo cambiar el estado');
    }
  });
}

}


