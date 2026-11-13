<script setup>
import { computed } from 'vue';
import { formatearMoneda } from '../helpers/formatters';

const props = defineProps({
  visible: { type: Boolean, required: true },
  campana: { type: Object, default: null }
});

defineEmits(['cerrar']);

const sponsorsConfirmados = computed(() => {
  if (!props.campana?.slotsIndumentaria) return [];
  return props.campana.slotsIndumentaria.filter(s => s.estado === 'reservado');
});

const ingresosExternos = computed(() => {
  return props.campana?.ingresosExternos || [];
});

const totalSponsors = computed(() =>
  sponsorsConfirmados.value.reduce((acc, s) => acc + Number(s.precio || 0), 0)
);

const totalExternos = computed(() =>
  ingresosExternos.value.reduce((acc, i) => acc + Number(i.monto || 0), 0)
);

const aportesDirectos = computed(() => {
  const total = Number(props.campana?.recaudado || 0);
  return Math.max(0, total - totalSponsors.value - totalExternos.value);
});
</script>

<template>
  <div v-if="visible && campana" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-xl shadow-xl max-w-xl w-full p-6 max-h-[85vh] overflow-y-auto">
      <div class="flex justify-between items-start mb-4">
        <div>
          <span class="text-xs font-bold uppercase tracking-wider text-blue-600">Rendición de Cuentas</span>
          <h3 class="text-xl font-bold text-slate-900">{{ campana.titulo }}</h3>
        </div>
        <button @click="$emit('cerrar')" class="text-slate-400 hover:text-slate-600 font-bold text-lg px-2">✕</button>
      </div>

      <!-- Resumen de composición de fondos -->
      <div class="grid grid-cols-3 gap-3 mb-6">
        <div class="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
          <p class="text-[11px] font-bold text-emerald-700 uppercase">Aportes Web/App</p>
          <p class="text-base font-bold text-emerald-900">${{ formatearMoneda(aportesDirectos) }}</p>
        </div>
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p class="text-[11px] font-bold text-blue-700 uppercase">Sponsors</p>
          <p class="text-base font-bold text-blue-900">${{ formatearMoneda(totalSponsors) }}</p>
        </div>
        <div class="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p class="text-[11px] font-bold text-amber-700 uppercase">Ing. Externos</p>
          <p class="text-base font-bold text-amber-900">${{ formatearMoneda(totalExternos) }}</p>
        </div>
      </div>

      <!-- Sponsors confirmados -->
      <div class="mb-6">
        <h4 class="text-xs font-bold text-slate-700 uppercase mb-2">
          Sponsors Confirmados en Camiseta ({{ sponsorsConfirmados.length }})
        </h4>
        <div v-if="sponsorsConfirmados.length > 0" class="divide-y divide-slate-100 border border-slate-200 rounded-lg">
          <div v-for="slot in sponsorsConfirmados" :key="slot.idSlot" class="p-3 flex justify-between items-center text-sm">
            <div>
              <p class="font-bold text-slate-900">{{ slot.sponsor?.nombreEmpresa || 'Sponsor' }}</p>
              <p class="text-xs text-slate-500">
                Ubicación: {{ slot.posicion }}
                <span v-if="slot.sponsor?.cuit"> • CUIT: {{ slot.sponsor.cuit }}</span>
              </p>
            </div>
            <span class="font-bold text-blue-600">${{ formatearMoneda(slot.precio) }}</span>
          </div>
        </div>
        <p v-else class="text-sm text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200">
          Todavía no hay sponsors confirmados en esta campaña.
        </p>
      </div>

      <!-- Ingresos externos declarados -->
      <div class="mb-6">
        <h4 class="text-xs font-bold text-slate-700 uppercase mb-2">
          Ingresos Externos Declarados ({{ ingresosExternos.length }})
        </h4>
        <div v-if="ingresosExternos.length > 0" class="divide-y divide-slate-100 border border-slate-200 rounded-lg">
          <div v-for="(ingreso, idx) in ingresosExternos" :key="idx" class="p-3 flex justify-between items-center text-sm">
            <div>
              <p class="font-bold text-slate-900">{{ ingreso.concepto }}</p>
              <p class="text-xs text-slate-500">Fecha: {{ ingreso.fecha || 'Sin fecha' }}</p>
            </div>
            <span class="font-bold text-amber-700">${{ formatearMoneda(ingreso.monto) }}</span>
          </div>
        </div>
        <p v-else class="text-sm text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200">
          No se declararon ingresos externos (rifas, eventos, bonos) aún.
        </p>
      </div>

      <div class="flex justify-between items-center pt-4 border-t border-slate-100">
        <span class="text-sm font-bold text-slate-700">
          Total Recaudado: <span class="text-emerald-600">${{ formatearMoneda(campana.recaudado) }}</span>
        </span>
        <button
          @click="$emit('cerrar')"
          class="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition"
        >
          Cerrar
        </button>
      </div>
    </div>
  </div>
</template>