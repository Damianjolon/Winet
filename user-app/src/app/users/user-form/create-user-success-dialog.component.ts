import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-create-user-success-dialog',
  templateUrl: './create-user-success-dialog.component.html',
  styleUrls: ['./create-user-success-dialog.component.scss'],
  encapsulation: ViewEncapsulation.None   // 👈 permite que el CSS de abajo alcance el overlay
})
export class CreateUserSuccessDialogComponent {
  constructor(
    private ref: MatDialogRef<CreateUserSuccessDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { nombre: string; modulos: string[]; usuario?: string; }
  ) {}
  close(): void { this.ref.close(true); }
}
