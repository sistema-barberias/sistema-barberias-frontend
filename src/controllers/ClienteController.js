/**
 * ClienteController — Comunicación con el backend (API de usuarios).
 *
 * Reglas de uso que siguen todos los métodos:
 *  - Si todo sale bien, devuelven el dato pedido (un usuario o una lista).
 *  - Si algo falla, devuelven un texto que empieza por "Error: ..."
 *    (por eso la interfaz usa `typeof respuesta === 'string'` para detectar errores).
 *
 * La dirección del servidor se toma de la variable VITE_API_URL
 * (archivo .env); si no existe, se usa el servidor local.
 */
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Expresiones regulares de validación
const REGEX_CORREO_LOGIN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Cualquier correo con formato válido
const REGEX_CORREO_REGISTRO = /^[^\s@]+@(gmail|hotmail)\.com$/i; // Registro: solo Gmail o Hotmail
const REGEX_SOLO_NUMEROS = /^\d+$/;
const REGEX_SOLO_LETRAS = /^[A-Za-zÁÉÍÓÚÜáéíóúüÑñ ]+$/; // Nombres: letras (con tildes) y espacios
const REGEX_PASSWORD = /^\d{6}$/; // Exactamente 6 dígitos

/**
 * Hace una petición al backend y unifica el manejo de errores.
 *
 * @param {string} ruta     Ruta de la API, por ejemplo '/api/usuarios/login'
 * @param {string} metodo   'GET', 'POST', 'PUT' o 'PATCH'
 * @param {object} [cuerpo] Datos a enviar en formato JSON (opcional)
 * @returns {Promise<any>}  Los datos de la respuesta, o "Error: ..." si falló
 */
async function peticion(ruta, metodo, cuerpo) {
  try {
    const opciones = { method: metodo };

    if (cuerpo) {
      opciones.headers = { 'Content-Type': 'application/json' };
      opciones.body = JSON.stringify(cuerpo);
    }

    const respuesta = await fetch(`${API_URL}${ruta}`, opciones);
    const resultado = await respuesta.json();

    // El backend explica el problema en el campo "mensaje"
    if (!respuesta.ok) {
      return `Error: ${resultado.mensaje}`;
    }

    return resultado;
  } catch (error) {
    console.error(`Error en ${metodo} ${ruta}:`, error);
    return 'Error: No se pudo conectar con el servidor';
  }
}

/**
 * Valida los datos del inicio de sesión.
 * @returns {Object} Errores por campo, por ejemplo { correo: '...', password: '...' }.
 *                   Si todo está bien devuelve un objeto vacío.
 */
export function validarLogin(datos) {
  const errores = {};
  const identificador = (datos.correo || '').trim();

  if (!identificador) {
    errores.correo = 'Ingresa tu correo o tu teléfono.';
  } else if (!REGEX_CORREO_LOGIN.test(identificador) && !REGEX_SOLO_NUMEROS.test(identificador)) {
    errores.correo = 'Escribe un correo válido (nombre@gmail.com) o un teléfono solo con números.';
  }

  if (!datos.password) {
    errores.password = 'Ingresa tu contraseña.';
  }

  return errores;
}

/**
 * Valida los datos para crear un cliente.
 * @returns {Object} Errores por campo: nombre, telefono, correo o password.
 *                   Si todo está bien devuelve un objeto vacío.
 */
export function validarRegistro(datos) {
  const errores = {};

  const nombre = (datos.nombre || '').trim();
  if (!nombre) {
    errores.nombre = 'Ingresa el nombre completo.';
  } else if (!REGEX_SOLO_LETRAS.test(nombre)) {
    errores.nombre = 'El nombre solo puede tener letras y espacios.';
  }

  const telefono = (datos.telefono || '').trim();
  if (!telefono) {
    errores.telefono = 'Ingresa el número de teléfono.';
  } else if (!REGEX_SOLO_NUMEROS.test(telefono)) {
    errores.telefono = 'El teléfono solo puede tener números, sin espacios ni guiones.';
  }

  const correo = (datos.correo || '').trim();
  if (!correo) {
    errores.correo = 'Ingresa el correo electrónico.';
  } else if (!REGEX_CORREO_REGISTRO.test(correo)) {
    errores.correo = 'El correo debe terminar en @gmail.com o @hotmail.com.';
  }

  if (!datos.password) {
    errores.password = 'Ingresa una contraseña.';
  } else if (!REGEX_PASSWORD.test(datos.password)) {
    errores.password = 'La contraseña debe tener exactamente 6 números (por ejemplo 123456).';
  }

  return errores;
}

// Devuelve el primer mensaje de un objeto de errores (para los métodos que responden con un solo texto)
const primerError = (errores) => Object.values(errores)[0];

export class ClienteController {

  /**
   * Inicia sesión con correo O teléfono, más la contraseña.
   * @param {{correo: string, password: string}} datos
   *        "correo" puede contener un correo electrónico o un número de teléfono.
   * @returns {Promise<object|string>} El usuario, o "Error: ..."
   */
  async iniciarSesion(datos) {
    const errores = validarLogin(datos);
    if (primerError(errores)) {
      return `Error: ${primerError(errores)}`;
    }

    // Se decide qué campo enviar según lo que escribió el usuario
    const identificador = datos.correo.trim();
    const esCorreo = REGEX_CORREO_LOGIN.test(identificador);
    const esTelefono = REGEX_SOLO_NUMEROS.test(identificador);

    const resultado = await peticion('/api/usuarios/login', 'POST', {
      correo: esCorreo ? identificador : undefined,
      telefono: esTelefono ? identificador : undefined,
      password: datos.password
    });

    return typeof resultado === 'string' ? resultado : resultado.usuario;
  }

  /**
   * Registra un cliente nuevo.
   * @param {{nombre: string, correo: string, telefono: string, password: string}} datos
   * @returns {Promise<object|string>} El usuario creado, o "Error: ..."
   */
  async crearCliente(datos) {
    const errores = validarRegistro(datos);
    if (primerError(errores)) {
      return `Error: ${primerError(errores)}`;
    }

    const resultado = await peticion('/api/usuarios/registro', 'POST', {
      nombre: datos.nombre,
      correo: datos.correo,
      telefono: datos.telefono,
      password: datos.password
    });

    return typeof resultado === 'string' ? resultado : resultado.usuario;
  }

  /**
   * Busca clientes (solo usuarios con rol Cliente) por nombre, correo o teléfono.
   * @param {string} [criterio] Texto a buscar (vacío = todos)
   * @returns {Promise<object[]|string>} Lista de usuarios, o "Error: ..."
   */
  async buscarCliente(criterio = '') {
    return peticion(`/api/usuarios?rol=Cliente&criterio=${encodeURIComponent(criterio)}`, 'GET');
  }

  /**
   * Actualiza el nombre, teléfono y correo de un cliente.
   * @param {{id_usuario: number, nombre: string, telefono: string, correo: string}} datos
   * @returns {Promise<object|string>} El usuario actualizado, o "Error: ..."
   */
  async actualizarCliente(datos) {
    const resultado = await peticion(`/api/usuarios/${datos.id_usuario}`, 'PUT', {
      nombre: datos.nombre,
      telefono: datos.telefono,
      correo: datos.correo
    });

    return typeof resultado === 'string' ? resultado : resultado.usuario;
  }

  /**
   * Elimina un cliente definitivamente.
   * Si el cliente ya tiene registros asociados (citas, etc.) el backend lo rechaza
   * y conviene inactivarlo en su lugar.
   * @param {{id_usuario: number}} datos
   * @returns {Promise<true|string>} true si se eliminó, o "Error: ..."
   */
  async eliminarCliente(datos) {
    const resultado = await peticion(`/api/usuarios/${datos.id_usuario}`, 'DELETE');

    return typeof resultado === 'string' ? resultado : true;
  }

  /**
   * Activa o inactiva un cliente (no se elimina, solo cambia su estado).
   * @param {{id_usuario: number, estado: 'Activo'|'Inactivo'}} datos
   * @returns {Promise<object|string>} El usuario actualizado, o "Error: ..."
   */
  async cambiarEstadoCliente(datos) {
    const resultado = await peticion(`/api/usuarios/${datos.id_usuario}/estado`, 'PATCH', {
      estado: datos.estado
    });

    return typeof resultado === 'string' ? resultado : resultado.usuario;
  }
}
