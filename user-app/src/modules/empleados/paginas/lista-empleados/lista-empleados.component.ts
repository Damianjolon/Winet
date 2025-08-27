import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { EmpleadosService } from '../../empleados.service';
import { Empleado } from '../../modelos';

@Component({
  selector: 'app-lista-empleados',
  templateUrl: './lista-empleados.component.html',
  styleUrls: ['./lista-empleados.component.css']
})
export class ListaEmpleadosComponent implements OnInit {
  data: Empleado[] = [];
  buscar = '';
  cargando = true;

  estadoSeleccionado: 'TODOS' | 'ACTIVO' | 'INACTIVO' = 'TODOS';

  constructor(private api: EmpleadosService, private router: Router) {}

  ngOnInit() {
    this.api.listar().subscribe(res => {
      this.data = res;
      this.cargando = false;
    });
  }

 filtrar(): Empleado[] {
  const term = this.buscar.toLowerCase();
  return this.data.filter(e => {
    const matchText = (
      `${e.primer_nombre} ${e.segundo_nombre ?? ''} ${e.primer_apellido} ${e.segundo_apellido ?? ''} ${e.email} ${e.puesto}`
    ).toLowerCase().includes(term);

    // Normalizar estado antes de comparar
    const estadoNum = typeof e.estado === 'string' ? parseInt(e.estado, 10) : e.estado;
    const estadoTexto = estadoNum === 1 ? 'ACTIVO' :
                        estadoNum === 2 ? 'INACTIVO' :
                        e.estado;

    const matchEstado =
      this.estadoSeleccionado === 'TODOS'
        ? true
        : estadoTexto === this.estadoSeleccionado;

    return matchText && matchEstado;
  });
}


  crear() { this.router.navigate(['/empleados/nuevo']); }
  editar(e:Empleado) { this.router.navigate(['/empleados/editar', e.id]); }
  verTareas(e:Empleado) { this.router.navigate(['/empleados/tareas/asignar', e.id]); }
}
