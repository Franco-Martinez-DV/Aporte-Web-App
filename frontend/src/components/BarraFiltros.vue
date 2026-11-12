<script setup>
defineProps({
  textoBusqueda: { type: String, required: true },
  categoriaSeleccionada: { type: String, required: true },
  categorias: { type: Array, required: true }
});

defineEmits(['update:textoBusqueda', 'update:categoriaSeleccionada']);
</script>

<template>
  <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-8 flex flex-col md:flex-row gap-4 justify-between items-center">
    <div class="w-full md:w-1/2 relative">
      <input
        :value="textoBusqueda"
        @input="$emit('update:textoBusqueda', $event.target.value)"
        type="text"
        placeholder="Buscar por título o palabra clave..."
        class="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
      />
    </div>

    <div class="flex flex-wrap gap-2 w-full md:w-auto">
      <button
        v-for="cat in categorias"
        :key="cat"
        @click="$emit('update:categoriaSeleccionada', cat)"
        :class="[
          'px-3.5 py-1.5 rounded-lg text-xs font-bold transition',
          categoriaSeleccionada === cat
            ? 'bg-blue-600 text-white shadow-sm'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        ]"
      >
        {{ cat }}
      </button>
    </div>
  </div>
</template>