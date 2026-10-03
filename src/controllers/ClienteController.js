import { ClienteDAO } from '../dao/ClienteDAO.js';
import { Cliente } from '../models/Cliente.js';

export class ClienteController {
  constructor() {
    this.clienteDAO = new ClienteDAO();
  }

  // 1.1 crearCliente()
  crearCliente(datos) {
    if (!datos.nombre || !datos.correo || !datos.password) {
      return "Error: Todos los campos son obligatorios";
    }
    
    // Validar duplicados utilizando el método buscarCliente del DAO
    const existe = this.clienteDAO.buscarCliente(datos.correo);
    if (existe.length > 0 && existe.some(c => c.correo === datos.correo)) {
      return "Error: Este correo electrónico ya está registrado";
    }

    const nuevoCliente = new Cliente(null, datos.nombre, datos.correo, datos.telefono, 'Activo');
    nuevoCliente.password = datos.password; 

    return this.clienteDAO.crearCliente(nuevoCliente);
  }

  // 1.1 buscarCliente()
  buscarCliente(criterio) {
    return this.clienteDAO.buscarCliente(criterio);
  }

  // 1.1 actualizarCliente() (Sirve tanto para editar datos como para cambiar el Estado)
  actualizarCliente(datos) {
    if (!datos.nombre || !datos.correo) {
      return "Error: El nombre y el correo no pueden estar vacíos";
    }
    
    const clienteModificado = new Cliente(datos.idCliente, datos.nombre, datos.correo, datos.telefono, datos.estado);
    if (datos.password) clienteModificado.password = datos.password;

    return this.clienteDAO.actualizarCliente(clienteModificado);
  }
}