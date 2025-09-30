import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  ClientesService,
  Cliente,
  Departamento,
  Municipio,
} from '../../../../clientes.service';
import { of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-clientes-form',
  templateUrl: './clientes-form.component.html',
  styleUrls: ['./clientes-form.component.css'],
})
export class ClientesFormComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  private id?: number;
  loading = false;

  departamentos: Departamento[] = [];
  municipios: Municipio[] = [];

  // Para mat-select (evita que no muestre el nombre por mismatch string/number)
  compareById = (a: string | number | null, b: string | number | null) =>
    a != null && b != null ? Number(a) === Number(b) : a === b;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private api: ClientesService,
    private snack: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      primer_nombre: ['', Validators.required],
      segundo_nombre: [''],
      primer_apellido: ['', Validators.required],
      segundo_apellido: [''],
      correo: ['', [Validators.required, Validators.email]],
      Telefono: ['', Validators.required],
      direccion: [''],
      zona: [null],
      colonia: [''],

      // nuevos (catálogos)
      id_departamento: [null, Validators.required],
      id_municipio: [{ value: null, disabled: true }, Validators.required],

      id_estado: [2, Validators.required],
    });

    // 1) cargar departamentos
    this.api.departamentosListar().subscribe((deps) => (this.departamentos = deps));

    // 2) cuando cambie el departamento => cargar municipios
    this.form.get('id_departamento')!.valueChanges.subscribe((depId: number | string | null) => {
      this.form.get('id_municipio')!.reset();
      this.form.get('id_municipio')!.disable();
      this.municipios = [];
      if (depId == null) return;

      this.api
        .municipiosPorDepartamento(Number(depId))
        .subscribe((ms) => {
          this.municipios = ms;
          this.form.get('id_municipio')!.enable();
        });
    });

    // 3) modo edición
    this.route.paramMap
      .pipe(
        switchMap((p) => {
          const idStr = p.get('id');
          if (!idStr) return of(null);
          this.isEdit = true;
          this.id = +idStr;
          return this.api.obtener(this.id);
        })
      )
      .subscribe((cli) => {
        if (!cli) return;

        // patch básico
        this.form.patchValue({
          primer_nombre: cli.primer_nombre,
          segundo_nombre: cli.segundo_nombre,
          primer_apellido: cli.primer_apellido,
          segundo_apellido: cli.segundo_apellido,
          correo: cli.correo,
          Telefono: cli.Telefono,
          direccion: cli.direccion,
          zona: cli.zona,
          colonia: cli.colonia,
          id_estado: cli.id_estado ?? 2,
        });

        // si viene id_municipio, resolvemos su depto y poblamos selects
        if (cli.id_municipio) {
          this.api.municipioById(Number(cli.id_municipio)).subscribe((m) => {
            // set depto primero (dispara valueChanges y carga municipios)
            this.form.patchValue({ id_departamento: Number(m.id_departamento) });

            // una vez cargados los municipios, seteamos el municipio
            this.api
              .municipiosPorDepartamento(Number(m.id_departamento))
              .subscribe((ms) => {
                this.municipios = ms;
                this.form.get('id_municipio')!.enable();
                this.form.patchValue({ id_municipio: Number(cli.id_municipio) });
              });
          });
        }
      });
  }

  guardar(): void {
    if (this.form.invalid || this.loading) return;
    this.loading = true;

    // getRawValue para obtener id_municipio aunque el control se haya deshabilitado en algún momento
    const body: Partial<Cliente> = { ...this.form.getRawValue() };

    const req$ =
      this.isEdit && this.id
        ? this.api.actualizar(this.id, body)
        : this.api.crear(body);

    req$.subscribe({
      next: () => {
        this.snack.open(
          this.isEdit ? 'Cliente actualizado' : 'Cliente creado',
          'OK',
          { duration: 1500, panelClass: 'success-snackbar' }
        );
        this.router.navigate(['/clientes']);
      },
      error: () => {
        this.loading = false;
        this.snack.open('No se pudo guardar', 'Cerrar', {
          panelClass: 'error-snackbar',
        });
      },
    });
  }

  cancelar(): void {
    this.router.navigate(['/clientes']);
  }
}


// import { Component, OnInit } from '@angular/core';
// import { FormBuilder, Validators, FormGroup } from '@angular/forms';
// import { ActivatedRoute, Router } from '@angular/router';
// import { MatSnackBar } from '@angular/material/snack-bar';
// import { ClientesService, Cliente } from '../../../../clientes.service';
// import { switchMap } from 'rxjs/operators';
// import { of } from 'rxjs';

// @Component({
//   selector: 'app-clientes-form',
//   templateUrl: './clientes-form.component.html',
//   styleUrls: ['./clientes-form.component.scss'],
// })
// export class ClientesFormComponent implements OnInit {
//   form!: FormGroup;
//   isEdit = false;
//   private id?: number;
//   loading = false;

//   constructor(
//     private fb: FormBuilder,
//     private route: ActivatedRoute,
//     private router: Router,
//     private api: ClientesService,
//     private snack: MatSnackBar,
//   ) {}

//   ngOnInit(): void {
//     this.form = this.fb.group({
//       primer_nombre: ['', Validators.required],
//       segundo_nombre: [''],
//       primer_apellido: ['', Validators.required],
//       segundo_apellido: [''],
//       correo: ['', [Validators.required, Validators.email]],
//       Telefono: ['', Validators.required],
//       direccion: [''],
//       zona: [null],
//       colonia: [''],
//       id_estado: [2, Validators.required],  // Activo por defecto
//       id_municipio: [null],
//     });

//     // Detecta si hay :id y, si lo hay, carga y setea modo edición
//     this.route.paramMap
//       .pipe(
//         switchMap(params => {
//           const idParam = params.get('id');
//           if (!idParam) return of(null);
//           this.isEdit = true;
//           this.id = +idParam;
//           return this.api.obtener(this.id);
//         })
//       )
//       .subscribe((cli: Cliente | null) => {
//         if (cli) this.form.patchValue(cli);
//       });
//   }

//   guardar(): void {
//     if (this.form.invalid || this.loading) return;
//     this.loading = true;

//     const body: Partial<Cliente> = {
//       ...this.form.value,
//     };

//     const req$ = this.isEdit && this.id
//       ? this.api.actualizar(this.id, body)     // ← EDITA
//       : this.api.crear(body);                  // ← CREA

//     req$.subscribe({
//       next: () => {
//         this.snack.open(this.isEdit ? 'Cliente actualizado' : 'Cliente creado', 'OK', { duration: 1500, panelClass: 'success-snackbar' });
//         this.router.navigate(['/clientes']);
//       },
//       error: () => {
//         this.loading = false;
//         this.snack.open('No se pudo guardar', 'Cerrar', { panelClass: 'error-snackbar' });
//       }
//     });
//   }

//   cancelar(): void {
//     this.router.navigate(['/clientes']);
//   }
// }


