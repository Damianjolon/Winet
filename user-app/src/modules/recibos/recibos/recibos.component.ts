import { Component } from '@angular/core';
import { ReciboHeader, RecibosApi } from './recibos.api';

@Component({
  selector: 'app-recibos',
  template: '<p>RecibosComponent works!</p>'
})
export class RecibosComponent {
  creado?: ReciboHeader;
  items: any[] = [];

  constructor(private recApi: RecibosApi) {}

  openPreview(){ if (!this.creado) return; window.open(this.recApi.previewUrl(this.creado.id), '_blank'); }

  changeCantidad(i: number, delta: number) {
    this.items[i].cantidad = Math.max(0, this.items[i].cantidad + delta);
    if (this.items[i].cantidad === 0) {
      this.items.splice(i, 1);
    }
    // Note: recalcular method not implemented in this component
  }
}
