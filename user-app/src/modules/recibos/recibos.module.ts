import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RecibosRoutingModule } from './recibos-routing.module';
import { RecibosComponent } from './recibos/recibos.component';


@NgModule({
  declarations: [
    RecibosComponent
  ],
  imports: [
    CommonModule,
    RecibosRoutingModule
  ]
})
export class RecibosModule { }
