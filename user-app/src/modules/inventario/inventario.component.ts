import { Component, OnInit } from '@angular/core';
import { InventarioService } from './inventario.service';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-inventario',
  templateUrl: './inventario.component.html',
  styleUrls: ['./inventario.component.scss']
})
export class InventarioComponent implements OnInit {
  movimientos: any[] = [];
  productos: any[] = [];
  Clientes: any[] = [];
  resumen: any = {};
  contadorBajos: number = 0;
  alertasPendientes = 0;
  cargando = true;
  filtroTexto = '';
  filtroTipo = 'TODOS';

  constructor(private api: InventarioService) {}

  // ================== Inicio ==================
  ngOnInit() {
    this.cargarProductos();
    this.cargarClientes();
    this.cargarDatos();
    this.cargarDashboard();
    this.contarAlertas();

    setTimeout(() => this.verAlertas(), 1200);
    setInterval(() => {
      this.cargarDashboard();
      this.contarAlertas();
    }, 30000);
  }

  // ================== Cargas ==================
  cargarProductos() {
    this.api.obtenerProductos().subscribe({
      next: (res) => this.productos = res,
      error: (err) => console.error('Error cargando productos', err)
    });
  }

  cargarClientes() {
    this.api.obtenerClientes().subscribe({
      next: (res) => this.Clientes = res,
      error: (err) => console.error('Error cargando clientes', err)
    });
  }

  cargarDatos() {
    this.cargando = true;
    this.api.listarKardex().subscribe({
      next: (res) => {
        this.movimientos = res;
        this.cargando = false;
      },
      error: (err) => {
        console.error(err);
        this.cargando = false;
      }
    });
  }

  cargarDashboard() {
    this.api.obtenerDashboard().subscribe({
      next: (res) => this.resumen = res,
      error: () => console.error('Error cargando dashboard')
    });
  }

  // ================== Filtros ==================
  filtrarMovimientos() {
    return this.movimientos.filter(m => {
      const coincideTexto =
        this.filtroTexto === '' ||
        m.producto?.toLowerCase().includes(this.filtroTexto.toLowerCase()) ||
        m.referencia?.toLowerCase().includes(this.filtroTexto.toLowerCase());
      const coincideTipo =
        this.filtroTipo === 'TODOS' || m.tipo === this.filtroTipo;
      return coincideTexto && coincideTipo;
    });
  }

  // ================== Registrar Movimiento ==================
  nuevoMovimiento() {
    const opcionesProd = this.productos
      .map(p => `<option value="${p.id}">${p.nombre}</option>`)
      .join('');
    const opcionesCli = this.Clientes.length
      ? this.Clientes.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('')
      : '<option value="">Sin clientes disponibles</option>';

    Swal.fire({
      title: 'Registrar movimiento',
      html: this.htmlFormulario(opcionesProd, opcionesCli),
      confirmButtonText: 'Guardar',
      showCancelButton: true,
      cancelButtonText: 'Cancelar',
      focusConfirm: false,
      preConfirm: async () => {
        const producto_id = Number((document.getElementById('producto_id') as HTMLSelectElement).value);
        const tipo = (document.getElementById('tipo') as HTMLSelectElement).value;
        const cantidad = Number((document.getElementById('cantidad') as HTMLInputElement).value);
        const referencia = (document.getElementById('referencia') as HTMLInputElement).value;
        const cliente_id = Number((document.getElementById('cliente_id') as HTMLSelectElement).value) || null;

        if (!producto_id || !cantidad) {
          Swal.showValidationMessage('Debe seleccionar un producto y una cantidad válida.');
          return false;
        }

        Swal.showLoading();
        try {
          await this.api.registrarMovimiento({ producto_id, tipo, cantidad, referencia, cliente_id }).toPromise();
          Swal.fire({ icon: 'success', title: 'Éxito', text: 'Movimiento registrado correctamente', timer: 1800, showConfirmButton: false });
          this.cargarDatos();
          this.cargarDashboard();
        } catch {
          Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo registrar el movimiento.' });
        }

        return false;
      }
    });
  }

  // ================== Editar Movimiento ==================
  editarMovimiento(mov: any) {
    const opcionesProd = this.productos
      .map(p => `<option value="${p.id}" ${p.id === mov.producto_id ? 'selected' : ''}>${p.nombre}</option>`)
      .join('');
    const opcionesCli = this.Clientes.map(c =>
      `<option value="${c.id}" ${c.id === mov.cliente_id ? 'selected' : ''}>${c.nombre}</option>`
    ).join('');

    Swal.fire({
      title: `Editar movimiento #${mov.id_movimiento}`,
      html: this.htmlFormulario(opcionesProd, opcionesCli, mov),
      confirmButtonText: 'Actualizar',
      showCancelButton: true,
      cancelButtonText: 'Cancelar',
      focusConfirm: false,
      preConfirm: async () => {
        const producto_id = Number((document.getElementById('producto_id') as HTMLSelectElement).value);
        const tipo = (document.getElementById('tipo') as HTMLSelectElement).value;
        const cantidad = Number((document.getElementById('cantidad') as HTMLInputElement).value);
        const referencia = (document.getElementById('referencia') as HTMLInputElement).value;
        const cliente_id = Number((document.getElementById('cliente_id') as HTMLSelectElement).value) || null;

        if (!producto_id || !cantidad) {
          Swal.showValidationMessage('Debe seleccionar un producto y una cantidad válida.');
          return false;
        }

        Swal.showLoading();
        try {
          await this.api.actualizarMovimiento(mov.id_movimiento, { producto_id, tipo, cantidad, referencia, cliente_id }).toPromise();
          Swal.fire({ icon: 'success', title: 'Actualizado', text: 'Movimiento actualizado correctamente', timer: 1500, showConfirmButton: false });
          this.cargarDatos();
          this.cargarDashboard();
        } catch {
          Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo actualizar el movimiento.' });
        }
        return false;
      }
    });
  }

  // ================== Eliminar Movimiento ==================
  eliminarMovimiento(mov: any) {
    Swal.fire({
      title: '¿Eliminar movimiento?',
      text: `Producto: ${mov.producto} (${mov.tipo})`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33'
    }).then(async (r) => {
      if (r.isConfirmed) {
        try {
          await this.api.eliminarMovimiento(mov.id_movimiento).toPromise();
          Swal.fire('Eliminado', 'Movimiento eliminado correctamente', 'success');
          this.cargarDatos();
          this.cargarDashboard();
        } catch {
          Swal.fire('Error', 'No se pudo eliminar el movimiento', 'error');
        }
      }
    });
  }

  // ================== Alertas ==================
  contarAlertas() {
    this.api.alertasStock().subscribe({
      next: (rows) => {
        const bajos = rows.filter((p: any) => p.estado_stock === 'BAJO');
        this.alertasPendientes = bajos.length;
      },
      error: () => this.alertasPendientes = 0
    });
  }

  verAlertas() {
    this.api.alertasStock().subscribe({
      next: (rows) => {
        const bajos = rows.filter((p: any) =>
          (p.estado_stock || '').toUpperCase() === 'BAJO'
        );
        this.contadorBajos = bajos.length;

        if (!bajos.length) {
          Swal.fire('Todo bien', 'No hay productos con stock bajo.', 'success');
          return;
        }

        const lista = bajos.map((b: any) =>
          `<li><b>${b.nombre}</b> (stock: ${b.stock_actual} / mínimo: ${b.stock_minimo})</li>`
        ).join('');

        Swal.fire({
          title: `Productos con stock bajo (${bajos.length})`,
          html: `<ul style="text-align:left">${lista}</ul>`,
          icon: 'warning'
        });
      },
      error: () => Swal.fire('Error', 'No se pudieron cargar las alertas', 'error')
    });
  }

  // ================== Exportar Excel ==================
  exportarKardex() {
    if (!this.movimientos?.length) {
      Swal.fire('Sin datos', 'No hay movimientos para exportar.', 'info');
      return;
    }

    const hoja = XLSX.utils.json_to_sheet(
      this.movimientos.map(m => ({
        ID: m.id_movimiento,
        Producto: m.producto,
        Tipo: m.tipo,
        Cantidad: m.cantidad,
        Referencia: m.referencia || '',
        Fecha: new Date(m.fecha).toLocaleString()
      }))
    );

    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, 'Kardex');
    const wbout = XLSX.write(libro, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    saveAs(blob, `Kardex_${new Date().toISOString().slice(0,10)}.xlsx`);

    Swal.fire('Éxito', 'Archivo Excel exportado correctamente.', 'success');
  }

  // ================== HTML Formulario (reutilizable) ==================
  private htmlFormulario(opcionesProd: string, opcionesCli: string, mov: any = {}) {
    return `
      <style>
        .swal2-input, .swal2-select {
          width: 100% !important;
          border: 1px solid #d0d0d0 !important;
          border-radius: 6px !important;
          padding: 8px 10px !important;
          font-size: 14px !important;
          box-shadow: none !important;
          background: #fafafa !important;
        }
        .swal-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          text-align: left;
          margin-top: 10px;
        }
        .swal-grid label {
          font-weight: 600;
          display: block;
          margin-bottom: 4px;
          color: #333;
        }
        .swal-full { grid-column: 1 / span 2; }
      </style>

      <div class="swal-grid">
        <div class="swal-full">
          <label>Producto</label>
          <select id="producto_id" class="swal2-select">
            <option value="">Seleccione un producto</option>
            ${opcionesProd}
          </select>
        </div>

        <div>
          <label>Tipo de movimiento</label>
          <select id="tipo" class="swal2-select">
            <option value="ENTRADA" ${mov.tipo === 'ENTRADA' ? 'selected' : ''}>ENTRADA</option>
            <option value="SALIDA" ${mov.tipo === 'SALIDA' ? 'selected' : ''}>SALIDA</option>
          </select>
        </div>

        <div>
          <label>Cantidad</label>
          <input id="cantidad" class="swal2-input" type="number" min="1"
                 value="${mov.cantidad || ''}" placeholder="Ingrese cantidad">
        </div>

        <div class="swal-full">
          <label>Referencia</label>
          <input id="referencia" class="swal2-input" placeholder="Referencia (opcional)"
                 value="${mov.referencia || ''}">
        </div>

        <div class="swal-full">
          <label>Cliente</label>
          <select id="cliente_id" class="swal2-select">
            <option value="">Sin cliente</option>
            ${opcionesCli}
          </select>
        </div>
      </div>
    `;
  }
}


// import { ClientesApi } from './../recibos/recibos/recibos.api';
// import { Component, OnInit } from '@angular/core';
// import { InventarioService } from './inventario.service';
// import Swal from 'sweetalert2';
// import * as XLSX from 'xlsx';
// import { saveAs } from 'file-saver';

// @Component({
//   selector: 'app-inventario',
//   templateUrl: './inventario.component.html',
//   styleUrls: ['./inventario.component.scss']
// })
// export class InventarioComponent implements OnInit {
//   movimientos: any[] = [];
//   productos: any[] = [];
//   cargando = true;
//   filtroTexto = '';
//   filtroTipo = 'TODOS';
// contadorBajos: any;
// resumen: any = {};
// Clientes: any[] = [];


//   constructor(private api: InventarioService) {}

//   ngOnInit() {
//       this.cargarProductos();
//     this.cargarDatos();
//     this.cargarDashboard();
//     this.contarAlertas();
//     this.cargarClientes();
//     setTimeout(() => this.verAlertas(), 1200);
//   setInterval(() => {
//     this.cargarDashboard();
//     this.contarAlertas();
//   }, 30000);
//   }

//   cargarClientes() {
//   this.api.obtenerClientes().subscribe({
//     next: (res) => this.Clientes = res,
//     error: (err) => console.error('Error cargando clientes', err)
//   });
// }
//   cargarDashboard() {
//   this.api.obtenerDashboard().subscribe({
//     next: (res) => this.resumen = res,
//     error: () => console.error('Error cargando dashboard')
//   });
// }
//   // ================== Cargar datos ==================
//   cargarDatos() {
//     this.cargando = true;
//     this.api.listarKardex().subscribe({
//       next: (res) => {
//         this.movimientos = res;
//         this.cargando = false;
//       },
//       error: (err) => {
//         console.error(err);
//         this.cargando = false;
//       }
//     });
//   }

//   cargarProductos() {
//     this.api.obtenerProductos().subscribe({
//       next: (res) => this.productos = res,
//       error: (err) => console.error('Error cargando productos', err)
//     });
//   }

//   // ================== Filtros ==================
//   filtrarMovimientos() {
//     return this.movimientos.filter(m => {
//       const coincideTexto =
//         this.filtroTexto === '' ||
//         m.producto?.toLowerCase().includes(this.filtroTexto.toLowerCase()) ||
//         m.referencia?.toLowerCase().includes(this.filtroTexto.toLowerCase());
//       const coincideTipo =
//         this.filtroTipo === 'TODOS' || m.tipo === this.filtroTipo;
//       return coincideTexto && coincideTipo;
//     });
//   }

// nuevoMovimiento() {
//   const opcionesProd = this.productos
//     .map(p => `<option value="${p.id}">${p.nombre}</option>`)
//     .join('');
//   const opcionesCli = this.Clientes.length
//     ? this.Clientes.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('')
//     : '<option value="">Sin clientes disponibles</option>';

//  Swal.fire({
//   title: 'Registrar movimiento',
//   html: `
//     <style>
//       .swal2-input, .swal2-select {
//         width: 100% !important;
//         border: 1px solid #d0d0d0 !important;
//         border-radius: 6px !important;
//         padding: 8px 10px !important;
//         font-size: 14px !important;
//         box-shadow: none !important;
//         background: #fafafa !important;
//         transition: border-color 0.2s ease;
//       }
//       .swal2-input:focus, .swal2-select:focus {
//         outline: none !important;
//         border-color: #888 !important;
//       }
//       .swal-grid {
//         display: grid;
//         grid-template-columns: 1fr 1fr;
//         gap: 14px;
//         text-align: left;
//         margin-top: 10px;
//       }
//       .swal-grid label {
//         font-weight: 600;
//         display: block;
//         margin-bottom: 4px;
//         color: #333;
//       }
//       .swal-full {
//         grid-column: 1 / span 2;
//       }
//     </style>

//     <div class="swal-grid">
//       <div class="swal-full">
//         <label>Producto</label>
//         <select id="producto_id" class="swal2-select">
//           <option value="">Seleccione un producto</option>
//           ${opcionesProd}
//         </select>
//       </div>

//       <div>
//         <label>Tipo de movimiento</label>
//         <select id="tipo" class="swal2-select">
//           <option value="ENTRADA">ENTRADA</option>
//           <option value="SALIDA">SALIDA</option>
//         </select>
//       </div>

//       <div>
//         <label>Cantidad</label>
//         <input id="cantidad" class="swal2-input" type="number" min="1" placeholder="Ingrese cantidad">
//       </div>

//       <div class="swal-full">
//         <label>Referencia</label>
//         <input id="referencia" class="swal2-input" placeholder="Referencia (opcional)">
//       </div>

//       <div class="swal-full">
//         <label>Cliente</label>
//         <select id="cliente_id" class="swal2-select">
//           <option value="">Sin cliente</option>
//           ${opcionesCli}
//         </select>
//       </div>
//     </div>
//   `,
//   confirmButtonText: 'Guardar',
//   showCancelButton: true,
//   cancelButtonText: 'Cancelar',
//   focusConfirm: false,
//   preConfirm: async () => {
//     const producto_id = Number((document.getElementById('producto_id') as HTMLSelectElement).value);
//     const tipo = (document.getElementById('tipo') as HTMLSelectElement).value;
//     const cantidad = Number((document.getElementById('cantidad') as HTMLInputElement).value);
//     const referencia = (document.getElementById('referencia') as HTMLInputElement).value;
//     const cliente_id = Number((document.getElementById('cliente_id') as HTMLSelectElement).value) || null;

//     if (!producto_id || !cantidad) {
//       Swal.showValidationMessage('Debe seleccionar un producto y una cantidad válida.');
//       return false;
//     }

//     Swal.showLoading();

//     try {
//       await this.api.registrarMovimiento({ producto_id, tipo, cantidad, referencia, cliente_id }).toPromise();
//       Swal.fire({
//         icon: 'success',
//         title: 'Éxito',
//         text: 'Movimiento registrado correctamente',
//         timer: 1800,
//         showConfirmButton: false
//       });
//       this.cargarDatos();
//     } catch (err) {
//       console.error(err);
//       Swal.fire({
//         icon: 'error',
//         title: 'Error',
//         text: 'No se pudo registrar el movimiento. Verifique los datos e intente nuevamente.'
//       });
//     }

//     return false;
//   }
// });

// }



//  alertasPendientes = 0;


// contarAlertas() {
//   this.api.alertasStock().subscribe({
//     next: (rows) => {
//       const bajos = rows.filter((p: any) => p.estado_stock === 'BAJO');
//       this.alertasPendientes = bajos.length;
//     },
//     error: () => this.alertasPendientes = 0
//   });
// }



//   // ================== Alertas de stock ==================
//  verAlertas() {
//   this.api.alertasStock().subscribe({
//     next: (rows) => {
//       const bajos = rows.filter((p: any) =>
//         (p.estado_stock || '').toUpperCase() === 'BAJO'
//       );

//       // 🔹 Actualiza contador global
//       this.contadorBajos = bajos.length;

//       if (!bajos.length) {
//         Swal.fire('Todo bien', 'No hay productos con stock bajo.', 'success');
//         return;
//       }

//       // 🔹 Construir lista HTML
//       const lista = bajos.map((b: any) =>
//         `<li style="margin-bottom:4px;"><b>${b.nombre}</b>
//           <span style="color:#555;">(stock: ${b.stock_actual} / mínimo: ${b.stock_minimo})</span>
//         </li>`
//       ).join('');

//       // 🔹 Mostrar alerta
//       Swal.fire({
//         title: `Productos con stock bajo (${bajos.length})`,
//         html: `<ul style="text-align:left; padding-left:20px; margin-top:10px;">${lista}</ul>`,
//         icon: 'warning',
//         confirmButtonColor: '#1abc9c',
//       });
//     },
//     error: () => Swal.fire('Error', 'No se pudieron cargar las alertas', 'error')
//   });
// }


//   // ================== Acciones ==================
//   editarMovimiento(mov: any) {
//     Swal.fire('Editar', `Aquí editarías el movimiento #${mov.id_movimiento}`, 'info');
//   }

//   eliminarMovimiento(mov: any) {
//     Swal.fire({
//       title: '¿Eliminar movimiento?',
//       text: `Se eliminará el registro del producto "${mov.producto}".`,
//       icon: 'warning',
//       showCancelButton: true,
//       confirmButtonText: 'Sí, eliminar',
//       cancelButtonText: 'Cancelar'
//     }).then((r) => {
//       if (r.isConfirmed) {
//         Swal.fire('Eliminado', 'Movimiento eliminado correctamente', 'success');
//       }
//     });
//   }
//   // ================== Exportar Excel ==================
//   exportarKardex() {
//     if (!this.movimientos?.length) {
//       Swal.fire('Sin datos', 'No hay movimientos para exportar.', 'info');
//       return;
//     }

//     const hoja = XLSX.utils.json_to_sheet(
//       this.movimientos.map(m => ({
//         ID: m.id_movimiento,
//         Producto: m.producto,
//         Tipo: m.tipo,
//         Cantidad: m.cantidad,
//         Referencia: m.referencia || '',
//         Fecha: new Date(m.fecha).toLocaleString()
//       }))
//     );

//     const libro = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(libro, hoja, 'Kardex');

//     const wbout = XLSX.write(libro, { bookType: 'xlsx', type: 'array' });
//     const blob = new Blob([wbout], { type: 'application/octet-stream' });
//     saveAs(blob, `Kardex_${new Date().toISOString().slice(0,10)}.xlsx`);

//     Swal.fire('Éxito', 'Archivo Excel exportado correctamente.', 'success');
//   }



// }
