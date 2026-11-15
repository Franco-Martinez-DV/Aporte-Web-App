<script setup>
import { ref, computed, watch } from 'vue';
import { Shirt, Building2, Trophy } from 'lucide-vue-next';
import { formatearMoneda } from '../helpers/formatters';

const props = defineProps({
  visible: { type: Boolean, required: true },
  campana: { type: Object, default: null },
  enviando: { type: Boolean, default: false }
});

const emit = defineEmits(['cerrar', 'reservar']);

const slotSeleccionado = ref(null);
const formularioSponsor = ref({
  nombreEmpresa: '',
  cuit: '',
  logoUrl: ''
});

const tituloModal = computed(() => {
  const cat = props.campana?.categoria;
  if (cat === 'Club') return 'Espacios de Patrocinio del Club';
  if (cat === 'Liga/Torneo') return 'Patrocinio de Liga / Torneo';
  return 'Patrocinio de camiseta';
});

const gruposSlots = computed(() => {
  const slots = props.campana?.slotsIndumentaria || [];
  const gruposMap = {
    indumentaria: {
      clave: 'indumentaria',
      titulo: 'Indumentaria Oficial (Camiseta)',
      icono: Shirt,
      items: []
    },
    infraestructura: {
      clave: 'infraestructura',
      titulo: 'Estadio, Predio y Cartelería en Paredes',
      icono: Building2,
      items: []
    },
    torneo: {
      clave: 'torneo',
      titulo: 'Naming y Cartelería de Liga / Torneo',
      icono: Trophy,
      items: []
    }
  };

  for (const slot of slots) {
    const clave = slot.grupo && gruposMap[slot.grupo] ? slot.grupo : 'indumentaria';
    gruposMap[clave].items.push(slot);
  }

  return Object.values(gruposMap).filter(g => g.items.length > 0);
});

watch(
  () => [props.visible, props.campana],
  () => {
    slotSeleccionado.value = null;
    formularioSponsor.value = { nombreEmpresa: '', cuit: '', logoUrl: '' };
  }
);

const seleccionarSlot = (slot) => {
  if (props.enviando || slot.estado === 'reservado') return;
  slotSeleccionado.value = slot;
};

const confirmarReserva = () => {
  if (props.enviando) return;
  if (!slotSeleccionado.value) {
    alert('Seleccioná un espacio publicitario disponible');
    return;
  }
  if (!formularioSponsor.value.nombreEmpresa.trim()) {
    alert('Ingresá el nombre o razón social de la empresa sponsor');
    return;
  }

  emit('reservar', {
    idSlot: slotSeleccionado.value.idSlot,
    nombreEmpresa: formularioSponsor.value.nombreEmpresa,
    cuit: formularioSponsor.value.cuit,
    logoUrl: formularioSponsor.value.logoUrl
  });
};
</script>

<template>
  <div v-if="visible" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
      <div class="flex justify-between items-center mb-4 border-b pb-3">
        <div>
          <h3 class="text-xl font-bold text-slate-900">{{ tituloModal }}</h3>
          <p class="text-xs text-slate-500">Seleccioná un espacio publicitario libre para promocionar tu marca.</p>
        </div>
        <button
          :disabled="enviando"
          @click="$emit('cerrar')"
          class="text-slate-400 hover:text-slate-600 text-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ✕
        </button>
      </div>

      <div class="space-y-4 mb-6">
        <div
          v-for="grupo in gruposSlots"
          :key="grupo.clave"
          class="bg-slate-900 rounded-xl p-5 text-white text-center relative shadow-inner"
        >
          <div class="inline-flex items-center justify-center gap-2 uppercase text-xs font-bold text-slate-300 tracking-widest mb-4">
            <component :is="grupo.icono" class="w-4 h-4 text-blue-400" />
            <span>{{ grupo.titulo }}</span>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-3 gap-3.5">
            <div
              v-for="slot in grupo.items"
              :key="slot.idSlot"
              @click="seleccionarSlot(slot)"
              :class="[
                'p-4 rounded-xl border-2 transition flex flex-col items-center justify-center min-h-[110px] cursor-pointer relative overflow-hidden',
                slot.estado === 'reservado'
                  ? 'border-blue-500 bg-blue-900/40 opacity-90 cursor-not-allowed'
                  : (slotSeleccionado?.idSlot === slot.idSlot
                    ? 'border-blue-400 bg-blue-950/60 ring-2 ring-blue-400'
                    : 'border-slate-700 bg-slate-800 hover:border-blue-400 hover:bg-slate-750')
              ]"
            >
              <span class="text-xs font-bold text-slate-300 mb-1 leading-snug">{{ slot.posicion }}</span>

              <template v-if="slot.estado === 'reservado'">
                <span class="text-emerald-400 font-extrabold text-sm uppercase tracking-wide">
                  {{ slot.sponsor?.nombreEmpresa }}
                </span>
                <span class="text-[10px] text-blue-300 mt-1">Espacio Ocupado</span>
              </template>

              <template v-else>
                <span class="text-lg font-bold text-emerald-400">${{ formatearMoneda(slot.precio) }}</span>
                <span class="text-[10px] text-slate-400 mt-1">Disponible</span>
              </template>
            </div>
          </div>
        </div>
      </div>

      <div v-if="slotSeleccionado" class="bg-blue-50 p-4 rounded-xl border border-blue-200">
        <h4 class="font-bold text-blue-900 mb-2 text-sm">
          Reservar Espacio: <span class="text-blue-700 uppercase">{{ slotSeleccionado.posicion }}</span>
          (${{ formatearMoneda(slotSeleccionado.precio) }})
        </h4>

        <form @submit.prevent="confirmarReserva" class="space-y-3">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Empresa / Comercio</label>
              <input
                v-model="formularioSponsor.nombreEmpresa"
                type="text"
                required
                placeholder="Ej: Calzados San Martín"
                class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
              />
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase mb-1">CUIT (Opcional)</label>
              <input
                v-model="formularioSponsor.cuit"
                type="text"
                placeholder="Ej: 30-71234567-8"
                class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
              />
            </div>
          </div>

          <div class="flex justify-end gap-3 pt-2">
            <button
              type="button"
              :disabled="enviando"
              @click="slotSeleccionado = null"
              class="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="submit"
              :disabled="enviando"
              class="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ enviando ? 'Reservando...' : `Confirmar Patrocinio ($${formatearMoneda(slotSeleccionado.precio)})` }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>