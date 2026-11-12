<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  visible: { type: Boolean, required: true },
  modoEdicion: { type: Boolean, default: false },
  campanaInicial: { type: Object, default: null }
});

const emit = defineEmits(['cerrar', 'guardar']);

const formulario = ref({
  titulo: '',
  descripcion: '',
  categoria: 'Deportista Individual',
  tipo: 'donacion',
  montoObjetivo: 100000,
  recaudado: 0,
  fechaLimite: ''
});

watch(
  () => props.visible,
  (abierto) => {
    if (!abierto) return;
    if (props.modoEdicion && props.campanaInicial) {
      formulario.value = {
        ...props.campanaInicial,
        tipo: props.campanaInicial.tipo || 'donacion'
      };
    } else {
      formulario.value = {
        titulo: '',
        descripcion: '',
        categoria: 'Deportista Individual',
        tipo: 'donacion',
        montoObjetivo: 100000,
        recaudado: 0,
        fechaLimite: ''
      };
    }
  }
);

const enviarFormulario = () => {
  emit('guardar', { ...formulario.value });
};
</script>

<template>
  <div v-if="visible" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 relative">
      <h3 class="text-xl font-bold text-slate-900 mb-4">
        {{ modoEdicion ? 'Editar Campaña' : 'Nueva Campaña' }}
      </h3>

      <form @submit.prevent="enviarFormulario" class="space-y-4">
        <div>
          <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Tipo de Campaña</label>
          <div class="grid grid-cols-2 gap-3">
            <label
              :class="[
                'border rounded-lg p-3 text-center cursor-pointer transition text-xs font-bold',
                formulario.tipo === 'donacion' ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-slate-300 text-slate-600'
              ]"
            >
              <input type="radio" v-model="formulario.tipo" value="donacion" class="sr-only" />
              Donación Estándar
            </label>
            <label
              :class="[
                'border rounded-lg p-3 text-center cursor-pointer transition text-xs font-bold',
                formulario.tipo === 'patrocinio' ? 'border-blue-700 bg-blue-600 text-white' : 'border-slate-300 text-slate-600'
              ]"
            >
              <input type="radio" v-model="formulario.tipo" value="patrocinio" class="sr-only" />
              Camiseta Virtual
            </label>
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Título</label>
          <input
            v-model="formulario.titulo"
            type="text"
            required
            class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Categoría</label>
          <select
            v-model="formulario.categoria"
            class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="Deportista Individual">Deportista Individual</option>
            <option value="Club">Club</option>
            <option value="Liga/Torneo">Liga/Torneo</option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Descripción</label>
          <textarea
            v-model="formulario.descripcion"
            rows="3"
            required
            class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          ></textarea>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Monto Objetivo ($)</label>
            <input
              v-model.number="formulario.montoObjetivo"
              type="number"
              min="1000"
              required
              class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Monto Recaudado ($)</label>
            <input
              v-model.number="formulario.recaudado"
              type="number"
              min="0"
              class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Fecha Límite</label>
          <input
            v-model="formulario.fechaLimite"
            type="date"
            required
            class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
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
            class="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow transition"
          >
            {{ modoEdicion ? 'Actualizar' : 'Guardar' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>