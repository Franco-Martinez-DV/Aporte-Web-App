<script setup>
import { ref, watch } from 'vue';
import { CreditCard } from 'lucide-vue-next';

const props = defineProps({
  visible: { type: Boolean, required: true },
  campana: { type: Object, default: null },
  enviando: { type: Boolean, default: false }
});

const emit = defineEmits(['cerrar', 'confirmar', 'pagar-mp']);
const montoInput = ref(5000);

watch(
  () => props.visible,
  (abierto) => {
    if (abierto) montoInput.value = 5000;
  }
);

const validarMonto = () => {
  if (!montoInput.value || montoInput.value <= 0) {
    alert('Por favor ingresá un monto mayor a 0');
    return false;
  }
  return true;
};

const pagarConMercadoPago = () => {
  if (props.enviando || !validarMonto()) return;
  emit('pagar-mp', montoInput.value);
};

const enviarAporteSimulado = () => {
  if (props.enviando || !validarMonto()) return;
  emit('confirmar', montoInput.value);
};
</script>

<template>
  <div v-if="visible" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative">
      <h3 class="text-xl font-bold text-slate-900 mb-1">Realizar Aporte</h3>
      <p class="text-slate-600 text-sm mb-4">
        Campaña: <strong class="text-slate-900">{{ campana?.titulo }}</strong>
      </p>

      <form @submit.prevent="pagarConMercadoPago" class="space-y-4">
        <div>
          <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Monto a Aportar ($)</label>
          <input
            v-model.number="montoInput"
            type="number"
            min="100"
            required
            class="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#009EE3] font-bold text-slate-900 text-lg"
          />
        </div>

        <div class="pt-3 border-t border-slate-100 space-y-2.5">
          <button
            type="submit"
            :disabled="enviando"
            class="w-full py-2.5 px-4 text-sm font-bold text-white bg-[#009EE3] hover:bg-[#0082BC] rounded-lg shadow transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CreditCard class="w-4 h-4" />
            <span>{{ enviando ? 'Redirigiendo a Mercado Pago...' : 'Pagar con Mercado Pago' }}</span>
          </button>

          <div class="flex items-center justify-between pt-1">
            <button
              type="button"
              :disabled="enviando"
              @click="enviarAporteSimulado"
              class="text-xs font-semibold text-emerald-700 hover:text-emerald-800 underline disabled:opacity-50"
            >
              Simular aporte directo (sin pasarela)
            </button>

            <button
              type="button"
              :disabled="enviando"
              @click="$emit('cerrar')"
              class="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>