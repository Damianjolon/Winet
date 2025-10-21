import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs';
import { ClientesApi, Cliente, RecibosApi, ReciboHeader, ServiciosApi, Servicio } from './recibos/recibos.api';

@Component({
  selector: 'app-recibos-nuevo',
  templateUrl: './recibos/recibos.component.html',
  styleUrls: ['./recibos/recibos.component.scss']
})
export class RecibosNuevoComponent implements OnInit, OnDestroy {
  form: FormGroup;

  // Autocomplete Cliente
  clienteInput = '';
  clienteId: number | null = null;
  clientesSug: Cliente[] = [];
  showSug = false;
  private buscarCliente$ = new Subject<string>();
  private destroy$ = new Subject<void>();

  // Servicios
  allServicios: Servicio[] = [];
  servicios: Servicio[] = [];
  serviciosLoading = false;

  // Items
  items: Array<{
    servicio_id: number; descripcion: string;
    precio_unitario: number; cantidad: number;
    descuento_pct: number; impuesto_pct: number;
  }> = [];

  // Estado
  guardando = false;
  creado?: ReciboHeader;

  // Totales
  subtotal = 0;
  descuento_total = 0;
  impuesto_total = 0;
  total = 0;

  // Modal de previsualización si decides usar modal (no obligatorio aquí)
  showPreview = false;

  constructor(
    private fb: FormBuilder,
    private cliApi: ClientesApi,
    public  recApi: RecibosApi,
    private servApi: ServiciosApi
  ) {
    this.form = this.fb.group({
      numero: [null, Validators.required],
      fecha: [new Date().toISOString().slice(0, 10), Validators.required],
      notas: [''],
      buscarServicio: ['']
    });
  }

  ngOnInit(): void {
    // Cargar servicios
    this.serviciosLoading = true;
    this.servApi.buscar().subscribe(serv => {
      this.allServicios = serv;
      this.servicios = [...this.allServicios];
      this.serviciosLoading = false;
    });

    // Siguiente número
    this.recApi.siguienteNumero().subscribe(res => {
      this.form.patchValue({ numero: res.next });
    });

    // Filtro de catálogo
    this.form.get('buscarServicio')!.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(q => {
      const query = String(q || '').toLowerCase();
      this.servicios = query
        ? this.allServicios.filter(s =>
            s.nombre.toLowerCase().includes(query) || s.codigo.toLowerCase().includes(query))
        : [...this.allServicios];
    });

    // Buscar clientes (autocomplete)
    this.buscarCliente$.pipe(
      debounceTime(250),
      distinctUntilChanged(),
      switchMap(q => this.cliApi.buscar(q)),
      takeUntil(this.destroy$)
    ).subscribe(list => {
      this.clientesSug = list || [];
      this.showSug = this.clientesSug.length > 0;
      // Autoselección si hay un único resultado
      if (!this.clienteId && this.clientesSug.length === 1 && (this.clienteInput.trim().length >= 3)) {
        this.seleccionarCliente(this.clientesSug[0]);
      }
    });
  }

  // Input del cliente
  onClienteInput(v: string) {
    this.clienteInput = v || '';
    this.clienteId = null; // invalida selección si se sigue escribiendo
    this.buscarCliente$.next(this.clienteInput);
  }

  seleccionarCliente(c: Cliente) {
    this.clienteId = c.id;
    this.clienteInput = c.nombre;
    this.showSug = false;
  }

  hideSugLater() { setTimeout(() => this.showSug = false, 150); }
  trackById = (_: number, it: Cliente) => it.id;

  // Drag & Drop
  allowDrop(event: DragEvent){ event.preventDefault(); }
  drop(event: DragEvent){
    event.preventDefault();
    const id = event.dataTransfer?.getData('text');
    const s = this.servicios.find(x => String(x.id) === String(id));
    if (s) this.addServicio(s);
  }
  dragStart(event: DragEvent, s: Servicio){ event.dataTransfer?.setData('text', String(s.id)); }

  addServicio(s: Servicio){
    const ex = this.items.find(it => it.servicio_id === s.id);
    if (ex) ex.cantidad++;
    else this.items.push({
      servicio_id: s.id,
      descripcion: s.nombre,
      precio_unitario: s.precio_unitario,
      cantidad: 1,
      descuento_pct: 0,
      impuesto_pct: s.impuesto_pct || 0
    });
    this.recalcular();
  }

  changeCantidad(i:number, d:number){
    this.items[i].cantidad = Math.max(0, this.items[i].cantidad + d);
    if (this.items[i].cantidad === 0) this.remove(i);
    else this.recalcular();
  }

  remove(i:number){ this.items.splice(i,1); this.recalcular(); }

  recalcular(){
    this.subtotal = this.items.reduce((s, it) => s + (it.precio_unitario * it.cantidad), 0);
    this.descuento_total = this.items.reduce((s, it) => s + (it.precio_unitario * it.cantidad * it.descuento_pct / 100), 0);
    this.impuesto_total = this.items.reduce((s, it) => {
      const base = it.precio_unitario * it.cantidad;
      const desc = base * it.descuento_pct / 100;
      return s + ((base - desc) * it.impuesto_pct / 100);
    }, 0);
    this.total = this.subtotal - this.descuento_total + this.impuesto_total;
  }

  lineaTotal(it:{precio_unitario:number; cantidad:number; descuento_pct:number; impuesto_pct:number;}){
    const base = it.precio_unitario * it.cantidad;
    const desc = base * it.descuento_pct / 100;
    const imp  = (base - desc) * it.impuesto_pct / 100;
    return base - desc + imp;
  }

  // Previsualizar (usa endpoint del backend)
  openPreview(){
    if (!this.creado) return;
    window.open(this.recApi.previewUrl(this.creado.id), '_blank');
  }

  openWhatsApp(){ /* opcional */ }

  submit(){
    if (this.form.invalid || this.items.length === 0) return;

    // Si no seleccionó de la lista pero hay coincidencia exacta, úsala
    if (!this.clienteId && this.clientesSug.length){
      const exact = this.clientesSug.find(c => c.nombre.toLowerCase() === this.clienteInput.toLowerCase());
      if (exact) this.clienteId = exact.id;
    }
    if (!this.clienteId){ alert('Selecciona un cliente de la lista'); return; }

    this.guardando = true;
    const payload = {
      id_cliente: this.clienteId!,
      numero: this.form.value.numero,
      notas: this.form.value.notas,
      items: this.items.map(it => ({
        servicio_id: it.servicio_id,
        descripcion: it.descripcion,
        cantidad: it.cantidad,
        precio_unitario: it.precio_unitario,
        descuento_pct: it.descuento_pct,
        impuesto_pct: it.impuesto_pct
      }))
    };

    this.recApi.crear(payload).subscribe({
      next: (res) => { this.creado = res; this.guardando = false; },
      error: () => { alert('Error al guardar'); this.guardando = false; }
    });
  }

  ngOnDestroy(){ this.destroy$.next(); this.destroy$.complete(); }
}
