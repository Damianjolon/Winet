export interface Usuario {
  id: number;
  nombre_completo: string;
  usuario: string;
  rol: string;
  estado: number | string;

  // 👇 que sean números (IDs)
  modulos: number[];
  permisos: number[];
  id_rol: number;

  primer_nombre: string;
  segundo_nombre?: string;
  primer_apellido: string;
  segundo_apellido?: string;
}

export interface Modulo {
  id: number;
  nombre: string;
}
