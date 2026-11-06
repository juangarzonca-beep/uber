export const STATUS: Record<string, string> = {
  requested: 'Buscando conductor',
  assigned: 'Conductor asignado',
  driver_arrived: 'El conductor llegó',
  in_progress: 'En viaje',
  completed: 'Completado',
  cancelled: 'Cancelado',
};

export const list = (x: any): any[] => (Array.isArray(x) ? x : (x?.data ?? []));
