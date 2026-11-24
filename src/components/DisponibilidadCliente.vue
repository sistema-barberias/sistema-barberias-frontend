<!--
  DisponibilidadCliente.vue — Horarios de atención de los barberos (HU-10).

  Lo ve el cliente en su pantalla. Es de solo lectura: muestra, por cada barbero
  activo, los días y horas en que atiende. Los horarios los asigna el administrador (HU-09).

  Los colores y medidas (var(--...)) vienen de App.vue: las variables CSS se heredan.
-->
<script setup>
import { ref, computed, onMounted } from 'vue';
import { DisponibilidadController } from '../controllers/DisponibilidadController.js';
import { nombreDia } from '../controllers/HorarioController.js';

const disponibilidadController = new DisponibilidadController();

const horarios = ref([]);
const cargando = ref(false);
const mensajeError = ref('');

// Agrupa los horarios para mostrar una tarjeta por barbero (no una por cada horario).
// El backend ya los entrega ordenados por barbero, día y hora.
const horariosPorBarbero = computed(() => {
  const grupos = new Map();

  for (const horario of horarios.value) {
    if (!grupos.has(horario.id_barbero)) {
      grupos.set(horario.id_barbero, { id_barbero: horario.id_barbero, barbero: horario.barbero, horarios: [] });
    }
    grupos.get(horario.id_barbero).horarios.push(horario);
  }

  return [...grupos.values()];
});

const consultarDisponibilidad = async () => {
  cargando.value = true;
  mensajeError.value = '';

  const resultado = await disponibilidadController.consultarDisponibilidad();

  if (typeof resultado === 'string') {
    mensajeError.value = resultado.replace(/^Error:\s*/, '');
    horarios.value = [];
  } else {
    horarios.value = resultado || [];
  }

  cargando.value = false;
};

onMounted(consultarDisponibilidad);
</script>

<template>
  <section class="disponibilidad">
    <div class="encabezado-disponibilidad">
      <h2>Disponibilidad de los barberos</h2>
      <p>Consulta los días y horarios de atención.</p>
    </div>

    <div v-if="cargando" class="estado-disponibilidad">
      Consultando horarios...
    </div>

    <div v-else-if="mensajeError" class="mensaje-error" role="alert">
      {{ mensajeError }}
      <button type="button" @click="consultarDisponibilidad">Intentar nuevamente</button>
    </div>

    <div v-else-if="horariosPorBarbero.length === 0" class="estado-disponibilidad">
      Actualmente no hay horarios disponibles para consultar.
    </div>

    <div v-else class="lista-barberos">
      <article
        v-for="grupo in horariosPorBarbero"
        :key="grupo.id_barbero"
        class="tarjeta-barbero"
      >
        <h3>{{ grupo.barbero }}</h3>

        <ul class="lista-horarios">
          <li v-for="horario in grupo.horarios" :key="horario.id_horario">
            <span class="dia-horario">{{ nombreDia(horario.dia_semana) }}</span>
            <span>{{ horario.hora_inicio }} - {{ horario.hora_fin }}</span>
          </li>
        </ul>
      </article>
    </div>

    <button
      v-if="!cargando && !mensajeError"
      type="button"
      class="boton-actualizar"
      @click="consultarDisponibilidad"
    >
      Actualizar horarios
    </button>
  </section>
</template>

<style scoped>
.disponibilidad {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: var(--gap);
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
}

.disponibilidad h2,
.disponibilidad h3 {
  margin: 0;
  font-family: var(--serif);
  color: var(--ink);
}
.disponibilidad h2 { font-size: 1.3rem; }

.encabezado-disponibilidad p {
  margin: 4px 0 0;
  color: var(--muted);
}

.lista-barberos {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.tarjeta-barbero {
  padding: 16px;
  background: #fff;
  border: 1px solid var(--line);
  border-top: 3px solid var(--gold);
  border-radius: var(--radius);
}
.tarjeta-barbero h3 {
  margin-bottom: 10px;
  font-size: 1.1rem;
}

.lista-horarios {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.lista-horarios li {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.dia-horario {
  font-weight: 600;
  color: var(--ink);
}

.estado-disponibilidad,
.mensaje-error {
  padding: 16px;
  border-radius: 8px;
  background: var(--sand);
  color: var(--muted);
}

.mensaje-error {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  background: #f9e7e8;
  color: var(--red-dark);
}

/* Mismo aspecto que los botones "btn-outline" de App.vue */
.boton-actualizar,
.mensaje-error button {
  align-self: flex-start;
  min-height: var(--touch);
  padding: 10px 16px;
  border: 1px solid #8f877b;
  border-radius: 8px;
  background: transparent;
  color: var(--ink);
  font-size: .95rem;
  font-weight: 600;
  cursor: pointer;
}
.boton-actualizar:hover,
.mensaje-error button:hover { background: rgba(176, 141, 87, .15); }
.boton-actualizar:focus-visible,
.mensaje-error button:focus-visible { outline: 2px solid var(--gold); outline-offset: 2px; }
</style>
