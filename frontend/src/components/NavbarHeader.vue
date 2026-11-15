<script setup>
import { LogIn, LogOut, UserCheck } from 'lucide-vue-next';

defineProps({
  usuario: { type: Object, default: null }
});

defineEmits(['abrir-auth', 'cerrar-sesion']);
</script>

<template>
  <header class="bg-blue-900 text-white shadow-md">
    <div class="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center gap-4">
      <div class="flex items-center space-x-3">
        <h1 class="text-2xl font-bold tracking-wide">APORTE</h1>
        <span class="hidden md:inline text-xs text-blue-200 border-l border-blue-700 pl-3">
          Crowdfunding y Patrocinio Deportivo
        </span>
      </div>

      <div v-if="usuario" class="flex items-center gap-3">
        <span class="hidden sm:inline-flex items-center gap-1.5 text-xs bg-blue-800/80 border border-blue-700 px-3 py-1.5 rounded-full text-blue-100">
          <UserCheck class="w-3.5 h-3.5 text-emerald-400" />
          <span>{{ usuario.email }}</span>
        </span>
        <button
          @click="$emit('cerrar-sesion')"
          class="bg-white hover:bg-rose-600 hover:text-white text-blue-900 text-xs font-semibold px-3.5 py-2 rounded-lg transition inline-flex items-center gap-1.5"
        >
          <LogOut class="w-4 h-4" />
          <span>Cerrar Sesión</span>
        </button>
      </div>

      <button
        v-else
        @click="$emit('abrir-auth')"
        class="bg-white hover:text-blue-700 text-blue-900 text-xs font-bold px-4 py-2 rounded-lg shadow transition inline-flex items-center gap-1.5"
      >
        <LogIn class="w-4 h-4" />
        <span>Iniciar Sesión</span>
      </button>
    </div>
  </header>
</template>