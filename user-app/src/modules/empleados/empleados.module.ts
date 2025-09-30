import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { EmpleadosRoutingModule } from './empleados-routing.module';

import { ListaEmpleadosComponent } from './paginas/lista-empleados/lista-empleados.component';
import { FormEmpleadoComponent } from './paginas/formulario-empleado/formulario-empleado.component';
import { TareasEmpleadoComponent } from './paginas/tareas-empleado/tareas-empleado.component';
import { AsignarTareaComponent } from './paginas/asignar-tarea/asignar-tarea.component';

import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

@NgModule({
  declarations: [
    ListaEmpleadosComponent,
    FormEmpleadoComponent,
    TareasEmpleadoComponent,
    AsignarTareaComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    EmpleadosRoutingModule,
    MatChipsModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCardModule,
    MatTableModule,
    MatMenuModule,
    MatTooltipModule,
    MatCheckboxModule,
    MatAutocompleteModule
  ]
})
export class EmpleadosModule {}
