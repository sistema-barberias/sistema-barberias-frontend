const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const REGEX_CORREO_LOGIN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REGEX_CORREO_REGISTRO = /^[^\s@]+@(gmail|hotmail)\.com$/i;
const REGEX_SOLO_NUMEROS = /^\d+$/;
const REGEX_SOLO_LETRAS = /^[A-Za-zÁÉÍÓÚáéíóúÑñ ]+$/;

async function peticion(ruta, metodo = 'GET', cuerpo = null) {
  try {
    const opciones = {
      method: metodo,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (cuerpo !== null) {
      opciones.body = JSON.stringify(cuerpo);
    }

    const respuesta = await fetch(`${API_URL}${ruta}`, opciones);
    const texto = await respuesta.text();

    let datos;

    try {
      datos = texto ? JSON.parse(texto) : {};
    } catch {
      datos = texto;
    }

    if (!respuesta.ok) {
      return `Error: ${datos?.mensaje || datos?.error || datos || 'Error en la petición'}`;
    }

    return datos;
  } catch (error) {
    return `Error: ${error.message}`;
  }
}

function validarLogin(datos) {
  const errores = {};

  const identificador = String(datos.identificador || '').trim();
  const password = String(datos.password || '');

  if (!identificador) {
    errores.identificador = 'El correo o teléfono es obligatorio.';
  } else {
    const esCorreo = REGEX_CORREO_LOGIN.test(identificador);
    const esTelefono = REGEX_SOLO_NUMEROS.test(identificador);

    if (!esCorreo && !esTelefono) {
      errores.identificador = 'Ingresa un correo o teléfono válido.';
    }
  }

  if (!password) {
    errores.password = 'La contraseña es obligatoria.';
  }

  return errores;
}

function validarRegistro(datos) {
  const errores = {};

  const nombre = String(datos.nombre || '').trim();
  const correo = String(datos.correo || '').trim();
  const telefono = String(datos.telefono || '').trim();
  const password = String(datos.password || '');

  if (!nombre) {
    errores.nombre = 'El nombre es obligatorio.';
  } else if (!REGEX_SOLO_LETRAS.test(nombre)) {
    errores.nombre = 'El nombre solo puede contener letras y espacios.';
  }

  if (!telefono) {
    errores.telefono = 'El teléfono es obligatorio.';
  } else if (!REGEX_SOLO_NUMEROS.test(telefono)) {
    errores.telefono = 'El teléfono solo puede contener números.';
  }

  if (!correo) {
    errores.correo = 'El correo es obligatorio.';
  } else if (!REGEX_CORREO_REGISTRO.test(correo)) {
    errores.correo = 'Solo se permiten correos Gmail o Hotmail.';
  }

  if (!password) {
    errores.password = 'La contraseña es obligatoria.';
  } else if (password.length < 6) {
    errores.password = 'La contraseña debe tener mínimo 6 caracteres.';
  }

  return errores;
}

const ClienteController = {
  async iniciarSesion(datos) {
    const errores = validarLogin(datos);

    if (Object.keys(errores).length > 0) {
      return {
        ok: false,
        errores
      };
    }

    const identificador = String(datos.identificador).trim();
    const esCorreo = REGEX_CORREO_LOGIN.test(identificador);
    const esTelefono = REGEX_SOLO_NUMEROS.test(identificador);

    return peticion('/api/usuarios/login', 'POST', {
      correo: esCorreo ? identificador : undefined,
      telefono: esTelefono ? identificador : undefined,
      password: datos.password
    });
  },

  async crearCliente(datos) {
    const errores = validarRegistro(datos);

    if (Object.keys(errores).length > 0) {
      return {
        ok: false,
        errores
      };
    }

    return peticion('/api/usuarios/registro', 'POST', {
      nombre: datos.nombre.trim(),
      correo: datos.correo.trim(),
      telefono: datos.telefono.trim(),
      password: datos.password
    });
  },

  async buscarCliente(criterio = '') {
    return peticion(
      `/api/usuarios?rol=Cliente&criterio=${encodeURIComponent(criterio)}`,
      'GET'
    );
  },

  async actualizarCliente(datos) {
    return peticion(`/api/usuarios/${datos.id_usuario}`, 'PUT', {
      nombre: datos.nombre,
      telefono: datos.telefono,
      correo: datos.correo
    });
  },

  async cambiarEstadoCliente(id_usuario, estado) {
    return peticion(`/api/usuarios/${id_usuario}/estado`, 'PATCH', {
      estado
    });
  }
};

export default ClienteController;
