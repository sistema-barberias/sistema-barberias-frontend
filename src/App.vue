<template>
  <div class="app">
    <header class="app-header">
      <div class="header-inner">
        <h1 class="brand">BarberFlow</h1>
        <div v-if="usuarioLogueado" class="session-area">
          <span class="session-text">
            <strong>{{ usuarioLogueado.nombre }}</strong>
            <small>{{ usuarioLogueado.rol }}</small>
          </span>
          <button @click="logout" class="btn btn-outline">Cerrar sesión</button>
        </div>
      </div>
    </header>

    <main class="main">
      <!-- ============ AUTENTICACIÓN ============ -->
      <section v-if="!usuarioLogueado" class="auth-section">
        <div class="auth-card">
          <div class="tabs" role="tablist">
            <button
              role="tab"
              @click="vistaAuth = 'login'"
              :class="{ active: vistaAuth === 'login' }"
            >Iniciar sesión</button>
            <button
              role="tab"
              @click="vistaAuth = 'registro'"
              :class="{ active: vistaAuth === 'registro' }"
            >Crear cuenta</button>
          </div>

          <form v-if="vistaAuth === 'login'" @submit.prevent="login" class="form">
            <h2>Bienvenido de nuevo</h2>
            <div class="form-group">
              <label for="login-correo">Correo electrónico</label>
              <input id="login-correo" type="email" v-model="formAuth.correo" placeholder="ejemplo@correo.com" required>
            </div>
            <div class="form-group">
              <label for="login-pass">Contraseña</label>
              <input id="login-pass" type="password" v-model="formAuth.password" placeholder="••••••••" required>
            </div>
            <button type="submit" class="btn btn-primary btn-block">Ingresar</button>
          </form>

          <form v-else @submit.prevent="ejecutarCrearCliente" class="form">
            <h2>Crea tu cuenta de cliente</h2>
            <div class="form-row">
              <div class="form-group">
                <label for="reg-nombre">Nombre completo</label>
                <input id="reg-nombre" type="text" v-model="formRegistro.nombre" placeholder="Tu nombre" required>
              </div>
              <div class="form-group">
                <label for="reg-tel">Teléfono</label>
                <input id="reg-tel" type="text" v-model="formRegistro.telefono" placeholder="Número de celular" required>
              </div>
            </div>
            <div class="form-group">
              <label for="reg-correo">Correo electrónico</label>
              <input id="reg-correo" type="email" v-model="formRegistro.correo" placeholder="correo@ejemplo.com" required>
            </div>
            <div class="form-group">
              <label for="reg-pass">Contraseña</label>
              <input id="reg-pass" type="password" v-model="formRegistro.password" placeholder="Crea una contraseña" required>
            </div>
            <button type="submit" class="btn btn-primary btn-block">Crear cuenta</button>
          </form>
        </div>
      </section>

      <!-- ============ CONTENIDO CON SESIÓN ============ -->
      <section v-else class="content-section">
        <!-- Cliente -->
        <div v-if="usuarioLogueado.rol === 'Cliente'" class="client-view">
          <div class="card welcome-card">
            <h2>¡Hola, {{ usuarioLogueado.nombre }}!</h2>
            <p class="muted">
              Estado de tu cuenta:
              <span :class="['badge', usuarioLogueado.estado]">{{ usuarioLogueado.estado }}</span>
            </p>
          </div>
          <div class="grid-2">
            <div class="card">
              <span class="label">Correo</span>
              <p class="value">{{ usuarioLogueado.correo }}</p>
            </div>
            <div class="card">
              <span class="label">Teléfono</span>
              <p class="value">{{ usuarioLogueado.telefono }}</p>
            </div>
          </div>
          <p class="hint">Pronto podrás agendar tus citas desde aquí.</p>
        </div>

        <!-- Administrador -->
        <div v-else-if="usuarioLogueado.rol === 'Administrador'" class="card admin-panel">
          <div class="panel-header">
            <h2>Clientes</h2>
            <input
              class="search-input"
              type="search"
              v-model="criterioBusqueda"
              @input="ejecutarBuscar"
              placeholder="Buscar por nombre, teléfono o correo"
            >
          </div>

          <div class="table-wrap">
            <table class="data-table">
              <colgroup>
                <col style="width: 24%">
                <col style="width: 16%">
                <col style="width: 28%">
                <col style="width: 12%">
                <col style="width: 20%">
              </colgroup>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Teléfono</th>
                  <th>Correo</th>
                  <th>Estado</th>
                  <th class="col-actions">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="cliente in listaClientes" :key="cliente.correo">
                  <td>
                    <input v-if="clienteEditando?.correo === cliente.correo" type="text" v-model="clienteEditando.nombre" class="table-input">
                    <span v-else>{{ cliente.nombre }}</span>
                  </td>
                  <td>
                    <input v-if="clienteEditando?.correo === cliente.correo" type="text" v-model="clienteEditando.telefono" class="table-input">
                    <span v-else>{{ cliente.telefono }}</span>
                  </td>
                  <td class="cell-email">{{ cliente.correo }}</td>
                  <td>
                    <span :class="['badge', cliente.estado]">{{ cliente.estado }}</span>
                  </td>
                  <td class="col-actions">
                    <div v-if="clienteEditando?.correo === cliente.correo" class="actions-cell">
                      <button @click="ejecutarActualizar" class="btn btn-sm btn-primary">Guardar</button>
                      <button @click="clienteEditando = null" class="btn btn-sm btn-outline">Cancelar</button>
                    </div>
                    <div v-else class="actions-cell">
                      <button @click="clienteEditando = { ...cliente }" class="btn btn-sm btn-outline">Editar</button>
                      <button
                        @click="ejecutarCambioEstado(cliente)"
                        :class="['btn', 'btn-sm', cliente.estado === 'Activo' ? 'btn-danger' : 'btn-ok']"
                      >{{ cliente.estado === 'Activo' ? 'Inactivar' : 'Activar' }}</button>
                    </div>
                  </td>
                </tr>
                <tr v-if="listaClientes.length === 0">
                  <td colspan="5" class="no-data">No hay clientes que coincidan con la búsqueda.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ClienteController } from './controllers/ClienteController.js';

// Instanciamos el controlador del esquema de clases
const controlador = new ClienteController();

// Variables de estado global de la interfaz
const vistaAuth = ref('login');
const usuarioLogueado = ref(null);
const criterioBusqueda = ref('');
const listaClientes = ref([]);
const clienteEditando = ref(null);

const formAuth = ref({ correo: '', password: '' });
const formRegistro = ref({ nombre: '', telefono: '', correo: '', password: '' });

onMounted(() => {
  ejecutarBuscar(); // Carga los clientes predeterminados al iniciar la pantalla
});

// Función para registrar clientes (Flujo de secuencia de creación)
const ejecutarCrearCliente = async () => {
  const respuesta = await controlador.crearCliente(formRegistro.value);

  if (typeof respuesta === 'string') {
    alert(respuesta);
    return;
  }

  alert('Usuario creado correctamente');

  formRegistro.value = {
    nombre: '',
    telefono: '',
    correo: '',
    password: ''
  };

  vistaAuth.value = 'login';
};

// Función para buscar en tiempo real (Flujo de secuencia de búsqueda)
const ejecutarBuscar = async () => {
  const respuesta = await controlador.buscarCliente(criterioBusqueda.value);

  console.log('Respuesta de búsqueda:', respuesta);

  if (typeof respuesta === 'string') {
    console.error(respuesta);
    return;
  }

  listaClientes.value = respuesta;
};

// Función para guardar actualizaciones físicas de campos (Flujo de secuencia de actualización)
const ejecutarActualizar = async () => {
  const respuesta = await controlador.actualizarCliente(
    clienteEditando.value
  );

  if (typeof respuesta === 'string') {
    alert(respuesta);
    return;
  }

  alert('Cliente actualizado correctamente');

  clienteEditando.value = null;

  await ejecutarBuscar();
};

// Función para la actualización del Estado (Solicitado por el profe en lugar del Delete)
const ejecutarCambioEstado = async (cliente) => {
  const nuevoEstado = cliente.estado === 'Activo'
    ? 'Inactivo'
    : 'Activo';

  const respuesta = await controlador.cambiarEstadoCliente({
    id_usuario: cliente.id_usuario,
    estado: nuevoEstado
  });

  if (typeof respuesta === 'string') {
    alert(respuesta);
    return;
  }

  alert(`Cliente ${nuevoEstado === 'Activo' ? 'activado' : 'inactivado'} correctamente`);

  await ejecutarBuscar();
};

// Simulación del proceso de autenticación de credenciales
const login = async () => {
  const { correo, password } = formAuth.value;

  const respuesta = await controlador.iniciarSesion({
    correo,
    password
  });

  if (typeof respuesta === 'string') {
    alert(respuesta);
    return;
  }

  usuarioLogueado.value = respuesta;

  formAuth.value = {
    correo: '',
    password: ''
  };
};

const logout = () => {
  usuarioLogueado.value = null;
  formAuth.value = { correo: '', password: '' };
};
</script>

<style scoped>
/* ---------- Tokens ---------- */
.app {
  --bg: #f4f5f7;
  --surface: #ffffff;
  --ink: #16213a;          /* azul marino */
  --text: #232a3b;
  --muted: #6a7285;
  --line: #e1e4ea;
  --red: #b3262e;          /* rojo poste de barbero */
  --red-dark: #8f1d24;
  --green: #1f7a4d;
  --radius: 10px;
  --gap: 24px;

  min-height: 100vh;
  background: var(--bg);
  color: var(--text);
  font-family: 'Segoe UI', system-ui, -apple-system, Roboto, sans-serif;
  line-height: 1.5;
}
.app *, .app *::before, .app *::after { box-sizing: border-box; }

/* ---------- Header (franja de poste de barbero) ---------- */
.app-header {
  background: var(--ink);
  color: #fff;
  border-top: 6px solid transparent;
  border-image: repeating-linear-gradient(
    135deg, var(--red) 0 14px, #fff 14px 28px, #2c4a8a 28px 42px
  ) 6;
}
.header-inner {
  width: 100%;
  padding: 16px 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.brand {
  font-size: 1.35rem;
  font-weight: 700;
  letter-spacing: .3px;
  color: #fff;
}

.session-area {
  display: flex;
  align-items: center;
  gap: 16px;
}

.session-text {
  display: flex;
  flex-direction: column;
  text-align: right;
  line-height: 1.2;
}

.session-text small {
  color: #b9c0d0;
}

/* ---------- Layout ---------- */
.main { width: 100%; padding: 40px; }
.auth-section { display: flex; justify-content: center; }
.auth-card {
  width: 100%;
  max-width: 460px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  overflow: hidden;
}
.card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: var(--gap);
}
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: var(--gap); }
.client-view { display: flex; flex-direction: column; gap: var(--gap); width: 100%; }

/* ---------- Tabs ---------- */
.tabs { display: grid; grid-template-columns: 1fr 1fr; border-bottom: 1px solid var(--line); }
.tabs button {
  padding: 16px;
  background: #f8f9fb;
  border: 0;
  border-bottom: 3px solid transparent;
  font-size: 1rem;
  font-weight: 600;
  color: var(--muted);
  cursor: pointer;
}
.tabs button.active { background: var(--surface); color: var(--ink); border-bottom-color: var(--red); }
.tabs button:focus-visible { outline: 2px solid var(--red); outline-offset: -2px; }

/* ---------- Formularios ---------- */
.form { padding: 32px; display: flex; flex-direction: column; gap: 18px; }
.form h2 { font-size: 1.3rem; color: var(--ink); }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: .9rem; font-weight: 600; color: var(--ink); }
.form-group input,
.search-input,
.table-input {
  width: 100%;
  padding: 11px 12px;
  border: 1px solid #c9ced8;
  border-radius: 8px;
  font-size: 1rem;
  background: #fff;
  color: var(--text);
}
.form-group input:focus,
.search-input:focus,
.table-input:focus { outline: 2px solid var(--red); outline-offset: 0; border-color: transparent; }

/* ---------- Botones ---------- */
.btn {
  padding: 10px 18px;
  border: 1px solid transparent;
  border-radius: 8px;
  font-size: .95rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}
.btn:focus-visible { outline: 2px solid var(--red); outline-offset: 2px; }
.btn-block { width: 100%; padding: 12px; font-size: 1rem; }
.btn-sm { padding: 6px 12px; font-size: .85rem; }
.btn-primary { background: var(--red); color: #fff; }
.btn-primary:hover { background: var(--red-dark); }
.btn-outline { background: transparent; border-color: #9aa3b8; color: inherit; }
.btn-outline:hover { background: rgba(120, 130, 160, .12); }
.table-wrap .btn-outline { border-color: var(--line); color: var(--ink); }
.btn-danger { background: #fff; border-color: var(--red); color: var(--red); }
.btn-danger:hover { background: var(--red); color: #fff; }
.btn-ok { background: #fff; border-color: var(--green); color: var(--green); }
.btn-ok:hover { background: var(--green); color: #fff; }

/* ---------- Cliente ---------- */
.welcome-card h2 { font-size: 1.6rem; color: var(--ink); margin-bottom: 8px; }
.muted { color: var(--muted); }
.label { font-size: .85rem; color: var(--muted); }
.value { font-size: 1.1rem; font-weight: 600; color: var(--ink); word-break: break-word; }
.hint { text-align: center; color: var(--muted); }

/* ---------- Admin ---------- */
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: var(--gap);
}
.panel-header h2 { font-size: 1.4rem; color: var(--ink); }
.search-input { max-width: 380px; }

.table-wrap { overflow-x: auto; }
.data-table { width: 100%; min-width: 760px; border-collapse: collapse; table-layout: fixed; }
.data-table th,
.data-table td { padding: 14px 12px; text-align: left; vertical-align: middle; border-bottom: 1px solid var(--line); }
.data-table th { font-size: .85rem; font-weight: 700; color: var(--muted); background: #f8f9fb; }
.data-table tbody tr:hover { background: #fafbfc; }
.cell-email { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.col-actions { text-align: right !important; }
.actions-cell { display: flex; gap: 8px; justify-content: flex-end; }
.no-data { text-align: center !important; color: var(--muted); padding: 32px 12px !important; }

.badge { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: .8rem; font-weight: 700; }
.badge.Activo { background: #e1f3ea; color: #17623c; }
.badge.Inactivo { background: #f4e0e1; color: #8f1d24; }

/* ---------- Responsive ---------- */
@media (max-width: 640px) {
  .main { padding: 24px 16px; }
  .header-inner { padding: 12px 16px; }
  .form { padding: 24px 20px; }
  .form-row, .grid-2 { grid-template-columns: 1fr; }
  .panel-header { flex-direction: column; align-items: stretch; }
  .search-input { max-width: none; }
  .session-text { display: none; }
}
</style>