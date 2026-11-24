/**
 * CitaController — Comunicación con el backend (citas del cliente: HU-11 y HU-12).
 *
 * Sigue las mismas reglas que los demás controladores: devuelve el dato pedido,
 * o un texto que empieza por "Error: ..." si algo falló.
 * Todas las rutas exigen sesión de Cliente (el token lo agrega api.js), y cada
 * cliente solo ve y modifica sus propias citas.
 */
import { peticion } from './api.js';

const REGEX_FECHA = /^\d{4}-\d{2}-\d{2}$/;
const REGEX_HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Fecha de hoy (hora local) en el formato del campo type="date": "AAAA-MM-DD". */
export function hoy() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Valida los datos de una reserva (al reservar y al modificar).
 * @returns {Object} Errores por campo: id_servicio, id_barbero, fecha u hora_inicio.
 *                   Si todo está bien devuelve un objeto vacío.
 */
export function validarReserva(datos) {
  const errores = {};

  if (!datos.id_servicio) {
    errores.id_servicio = 'Selecciona un servicio.';
  }

  if (!datos.id_barbero) {
    errores.id_barbero = 'Selecciona un barbero.';
  }

  const fecha = String(datos.fecha ?? '');
  if (!fecha) {
    errores.fecha = 'Selecciona la fecha de la cita.';
  } else if (!REGEX_FECHA.test(fecha)) {
    errores.fecha = 'La fecha no es válida.';
  } else if (fecha < hoy()) {
    // Con el formato "AAAA-MM-DD", comparar el texto equivale a comparar la fecha
    errores.fecha = 'La fecha no puede ser anterior a hoy.';
  }

  if (!REGEX_HORA.test(String(datos.hora_inicio ?? ''))) {
    errores.hora_inicio = 'Selecciona una de las horas disponibles.';
  }

  return errores;
}

// Devuelve el primer mensaje de un objeto de errores (para los métodos que responden con un solo texto)
const primerError = (errores) => Object.values(errores)[0];

// Datos que espera el backend al reservar o modificar una cita
const datosReserva = (datos) => ({
  id_servicio: Number(datos.id_servicio),
  id_barbero: Number(datos.id_barbero),
  fecha: datos.fecha,
  hora_inicio: datos.hora_inicio
});

export class CitaController {

  /**
   * Citas del cliente (HU-12): primero las próximas, después las pasadas y canceladas.
   * Cada cita trae "puede_modificar" (true si está reservada y todavía no ha pasado).
   * @returns {Promise<object[]|string>} Lista de citas, o "Error: ..."
   */
  async buscarMisCitas() {
    const resultado = await peticion('/api/citas', 'GET');

    return typeof resultado === 'string' ? resultado : resultado.citas;
  }

  /**
   * Servicios activos que se pueden reservar.
   * @returns {Promise<object[]|string>} Lista de servicios, o "Error: ..."
   */
  async buscarServicios() {
    const resultado = await peticion('/api/citas/servicios', 'GET');

    return typeof resultado === 'string' ? resultado : resultado.servicios;
  }

  /**
   * Horas libres para reservar (HU-11): caben en el horario del barbero
   * y no se cruzan con otra cita.
   * @param {{id_barbero: number, id_servicio: number, fecha: string, excluir_cita?: number}} datos
   *        excluir_cita: al modificar una cita, esa no cuenta como ocupada.
   * @returns {Promise<string[]|string>} Horas "HH:MM", o "Error: ..."
   */
  async buscarTurnos({ id_barbero, id_servicio, fecha, excluir_cita }) {
    const parametros = new URLSearchParams({ id_barbero, id_servicio, fecha });

    if (excluir_cita) {
      parametros.set('excluir_cita', excluir_cita);
    }

    const resultado = await peticion(`/api/citas/turnos?${parametros}`, 'GET');

    return typeof resultado === 'string' ? resultado : resultado.turnos;
  }

  /**
   * Reserva una cita (HU-11).
   * @returns {Promise<object|string>} La cita creada, o "Error: ..."
   */
  async reservarCita(datos) {
    const errores = validarReserva(datos);
    if (primerError(errores)) {
      return `Error: ${primerError(errores)}`;
    }

    const resultado = await peticion('/api/citas', 'POST', datosReserva(datos));

    return typeof resultado === 'string' ? resultado : resultado.cita;
  }

  /**
   * Modifica una cita (HU-12): servicio, barbero, fecha u hora.
   * @returns {Promise<object|string>} La cita modificada, o "Error: ..."
   */
  async modificarCita(id, datos) {
    const errores = validarReserva(datos);
    if (primerError(errores)) {
      return `Error: ${primerError(errores)}`;
    }

    const resultado = await peticion(`/api/citas/${id}`, 'PUT', datosReserva(datos));

    return typeof resultado === 'string' ? resultado : resultado.cita;
  }

  /**
   * Cancela una cita (HU-12). No se borra: queda como "Cancelada".
   * @returns {Promise<object|string>} La cita cancelada, o "Error: ..."
   */
  async cancelarCita(id) {
    const resultado = await peticion(`/api/citas/${id}/cancelar`, 'PATCH');

    return typeof resultado === 'string' ? resultado : resultado.cita;
  }
}
