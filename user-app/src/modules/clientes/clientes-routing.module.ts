import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ClientesComponent } from './clientes/clientes.component';
import { ClientesListComponent } from './clientes/paginas/lista-clilentes/clientes-list/clientes-list.component';
import { ClientesFormComponent } from './clientes/paginas/formulario-clientes/clientes-form/clientes-form.component';

const routes: Routes = [
  {
    path: '',
    component: ClientesComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'listar' },
      { path: 'listar', component: ClientesListComponent },
      { path: 'new', component: ClientesFormComponent },
      { path: ':id/edit', component: ClientesFormComponent },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ClientesRoutingModule {}
