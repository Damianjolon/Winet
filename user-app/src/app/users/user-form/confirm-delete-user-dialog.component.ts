import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-confirm-delete-user-dialog',
  templateUrl: './confirm-delete-user-dialog.component.html',
  styleUrls: ['./confirm-delete-user-dialog.component.scss'],
  encapsulation: ViewEncapsulation.None // para poder estilizar el overlay solo de este diálogo
})
export class ConfirmDeleteUserDialogComponent {
  constructor(
    private ref: MatDialogRef<ConfirmDeleteUserDialogComponent, boolean>,
    @Inject(MAT_DIALOG_DATA) public data: { id: number }
  ) {}
  cancelar(): void { this.ref.close(false); }
  eliminar(): void { this.ref.close(true); }
}
