import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { UsersRoutingModule } from './users-routing.module';

// Importar Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { UserListComponent } from './user-list/user-list.component';
import { UserFormComponent } from './user-form/user-form.component';
import { MatListModule } from "@angular/material/list";
import { MatIconModule } from "@angular/material/icon";
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableModule } from '@angular/material/table';
import { MatDialogModule } from '@angular/material/dialog';
import { CreateUserSuccessDialogComponent } from './user-form/create-user-success-dialog.component';
import { ConfirmDeleteUserDialogComponent } from './user-form/confirm-delete-user-dialog.component';


@NgModule({
  declarations: [
    UserListComponent,
    UserFormComponent,
    CreateUserSuccessDialogComponent,
    ConfirmDeleteUserDialogComponent
  ],
  imports: [
    MatTableModule,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    UsersRoutingModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatCheckboxModule,
    MatListModule,
    MatIconModule,
    MatSlideToggleModule,
    MatTooltipModule,
    MatDialogModule,
    MatIconModule
]
})
export class UsersModule {}
