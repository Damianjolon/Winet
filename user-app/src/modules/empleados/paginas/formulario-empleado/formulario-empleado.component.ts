import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

import { EmpleadosService, EmpleadoCreate, Municipio } from '../../empleados.service';

interface Departamento { id: number; nombre: string; }

@Component({
  selector: 'app-formulario-empleado',
  templateUrl: './formulario-empleado.component.html',
  styleUrls: ['./formulario-empleado.component.css']
})
export class FormEmpleadoComponent implements OnInit {

  titulo = 'Nuevo empleado';
  form!: FormGroup;

  // Catálogos y estados de carga
  departamentos: Departamento[] = [];
  municipios: Municipio[] = [];
  cargando = false;
  cargandoMuni = false;

  id?: number;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private api: EmpleadosService,
    private snack: MatSnackBar
  ) {}

  /** Evita usar form?.get('id') en el template (corrige NG8107) */
  get isEdit(): boolean {
    return !!this.form?.get('id')?.value;
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      id: [],
      primer_nombre: ['', Validators.required],
      segundo_nombre: [''],
      primer_apellido: ['', Validators.required],
      segundo_apellido: [''],
      DPI: ['', Validators.required],
      puesto: ['', Validators.required],
      salario: [null, [Validators.required, Validators.min(0)]],
      fecha_ingreso: [this.hoyISO(), Validators.required],
      telefono: [''],
      direccion: [''],
      zona: [''],
      colonia: [''],
      ubicacion: [''],

      // NUEVOS: dependencia Departamento -> Municipio
      id_departamento: [null, Validators.required],
      id_municipio: [null, Validators.required],

      id_estado: ['ACTIVO'] // oculto en el HTML; por defecto ACTIVO
    });

    // 1) Cargar Departamentos
    this.cargarDepartamentos();

    // 2) Cuando cambia Departamento, cargar Municipios
    this.form.get('id_departamento')?.valueChanges.subscribe((depId: number | null) => {
      this.form.patchValue({ id_municipio: null }, { emitEvent: false });
      this.municipios = [];
      if (depId) this.cargarMunicipios(depId);
    });

    // 3) Modo edición (si hay :id en ruta)
    const rawId = this.route.snapshot.paramMap.get('id');
    if (rawId) {
      this.id = +rawId;
      this.titulo = 'Editar empleado';

      this.api.obtener(this.id).subscribe((e: any) => {
        const depId = e.id_departamento ?? e.departamento?.id ?? null;

        this.form.patchValue({
          id: e.id,
          primer_nombre: e.primer_nombre,
          segundo_nombre: e.segundo_nombre,
          primer_apellido: e.primer_apellido,
          segundo_apellido: e.segundo_apellido,
          DPI: e.DPI,
          puesto: e.puesto,
          salario: e.salario,
          fecha_ingreso: this.aISO(e.fecha_ingreso),
          telefono: e.telefono,
          direccion: e.direccion,
          zona: e.zona,
          colonia: e.colonia,
          ubicacion: e.ubicacion,
          id_departamento: depId,
          id_municipio: null,                 // se setea tras cargar lista
          id_estado: e.id_estado ?? 'ACTIVO'
        });

        if (depId) {
          this.cargarMunicipios(depId, e.id_municipio ?? e.municipio?.id);
        }
      });
    }
  }

  /** Carga cat. Departamentos (usa el mismo endpoint que Clientes) */
  private cargarDepartamentos(): void {
    const svc: any = this.api as any;
    if (typeof svc.listarDepartamentos === 'function') {
      svc.listarDepartamentos().subscribe({
        next: (rows: any[]) => {
          this.departamentos = (rows || []).map(r => ({
            id: r.id ?? r.ID ?? r.id_departamento ?? r.ID_DEPARTAMENTO,
            nombre: r.nombre ?? r.NOMBRE
          }));
        },
        error: () => this.snack.open('No se pudieron cargar los departamentos', 'Cerrar', { duration: 3000 })
      });
    } else {
      // Fallback: si no tienes listarDepartamentos en el service
      this.snack.open('Endpoint de departamentos no disponible en EmpleadosService', 'Cerrar', { duration: 3000 });
    }
  }

  /** Carga Municipios por Departamento. Si no existe el endpoint filtrado, usa listarMunicipios() y filtra. */
  private cargarMunicipios(depId: number, preselectId?: number): void {
    this.cargandoMuni = true;
    this.form.get('id_municipio')?.disable({ emitEvent: false });

    const svc: any = this.api as any;
    const obs = (typeof svc.listarMunicipiosPorDepartamento === 'function')
      ? svc.listarMunicipiosPorDepartamento(depId)
      : this.api.listarMunicipios();

    obs.subscribe({
      next: (list: Municipio[] | any[]) => {
        const data = (list || []) as any[];

        // Si vino la lista general, intentamos filtrar por id_departamento si existe
        const filtered = (typeof svc.listarMunicipiosPorDepartamento === 'function')
          ? data
          : data.filter(r => {
              const rid = r.id_departamento ?? r.ID_DEPARTAMENTO ?? r.departamento?.id;
              return Number(rid) === Number(depId);
            });

        this.municipios = filtered.map(r => ({
          id: r.id ?? r.ID ?? r.id_municipio ?? r.ID_MUNICIPIO,
          nombre: r.nombre ?? r.NOMBRE,
          id_departamento: r.id_departamento ?? r.ID_DEPARTAMENTO ?? depId
        })) as Municipio[];

        this.form.get('id_municipio')?.enable({ emitEvent: false });

        if (preselectId) {
          const existe = this.municipios.some(m => Number(m.id) === Number(preselectId));
          this.form.patchValue({ id_municipio: existe ? preselectId : null }, { emitEvent: false });
        }
      },
      error: () => {
        this.snack.open('No se pudieron cargar los municipios', 'Cerrar', { duration: 3000 });
        this.form.get('id_municipio')?.enable({ emitEvent: false });
      },
      complete: () => this.cargandoMuni = false
    });
  }

  /** yyyy-MM-dd ajustado por timezone para <input type="date"> */
  private hoyISO(): string {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
  }

  /** Normaliza cualquier fecha a yyyy-MM-dd (o hoy si es falsy) */
  private aISO(value: any): string {
    if (!value) return this.hoyISO();
    const d = new Date(value);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.value;
    const payload: EmpleadoCreate = {
      id: v.id ?? undefined,
      primer_nombre: v.primer_nombre!,
      segundo_nombre: v.segundo_nombre || undefined,
      primer_apellido: v.primer_apellido!,
      segundo_apellido: v.segundo_apellido || undefined,
      DPI: v.DPI!,
      puesto: v.puesto!,
      salario: Number(v.salario),
      fecha_ingreso: v.fecha_ingreso!, // yyyy-MM-dd
      telefono: v.telefono || undefined,
      direccion: v.direccion || undefined,
      zona: v.zona || undefined,
      colonia: v.colonia || undefined,
      ubicacion: v.ubicacion || undefined,
      id_municipio: Number(v.id_municipio),
      // Envíalo si tu API lo requiere:
      // id_departamento: Number(v.id_departamento),
      id_estado: v.id_estado || 'ACTIVO'
    };

    this.cargando = true;

    const req$ = this.id
      ? this.api.actualizar(this.id, payload)
      : this.api.crear(payload);

    req$.subscribe({
      next: () => {
        this.snack.open('Empleado guardado', 'OK', { duration: 2000, panelClass: 'success-snackbar' });
        this.router.navigate(['/empleados']);
      },
      error: () => {
        this.snack.open('Error al guardar', 'Cerrar', { duration: 3500, panelClass: 'error-snackbar' });
      },
      complete: () => this.cargando = false
    });
  }

  cancelar(): void {
    this.router.navigate(['/empleados']);
  }
}
