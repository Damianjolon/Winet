import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RecibosListaComponent } from './recibos/recibos-list/recibo-list.component';
import { RecibosNuevoComponent } from './recibos-nuevo.component';

const routes: Routes = [
    { path: '', component: RecibosListaComponent },      // /recibos
  { path: 'nuevo', component: RecibosNuevoComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RecibosRoutingModule { }
