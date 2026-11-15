<script setup>
import { computed } from 'vue';
import { ExternalLink, FileText } from 'lucide-vue-next';
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

const ingresosExternos = computed(() => props.campana?.ingresosExternos || []);
const gastosRendidos = computed(() => props.campana?.gastos || []);

const totalSponsors = computed(() =>
  sponsorsConfirmados.value.reduce((acc, s) => acc + Number(s.precio || 0), 0)
);

const totalExternos = computed(() =>
  ingresosExternos.value.reduce((acc, i) => acc + Number(i.monto || 0), 0)
);

const totalGastos = computed(() =>
  gastosRendidos.value.reduce((acc, g) => acc + Number(g.monto || 0), 0)
);

const aportesDirectos = computed(() => {
  const total = Number(props.campana?.recaudado || 0);
  return Math.max(0, total - totalSponsors.value - totalExternos.value);
});

const saldoDisponible = computed(() => {
  const total = Number(props.campana?.recaudado || 0);
  return Math.max(0, total - totalGastos.value);
});
</script>

<template>
  <div v-if="visible && campana" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[88vh] overflow-y-auto">
      <div class="flex justify-between items-start mb-4">
        <div>
          <span class="text-xs font-bold uppercase tracking-wider text-blue-600">Transparencia y Rendición de Cuentas</span>
          <h3 class="text-xl font-bold text-slate-900">{{ campana.titulo }}</h3>
        </div>
        <button @click="$emit('cerrar')" class="text-slate-400 hover:text-slate-600 font-bold text-lg px-2">✕</button>
      </div>

      <div class="grid grid-cols-3 gap-3 mb-4">
        <div class="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
          <p class="text-[11px] font-bold text-emerald-700 uppercase">Total Recaudado</p>
          <p class="text-base font-bold text-emerald-900">${{ formatearMoneda(campana.recaudado) }}</p>
        </div>
        <div class="bg-rose-50 border border-rose-200 rounded-lg p-3">
          <p class="text-[11px] font-bold text-rose-700 uppercase">Gastos Rendidos</p>
          <p class="text-base font-bold text-rose-900">${{ formatearMoneda(totalGastos) }}</p>
        </div>
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p class="text-[11px] font-bold text-blue-700 uppercase">Saldo Disponible</p>
          <p class="text-base font-bold text-blue-900">${{ formatearMoneda(saldoDisponible) }}</p>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-2 mb-6 text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5">
        <div>
          <span class="text-slate-500">Aportes</span>
          <strong class="block text-slate-800">${{ formatearMoneda(aportesDirectos) }}</strong>
        </div>
        <div>
          <span class="text-slate-500">Sponsors Camiseta:</span>
          <strong class="block text-slate-800">${{ formatearMoneda(totalSponsors) }}</strong>
        </div>
        <div>
          <span class="text-slate-500">Ingresos Externos:</span>
          <strong class="block text-slate-800">${{ formatearMoneda(totalExternos) }}</strong>
        </div>
      </div>

      <div class="mb-6">
        <h4 class="text-xs font-bold text-slate-700 uppercase mb-2">
          Gastos Rendidos y Facturas ({{ gastosRendidos.length }})
        </h4>
        <div v-if="gastosRendidos.length > 0" class="divide-y divide-slate-100 border border-slate-200 rounded-lg">
          <div v-for="(gasto, idx) in gastosRendidos" :key="idx" class="p-3 flex justify-between items-center gap-3 text-sm">
            <div class="min-w-0">
              <p class="font-bold text-slate-900 truncate">{{ gasto.concepto }}</p>
              <p class="text-xs text-slate-500">Fecha: {{ gasto.fecha || 'Sin fecha' }}</p>
            </div>
            <div class="flex items-center gap-3 shrink-0">
              <span class="font-bold text-rose-600">-${{ formatearMoneda(gasto.monto) }}</span>
              <a
                v-if="gasto.comprobanteUrl"
                :href="gasto.comprobanteUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="bg-slate-100 hover:bg-blue-50 text-blue-700 border border-slate-300 hover:border-blue-300 text-xs font-semibold px-2.5 py-1.5 rounded-lg inline-flex items-center gap-1 transition"
              >
                <FileText class="w-3.5 h-3.5" />
                <span>Ver Factura</span>
                <ExternalLink class="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
        <p v-else class="text-sm text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200">
          Todavía no se rindieron facturas de gastos en esta campaña.
        </p>
      </div>

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
            <span class="font-bold text-amber-700">+${{ formatearMoneda(ingreso.monto) }}</span>
          </div>
        </div>
        <p v-else class="text-sm text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200">
          No se declararon ingresos externos (rifas, eventos, bonos) aún.
        </p>
      </div>

      <div class="flex justify-end pt-4 border-t border-slate-100">
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