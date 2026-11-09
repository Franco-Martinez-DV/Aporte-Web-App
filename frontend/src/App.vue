<script setup>
import { ref, onMounted, computed } from 'vue';
import campanaService from './services/campanaService';

const campanas = ref([]);
const cargando = ref(true);
const mostrandoModal = ref(false);
const modoEdicion = ref(false);
const idSeleccionado = ref(null);

const formulario = ref({
  titulo: '',
  descripcion: '',
  categoria: 'Deportista Individual',
  montoObjetivo: 100000,
  recaudado: 0,
  fechaLimite: ''
});

const categorias = ['Deportista Individual', 'Club', 'Liga/Torneo'];

const cargarCampanas = async () => {
  cargando.value = true;
  try {
    campanas.value = await campanaService.obtenerCampanas();
  } catch (error) {
    alert('Error al conectar con el backend');
  } finally {
    cargando.value = false;
  }
};

const abrirModalNuevo = () => {
  modoEdicion.value = false;
  idSeleccionado.value = null;
  formulario.value = {
    titulo: '',
    descripcion: '',
    categoria: 'Deportista Individual',
    montoObjetivo: 100000,
    recaudado: 0,
    fechaLimite: ''
  };
  mostrandoModal.value = true;
};

const abrirModalEditar = (campana) => {
  modoEdicion.value = true;
  idSeleccionado.value = campana.id;
  formulario.value = { ...campana };
  mostrandoModal.value = true;
};

const guardarCampana = async () => {
  try {
    if (modoEdicion.value) {
      await campanaService.actualizarCampana(idSeleccionado.value, formulario.value);
    } else {
      await campanaService.crearCampana(formulario.value);
    }
    mostrandoModal.value = false;
    await cargarCampanas();
  } catch (error) {
    alert('Error al guardar la campaña');
  }
};

const eliminarCampana = async (id) => {
  if (confirm('¿Seguro que deseas eliminar esta campaña del sistema?')) {
    try {
      await campanaService.eliminarCampana(id);
      await cargarCampanas();
    } catch (error) {
      alert('Error al eliminar la campaña');
    }
  }
};

const calcularPorcentaje = (recaudado, objetivo) => {
  if (!objetivo || objetivo === 0) return 0;
  const pct = Math.round((recaudado / objetivo) * 100);
  return pct > 100 ? 100 : pct;
};

onMounted(() => {
  cargarCampanas();
});
</script>

<template>
  <div class="min-h-screen bg-slate-100 text-slate-800 font-sans">
    <!-- Navbar -->
    <header class="bg-blue-900 text-white shadow-md">
      <div class="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
        <div class="flex items-center space-x-2">
          <h1 class="text-2xl font-bold tracking-wide">APORTE</h1>
        </div>
        <p class="hidden sm:block text-sm text-blue-200">Plataforma Crowdfunding para el Deporte Amateur</p>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-6xl mx-auto px-4 py-8">
      <!-- Action Bar -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h2 class="text-2xl font-bold text-slate-900">Campañas en Curso</h2>
          <p class="text-slate-600 text-sm">Gestiona y apoya a deportistas, clubes y ligas deportivas.</p>
        </div>
        <button 
          @click="abrirModalNuevo"
          class="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-lg shadow transition flex items-center gap-2"
        >
          <span>+</span> Crear Campaña
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="cargando" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
        <p class="mt-2 text-slate-500">Cargando campañas de Firestore...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="campanas.length === 0" class="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
        <p class="text-slate-500 text-lg">No hay campañas activas actualmente.</p>
        <button @click="abrirModalNuevo" class="mt-4 text-blue-600 font-semibold hover:underline">
          Crear la primera campaña
        </button>
      </div>

      <!-- Grid de Campañas -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <article 
          v-for="c in campanas" 
          :key="c.id"
          class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col justify-between hover:shadow-md transition"
        >
          <div class="p-5">
            <div class="flex justify-between items-center mb-3">
              <span class="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                {{ c.categoria }}
              </span>
              <span class="text-xs text-slate-400">Límite: {{ c.fechaLimite }}</span>
            </div>

            <h3 class="text-lg font-bold text-slate-900 mb-2 line-clamp-1">{{ c.titulo }}</h3>
            <p class="text-slate-600 text-sm mb-4 line-clamp-3">{{ c.descripcion }}</p>
          </div>

          <div class="px-5 pb-5 pt-0">
            <!-- Progress Bar -->
            <div class="w-full bg-slate-200 rounded-full h-2.5 mb-2">
              <div 
                class="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
                :style="{ width: calcularPorcentaje(c.recaudado, c.montoObjetivo) + '%' }"
              ></div>
            </div>

            <div class="flex justify-between items-center text-sm mb-4">
              <span class="font-bold text-emerald-600">${{ c.recaudado?.toLocaleString() }}</span>
              <span class="text-slate-500">de ${{ c.montoObjetivo?.toLocaleString() }}</span>
            </div>

            <div class="flex justify-between items-center pt-3 border-t border-slate-100">
              <button 
                @click="abrirModalEditar(c)"
                class="text-xs font-semibold text-blue-600 hover:text-blue-800 px-3 py-1.5 rounded hover:bg-blue-50 transition"
              >
                ✏️ Editar
              </button>
              <button 
                @click="eliminarCampana(c.id)"
                class="text-xs font-semibold text-rose-600 hover:text-rose-800 px-3 py-1.5 rounded hover:bg-rose-50 transition"
              >
                🗑️ Eliminar
              </button>
            </div>
          </div>
        </article>
      </div>
    </main>

    <!-- Modal Formulario (Crear/Editar) -->
    <div v-if="mostrandoModal" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 relative">
        <h3 class="text-xl font-bold text-slate-900 mb-4">
          {{ modoEdicion ? 'Editar Campaña' : 'Nueva Campaña Deportiva' }}
        </h3>

        <form @submit.prevent="guardarCampana" class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Título</label>
            <input 
              v-model="formulario.titulo" 
              type="text" 
              required
              placeholder="Ej: Viaje Torneo Nacional de Natación"
              class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Categoría</label>
            <select 
              v-model="formulario.categoria" 
              class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option v-for="cat in categorias" :key="cat" :value="cat">{{ cat }}</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Descripción</label>
            <textarea 
              v-model="formulario.descripcion" 
              rows="3" 
              required
              placeholder="Detalla la meta o necesidad de financiamiento..."
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
              @click="mostrandoModal = false"
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
  </div>
</template>