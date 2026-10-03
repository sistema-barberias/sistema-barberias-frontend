export class Cliente {
  constructor(idCliente, nombre, correo, telefono, estado = 'Activo') {
    this.idCliente = idString(idCliente) || correo; // Usa el correo o un ID
    this.nombre = nombre;
    this.correo = correo;
    this.telefono = telefono;
    this.estado = estado; // Atributo solicitado por el profesor para el Sprint 1
  }
}

// Función auxiliar para generar un ID si no viene uno
function idString(id) {
  return id ? id.toString() : Math.random().toString(36).substr(2, 9);
}