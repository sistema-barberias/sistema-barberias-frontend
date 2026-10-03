import { Cliente } from '../models/Cliente.js';

export class ClienteDAO {
  constructor() {
    this.dbKey = 'barberia_clientes';
    // Datos iniciales de prueba por si la base de datos está vacía
    if (!localStorage.getItem(this.dbKey)) {
      const datosIniciales = [
        new Cliente('1', 'Carlos Gómez', 'carlos@gmail.com', '3157778899', 'Activo'),
        new Cliente('2', 'Luisa Zapata', 'luisa@gmail.com', '3102223344', 'Inactivo')
      ];
      // Para las pruebas, les dejamos una contraseña por defecto
      datosIniciales[0].password = '123';
      datosIniciales[1].password = '123';
      localStorage.setItem(this.dbKey, JSON.stringify(datosIniciales));
    }
  }

  // 1.3 INSERT cliente (Diagrama Crear)
  crearCliente(cliente) {
    const clientes = this._obtenerTodos();
    clientes.push(cliente);
    localStorage.setItem(this.dbKey, JSON.stringify(clientes));
    return "Confirmación: Cliente registrado con éxito";
  }

  // 1.3 SELECT FROM cliente WHERE criterio (Diagrama Buscar)
  buscarCliente(criterio) {
    const clientes = this._obtenerTodos();
    if (!criterio) return clientes;
    
    return clientes.filter(c => 
      c.nombre.toLowerCase().includes(criterio.toLowerCase()) ||
      c.correo.toLowerCase().includes(criterio.toLowerCase())
    );
  }

  // 1.3 UPDATE clientes SET... (Diagrama Actualizar)
  actualizarCliente(clienteActualizado) {
    const clientes = this._obtenerTodos();
    const index = clientes.findIndex(c => c.correo === clienteActualizado.correo);
    
    if (index !== -1) {
      // Mantenemos la contraseña existente para que no se pierda al editar
      if (!clienteActualizado.password) {
        clienteActualizado.password = clientes[index].password;
      }
      clientes[index] = clienteActualizado;
      localStorage.setItem(this.dbKey, JSON.stringify(clientes));
      return "Confirmación: Cliente actualizado correctamente";
    }
    return "Error: Cliente no encontrado";
  }

  // Método auxiliar para leer el LocalStorage
  _obtenerTodos() {
    return JSON.parse(localStorage.getItem(this.dbKey)) || [];
  }
}