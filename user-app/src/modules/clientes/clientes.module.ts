import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

// Material
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';

import { ClientesRoutingModule } from './clientes-routing.module';

import { ClientesComponent } from './clientes/clientes.component';
import { ClientesListComponent } from './clientes/paginas/lista-clilentes/clientes-list/clientes-list.component';
import { ClientesFormComponent } from './clientes/paginas/formulario-clientes/clientes-form/clientes-form.component';

@NgModule({
  declarations: [ClientesComponent, ClientesListComponent, ClientesFormComponent],
  imports: [
    CommonModule,
    RouterModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,

    // Material
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatDividerModule,

    ClientesRoutingModule,
  ],
})
export class ClientesModule {}
