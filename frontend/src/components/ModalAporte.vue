<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  visible: { type: Boolean, required: true },
  campana: { type: Object, default: null }
});

const emit = defineEmits(['cerrar', 'confirmar']);
const montoInput = ref(5000);

watch(
  () => props.visible,
  (abierto) => {
    if (abierto) montoInput.value = 5000;
  }
);

const enviarAporte = () => {
  if (!montoInput.value || montoInput.value <= 0) {
    alert('Por favor ingresá un monto mayor a 0');
    return;
  }
  emit('confirmar', montoInput.value);
};
</script>

<template>
  <div v-if="visible" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative">
      <h3 class="text-xl font-bold text-slate-900 mb-2">Simular Aporte</h3>
      <p class="text-slate-600 text-sm mb-4">
        Campaña: <strong class="text-slate-900">{{ campana?.titulo }}</strong>
      </p>

      <form @submit.prevent="enviarAporte" class="space-y-4">
        <div>
          <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Monto a Aportar ($)</label>
          <input
            v-model.number="montoInput"
            type="number"
            min="100"
            required
            class="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-bold text-emerald-700 text-lg"
          />
        </div>

        <div class="flex justify-end space-x-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            @click="$emit('cerrar')"
            class="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            Cancelar
          </button>
          <button
            type="submit"
            class="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow transition"
          >
            Confirmar Aporte
          </button>
        </div>
      </form>
    </div>
  </div>
</template>