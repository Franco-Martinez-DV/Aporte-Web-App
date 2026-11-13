<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  visible: { type: Boolean, required: true },
  campana: { type: Object, default: null },
  enviando: { type: Boolean, default: false }
});

const emit = defineEmits(['cerrar', 'guardar']);

const formulario = ref({
  monto: 10000,
  concepto: '',
  fecha: new Date().toISOString().split('T')[0]
});

watch(
  () => props.visible,
  (abierto) => {
    if (abierto) {
      formulario.value = {
        monto: 10000,
        concepto: '',
        fecha: new Date().toISOString().split('T')[0]
      };
    }
  }
);

const enviarIngreso = () => {
  if (props.enviando) return;
  if (!formulario.value.concepto.trim()) {
    alert('Ingresá el concepto del ingreso');
    return;
  }
  emit('guardar', { ...formulario.value });
};
</script>

<template>
  <div v-if="visible" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative">
      <h3 class="text-xl font-bold text-slate-900 mb-1">Declarar Ingreso Externo</h3>
      <p class="text-slate-600 text-xs mb-4">Registrar fondos obtenidos por rifas o eventos locales.</p>

      <form @submit.prevent="enviarIngreso" class="space-y-4">
        <div>
          <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Concepto / Origen</label>
          <input
            v-model="formulario.concepto"
            type="text"
            required
            placeholder="Ej: Sorteo de indumentaria en el club"
            class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
          />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Monto ($)</label>
            <input
              v-model.number="formulario.monto"
              type="number"
              min="1"
              required
              class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600 font-bold text-slate-800"
            />
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Fecha</label>
            <input
              v-model="formulario.fecha"
              type="date"
              required
              class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
            />
          </div>
        </div>

        <div class="flex justify-end space-x-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            :disabled="enviando"
            @click="$emit('cerrar')"
            class="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            type="submit"
            :disabled="enviando"
            class="px-4 py-2 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ enviando ? 'Guardando...' : 'Guardar Ingreso' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>