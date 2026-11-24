<!--
  CitasCliente.vue — Citas del cliente.
    · HU-11: reservar una cita con un barbero en un horario disponible.
    · HU-12: ver, modificar y cancelar sus citas.

  Las horas que se ofrecen las calcula el backend (/api/citas/turnos): solo aparecen
  las que caben en el horario del barbero y no se cruzan con otra cita.

  Los colores y medidas (var(--...)) vienen de App.vue: las variables CSS se heredan.
-->
<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { CitaController, validarReserva, hoy } from '../controllers/CitaController.js';
import { DisponibilidadController } from '../controllers/DisponibilidadController.js';
import { nombreDia } from '../controllers/HorarioController.js';

const citaController = new CitaController();
const disponibilidadController = new DisponibilidadController();

// =====================================================
// UTILIDADES
// =====================================================

const MENSAJE_VACIO = { tipo: '', texto: '' };
const reservaVacia = () => ({ id_servicio: '', id_barbero: '', fecha: '', hora_inicio: '' });

// El controlador avisa los errores con un texto que empieza por "Error:".
const esError = (respuesta) => typeof respuesta === 'string';
const quitarPrefijoError = (texto) => texto.replace(/^Error:\s*/, '');
const hayErrores = (errores) => Object.keys(errores).length > 0;

const formatoPrecio = (precio) => `$${Number(precio).toLocaleString('es-CO')}`;

// "2026-11-30" -> "lunes, 30 de noviembre de 2026"
const formatoFecha = (fecha) =>
  new Date(`${fecha}T00:00`).toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

// Estado que ve el cliente: una cita reservada cuya hora ya pasó se muestra como "Pasada"
const estadoVisible = (cita) =>
  cita.estado === 'Reservada' && !cita.puede_modificar ? 'Pasada' : cita.estado;

// =====================================================
// ESTADO
// =====================================================

// --- Opciones del formulario ---
const servicios = ref([]);
const horariosBarberos = ref([]);              // Horarios semanales de los barberos activos (HU-10)

// Un barbero por cada uno que tiene horarios, con los días en que atiende
const barberos = computed(() => {
  const grupos = new Map();

  for (const horario of horariosBarberos.value) {
    if (!grupos.has(horario.id_barbero)) {
      grupos.set(horario.id_barbero, { id_barbero: horario.id_barbero, nombre: horario.barbero, dias: new Set() });
    }
    grupos.get(horario.id_barbero).dias.add(Number(horario.dia_semana));
  }

  return [...grupos.values()];
});

// --- Formulario de reserva (también sirve para modificar una cita) ---
const formulario = ref(null);                  // Elemento <form>, para llevar la pantalla hasta él al modificar
const form = ref(reservaVacia());
const errores = ref({});
const citaEditando = ref(null);                // La cita que se está modificando (null = reserva nueva)
const turnos = ref([]);                        // Horas libres para el servicio, barbero y fecha elegidos
const cargandoTurnos = ref(false);
const enviando = ref(false);
const mensaje = ref({ ...MENSAJE_VACIO });

// Días en que atiende el barbero elegido (ayuda a escoger una fecha con horas libres)
const diasDelBarbero = computed(() => {
  const barbero = barberos.value.find((b) => b.id_barbero === Number(form.value.id_barbero));
  return barbero ? [...barbero.dias].sort().map(nombreDia).join(', ') : '';
});

const faltanDatos = computed(() => !form.value.id_servicio || !form.value.id_barbero || !form.value.fecha);

// --- Mis citas ---
const misCitas = ref([]);
const cargandoCitas = ref(false);
const mensajeCitas = ref({ ...MENSAJE_VACIO });
const idCancelando = ref(null);                // id de la cita que espera confirmación para cancelarse

// =====================================================
// CARGA DE DATOS
// =====================================================

// Servicios y barberos para los desplegables
const cargarOpciones = async () => {
  const [respuestaServicios, respuestaHorarios] = await Promise.all([
    citaController.buscarServicios(),
    disponibilidadController.consultarDisponibilidad()
  ]);

  if (esError(respuestaServicios)) {
    mensaje.value = { tipo: 'error', texto: quitarPrefijoError(respuestaServicios) };
  } else {
    servicios.value = respuestaServicios;
  }

  if (esError(respuestaHorarios)) {
    mensaje.value = { tipo: 'error', texto: quitarPrefijoError(respuestaHorarios) };
  } else {
    horariosBarberos.value = respuestaHorarios || [];
  }
};

const buscarMisCitas = async () => {
  cargandoCitas.value = true;
  const respuesta = await citaController.buscarMisCitas();
  cargandoCitas.value = false;

  if (esError(respuesta)) {
    mensajeCitas.value = { tipo: 'error', texto: quitarPrefijoError(respuesta) };
    return;
  }

  misCitas.value = respuesta;
};

// Pide las horas libres cada vez que cambian el servicio, el barbero o la fecha.
// "consultaActual" descarta las respuestas viejas si el cliente cambió algo mientras tanto.
let consultaActual = 0;
const cargarTurnos = async () => {
  const numero = ++consultaActual;
  turnos.value = [];

  if (faltanDatos.value || form.value.fecha < hoy()) {
    cargandoTurnos.value = false;
    return;
  }

  cargandoTurnos.value = true;
  const respuesta = await citaController.buscarTurnos({
    id_barbero: form.value.id_barbero,
    id_servicio: form.value.id_servicio,
    fecha: form.value.fecha,
    excluir_cita: citaEditando.value?.id_cita
  });

  if (numero !== consultaActual) return;
  cargandoTurnos.value = false;

  if (esError(respuesta)) {
    mensaje.value = { tipo: 'error', texto: quitarPrefijoError(respuesta) };
    return;
  }

  turnos.value = respuesta;

  // La hora elegida se conserva solo si sigue libre
  if (!respuesta.includes(form.value.hora_inicio)) {
    form.value.hora_inicio = '';
  }
};

watch(() => [form.value.id_servicio, form.value.id_barbero, form.value.fecha], cargarTurnos);

onMounted(() => Promise.all([cargarOpciones(), buscarMisCitas()]));

// =====================================================
// RESERVAR Y MODIFICAR (HU-11 y HU-12)
// =====================================================

// Deja el formulario como reserva nueva y en blanco
const reiniciarFormulario = () => {
  citaEditando.value = null;
  form.value = reservaVacia();
  errores.value = {};
  mensaje.value = { ...MENSAJE_VACIO };
};

const guardarCita = async () => {
  mensaje.value = { ...MENSAJE_VACIO };
  errores.value = validarReserva(form.value);
  if (hayErrores(errores.value)) return;

  const modificando = Boolean(citaEditando.value);

  enviando.value = true;
  const respuesta = modificando
    ? await citaController.modificarCita(citaEditando.value.id_cita, form.value)
    : await citaController.reservarCita(form.value);
  enviando.value = false;

  if (esError(respuesta)) {
    mensaje.value = { tipo: 'error', texto: quitarPrefijoError(respuesta) };
    await cargarTurnos();   // La hora pudo ocuparse mientras tanto: se actualiza la lista
    return;
  }

  reiniciarFormulario();
  mensaje.value = {
    tipo: 'exito',
    texto: `${modificando ? 'Cita modificada' : 'Cita reservada'}: ${formatoFecha(respuesta.fecha)} a las ${respuesta.hora_inicio} con ${respuesta.barbero}.`
  };
  mensajeCitas.value = { ...MENSAJE_VACIO };
  await buscarMisCitas();
};

// Lleva una cita al formulario para cambiar su servicio, barbero, fecha u hora
const editarCita = (cita) => {
  citaEditando.value = cita;
  form.value = {
    id_servicio: cita.id_servicio,
    id_barbero: cita.id_barbero,
    fecha: cita.fecha,
    hora_inicio: cita.hora_inicio
  };
  errores.value = {};
  mensaje.value = { ...MENSAJE_VACIO };
  idCancelando.value = null;
  formulario.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

// =====================================================
// CANCELAR (HU-12)
// =====================================================

const pedirConfirmacionCancelar = (cita) => {
  idCancelando.value = cita.id_cita;
  mensajeCitas.value = { ...MENSAJE_VACIO };
};

const confirmarCancelacion = async (cita) => {
  const respuesta = await citaController.cancelarCita(cita.id_cita);
  idCancelando.value = null;

  if (esError(respuesta)) {
    mensajeCitas.value = { tipo: 'error', texto: quitarPrefijoError(respuesta) };
    return;
  }

  // Si se estaba modificando esa misma cita, el formulario vuelve a ser una reserva nueva
  if (citaEditando.value?.id_cita === cita.id_cita) {
    reiniciarFormulario();
  }

  mensajeCitas.value = { tipo: 'exito', texto: `Cita del ${formatoFecha(cita.fecha)} cancelada. La hora quedó libre.` };
  await buscarMisCitas();
  await cargarTurnos();
};
</script>

<template>
  <section class="citas">
    <!-- HU-11 (y HU-12 al modificar): elegir servicio, barbero, fecha y una hora libre -->
    <form ref="formulario" class="tarjeta formulario-cita" novalidate @submit.prevent="guardarCita">
      <div class="encabezado">
        <h2>{{ citaEditando ? 'Modificar cita' : 'Reservar una cita' }}</h2>
        <p>Elige el servicio, el barbero y el día; después escoge una de las horas libres.</p>
      </div>

      <div class="fila">
        <div class="campo">
          <label for="cita-servicio">Servicio</label>
          <select id="cita-servicio" v-model="form.id_servicio" :class="{ invalido: errores.id_servicio }">
            <option value="">Selecciona un servicio</option>
            <option v-for="servicio in servicios" :key="servicio.id_servicio" :value="servicio.id_servicio">
              {{ servicio.nombre }} · {{ formatoPrecio(servicio.precio) }} · {{ servicio.duracion }} min
            </option>
          </select>
          <p v-if="errores.id_servicio" class="error-campo" role="alert">{{ errores.id_servicio }}</p>
        </div>

        <div class="campo">
          <label for="cita-barbero">Barbero</label>
          <select id="cita-barbero" v-model="form.id_barbero" :class="{ invalido: errores.id_barbero }">
            <option value="">Selecciona un barbero</option>
            <option v-for="barbero in barberos" :key="barbero.id_barbero" :value="barbero.id_barbero">
              {{ barbero.nombre }}
            </option>
          </select>
          <p v-if="diasDelBarbero" class="ayuda">Atiende: {{ diasDelBarbero }}</p>
          <p v-if="errores.id_barbero" class="error-campo" role="alert">{{ errores.id_barbero }}</p>
        </div>
      </div>

      <div class="campo">
        <label for="cita-fecha">Fecha</label>
        <input id="cita-fecha" type="date" v-model="form.fecha" :min="hoy()" :class="{ invalido: errores.fecha }">
        <p v-if="errores.fecha" class="error-campo" role="alert">{{ errores.fecha }}</p>
      </div>

      <div class="campo">
        <span class="etiqueta">Hora</span>
        <p v-if="faltanDatos" class="ayuda">Elige servicio, barbero y fecha para ver las horas disponibles.</p>
        <p v-else-if="form.fecha < hoy()" class="ayuda">Elige una fecha a partir de hoy.</p>
        <p v-else-if="cargandoTurnos" class="ayuda">Buscando horas disponibles...</p>
        <p v-else-if="turnos.length === 0" class="ayuda">
          No hay horas disponibles ese día. Prueba con otra fecha{{ diasDelBarbero ? ` (atiende: ${diasDelBarbero})` : '' }}.
        </p>
        <div v-else class="turnos" role="radiogroup" aria-label="Horas disponibles">
          <button
            v-for="turno in turnos"
            :key="turno"
            type="button"
            role="radio"
            :aria-checked="form.hora_inicio === turno"
            :class="['turno', { activo: form.hora_inicio === turno }]"
            @click="form.hora_inicio = turno"
          >{{ turno }}</button>
        </div>
        <p v-if="errores.hora_inicio" class="error-campo" role="alert">{{ errores.hora_inicio }}</p>
      </div>

      <p v-if="mensaje.texto" :class="['aviso', mensaje.tipo]" role="alert">{{ mensaje.texto }}</p>

      <div class="acciones">
        <button v-if="citaEditando" type="button" class="boton secundario" @click="reiniciarFormulario">
          Descartar cambios
        </button>
        <button type="submit" class="boton principal" :disabled="enviando">
          {{ enviando ? 'Guardando...' : citaEditando ? 'Guardar cambios' : 'Reservar cita' }}
        </button>
      </div>
    </form>

    <!-- HU-12: ver, modificar y cancelar mis citas -->
    <div class="tarjeta">
      <h2>Mis citas</h2>

      <p v-if="mensajeCitas.texto" :class="['aviso', mensajeCitas.tipo]" role="alert">{{ mensajeCitas.texto }}</p>

      <p v-if="cargandoCitas" class="ayuda">Cargando tus citas...</p>
      <p v-else-if="misCitas.length === 0 && mensajeCitas.tipo !== 'error'" class="ayuda">Todavía no tienes citas.</p>

      <ul v-else class="lista-citas">
        <li
          v-for="cita in misCitas"
          :key="cita.id_cita"
          :class="['cita', { inactiva: !cita.puede_modificar, editando: citaEditando?.id_cita === cita.id_cita }]"
        >
          <div class="cita-datos">
            <p class="cita-fecha">{{ formatoFecha(cita.fecha) }} · {{ cita.hora_inicio }} - {{ cita.hora_fin }}</p>
            <p>{{ cita.servicio }} con {{ cita.barbero }} · {{ formatoPrecio(cita.precio) }}</p>
            <span :class="['estado', estadoVisible(cita)]">{{ estadoVisible(cita) }}</span>
          </div>

          <div v-if="cita.puede_modificar" class="cita-acciones">
            <!-- Confirmación antes de cancelar -->
            <template v-if="idCancelando === cita.id_cita">
              <p class="error-campo">¿Cancelar esta cita?</p>
              <button type="button" class="boton peligro" @click="confirmarCancelacion(cita)">Sí, cancelar</button>
              <button type="button" class="boton secundario" @click="idCancelando = null">No</button>
            </template>
            <template v-else>
              <button type="button" class="boton secundario" @click="editarCita(cita)">Modificar</button>
              <button type="button" class="boton peligro" @click="pedirConfirmacionCancelar(cita)">Cancelar cita</button>
            </template>
          </div>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
/* ---------- Estructura ---------- */
.citas { display: flex; flex-direction: column; gap: var(--gap); }

.tarjeta {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: var(--gap);
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
}
.formulario-cita { border-top: 3px solid var(--gold); scroll-margin-top: 16px; }

.citas h2 { margin: 0; font-family: var(--serif); font-size: 1.3rem; color: var(--ink); }
.encabezado p { margin: 4px 0 0; color: var(--muted); }

.fila { display: grid; grid-template-columns: 1fr; gap: 16px; }   /* 1 columna en celular */

/* ---------- Campos (mismo aspecto que CampoForm.vue) ---------- */
.campo { display: flex; flex-direction: column; gap: 6px; }
.campo label,
.etiqueta { font-size: .9rem; font-weight: 600; color: var(--ink); }

/* font-size 16px evita que el iPhone haga zoom automático al tocar un campo */
.campo select,
.campo input {
  width: 100%;
  min-height: var(--touch);
  padding: 10px 12px;
  border: 1px solid #d6cab6;
  border-radius: 8px;
  font-family: inherit;
  font-size: 16px;
  background: #fff;
  color: var(--text);
}
.campo select:focus,
.campo input:focus { outline: 2px solid var(--gold); border-color: transparent; }
.campo .invalido { border-color: var(--red); background: #fffafa; }

.ayuda { margin: 0; font-size: .9rem; color: var(--muted); }
.error-campo { margin: 0; font-size: .85rem; line-height: 1.3; color: var(--red-dark); }

/* ---------- Horas disponibles ---------- */
.turnos { display: flex; flex-wrap: wrap; gap: 8px; }
.turno {
  min-width: 72px;
  min-height: var(--touch);
  padding: 8px 12px;
  border: 1px solid #d6cab6;
  border-radius: 8px;
  background: #fff;
  font: inherit;
  font-weight: 600;
  color: var(--ink);
  cursor: pointer;
}
.turno:hover { background: rgba(176, 141, 87, .15); }
.turno.activo { background: var(--red); border-color: var(--red); color: #fff; }

/* ---------- Avisos ---------- */
.aviso { margin: 0; padding: 12px 14px; border: 1px solid transparent; border-radius: 8px; font-size: .92rem; }
.aviso.error { background: #f9e7e8; border-color: #e8bcbf; color: var(--red-dark); }
.aviso.exito { background: #e1f3ea; border-color: #b6dcc8; color: #17623c; }

/* ---------- Botones (mismo aspecto que los de App.vue) ---------- */
.acciones { display: flex; flex-direction: column-reverse; gap: 12px; }
.boton {
  min-height: var(--touch);
  padding: 10px 16px;
  border: 1px solid transparent;
  border-radius: 8px;
  font: inherit;
  font-size: .95rem;
  font-weight: 600;
  cursor: pointer;
}
.boton:disabled { opacity: .6; cursor: not-allowed; }
.boton:focus-visible,
.turno:focus-visible { outline: 2px solid var(--gold); outline-offset: 2px; }
.principal { background: var(--red); color: #fff; }
.principal:hover:not(:disabled) { background: var(--red-dark); }
.secundario { background: transparent; border-color: #8f877b; color: var(--ink); }
.secundario:hover { background: rgba(176, 141, 87, .15); }
.peligro { background: #fff; border-color: var(--red); color: var(--red); }
.peligro:hover { background: var(--red); color: #fff; }

/* ---------- Mis citas ---------- */
.lista-citas { display: flex; flex-direction: column; gap: 12px; margin: 0; padding: 0; list-style: none; }
.cita {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: var(--radius);
}
.cita.inactiva { background: var(--sand); opacity: .8; }
.cita.editando { border-color: var(--gold); box-shadow: 0 0 0 1px var(--gold); }

.cita-datos { display: flex; flex-direction: column; gap: 4px; }
.cita-datos p { margin: 0; }
.cita-fecha { font-weight: 700; color: var(--ink); }
.cita-fecha::first-letter { text-transform: uppercase; }

.cita-acciones { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }

.estado { align-self: flex-start; padding: 3px 10px; border-radius: 999px; font-size: .8rem; font-weight: 700; }
.estado.Reservada { background: #e1f3ea; color: #17623c; }
.estado.Cancelada { background: #f4e0e1; color: #831c21; }
.estado.Pasada { background: #efe8da; color: var(--muted); }

/* ---------- Tabletas y computadores (≥ 640px) ---------- */
@media (min-width: 640px) {
  .fila { grid-template-columns: 1fr 1fr; }
  .acciones { flex-direction: row; justify-content: flex-end; }
  .cita { flex-direction: row; align-items: center; justify-content: space-between; }
  .cita-acciones { justify-content: flex-end; }
}
</style>
