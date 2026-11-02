// src/controllers/ServicioController.js

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function peticion(ruta, metodo, cuerpo) {
  try {
    const opciones = { method: metodo };
    if (cuerpo) {
      opciones.headers = { 'Content-Type': 'application/json' };
      opciones.body = JSON.stringify(cuerpo);
    }
    const respuesta = await fetch(`${API_URL}${ruta}`, opciones);
    const resultado = await respuesta.json();
    if (!respuesta.ok) return `Error: ${resultado.mensaje}`;
    return resultado;
  } catch (error) {
    return 'Error: No se pudo conectar con el servidor';
  }
}

// Validación requerida para la oferta y precios (HU-07)


export class ServicioController {
  // Obtener todos los servicios
  async obtenerServicios() {
    return peticion('/api/servicios', 'GET');
  }

  // Registrar un servicio (HU-05)
  async crearServicio(datos) {
    return peticion('/api/servicios', 'POST', datos);
  }

  // Modificar servicio (HU-06)
  async actualizarServicio(datos) {
    return peticion(`/api/servicios/${datos.id_servicio}`, 'PUT', {
      nombre: datos.nombre,
      precio: datos.precio,
      descripcion: datos.descripcion
    });
  }

  // Eliminar servicio (HU-06)
  async eliminarServicio(id_servicio) {
    return peticion(`/api/servicios/${id_servicio}`, 'DELETE');
  }
}