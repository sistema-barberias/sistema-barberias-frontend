<!--
  App.vue — Pantalla única de BarberFlow.

  Muestra una de tres vistas según el estado de la sesión:
    1. Autenticación (sin sesión): iniciar sesión o crear cuenta.
    2. Cliente: resumen de su cuenta.
    3. Administrador: gestión de clientes (buscar, crear, editar, activar/inactivar).

  La comunicación con el backend vive en controllers/ClienteController.js.
-->
<template>
  <div class="app">
    <!-- ============ ENCABEZADO ============ -->
    <header class="app-header">
      <div class="header-inner">
        <h1 class="brand">BarberFlow</h1>

        <!-- Datos de sesión: solo visibles si hay un usuario logueado -->
        <div v-if="usuarioLogueado" class="session-area">
          <span class="session-text">
            <strong>{{ usuarioLogueado.nombre }}</strong>
            <small>{{ rolActivo }}</small>
          </span>

          <!-- Menú para alternar entre la vista de Cliente y la de Administrador -->
          <details class="role-switch">
            <summary>Cambiar rol</summary>
            <div class="role-switch-menu">
              <p>Rol actual: <strong>{{ rolActivo }}</strong></p>
              <button
                type="button"
                class="btn btn-outline"
                @click="rolVista = rolActivo === 'Cliente' ? 'Administrador' : 'Cliente'"
              >{{ rolActivo === 'Cliente' ? 'Administrador' : 'Cliente' }}</button>
            </div>
          </details>

          <button type="button" class="btn btn-outline" @click="logout">Cerrar sesión</button>
        </div>
      </div>
    </header>

    <main class="main">
      <!-- ============ 1. AUTENTICACIÓN ============ -->
      <section v-if="!usuarioLogueado" class="auth-section">
        <div class="auth-wrap">
          <div class="auth-intro">
            <h2>Tu barbería, a un clic</h2>
            <p>Ingresa para gestionar tu cuenta y tus citas.</p>
          </div>

          <div class="auth-card">
            <!-- Pestañas: iniciar sesión / crear cuenta -->
            <div class="tabs" role="tablist">
              <button
                type="button"
                role="tab"
                :class="{ active: vistaAuth === 'login' }"
                @click="cambiarVista('login')"
              >Iniciar sesión</button>
              <button
                type="button"
                role="tab"
                :class="{ active: vistaAuth === 'registro' }"
                @click="cambiarVista('registro')"
              >Crear cuenta</button>
            </div>

            <!-- Formulario de inicio de sesión (correo o teléfono + contraseña) -->
            <!--
              Los formularios usan "novalidate": la validación la hace nuestro código
              y cada error aparece debajo del campo que lo causó.
            -->
            <form v-if="vistaAuth === 'login'" class="form" novalidate @submit.prevent="login">
              <h2>Bienvenido de nuevo</h2>
              <!-- Aviso de éxito (por ejemplo, después de crear la cuenta) -->
              <p v-if="mensajeExito" class="alert exito" role="status">{{ mensajeExito }}</p>

              <CampoForm
                id="login-correo"
                label="Correo electrónico o teléfono"
                v-model="formAuth.correo"
                :error="errores.correo"
                autocomplete="username"
                placeholder="ejemplo@gmail.com o 3001234567"
              />
              <CampoForm
                id="login-pass"
                label="Contraseña"
                type="password"
                v-model="formAuth.password"
                :error="errores.password"
                autocomplete="current-password"
                placeholder="Tu contraseña"
              />

              <!-- Error del servidor (credenciales incorrectas, cuenta inactiva, sin conexión...) -->
              <p v-if="errores.general" class="form-error" role="alert">{{ errores.general }}</p>
              <button type="submit" class="btn btn-primary btn-block" :disabled="enviando">
                {{ enviando ? 'Ingresando...' : 'Ingresar' }}
              </button>
            </form>

            <!-- Formulario de registro de un nuevo cliente -->
            <form v-else class="form" novalidate @submit.prevent="registrarse">
              <h2>Crea tu cuenta de cliente</h2>

              <div class="form-row">
                <CampoForm id="reg-nombre" label="Nombre completo" v-model="formRegistro.nombre" :error="errores.nombre" autocomplete="name" placeholder="Tu nombre" />
                <CampoForm id="reg-tel" label="Teléfono" type="tel" inputmode="numeric" v-model="formRegistro.telefono" :error="errores.telefono" autocomplete="tel" placeholder="Número de celular" />
              </div>
              <CampoForm id="reg-correo" label="Correo electrónico" type="email" v-model="formRegistro.correo" :error="errores.correo" autocomplete="email" placeholder="correo@gmail.com" />
              <div class="form-row">
                <CampoForm id="reg-pass" label="Contraseña" type="password" v-model="formRegistro.password" :error="errores.password" autocomplete="new-password" placeholder="6 números" />
                <CampoForm id="reg-pass2" label="Confirmar contraseña" type="password" v-model="formRegistro.confirmarPassword" :error="errores.confirmarPassword" autocomplete="new-password" placeholder="Repite la contraseña" />
              </div>

              <p v-if="errores.general" class="form-error" role="alert">{{ errores.general }}</p>
              <button type="submit" class="btn btn-primary btn-block" :disabled="enviando">
                {{ enviando ? 'Creando cuenta...' : 'Crear cuenta' }}
              </button>
            </form>
          </div>
        </div>
      </section>

      <!-- ============ CONTENIDO CON SESIÓN ============ -->
      <section v-else class="content-section">
        <!-- 2. Vista de Cliente -->
        <div v-if="rolActivo === 'Cliente'" class="client-view">
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

        <!-- Vista previa del panel: un Cliente que pulsó "Cambiar rol" ve la tabla sin poder usarla -->
        <div v-else-if="!esAdministradorReal" class="card admin-panel">
          <div class="panel-header">
            <h2>Clientes</h2>
            <span class="badge preview">Vista previa</span>
          </div>
          <div class="table-wrap">
            <table class="data-table">
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
                <tr>
                  <td data-label="Nombre">Cliente de ejemplo</td>
                  <td data-label="Teléfono">—</td>
                  <td data-label="Correo" class="cell-email">cliente@ejemplo.com</td>
                  <td data-label="Estado"><span class="badge Activo">Activo</span></td>
                  <td data-label="Acciones" class="col-actions">
                    <div class="actions-cell">
                      <button type="button" class="btn btn-sm btn-outline" disabled>Editar</button>
                      <button type="button" class="btn btn-sm btn-outline" disabled>Inactivar</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 3. Panel real del Administrador -->
        <div v-else class="card admin-panel">
          <div class="panel-header">
            <h2>Clientes</h2>
            <div class="panel-actions">
              <input
                class="search-input"
                type="search"
                v-model="criterioBusqueda"
                @input="buscarConRetraso"
                placeholder="Buscar por nombre, teléfono o correo"
              >
              <button type="button" class="btn btn-primary" @click="alternarFormNuevo">
                {{ mostrarFormNuevo ? 'Cerrar' : '+ Nuevo cliente' }}
              </button>
            </div>
          </div>

          <!-- Mensaje general del panel (se oculta mientras el formulario nuevo muestra el suyo) -->
          <p v-if="!mostrarFormNuevo && mensajeAdmin.texto" :class="['alert', mensajeAdmin.tipo]" role="alert">{{ mensajeAdmin.texto }}</p>

          <!-- Formulario para que el administrador cree un cliente -->
          <form v-if="mostrarFormNuevo" class="new-client-form" novalidate @submit.prevent="crearClienteAdmin">
            <h3>Nuevo cliente</h3>
            <div class="form-row">
              <CampoForm id="adm-nombre" label="Nombre completo" v-model="formNuevo.nombre" :error="erroresNuevo.nombre" placeholder="Nombre del cliente" />
              <CampoForm id="adm-tel" label="Teléfono" type="tel" inputmode="numeric" v-model="formNuevo.telefono" :error="erroresNuevo.telefono" placeholder="Número de celular" />
            </div>
            <CampoForm id="adm-correo" label="Correo electrónico" type="email" v-model="formNuevo.correo" :error="erroresNuevo.correo" placeholder="correo@gmail.com" />
            <div class="form-row">
              <CampoForm id="adm-pass" label="Contraseña" type="password" v-model="formNuevo.password" :error="erroresNuevo.password" autocomplete="new-password" placeholder="6 números" />
              <CampoForm id="adm-pass2" label="Confirmar contraseña" type="password" v-model="formNuevo.confirmarPassword" :error="erroresNuevo.confirmarPassword" autocomplete="new-password" placeholder="Repite la contraseña" />
            </div>

            <p v-if="erroresNuevo.general" class="form-error" role="alert">{{ erroresNuevo.general }}</p>
            <div class="form-actions">
              <button type="button" class="btn btn-outline" @click="alternarFormNuevo">Cancelar</button>
              <button type="submit" class="btn btn-primary" :disabled="enviandoAdmin">
                {{ enviandoAdmin ? 'Creando cliente...' : 'Crear cliente' }}
              </button>
            </div>
          </form>

          <!--
            Tabla de clientes. En pantallas grandes es una tabla normal; en celular
            cada fila se muestra como una tarjeta (el atributo data-label da el título
            de cada dato, ver los estilos "Responsive" al final).
          -->
          <div class="table-wrap">
            <table class="data-table">
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
                <tr v-for="cliente in listaClientes" :key="cliente.id_usuario">
                  <td data-label="Nombre">
                    <input v-if="estaEditando(cliente)" type="text" v-model="clienteEditando.nombre" class="table-input">
                    <span v-else>{{ cliente.nombre }}</span>
                  </td>
                  <td data-label="Teléfono">
                    <input v-if="estaEditando(cliente)" type="tel" inputmode="numeric" v-model="clienteEditando.telefono" class="table-input">
                    <span v-else>{{ cliente.telefono }}</span>
                  </td>
                  <td data-label="Correo" class="cell-email">{{ cliente.correo }}</td>
                  <td data-label="Estado">
                    <span :class="['badge', cliente.estado]">{{ cliente.estado }}</span>
                  </td>
                  <td data-label="Acciones" class="col-actions">
                    <!-- Modo edición: error (si lo hay) debajo de los campos, y botones guardar / cancelar -->
                    <template v-if="estaEditando(cliente)">
                      <p v-if="errorEdicion" class="field-error" role="alert">{{ errorEdicion }}</p>
                      <div class="actions-cell">
                        <button type="button" class="btn btn-sm btn-primary" @click="guardarEdicion">Guardar</button>
                        <button type="button" class="btn btn-sm btn-outline" @click="cancelarEdicion">Cancelar</button>
                      </div>
                    </template>
                    <!-- Modo normal: editar o activar/inactivar -->
                    <div v-else class="actions-cell">
                      <button type="button" class="btn btn-sm btn-outline" @click="editarCliente(cliente)">Editar</button>
                      <button
                        type="button"
                        :class="['btn', 'btn-sm', cliente.estado === 'Activo' ? 'btn-danger' : 'btn-ok']"
                        @click="cambiarEstado(cliente)"
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
import { ref, computed } from 'vue';
import CampoForm from './components/CampoForm.vue';
import { ClienteController, validarLogin, validarRegistro } from './controllers/ClienteController.js';

// El controlador es el único que habla con el backend.
// Sus métodos devuelven el dato pedido, o un texto "Error: ..." si algo falló.
const controlador = new ClienteController();

// =====================================================
// UTILIDADES
// =====================================================

const MENSAJE_VACIO = { tipo: '', texto: '' };

// Formulario de cliente en blanco (lo usan el registro y el panel de administrador)
const formVacio = () => ({ nombre: '', telefono: '', correo: '', password: '', confirmarPassword: '' });

// El controlador avisa los errores con un texto que empieza por "Error:".
const esError = (respuesta) => typeof respuesta === 'string';
const quitarPrefijoError = (texto) => texto.replace(/^Error:\s*/, '');

const hayErrores = (errores) => Object.keys(errores).length > 0;

// Convierte el error que devolvió el servidor en un objeto de errores por campo.
// Si el texto habla del correo o del teléfono, aparece debajo de ese campo;
// en cualquier otro caso va en "general" (se muestra encima del botón).
const errorDelServidor = (respuesta) => {
  const texto = quitarPrefijoError(respuesta);
  if (/correo/i.test(texto)) return { correo: texto };
  if (/tel[eé]fono/i.test(texto)) return { telefono: texto };
  return { general: texto };
};

// Valida el formulario de un cliente nuevo: reglas del controlador + confirmación de contraseña
const validarFormularioCliente = (f) => {
  const errores = validarRegistro(f);

  if (!f.confirmarPassword) {
    errores.confirmarPassword = 'Escribe de nuevo la contraseña para confirmarla.';
  } else if (f.password !== f.confirmarPassword) {
    errores.confirmarPassword = 'Las contraseñas no coinciden.';
  }

  return errores;
};

// =====================================================
// ESTADO
// =====================================================

// --- Sesión ---
const usuarioLogueado = ref(null);   // Datos del usuario que inició sesión (o null)
const rolVista = ref(null);          // Rol elegido en "Cambiar rol" (null = usar el rol real)
const rolActivo = computed(() => rolVista.value || usuarioLogueado.value?.rol);
const esAdministradorReal = computed(() => usuarioLogueado.value?.rol === 'Administrador');

// --- Autenticación (login / registro) ---
const vistaAuth = ref('login');                // 'login' | 'registro'
const formAuth = ref({ correo: '', password: '' });   // "correo" admite correo o teléfono
const formRegistro = ref(formVacio());
const errores = ref({});                       // Errores del formulario visible: { campo: 'texto' } (+ "general")
const mensajeExito = ref('');                  // Aviso de éxito mostrado en el login
const enviando = ref(false);                   // Evita envíos dobles mientras se espera al servidor

// --- Panel de administrador ---
const listaClientes = ref([]);
const criterioBusqueda = ref('');
const clienteEditando = ref(null);             // Copia del cliente que se está editando en la tabla
const errorEdicion = ref('');                  // Error mostrado bajo la fila que se está editando
const formNuevo = ref(formVacio());
const erroresNuevo = ref({});                  // Errores del formulario "Nuevo cliente"
const mostrarFormNuevo = ref(false);
const enviandoAdmin = ref(false);
const mensajeAdmin = ref({ ...MENSAJE_VACIO });   // Avisos generales del panel (éxito, o error al buscar / cambiar estado)

// =====================================================
// AUTENTICACIÓN
// =====================================================

// Cambia entre las pestañas "Iniciar sesión" y "Crear cuenta"
const cambiarVista = (vista) => {
  vistaAuth.value = vista;
  errores.value = {};
  mensajeExito.value = '';
};

// Inicia sesión con correo o teléfono + contraseña
const login = async () => {
  mensajeExito.value = '';
  errores.value = validarLogin(formAuth.value);
  if (hayErrores(errores.value)) return;   // Los errores ya quedaron bajo cada campo

  enviando.value = true;
  const respuesta = await controlador.iniciarSesion(formAuth.value);
  enviando.value = false;

  if (esError(respuesta)) {
    // Credenciales incorrectas, cuenta inactiva, sin conexión...: se muestra encima del botón
    errores.value = { general: quitarPrefijoError(respuesta) };
    return;
  }

  usuarioLogueado.value = respuesta;
  rolVista.value = null;
  errores.value = {};
  formAuth.value = { correo: '', password: '' };

  // Solo el administrador necesita la lista de clientes
  if (esAdministradorReal.value) {
    await buscarClientes();
  }
};

// Cierra la sesión y limpia todo lo relacionado con el usuario
const logout = () => {
  usuarioLogueado.value = null;
  rolVista.value = null;
  mostrarFormNuevo.value = false;
  clienteEditando.value = null;
  listaClientes.value = [];
  criterioBusqueda.value = '';
  mensajeAdmin.value = { ...MENSAJE_VACIO };
  errores.value = {};
  mensajeExito.value = '';
};

// =====================================================
// CREACIÓN DE CLIENTES (registro público y panel de administrador)
// =====================================================

// Valida y envía un formulario de cliente. Lo comparten el registro y el panel de administrador.
// Devuelve { cliente } si se creó, o { errores } con los mensajes por campo.
const enviarNuevoCliente = async (f) => {
  const erroresForm = validarFormularioCliente(f);
  if (hayErrores(erroresForm)) return { errores: erroresForm };

  // Solo se envían los datos personales: el rol y el estado los asigna el backend
  const respuesta = await controlador.crearCliente({
    nombre: f.nombre.trim(),
    telefono: f.telefono.trim(),
    correo: f.correo.trim(),
    password: f.password
  });

  if (esError(respuesta)) return { errores: errorDelServidor(respuesta) };
  return { cliente: respuesta };
};

// Registro público: crea la cuenta y lleva al usuario a la pestaña de login
const registrarse = async () => {
  enviando.value = true;
  errores.value = {};

  const resultado = await enviarNuevoCliente(formRegistro.value);
  enviando.value = false;

  if (resultado.errores) {
    errores.value = resultado.errores;
    return;
  }

  formRegistro.value = formVacio();
  vistaAuth.value = 'login';
  mensajeExito.value = 'Cuenta creada correctamente. Ya puedes iniciar sesión.';
};

// Muestra u oculta el formulario "Nuevo cliente" (siempre lo deja limpio)
const alternarFormNuevo = () => {
  mostrarFormNuevo.value = !mostrarFormNuevo.value;
  formNuevo.value = formVacio();
  erroresNuevo.value = {};
  mensajeAdmin.value = { ...MENSAJE_VACIO };
};

// El administrador crea un cliente con las mismas validaciones que el registro público
const crearClienteAdmin = async () => {
  enviandoAdmin.value = true;
  erroresNuevo.value = {};
  mensajeAdmin.value = { ...MENSAJE_VACIO };

  const { cliente, errores: erroresForm } = await enviarNuevoCliente(formNuevo.value);
  enviandoAdmin.value = false;

  if (erroresForm) {
    erroresNuevo.value = erroresForm;
    return;
  }

  formNuevo.value = formVacio();
  mostrarFormNuevo.value = false;
  mensajeAdmin.value = { tipo: 'exito', texto: `Cliente "${cliente.nombre}" creado correctamente.` };
  await buscarClientes();
};

// =====================================================
// PANEL DE ADMINISTRADOR: buscar, editar y cambiar estado
// =====================================================

// Pide al backend los clientes que coinciden con el texto del buscador
const buscarClientes = async () => {
  const respuesta = await controlador.buscarCliente(criterioBusqueda.value);

  if (esError(respuesta)) {
    mensajeAdmin.value = { tipo: 'error', texto: quitarPrefijoError(respuesta) };
    return;
  }

  listaClientes.value = respuesta;
};

// Busca mientras se escribe, pero espera 300 ms sin teclear para no saturar el servidor
let temporizadorBusqueda;
const buscarConRetraso = () => {
  clearTimeout(temporizadorBusqueda);
  temporizadorBusqueda = setTimeout(buscarClientes, 300);
};

// ¿Es esta la fila que se está editando?
const estaEditando = (cliente) => clienteEditando.value?.id_usuario === cliente.id_usuario;

// Pone una fila en modo edición (trabaja sobre una copia, así "Cancelar" no deja cambios)
const editarCliente = (cliente) => {
  clienteEditando.value = { ...cliente };
  errorEdicion.value = '';
  mensajeAdmin.value = { ...MENSAJE_VACIO };
};

const cancelarEdicion = () => {
  clienteEditando.value = null;
  errorEdicion.value = '';
};

// Guarda el nombre y teléfono editados en la tabla.
// Si algo falla, el error aparece debajo de la fila que se está editando.
const guardarEdicion = async () => {
  const { nombre, telefono } = clienteEditando.value;

  if (!nombre.trim()) {
    errorEdicion.value = 'El nombre no puede estar vacío.';
    return;
  }
  if (!/^\d+$/.test(telefono.trim())) {
    errorEdicion.value = 'El teléfono solo puede tener números, sin espacios ni guiones.';
    return;
  }

  const respuesta = await controlador.actualizarCliente(clienteEditando.value);

  if (esError(respuesta)) {
    errorEdicion.value = quitarPrefijoError(respuesta);
    return;
  }

  cancelarEdicion();
  mensajeAdmin.value = { tipo: 'exito', texto: 'Cliente actualizado correctamente.' };
  await buscarClientes();
};

// Activa o inactiva un cliente (en lugar de eliminarlo, así se conserva su historial)
const cambiarEstado = async (cliente) => {
  const nuevoEstado = cliente.estado === 'Activo' ? 'Inactivo' : 'Activo';

  const respuesta = await controlador.cambiarEstadoCliente({
    id_usuario: cliente.id_usuario,
    estado: nuevoEstado
  });

  if (esError(respuesta)) {
    mensajeAdmin.value = { tipo: 'error', texto: quitarPrefijoError(respuesta) };
    return;
  }

  mensajeAdmin.value = {
    tipo: 'exito',
    texto: `Cliente ${nuevoEstado === 'Activo' ? 'activado' : 'inactivado'} correctamente.`
  };
  await buscarClientes();
};
</script>

<style scoped>
/*
  Estilos de la aplicación — enfoque "mobile first":
  las reglas base están pensadas para celular y los @media del final
  (min-width) agregan lo necesario para tabletas y computadores.
*/

/* ---------- Colores y medidas reutilizables ---------- */
.app {
  --bg: #f6f1e9;           /* crema (fondo general) */
  --surface: #fffdf9;      /* fondo de tarjetas */
  --ink: #1f1d1b;          /* carbón (encabezado y títulos) */
  --text: #2b2825;
  --muted: #7a7268;
  --line: #e6dccd;         /* bordes suaves */
  --sand: #f7f1e7;         /* fondo de pestañas, encabezado de tabla */
  --gold: #b08d57;
  --red: #a4262c;          /* rojo poste de barbero (acción principal) */
  --red-dark: #831c21;
  --green: #1f7a4d;
  --radius: 10px;
  --gap: 16px;
  --serif: Georgia, 'Times New Roman', serif;
  --touch: 44px;           /* alto mínimo cómodo para tocar con el dedo */

  min-height: 100vh;
  background: var(--bg);
  color: var(--text);
  font-family: 'Segoe UI', system-ui, -apple-system, Roboto, sans-serif;
  line-height: 1.5;
}
.app h1, .app h2, .app h3 { margin: 0; font-family: var(--serif); font-weight: 700; color: var(--ink); }
.app p { margin: 0; }

/* ---------- Encabezado (franja de poste de barbero) ---------- */
.app-header {
  background: var(--ink);
  color: #fff;
  border-top: 6px solid transparent;
  border-image: repeating-linear-gradient(
    135deg, var(--red) 0 14px, #fff 14px 28px, #2c4a8a 28px 42px
  ) 6 0 0 0;
  box-shadow: 0 2px 0 var(--gold);
}
.header-inner {
  display: flex;
  flex-wrap: wrap;               /* en celular la sesión baja a otra línea si no cabe */
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
}
/* Se escribe con .app-header para ganarle a ".app h1" (que pinta los títulos en carbón) */
.app-header .brand { font-size: 1.35rem; letter-spacing: 1px; color: #fff; }

.session-area { position: relative; display: flex; align-items: center; gap: 12px; }
.session-text { display: none; flex-direction: column; text-align: right; line-height: 1.2; }
.session-text small { color: var(--gold); }

/* Menú "Cambiar rol": se ancla al área de sesión para no salirse de la pantalla */
.role-switch summary { display: flex; align-items: center; min-height: var(--touch); cursor: pointer; font-weight: 600; }
.role-switch summary:focus-visible { outline: 2px solid var(--gold); outline-offset: 4px; }
.role-switch-menu {
  position: absolute;
  z-index: 1;
  top: calc(100% + 8px);
  right: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: min(260px, calc(100vw - 32px));
  padding: 16px;
  color: var(--text);
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(31, 29, 27, .18);
}

/* ---------- Estructura general ---------- */
.main { padding: 20px 16px; }
.card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: 0 2px 8px rgba(31, 29, 27, .04);
  padding: var(--gap);
}

/* ---------- Autenticación ---------- */
.auth-wrap { width: 100%; max-width: 460px; margin: 0 auto; }
.auth-intro { text-align: center; margin-bottom: 16px; }
.auth-intro h2 { margin-bottom: 4px; font-size: 1.5rem; }
.auth-intro p { color: var(--muted); }
.auth-card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-top: 3px solid var(--gold);
  border-radius: var(--radius);
  box-shadow: 0 10px 30px rgba(31, 29, 27, .08);
  overflow: hidden;
}

.tabs { display: grid; grid-template-columns: 1fr 1fr; border-bottom: 1px solid var(--line); }
.tabs button {
  min-height: var(--touch);
  padding: 12px 8px;
  background: var(--sand);
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
.form { display: flex; flex-direction: column; gap: 16px; padding: 20px 16px; }
.form h2 { font-size: 1.25rem; }
.form-row { display: grid; grid-template-columns: 1fr; gap: 16px; }   /* 1 columna en celular */

/* Los campos de los formularios están en components/CampoForm.vue.
   Aquí solo se estilan el buscador y los campos de la tabla.
   font-size 16px evita que el iPhone haga zoom automático al tocar un campo */
.search-input,
.table-input {
  width: 100%;
  min-height: var(--touch);
  padding: 10px 12px;
  border: 1px solid #d6cab6;
  border-radius: 8px;
  font-size: 16px;
  background: #fff;
  color: var(--text);
}
.search-input:focus,
.table-input:focus { outline: 2px solid var(--gold); border-color: transparent; }

/* ---------- Botones ---------- */
.btn {
  min-height: var(--touch);
  padding: 10px 16px;
  border: 1px solid transparent;
  border-radius: 8px;
  font-size: .95rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: background .15s, color .15s;
}
.btn:focus-visible { outline: 2px solid var(--gold); outline-offset: 2px; }
.btn:disabled { opacity: .6; cursor: not-allowed; }
.btn-block { width: 100%; font-size: 1rem; }
.btn-sm { padding: 8px 12px; font-size: .9rem; }

.btn-primary { background: var(--red); color: #fff; }
.btn-primary:hover:not(:disabled) { background: var(--red-dark); }
.btn-outline { background: transparent; border-color: #8f877b; color: inherit; }
.btn-outline:hover:not(:disabled) { background: rgba(176, 141, 87, .15); }
.table-wrap .btn-outline { border-color: #d6cab6; color: var(--ink); }
.btn-danger { background: #fff; border-color: var(--red); color: var(--red); }
.btn-danger:hover { background: var(--red); color: #fff; }
.btn-ok { background: #fff; border-color: var(--green); color: var(--green); }
.btn-ok:hover { background: var(--green); color: #fff; }

/* ---------- Mensajes ---------- */
/* Avisos de éxito (y errores generales del panel) */
.alert { padding: 12px 14px; border-radius: 8px; font-size: .92rem; border: 1px solid transparent; }
.alert.error { background: #f9e7e8; border-color: #e8bcbf; color: var(--red-dark); }
.alert.exito { background: #e1f3ea; border-color: #b6dcc8; color: #17623c; }

/* Errores de validación: texto rojo directamente debajo del campo o encima del botón */
.field-error { font-size: .85rem; line-height: 1.3; color: var(--red-dark); }
.form-error { padding: 10px 12px; font-size: .9rem; color: var(--red-dark); background: #f9e7e8; border-left: 3px solid var(--red); border-radius: 4px; }

/* ---------- Vista de Cliente ---------- */
.client-view { display: flex; flex-direction: column; gap: var(--gap); }
.welcome-card { border-left: 4px solid var(--gold); }
.welcome-card h2 { margin-bottom: 8px; font-size: 1.4rem; }
.grid-2 { display: grid; grid-template-columns: 1fr; gap: var(--gap); }
.muted { color: var(--muted); }
.label { font-size: .85rem; color: var(--muted); }
.value { font-size: 1.1rem; font-weight: 600; color: var(--ink); word-break: break-word; }
.hint { text-align: center; color: var(--muted); }

/* ---------- Panel de Administrador ---------- */
.panel-header { display: flex; flex-direction: column; gap: 12px; margin-bottom: var(--gap); }
.panel-header h2 { font-size: 1.3rem; }
.panel-actions { display: flex; flex-direction: column; gap: 12px; }
.admin-panel > .alert { margin-bottom: var(--gap); }

.new-client-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: var(--gap);
  margin-bottom: var(--gap);
  background: var(--sand);
  border: 1px solid var(--line);
  border-radius: var(--radius);
}
.new-client-form h3 { font-size: 1.1rem; }
.form-actions { display: flex; flex-direction: column-reverse; gap: 12px; }

/* ---------- Tabla de clientes ---------- */
/*
  En celular (base) la tabla se convierte en una lista de tarjetas:
  se oculta el encabezado y cada celda muestra su título con data-label.
*/
.data-table, .data-table tbody, .data-table tr, .data-table td { display: block; width: 100%; }
.data-table thead { display: none; }
.data-table tr { padding: 4px 14px; margin-bottom: 12px; border: 1px solid var(--line); border-radius: var(--radius); background: var(--surface); }
.data-table td {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid var(--line);
  text-align: right;
  word-break: break-word;
}
.data-table td:last-child { border-bottom: 0; }
.data-table td::before {
  content: attr(data-label);
  flex-shrink: 0;
  font-size: .8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .5px;
  color: var(--muted);
  text-align: left;
}
.table-input { max-width: 60%; }
.col-actions { flex-direction: column; align-items: stretch !important; }
.col-actions::before { display: none; }
.actions-cell { display: flex; gap: 8px; }
.actions-cell .btn { flex: 1; }
.data-table .no-data { display: block; text-align: center; color: var(--muted); padding: 24px 12px; }
.data-table .no-data::before { display: none; }

.badge { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: .8rem; font-weight: 700; }
.badge.Activo { background: #e1f3ea; color: #17623c; }
.badge.Inactivo { background: #f4e0e1; color: #831c21; }
.badge.preview { background: #efe8da; color: var(--muted); }

/* ---------- Tabletas (≥ 640px) ---------- */
@media (min-width: 640px) {
  .app { --gap: 24px; }
  .header-inner { padding: 14px 24px; }
  .session-text { display: flex; }
  .main { padding: 32px 24px; }
  .auth-intro h2 { font-size: 1.8rem; }
  .form { padding: 32px; }
  .form-row, .grid-2 { grid-template-columns: 1fr 1fr; }
  .form-actions { flex-direction: row; justify-content: flex-end; }
  .panel-header { flex-direction: row; align-items: center; justify-content: space-between; }
  .panel-actions { flex-direction: row; align-items: center; flex: 1; justify-content: flex-end; }
  .search-input { max-width: 380px; }
  .panel-actions .btn { flex-shrink: 0; }
}

/* ---------- Computador (≥ 900px): la tarjeta vuelve a ser tabla ---------- */
@media (min-width: 900px) {
  .header-inner { padding: 14px 40px; }
  .main { padding: 40px; }

  .table-wrap { overflow-x: auto; }
  .data-table { display: table; table-layout: fixed; border-collapse: collapse; }
  .data-table thead { display: table-header-group; }
  .data-table tbody { display: table-row-group; }
  .data-table tr { display: table-row; padding: 0; margin: 0; border: 0; border-radius: 0; background: none; }
  .data-table th,
  .data-table td { display: table-cell; width: auto; padding: 14px 12px; text-align: left; vertical-align: middle; border-bottom: 1px solid var(--line); }
  .data-table td::before { display: none; }
  .data-table th { font-size: .8rem; font-weight: 700; letter-spacing: .5px; text-transform: uppercase; color: var(--muted); background: var(--sand); }
  .data-table tbody tr:hover { background: #fbf7f0; }
  .data-table td:last-child { border-bottom: 1px solid var(--line); }
  .table-input { max-width: none; }
  .cell-email { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .col-actions { text-align: right !important; }
  .actions-cell { justify-content: flex-end; }
  .actions-cell .btn { flex: none; }
  .btn-sm { padding: 6px 12px; min-height: 0; }
}
</style>
