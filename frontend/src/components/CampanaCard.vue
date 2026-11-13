<script setup>
import { ref, watch } from 'vue';
import { calcularPorcentaje, formatearMoneda } from '../helpers/formatters';
import {
  Shirt,
  HeartHandshake,
  Receipt,
  QrCode,
  FileText,
  Pencil,
  Trash2,
  Trophy
} from 'lucide-vue-next';

const props = defineProps({
  campana: { type: Object, required: true }
});

defineEmits([
  'abrir-camiseta',
  'abrir-aporte',
  'abrir-ingreso',
  'abrir-qr',
  'abrir-transparencia',
  'editar',
  'eliminar'
]);

const imagenRota = ref(false);

watch(
  () => props.campana.imagenUrl,
  () => {
    imagenRota.value = false;
  }
);
</script>

<template>
  <article class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col justify-between hover:shadow-md transition">
    <div>
      <!-- Portada de la campaña -->
      <div class="w-full h-44 bg-slate-100 overflow-hidden relative">
        <img
          v-if="campana.imagenUrl && !imagenRota"
          :src="campana.imagenUrl"
          :alt="campana.titulo"
          @error="imagenRota = true"
          class="w-full h-full object-cover"
        />
        <div
          v-else
          class="w-full h-full bg-gradient-to-br from-[#0077FF] to-blue-800 flex flex-col items-center justify-center text-white/90"
        >
          <Trophy class="w-9 h-9 mb-1 opacity-85" />
          <span class="text-[11px] font-bold uppercase tracking-widest opacity-80">Aporte Deportivo</span>
        </div>
      </div>

      <div class="p-5 pb-0">
        <div class="flex justify-between items-center mb-3 gap-2">
          <span class="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded uppercase tracking-wider">
            {{ campana.categoria }}
          </span>
          <span
            :class="[
              'text-xs font-bold px-2.5 py-1 rounded uppercase',
              campana.tipo === 'patrocinio' ? 'bg-blue-600 text-white' : 'bg-emerald-100 text-emerald-700'
            ]"
          >
            {{ campana.tipo === 'patrocinio' ? 'Camiseta Virtual' : 'Donación' }}
          </span>
        </div>

        <h3 class="text-lg font-bold text-slate-900 mb-2 line-clamp-1">{{ campana.titulo }}</h3>
        <p class="text-slate-600 text-sm mb-4 line-clamp-3">{{ campana.descripcion }}</p>
      </div>
    </div>

    <div class="px-5 pb-5 pt-0">
      <div class="w-full bg-slate-200 rounded-full h-2.5 mb-2">
        <div
          class="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
          :style="{ width: calcularPorcentaje(campana.recaudado, campana.montoObjetivo) + '%' }"
        ></div>
      </div>

      <div class="flex justify-between items-center text-sm mb-4">
        <span class="font-bold text-emerald-600">${{ formatearMoneda(campana.recaudado) }}</span>
        <span class="text-slate-500">de ${{ formatearMoneda(campana.montoObjetivo) }}</span>
      </div>

      <div class="space-y-2 mb-3">
        <button
          v-if="campana.tipo === 'patrocinio'"
          @click="$emit('abrir-camiseta', campana)"
          class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition flex items-center justify-center gap-2 text-sm shadow-sm"
        >
          <Shirt class="w-4 h-4" />
          <span>Ver / Patrocinar Camiseta Virtual</span>
        </button>

        <button
          @click="$emit('abrir-aporte', campana)"
          class="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold py-2 px-4 rounded-lg border border-emerald-200 transition flex items-center justify-center gap-2 text-sm"
        >
          <HeartHandshake class="w-4 h-4" />
          <span>Simular Aporte</span>
        </button>

        <button
          @click="$emit('abrir-ingreso', campana)"
          class="w-full bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold py-2 px-4 rounded-lg border border-amber-200 transition flex items-center justify-center gap-2 text-sm"
        >
          <Receipt class="w-4 h-4" />
          <span>Declarar Ingreso Externo</span>
        </button>

        <button
          @click="$emit('abrir-qr', campana)"
          class="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-4 rounded-lg border border-slate-300 transition flex items-center justify-center gap-2 text-sm"
        >
          <QrCode class="w-4 h-4" />
          <span>Compartir / Código QR</span>
        </button>

        <button
          @click="$emit('abrir-transparencia', campana)"
          class="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold py-2 px-4 rounded-lg border border-blue-200 transition flex items-center justify-center gap-2 text-sm"
        >
          <FileText class="w-4 h-4" />
          <span>Transparencia y Movimientos</span>
        </button>
      </div>

      <div class="flex justify-between items-center pt-3 border-t border-slate-100">
        <button
          @click="$emit('editar', campana)"
          class="text-xs font-semibold text-blue-600 hover:text-blue-800 px-3 py-1.5 rounded hover:bg-blue-50 transition inline-flex items-center gap-1.5"
        >
          <Pencil class="w-3.5 h-3.5" />
          <span>Editar</span>
        </button>
        <button
          @click="$emit('eliminar', campana.id)"
          class="text-xs font-semibold text-rose-600 hover:text-rose-800 px-3 py-1.5 rounded hover:bg-rose-50 transition inline-flex items-center gap-1.5"
        >
          <Trash2 class="w-3.5 h-3.5" />
          <span>Eliminar</span>
        </button>
      </div>
    </div>
  </article>
</template>