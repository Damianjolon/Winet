import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { RecibosRoutingModule } from './recibos-routing.module';

import { RecibosComponent } from './recibos/recibos.component';         // si lo sigues usando de wrapper
import { RecibosNuevoComponent } from './recibos-nuevo.component';
import { RecibosListaComponent } from './recibos/recibos-list/recibo-list.component';
import { ReciboPreviewModalComponent } from '../recibos/preview/preview-modal.component';
import { ClientesApi, RecibosApi, ServiciosApi } from './recibos/recibos.api';

@NgModule({
  declarations: [
    RecibosComponent,
    RecibosNuevoComponent,
    RecibosListaComponent,
    ReciboPreviewModalComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    RecibosRoutingModule
  ],
  providers: [ClientesApi, RecibosApi, ServiciosApi]
})
export class RecibosModule {}
