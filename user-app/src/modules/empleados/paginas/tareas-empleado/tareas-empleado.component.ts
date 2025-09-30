// src/modules/empleados/paginas/tareas-empleado/tareas-empleado.component.ts
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, combineLatest, map } from 'rxjs';
import { Tarea, EstadoTarea } from '../tareas-empleado/tareas.service';
import { TareasService } from '../tareas-empleado/tareas.service';

@Component({
  selector: 'app-tareas-empleado',
  templateUrl: './tareas-empleado.component.html',
  styleUrls: ['./tareas-empleado.component.css']
})
export class TareasEmpleadoComponent implements OnInit, OnDestroy {
  fecha = new Date();
  tareasHoy: Tarea[] = [];
  pendientes: Tarea[] = [];
  enProceso: Tarea[] = [];
  completadas: Tarea[] = [];
  finalizadas: Tarea[] = [];
  displayedColumns = ['empleado','titulo','descripcion','prioridad','estado','acciones'];
  sub?: Subscription;
  private empleadoId?: number;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private tareasSrv: TareasService
  ) {}

  ngOnInit(): void {
    this.sub = combineLatest([
      this.route.queryParamMap.pipe(map(pm => pm.get('fecha') ?? this.toYmd(new Date()))),
      this.route.queryParamMap.pipe(map(pm => pm.get('asignadoA')))
    ]).subscribe(([fecha, asignadoA]) => {
      this.empleadoId = asignadoA ? Number(asignadoA) : undefined;
      this.fecha = this.parseYmd(fecha);
      this.tareasSrv.listarDelDia(fecha, this.empleadoId).subscribe();
    });

    this.sub?.add(this.tareasSrv.tareas$.subscribe((ts: Tarea[]) => {
      const ymd = this.toYmd(this.fecha);
      this.tareasHoy = (ts || []).filter(t => (t.fecha ?? '').startsWith(ymd));
      this.partirEnColumnas();
    }));
  }

  ngOnDestroy(): void { this.sub?.unsubscribe(); }

  private partirEnColumnas() {
    this.pendientes  = this.tareasHoy.filter(t => t.estado === 'PENDIENTE');
    this.enProceso   = this.tareasHoy.filter(t => t.estado === 'EN_PROCESO');
    this.completadas = this.tareasHoy.filter(t => t.estado === 'COMPLETADA');
    this.finalizadas = this.tareasHoy.filter(t => t.estado === 'FINALIZADA');
  }

  cambiarEstado(t: Tarea, nuevo: EstadoTarea) {
    if (t.estado === nuevo) return;
    this.tareasSrv.actualizarEstado(Number(t.id), nuevo).subscribe({
      next: _ => this.tareasSrv.listarDelDia(this.toYmd(this.fecha), this.empleadoId).subscribe()
    });
  }

  marcarCompletada(t: Tarea) { this.cambiarEstado(t, 'COMPLETADA'); }

  onDate(date: Date | null) { this.navigateWithDate(this.toYmd(date ?? new Date())); }
  anterior() { const d = new Date(this.fecha); d.setDate(d.getDate()-1); this.navigateWithDate(this.toYmd(d)); }
  siguiente() { const d = new Date(this.fecha); d.setDate(d.getDate()+1); this.navigateWithDate(this.toYmd(d)); }
  hoy() { this.navigateWithDate(this.toYmd(new Date())); }

  private navigateWithDate(ymd: string) {
    this.router.navigate([], { relativeTo: this.route, queryParams: { fecha: ymd, asignadoA: this.empleadoId }, queryParamsHandling: 'merge' });
  }
  private toYmd(d: Date) { const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,'0'); const dd=String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${dd}`; }
  private parseYmd(s: string) { const [y,m,d]=s.split('-').map(Number); return new Date(y,(m??1)-1,d??1); }

  finalizar(t: Tarea) {
  if (!confirm(`¿Eliminar definitivamente la tarea "${t.titulo}"?`)) return;
  this.tareasSrv.finalizar(Number(t.id)).subscribe({
    next: _ => this.tareasSrv.listarDelDia(this.toYmd(this.fecha), this.empleadoId).subscribe(),
    error: e => console.error('[finalizar] error', e)
  });
  }

  finalizarEstado(t: Tarea) { this.cambiarEstado(t, 'FINALIZADA'); }

eliminarDef(t: Tarea) {
  if (!confirm(`¿Eliminar definitivamente "${t.titulo}"?`)) return;
  this.tareasSrv.finalizar(Number(t.id)).subscribe({
    next: () => this.tareasSrv.listarDelDia(this.toYmd(this.fecha), this.empleadoId).subscribe(),
    error: e => console.error('[eliminarDef] error', e)
  });
}
}
