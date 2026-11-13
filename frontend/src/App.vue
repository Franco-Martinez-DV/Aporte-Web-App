<script setup>
import { ref, computed, onMounted } from 'vue';
import { Plus } from 'lucide-vue-next';
import campanaService from './services/campanaService';
import NavbarHeader from './components/NavbarHeader.vue';
import BarraFiltros from './components/BarraFiltros.vue';
import CampanaCard from './components/CampanaCard.vue';
import ModalCampanaForm from './components/ModalCampanaForm.vue';
import ModalAporte from './components/ModalAporte.vue';
import ModalIngresoExterno from './components/ModalIngresoExterno.vue';
import ModalCamisetaVirtual from './components/ModalCamisetaVirtual.vue';
import ModalQR from './components/ModalQR.vue';
import ModalTransparencia from './components/ModalTransparencia.vue';

const campanas = ref([]);
const cargando = ref(true);

const textoBusqueda = ref('');
const categoriaSeleccionada = ref('Todas');
const categorias = ['Todas', 'Deportista Individual', 'Club', 'Liga/Torneo'];

const mostrandoModalForm = ref(false);
const modoEdicion = ref(false);
const campanaSeleccionada = ref(null);

const mostrandoModalAporte = ref(false);
const mostrandoModalIngresoExterno = ref(false);
const mostrandoModalCamiseta = ref(false);
const mostrandoModalQR = ref(false);
const mostrandoModalTransparencia = ref(false);

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

const campanasFiltradas = computed(() => {
  return campanas.value.filter(c => {
    const coincideTexto = c.titulo.toLowerCase().includes(textoBusqueda.value.toLowerCase()) ||
      c.descripcion.toLowerCase().includes(textoBusqueda.value.toLowerCase());
    const coincideCategoria = categoriaSeleccionada.value === 'Todas' || c.categoria === categoriaSeleccionada.value;
    return coincideTexto && coincideCategoria;
  });
});

const abrirModalNuevo = () => {
  modoEdicion.value = false;
  campanaSeleccionada.value = null;
  mostrandoModalForm.value = true;
};

const abrirModalEditar = (campana) => {
  modoEdicion.value = true;
  campanaSeleccionada.value = campana;
  mostrandoModalForm.value = true;
};

const abrirModalConCampana = (campana, tipoModal) => {
  campanaSeleccionada.value = campana;
  if (tipoModal === 'camiseta') mostrandoModalCamiseta.value = true;
  if (tipoModal === 'aporte') mostrandoModalAporte.value = true;
  if (tipoModal === 'ingreso') mostrandoModalIngresoExterno.value = true;
  if (tipoModal === 'qr') mostrandoModalQR.value = true;
  if (tipoModal === 'transparencia') mostrandoModalTransparencia.value = true;
};

const guardarCampana = async (datos) => {
  try {
    if (modoEdicion.value && campanaSeleccionada.value) {
      await campanaService.actualizarCampana(campanaSeleccionada.value.id, datos);
    } else {
      await campanaService.crearCampana(datos);
    }
    mostrandoModalForm.value = false;
    await cargarCampanas();
  } catch (error) {
    alert(error.response?.data?.error || 'Error al guardar la campaña');
  }
};

const procesarAporte = async (monto) => {
  try {
    await campanaService.registrarAporte(campanaSeleccionada.value.id, monto);
    mostrandoModalAporte.value = false;
    await cargarCampanas();
  } catch (error) {
    alert(error.response?.data?.error || 'Error al registrar el aporte');
  }
};

const guardarIngresoExterno = async (datos) => {
  try {
    await campanaService.registrarIngresoExterno(campanaSeleccionada.value.id, datos);
    mostrandoModalIngresoExterno.value = false;
    await cargarCampanas();
  } catch (error) {
    alert(error.response?.data?.error || 'Error al registrar el ingreso externo');
  }
};

const procesarReservaSlot = async (payload) => {
  try {
    const actualizada = await campanaService.reservarSlot(campanaSeleccionada.value.id, payload);
    campanaSeleccionada.value = actualizada;
    alert('¡Espacio publicitario reservado con éxito!');
    await cargarCampanas();
  } catch (error) {
    alert(error.response?.data?.error || 'Error al reservar el espacio publicitario');
  }
};

const eliminarCampana = async (id) => {
  if (confirm('¿Seguro que deseas eliminar esta campaña?')) {
    try {
      await campanaService.eliminarCampana(id);
      await cargarCampanas();
    } catch (error) {
      alert('Error al eliminar la campaña');
    }
  }
};

onMounted(() => {
  cargarCampanas();
});
</script>

<template>
  <div class="min-h-screen bg-[#F5F5F5] text-slate-800 font-sans">
    <NavbarHeader />

    <main class="max-w-6xl mx-auto px-4 py-8">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 class="text-2xl font-bold text-slate-900">Campañas en Curso</h2>
          <p class="text-slate-600 text-sm">Financiación colectiva y patrocinio de indumentaria deportiva.</p>
        </div>
        <button
          @click="abrirModalNuevo"
          class="bg-[#0077FF] hover:bg-blue-600 text-white font-semibold px-5 py-2.5 rounded-lg shadow transition flex items-center gap-2"
        >
          <Plus class="w-5 h-5" />
          <span>Crear Campaña</span>
        </button>
      </div>

      <BarraFiltros
        v-model:texto-busqueda="textoBusqueda"
        v-model:categoria-seleccionada="categoriaSeleccionada"
        :categorias="categorias"
      />

      <div v-if="cargando" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#0077FF] border-t-transparent"></div>
        <p class="mt-2 text-slate-500">Cargando campañas de Firestore...</p>
      </div>

      <div v-else-if="campanasFiltradas.length === 0"
        class="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
        <p class="text-slate-500 text-lg">No se encontraron campañas con los filtros aplicados.</p>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <CampanaCard
          v-for="c in campanasFiltradas"
          :key="c.id"
          :campana="c"
          @abrir-camiseta="abrirModalConCampana(c, 'camiseta')"
          @abrir-aporte="abrirModalConCampana(c, 'aporte')"
          @abrir-ingreso="abrirModalConCampana(c, 'ingreso')"
          @abrir-qr="abrirModalConCampana(c, 'qr')"
          @abrir-transparencia="abrirModalConCampana(c, 'transparencia')"
          @editar="abrirModalEditar(c)"
          @eliminar="eliminarCampana"
        />
      </div>
    </main>

    <ModalCampanaForm
      :visible="mostrandoModalForm"
      :modo-edicion="modoEdicion"
      :campana-inicial="campanaSeleccionada"
      @cerrar="mostrandoModalForm = false"
      @guardar="guardarCampana"
    />

    <ModalAporte
      :visible="mostrandoModalAporte"
      :campana="campanaSeleccionada"
      @cerrar="mostrandoModalAporte = false"
      @confirmar="procesarAporte"
    />

    <ModalIngresoExterno
      :visible="mostrandoModalIngresoExterno"
      :campana="campanaSeleccionada"
      @cerrar="mostrandoModalIngresoExterno = false"
      @guardar="guardarIngresoExterno"
    />

    <ModalCamisetaVirtual
      :visible="mostrandoModalCamiseta"
      :campana="campanaSeleccionada"
      @cerrar="mostrandoModalCamiseta = false"
      @reservar="procesarReservaSlot"
    />

    <ModalQR
      :visible="mostrandoModalQR"
      :campana="campanaSeleccionada"
      @cerrar="mostrandoModalQR = false"
    />

    <ModalTransparencia
      :visible="mostrandoModalTransparencia"
      :campana="campanaSeleccionada"
      @cerrar="mostrandoModalTransparencia = false"
    />
  </div>
</template>