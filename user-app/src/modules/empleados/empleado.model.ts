// ====== TIPOS BASE ======
export type Prioridad = 'BAJA' | 'MEDIA' | 'ALTA';
export type EstadoTarea = 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADA' | 'CANCELADA';

export interface Tarea {
  id: number | string;
  titulo: string;
  descripcion?: string;
  prioridad: Prioridad;
  // fecha de vencimiento / ejecución (lo usamos para "del día")
  fecha: string;               // ISO (ej: '2025-09-20T00:00:00.000Z')
  estado: EstadoTarea;
  asignadoA: number;           // employeeId
  asignadoANombre?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Empleado {
  id: number;
  primer_nombre: string;
  segundo_nombre?: string;
  primer_apellido: string;
  segundo_apellido?: string;
  email?: string;
  puesto?: string;
  estado: 'ACTIVO' | 'INACTIVO';
  // atajo útil en frontend
  get activo(): boolean;
}
