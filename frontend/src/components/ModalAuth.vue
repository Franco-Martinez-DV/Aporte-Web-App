<script setup>
import { ref, watch } from 'vue';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from '@firebase/auth';
import { auth } from '../firebase';

const props = defineProps({
  visible: { type: Boolean, required: true }
});

const emit = defineEmits(['cerrar', 'autenticado']);

const modoRegistro = ref(false);
const email = ref('');
const password = ref('');
const confirmarPassword = ref('');
const cargando = ref(false);
const errorMensaje = ref('');

watch(
  () => props.visible,
  (abierto) => {
    if (abierto) {
      email.value = '';
      password.value = '';
      confirmarPassword.value = '';
      errorMensaje.value = '';
      cargando.value = false;
    }
  }
);

const traducirErrorFirebase = (code) => {
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Correo electrónico o contraseña incorrectos.';
    case 'auth/email-already-in-use':
      return 'Ya existe una cuenta registrada con este correo.';
    case 'auth/weak-password':
      return 'La contraseña debe tener al menos 6 caracteres.';
    case 'auth/invalid-email':
      return 'Ingresá un correo electrónico válido.';
    default:
      return 'No se pudo completar la autenticación. Intentá nuevamente.';
  }
};

const procesarAuth = async () => {
  if (cargando.value) return;
  errorMensaje.value = '';

  if (modoRegistro.value && password.value !== confirmarPassword.value) {
    errorMensaje.value = 'Las contraseñas no coinciden.';
    return;
  }

  cargando.value = true;
  try {
    if (modoRegistro.value) {
      await createUserWithEmailAndPassword(auth, email.value.trim(), password.value);
    } else {
      await signInWithEmailAndPassword(auth, email.value.trim(), password.value);
    }
    emit('autenticado');
    emit('cerrar');
  } catch (err) {
    errorMensaje.value = traducirErrorFirebase(err.code);
  } finally {
    cargando.value = false;
  }
};
</script>

<template>
  <div v-if="visible" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-xl font-bold text-slate-900">
          {{ modoRegistro ? 'Crear Cuenta en Aporte' : 'Iniciar Sesión' }}
        </h3>
        <button @click="$emit('cerrar')" class="text-slate-400 hover:text-slate-600 font-bold text-lg">✕</button>
      </div>

      <div class="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-lg mb-5">
        <button
          type="button"
          @click="modoRegistro = false; errorMensaje = ''"
          :class="[
            'py-2 text-xs font-bold rounded-md transition',
            !modoRegistro ? 'bg-white text-[#0077FF] shadow-sm' : 'text-slate-600 hover:text-slate-900'
          ]"
        >
          Iniciar Sesión
        </button>
        <button
          type="button"
          @click="modoRegistro = true; errorMensaje = ''"
          :class="[
            'py-2 text-xs font-bold rounded-md transition',
            modoRegistro ? 'bg-white text-[#0077FF] shadow-sm' : 'text-slate-600 hover:text-slate-900'
          ]"
        >
          Crear Cuenta
        </button>
      </div>

      <form @submit.prevent="procesarAuth" class="space-y-4">
        <div>
          <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Correo Electrónico</label>
          <input
            v-model="email"
            type="email"
            required
            placeholder="deportista@ejemplo.com"
            class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Contraseña</label>
          <input
            v-model="password"
            type="password"
            required
            minlength="6"
            placeholder="Mínimo 6 caracteres"
            class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div v-if="modoRegistro">
          <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Confirmar Contraseña</label>
          <input
            v-model="confirmarPassword"
            type="password"
            required
            minlength="6"
            placeholder="Repetí tu contraseña"
            class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <p v-if="errorMensaje" class="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-2.5">
          {{ errorMensaje }}
        </p>

        <div class="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            :disabled="cargando"
            @click="$emit('cerrar')"
            class="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            :disabled="cargando"
            class="px-5 py-2 text-sm font-semibold text-white bg-[#0077FF] hover:bg-blue-600 rounded-lg shadow transition disabled:opacity-50"
          >
            {{ cargando ? 'Procesando...' : (modoRegistro ? 'Registrarme' : 'Ingresar') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>