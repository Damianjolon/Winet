// src/app/pages/empleados/asignar-tarea/asignar-tarea.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EmpleadosService } from '../../empleados.service';
import { filter, map, switchMap, tap } from 'rxjs/operators';
import { TareasService, Prioridad } from '../tareas-empleado/tareas.service';

type EstadoEmpleado = 'ACTIVO' | 'INACTIVO';
interface Empleado {
  id: number;
  primer_nombre?: string; segundo_nombre?: string;
  primer_apellido?: string; segundo_apellido?: string;
  estado?: EstadoEmpleado;
}

@Component({
  selector: 'app-asignar-tarea',
  templateUrl: './asignar-tarea.component.html',
  styleUrls: ['./asignar-tarea.component.css']
})
export class AsignarTareaComponent implements OnInit {
prioridadLabel(arg0: string|null|undefined) {
throw new Error('Method not implemented.');
}
compareSimple: ((o1: any, o2: any) => boolean) | undefined;
cancelar() {
throw new Error('Method not implemented.');
}
  empleado?: Empleado;
  bloqueado = false;

  commonTitles = [
    'Revisar documentos',
    'Llamar cliente',
    'Actualizar base de datos',
    'Preparar reporte',
    'Reunión de equipo',
    'Capacitación',
    'Mantenimiento sistema'
  ];

  form = this.fb.group({
    titulo: ['', Validators.required],
    descripcion: [''],
    prioridad: ['MEDIA' as Prioridad, Validators.required],
    fecha: [new Date(), Validators.required]
  });

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private empleados: EmpleadosService,
    private tareasSrv: TareasService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.pipe(
      map(pm => Number(pm.get('id') ?? 0)),
      filter(id => !!id),
      switchMap(id => this.empleados.obtenerPorId(id)),
      tap(emp => {
        this.empleado = emp as Empleado;
        this.bloqueado = (emp?.estado === 'INACTIVO');
      })
    ).subscribe({
      error: err => {
        console.error('[AsignarTarea] error al cargar empleado', err);
        this.empleado = undefined;
        this.bloqueado = true;
      }
    });
  }

  // Tu HTML lo usa, lo dejo igual.
  get nombreCompleto(): string {
    if (!this.empleado) return '';
    const { primer_nombre, segundo_nombre, primer_apellido, segundo_apellido } = this.empleado as any;
    return [primer_nombre, segundo_nombre, primer_apellido, segundo_apellido].filter(Boolean).join(' ');
  }

  comparePrioridad(o1: string, o2: string): boolean {
    return o1 === o2;
  }

  private toYmd(d: Date) {
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const dd = d.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${dd}`;
  }

  asignar(): void {
    if (this.form.invalid || !this.empleado) return;
    if (this.bloqueado) return;

    const ymd = this.toYmd(this.form.value.fecha as Date);

    const payload = {
      titulo: this.form.value.titulo!,
      descripcion: this.form.value.descripcion ?? '',
      prioridad: this.form.value.prioridad!,
      fecha: ymd, // YYYY-MM-DD para columna DATE
      asignadoA: this.empleado.id,
      asignadoANombre: this.nombreCompleto,
      estado: 'PENDIENTE' as const
    };

    this.tareasSrv.crear(payload).subscribe({
      next: _t => {
        this.router.navigate(['/empleados/tareas'], {
          queryParams: { fecha: ymd, asignadoA: this.empleado!.id }
        });
      },
      error: e => {
        console.error('[AsignarTarea] Error creando tarea:', e, 'payload:', payload);
        alert(`No se pudo crear la tarea: ${e?.status ?? ''} ${e?.statusText ?? ''}`);
      }
    });
  }

  verAsignaciones(): void {
    if (!this.empleado) return;
    const d = this.form.value.fecha as Date;
    const ymd = this.toYmd(d || new Date());
    this.router.navigate(['/empleados/tareas'], {
      queryParams: { fecha: ymd, asignadoA: this.empleado.id }
    });
  }
}
