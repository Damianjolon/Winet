// // src/modules/empleados/paginas/tareas-general/tablero-general.component.ts
// import { Component, OnInit } from '@angular/core';
// import { TareasService } from '../tareas-empleado/tareas.service';

// type Estado = 'PENDIENTE'|'EN_PROCESO'|'COMPLETADA';
// interface Item {
//   id: number;
//   empleado: string;
//   titulo: string;
//   descripcion?: string;
//   estado: Estado;
//   fecha: string;   // YYYY-MM-DD
//   hora: string;    // HH:mm:ss
//   prioridad: 'BAJA'|'MEDIA'|'ALTA';
// }

// @Component({
//   selector: 'app-tablero-general-tareas',
//   templateUrl: './tablero-general.component.html',
//   styleUrls: ['./tablero-general.component.css'],
// })
// export class TableroGeneralComponent implements OnInit {
//   filtros = { desde: '', hasta: '', estado: '', q: '' };
//   pendientes: Item[] = [];
//   enProceso: Item[] = [];
//   completadas: Item[] = [];
//   cargando = false;

//   constructor(private tareas: TareasService) {}

//   ngOnInit() { this.buscar(); }

//   buscar() {
//     this.cargando = true;
//     this.tareas.listarTodas(this.filtros).subscribe({
//       next: (rows) => {
//         const norm = (rows || []).map(r => ({
//           id: r.id,
//           empleado: r.empleado ?? r.asignadoANombre,
//           titulo: r.titulo,
//           descripcion: r.descripcion,
//           estado: r.estado as Estado,
//           fecha: String(r.fecha).slice(0,10),
//           hora: r.hora ?? '',
//           prioridad: r.prioridad
//         }) as Item);

//         this.pendientes  = norm.filter(x => x.estado === 'PENDIENTE');
//         this.enProceso   = norm.filter(x => x.estado === 'EN_PROCESO');
//         this.completadas = norm.filter(x => x.estado === 'COMPLETADA');
//       },
//       complete: () => this.cargando = false
//     });
//   }
// }
