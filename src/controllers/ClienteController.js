const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export class ClienteController {

  // Iniciar sesión
  async iniciarSesion(datos) {
    // "correo" puede traer un correo electrónico o un número de teléfono
    const identificador = (datos.correo || '').trim();

    if (!identificador || !datos.password) {
      return "Error: El correo o teléfono y la contraseña son obligatorios";
    }

    const esCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identificador);
    const esTelefono = /^\d+$/.test(identificador);

    if (!esCorreo && !esTelefono) {
      return "Error: Ingresa un correo válido o un teléfono solo con números";
    }

    try {
      const respuesta = await fetch(
        `${API_URL}/api/usuarios/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            correo: esCorreo ? identificador : undefined,
            telefono: esTelefono ? identificador : undefined,
            password: datos.password
          })
        }
      );

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        return `Error: ${resultado.mensaje}`;
      }

      return resultado.usuario;

    } catch (error) {
      console.error('Error conectando con el backend:', error);
      return "Error: No se pudo conectar con el servidor";
    }
  }


  // Registrar cliente
  async crearCliente(datos) {

    // ==============================
    // VALIDAR CAMPOS OBLIGATORIOS
    // ==============================

    if (!datos.nombre || !datos.correo || !datos.telefono || !datos.password) {
      return "Error: Todos los campos son obligatorios";
    }


    // ==============================
    // VALIDAR CORREO
    // Solo permite Gmail o Hotmail
    // ==============================

    const correoValido = /^[^\s@]+@(gmail|hotmail)\.com$/i;

    if (!correoValido.test(datos.correo)) {
      return "Error: El correo debe ser de Gmail o Hotmail (@gmail.com o @hotmail.com)";
    }


    // ==============================
    // VALIDAR TELÉFONO
    // Solo números
    // ==============================

    const telefonoValido = /^\d+$/;

    if (!telefonoValido.test(datos.telefono)) {
      return "Error: El teléfono solo puede contener números";
    }


    // ==============================
    // VALIDAR CONTRASEÑA
    // Exactamente 6 dígitos numéricos
    // ==============================

    const passwordValida = /^\d{6}$/;

    if (!passwordValida.test(datos.password)) {
      return "Error: La contraseña debe tener exactamente 6 dígitos numéricos";
    }


    // ==============================
    // ENVIAR DATOS AL BACKEND
    // ==============================

    try {
      const respuesta = await fetch(
        `${API_URL}/api/usuarios/registro`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            nombre: datos.nombre,
            correo: datos.correo,
            telefono: datos.telefono,
            password: datos.password
          })
        }
      );

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        return `Error: ${resultado.mensaje}`;
      }

      return resultado.usuario;

    } catch (error) {
      console.error('Error conectando con el backend:', error);
      return "Error: No se pudo conectar con el servidor";
    }
  }


  // Buscar clientes
  async buscarCliente(criterio = '') {
    try {
      const respuesta = await fetch(
        `${API_URL}/api/usuarios?criterio=${encodeURIComponent(criterio)}`
      );

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        return `Error: ${resultado.mensaje}`;
      }

      return resultado;

    } catch (error) {
      console.error('Error buscando usuarios:', error);
      return "Error: No se pudo conectar con el servidor";
    }
  }


  // Actualizar cliente
  async actualizarCliente(datos) {
    try {
      const respuesta = await fetch(
        `${API_URL}/api/usuarios/${datos.id_usuario}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            nombre: datos.nombre,
            telefono: datos.telefono
          })
        }
      );

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        return `Error: ${resultado.mensaje}`;
      }

      return resultado.usuario;

    } catch (error) {
      console.error('Error actualizando usuario:', error);
      return "Error: No se pudo conectar con el servidor";
    }
  }


  // Cambiar estado
  async cambiarEstadoCliente(datos) {
    try {
      const respuesta = await fetch(
        `${API_URL}/api/usuarios/${datos.id_usuario}/estado`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            estado: datos.estado
          })
        }
      );

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        return `Error: ${resultado.mensaje}`;
      }

      return resultado.usuario;

    } catch (error) {
      console.error('Error actualizando estado:', error);
      return "Error: No se pudo conectar con el servidor";
    }
  }
}
