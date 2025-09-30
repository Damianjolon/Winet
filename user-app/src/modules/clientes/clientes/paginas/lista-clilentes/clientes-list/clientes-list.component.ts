import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormControl } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ClientesService, Cliente } from '../../../../clientes.service';

type ClienteView = Cliente & {
  nombre_completo?: string;
  municipio_nombre?: string;
  created_at_dt?: Date | null;   // ← fecha normalizada desde created_at
};

@Component({
  selector: 'app-clientes-list',
  templateUrl: './clientes-list.component.html',
  styleUrls: ['./clientes-list.component.css'],
})
export class ClientesListComponent implements OnInit {
  displayedColumns = ['id','nombre_completo','direccion','Telefono','correo','fecha_creacion','acciones'];

  clientes: ClienteView[] = [];
  buscarCtrl = new FormControl<string>('');
  private municipios = new Map<number, string>();

  constructor(
    private api: ClientesService,
    private snack: MatSnackBar,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.api.municipiosBuscar('').subscribe(arr => arr.forEach(m => this.municipios.set(m.id, m.nombre)));
    this.cargar();
  }

  private normalizeDate(val: unknown): Date | null {
    if (!val) return null;
    if (val instanceof Date) return val;
    const s = String(val).trim();
    const isoish = s.includes('T') ? s : s.replace(' ', 'T'); // 'YYYY-MM-DD HH:mm:ss' → 'YYYY-MM-DDTHH:mm:ss'
    const d = new Date(isoish);
    return isNaN(d.getTime()) ? null : d;
  }

  private cargar(): void {
    this.api.listar().subscribe({
      next: (rows) => {
        this.clientes = rows.map((c): ClienteView => ({
          ...c,
          nombre_completo:
            c.nombre_completo ??
            [c.primer_nombre, c.segundo_nombre, c.primer_apellido, c.segundo_apellido]
              .filter(Boolean)
              .join(' '),
          municipio_nombre:
            c.municipio_nombre ??
            (c.id_municipio ? (this.municipios.get(c.id_municipio) || '') : ''),
          // ← Tomamos SIEMPRE created_at
          created_at_dt: this.normalizeDate((c as any).created_at ?? (c as any).CREATED_AT ?? null),
        }));
      },
      error: () =>
        this.snack.open('Error al listar clientes', 'Cerrar', { panelClass: 'error-snackbar' }),
    });
  }

  get filtrados(): ClienteView[] {
    const q = (this.buscarCtrl.value || '').toLowerCase().trim();
    if (!q) return this.clientes;
    return this.clientes.filter(c =>
      (c.nombre_completo || '').toLowerCase().includes(q) ||
      (c.correo || '').toLowerCase().includes(q) ||
      (c.Telefono || '').toLowerCase().includes(q) ||
      (c.direccion || '').toLowerCase().includes(q) ||
      (c.municipio_nombre || '').toLowerCase().includes(q)
    );
  }

  editar(c: ClienteView) {
    this.router.navigate([c.id, 'edit'], { relativeTo: this.activatedRoute });
  }

  eliminar(id: number) {
    if (!confirm('¿Eliminar cliente?')) return;
    this.api.eliminar(id).subscribe({
      next: () => {
        this.snack.open('Cliente eliminado', 'OK', { duration: 1500, panelClass: 'success-snackbar' });
        this.cargar();
      },
      error: () => this.snack.open('No se pudo eliminar', 'Cerrar', { panelClass: 'error-snackbar' }),
    });
  }

  async exportarExcel() {
    const { utils, writeFile } = await import('xlsx');
    const data = this.filtrados.map(c => ({
      ID: c.id,
      'Nombre Completo': c.nombre_completo,
      Dirección: c.direccion ?? '',
      Teléfono: c.Telefono ?? '',
      Correo: c.correo ?? '',
      Municipio: c.municipio_nombre ?? '',
      // Usa created_at normalizada (con fecha y hora)
      'Fecha creación': c.created_at_dt
        ? new Date(c.created_at_dt).toISOString().slice(0,19).replace('T',' ')
        : ((c as any).created_at ?? '').toString().replace('T',' ').slice(0,19),
    }));
    const wb = utils.book_new();
    const ws = utils.json_to_sheet(data);
    utils.book_append_sheet(wb, ws, 'Clientes');
    writeFile(wb, `clientes_${new Date().toISOString().slice(0,10)}.xlsx`);
  }
}
