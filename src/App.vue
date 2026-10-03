<template>
  <div id="app" class="container">
    <header class="app-header">
      <div class="logo-area">
        <h2>💈 BarberSys - Sprint 1</h2>
      </div>
      <div v-if="usuarioLogueado" class="session-area">
        <span>Sesión: <strong>{{ usuarioLogueado.nombre }} ({{ usuarioLogueado.rol }})</strong></span>
        <button @click="logout" class="btn-logout">Cerrar Sesión</button>
      </div>
    </header>

    <section v-if="!usuarioLogueado" class="auth-section">
      <div class="tabs">
        <button @click="vistaAuth = 'login'" :class="{ active: vistaAuth === 'login' }">Iniciar Sesión</button>
        <button @click="vistaAuth = 'registro'" :class="{ active: vistaAuth === 'registro' }">Registrarse de forma Pública</button>
      </div>

      <div v-if="vistaAuth === 'login'" class="form-card">
        <h3>Ingreso al Sistema</h3>
        <form @submit.prevent="login">
          <div class="form-group">
            <label>Correo Electrónico:</label>
            <input type="email" v-model="formAuth.correo" placeholder="ejemplo@correo.com" required>
          </div>
          <div class="form-group">
            <label>Contraseña:</label>
            <input type="password" v-model="formAuth.password" placeholder="••••••••" required>
          </div>
          <button type="submit" class="btn-primary">Ingresar</button>
        </form>
      </div>

      <div v-if="vistaAuth === 'registro'" class="form-card">
        <h3>Crear Cuenta de Cliente</h3>
        <form @submit.prevent="ejecutarCrearCliente">
          <div class="form-group">
            <label>Nombre Completo:</label>
            <input type="text" v-model="formRegistro.nombre" placeholder="Tu Nombre" required>
          </div>
          <div class="form-group">
            <label>Teléfono:</label>
            <input type="text" v-model="formRegistro.telefono" placeholder="Número de celular" required>
          </div>
          <div class="form-group">
            <label>Correo Electrónico:</label>
            <input type="email" v-model="formRegistro.correo" placeholder="correo@ejemplo.com" required>
          </div>
          <div class="form-group">
            <label>Contraseña de Seguridad:</label>
            <input type="password" v-model="formRegistro.password" placeholder="Crea una contraseña" required>
          </div>
          <button type="submit" class="btn-success">Completar Registro</button>
        </form>
      </div>
    </section>

    <section v-else class="content-section">
      
      <div v-if="usuarioLogueado.rol === 'Cliente'" class="welcome-card">
        <h2>¡Hola, {{ usuarioLogueado.nombre }}! 👋</h2>
        <p>Tu cuenta se encuentra actualmente en estado: <span class="badge Activo">{{ usuarioLogueado.estado }}</span></p>
        <div class="info-box">
          <p><strong>Correo:</strong> {{ usuarioLogueado.correo }}</p>
          <p><strong>Teléfono:</strong> {{ usuarioLogueado.telefono }}</p>
        </div>
        <p class="hint">El módulo para agendar tus citas estará disponible en el Sprint 2.</p>
      </div>

      <div v-else-if="usuarioLogueado.rol === 'Administrador'" class="admin-panel">
        <div class="panel-header">
          <h3>Panel de Control - Administración de Clientes</h3>
        </div>
        
        <div class="search-box">
          <input 
            type="text" 
            v-model="criterioBusqueda" 
            @input="ejecutarBuscar" 
            placeholder="🔍 Buscar clientes por nombre, apellido o correo electrónico..."
          >
        </div>

        <table class="data-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Teléfono</th>
              <th>Correo Electrónico</th>
              <th>Estado</th>
              <th>Acciones de Gestión</th>
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
              <td>{{ cliente.correo }}</td>
              <td>
                <span :class="['badge', cliente.estado]">{{ cliente.estado }}</span>
              </td>
              <td>
                <div v-if="clienteEditando?.correo === cliente.correo" class="actions-cell">
                  <button @click="ejecutarActualizar" class="btn-action btn-save">Guardar</button>
                  <button @click="clienteEditando = null" class="btn-action btn-cancel">Cancelar</button>
                </div>
                <div v-else class="actions-cell">
                  <button @click="clienteEditando = { ...cliente }" class="btn-action btn-edit">Editar Datos</button>
                  <button @click="ejecutarCambioEstado(cliente)" :class="['btn-action', cliente.estado === 'Activo' ? 'btn-disable' : 'btn-enable']">
                    {{ cliente.estado === 'Activo' ? 'Inactivar' : 'Activar' }}
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="listaClientes.length === 0">
              <td colspan="5" class="no-data">No se encontraron registros que coincidan con la búsqueda.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
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

// Administrador maestro del sistema
const adminCredenciales = {
  correo: 'admin@barberia.com',
  password: 'admin',
  nombre: 'Administrador Principal',
  rol: 'Administrador'
};

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

  // Validación temporal del Administrador
  if (
    correo === adminCredenciales.correo &&
    password === adminCredenciales.password
  ) {
    usuarioLogueado.value = adminCredenciales;
    ejecutarBuscar();
    return;
  }

  // Login de Clientes mediante el backend
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
/* Paleta de colores elegante tipo Barbería (Oscuros, Grises, Blancos y acentos limpios) */
.container { max-width: 950px; margin: 40px auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 0 20px; }
.app-header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 15px; border-bottom: 3px solid #1a1a1a; margin-bottom: 25px; }
.tabs { display: flex; margin-bottom: 20px; }
.tabs button { flex: 1; padding: 12px; background: #e0e0e0; border: none; cursor: pointer; font-size: 16px; font-weight: bold; transition: 0.3s; }
.tabs button.active { background: #1a1a1a; color: #fff; }
.form-card { background: #f9f9f9; padding: 25px; border: 1px solid #ddd; border-radius: 6px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
.form-group { margin-bottom: 15px; }
.form-group label { display: block; margin-bottom: 5px; font-weight: 600; }
.form-group input { width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; }
.search-box input { width: 100%; padding: 12px; border: 2px solid #1a1a1a; border-radius: 4px; font-size: 15px; margin-bottom: 20px; }
.data-table { width: 100%; border-collapse: collapse; margin-top: 10px; background: white; }
.data-table th, .data-table td { padding: 12px; border: 1px solid #ddd; text-align: left; }
.data-table th { background: #1a1a1a; color: white; }
.table-input { padding: 6px; border: 1px solid #222; border-radius: 3px; width: 85%; }
.badge { padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: bold; display: inline-block; }
.badge.Activo { background: #d4edda; color: #155724; }
.badge.Inactivo { background: #f8d7da; color: #721c24; }
.actions-cell { display: flex; gap: 5px; }
.btn-action { padding: 6px 12px; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; font-size: 13px; }
.btn-edit { background: #ffc107; color: #000; }
.btn-disable { background: #dc3545; color: white; }
.btn-enable { background: #28a745; color: white; }
.btn-save { background: #007bff; color: white; }
.btn-cancel { background: #6c757d; color: white; }
.btn-primary { background: #1a1a1a; color: white; width: 100%; padding: 12px; border: none; font-size: 16px; cursor: pointer; }
.btn-success { background: #28a745; color: white; width: 100%; padding: 12px; border: none; font-size: 16px; cursor: pointer; }
.btn-logout { background: #dc3545; color: white; border: none; padding: 6px 12px; cursor: pointer; border-radius: 4px; margin-left: 10px; }
.welcome-card { background: #f4f6f9; border-left: 5px solid #1a1a1a; padding: 25px; border-radius: 4px; }
.info-box { background: white; padding: 15px; border: 1px solid #eee; margin: 15px 0; border-radius: 4px; }
.no-data { text-align: center; color: #777; font-style: italic; }
</style>