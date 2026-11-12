<script setup>
import { ref, watch } from 'vue';
import { obtenerUrlCampana } from '../helpers/formatters';

const props = defineProps({
  visible: { type: Boolean, required: true },
  campana: { type: Object, default: null }
});

defineEmits(['cerrar']);
const copiadoExitoso = ref(false);

watch(
  () => props.visible,
  (abierto) => {
    if (abierto) copiadoExitoso.value = false;
  }
);

const copiarEnlace = async () => {
  if (!props.campana) return;
  const url = obtenerUrlCampana(props.campana.id);
  try {
    await navigator.clipboard.writeText(url);
    copiadoExitoso.value = true;
    setTimeout(() => { copiadoExitoso.value = false; }, 3000);
  } catch (err) {
    alert('No se pudo copiar el enlace.');
  }
};
</script>

<template>
  <div v-if="visible" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative text-center">
      <div class="flex justify-between items-center mb-4 border-b pb-3 text-left">
        <div>
          <h3 class="text-xl font-bold text-slate-900">Material de Difusión</h3>
          <p class="text-xs text-slate-500">Escaneá el QR o compartí el enlace en redes sociales.</p>
        </div>
        <button @click="$emit('cerrar')" class="text-slate-400 hover:text-slate-600 text-xl font-bold">✕</button>
      </div>

      <div class="bg-slate-50 p-6 rounded-xl border border-slate-200 inline-block mb-4 shadow-inner">
        <img
          :src="'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(obtenerUrlCampana(campana?.id))"
          alt="Código QR de la Campaña"
          class="w-48 h-48 mx-auto rounded-lg shadow-sm"
        />
        <p class="text-[11px] text-slate-400 mt-2 font-mono">ID: {{ campana?.id }}</p>
      </div>

      <h4 class="font-bold text-slate-800 text-base mb-1">{{ campana?.titulo }}</h4>
      <p class="text-xs text-slate-500 mb-4 line-clamp-2">{{ campana?.descripcion }}</p>

      <div class="flex gap-2 mb-4">
        <input
          type="text"
          readonly
          :value="obtenerUrlCampana(campana?.id)"
          class="w-full bg-slate-100 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-600 focus:outline-none"
        />
        <button
          @click="copiarEnlace"
          class="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg text-xs transition shrink-0"
        >
          {{ copiadoExitoso ? '✓ Copiado' : 'Copiar Link' }}
        </button>
      </div>

      <div class="pt-2 border-t border-slate-100 flex justify-end">
        <button
          @click="$emit('cerrar')"
          class="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition"
        >
          Cerrar
        </button>
      </div>
    </div>
  </div>
</template>