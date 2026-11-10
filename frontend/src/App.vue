<script setup>
import { ref, computed, onMounted } from 'vue';
import campanaService from './services/campanaService';

const campanas = ref([]);
const cargando = ref(true);

const textoBusqueda = ref('');
const categoriaSeleccionada = ref('Todas');
const categorias = ['Todas', 'Deportista Individual', 'Club', 'Liga/Torneo'];

const mostrandoModal = ref(false);
const modoEdicion = ref(false);
const idSeleccionado = ref(null);

const mostrandoModalAporte = ref(false);
const campanaAporte = ref(null);
const montoAporteInput = ref(5000);

const mostrandoModalIngresoExterno = ref(false);
const campanaIngresoExterno = ref(null);
const formularioIngresoExterno = ref({
  monto: 10000,
  concepto: '',
  fecha: new Date().toISOString().split('T')[0]
});

const mostrandoModalCamiseta = ref(false);
const campanaCamiseta = ref(null);
const slotSeleccionado = ref(null);
const formularioSponsor = ref({
  nombreEmpresa: '',
  cuit: '',
  logoUrl: ''
});

const formulario = ref({
  titulo: '',
  descripcion: '',
  categoria: 'Deportista Individual',
  tipo: 'donacion',
  montoObjetivo: 100000,
  recaudado: 0,
  fechaLimite: ''
});

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
  idSeleccionado.value = null;
  formulario.value = {
    titulo: '',
    descripcion: '',
    categoria: 'Deportista Individual',
    tipo: 'donacion',
    montoObjetivo: 100000,
    recaudado: 0,
    fechaLimite: ''
  };
  mostrandoModal.value = true;
};

const abrirModalEditar = (campana) => {
  modoEdicion.value = true;
  idSeleccionado.value = campana.id;
  formulario.value = {
    ...campana,
    tipo: campana.tipo || 'donacion'
  };
  mostrandoModal.value = true;
};

const abrirModalAporte = (campana) => {
  campanaAporte.value = campana;
  montoAporteInput.value = 5000;
  mostrandoModalAporte.value = true;
};

const abrirModalIngresoExterno = (campana) => {
  campanaIngresoExterno.value = campana;
  formularioIngresoExterno.value = {
    monto: 10000,
    concepto: '',
    fecha: new Date().toISOString().split('T')[0]
  };
  mostrandoModalIngresoExterno.value = true;
};

const abrirModalCamiseta = (campana) => {
  campanaCamiseta.value = campana;
  slotSeleccionado.value = null;
  formularioSponsor.value = { nombreEmpresa: '', cuit: '', logoUrl: '' };
  mostrandoModalCamiseta.value = true;
};

const seleccionarSlot = (slot) => {
  if (slot.estado === 'reservado') return;
  slotSeleccionado.value = slot;
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

const procesarAporte = async () => {
  if (!montoAporteInput.value || montoAporteInput.value <= 0) {
    alert('Por favor ingresá un monto mayor a 0');
    return;
  }
  try {
    await campanaService.registrarAporte(campanaAporte.value.id, montoAporteInput.value);
    mostrandoModalAporte.value = false;
    await cargarCampanas();
  } catch (error) {
    alert('Error al registrar el aporte');
  }
};

const guardarIngresoExterno = async () => {
  if (!formularioIngresoExterno.value.concepto.trim()) {
    alert('Ingresá el concepto del ingreso');
    return;
  }
  try {
    await campanaService.registrarIngresoExterno(campanaIngresoExterno.value.id, formularioIngresoExterno.value);
    mostrandoModalIngresoExterno.value = false;
    await cargarCampanas();
  } catch (error) {
    alert('Error al registrar el ingreso externo');
  }
};

const procesarReservaSlot = async () => {
  if (!slotSeleccionado.value) {
    alert('Seleccioná un espacio disponible en la camiseta');
    return;
  }
  if (!formularioSponsor.value.nombreEmpresa.trim()) {
    alert('Ingresá el nombre o razón social de la empresa sponsor');
    return;
  }

  try {
    const payload = {
      idSlot: slotSeleccionado.value.idSlot,
      nombreEmpresa: formularioSponsor.value.nombreEmpresa,
      cuit: formularioSponsor.value.cuit,
      logoUrl: formularioSponsor.value.logoUrl
    };

    const actualizada = await campanaService.reservarSlot(campanaCamiseta.value.id, payload);
    campanaCamiseta.value = actualizada;
    slotSeleccionado.value = null;
    formularioSponsor.value = { nombreEmpresa: '', cuit: '', logoUrl: '' };
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

const calcularPorcentaje = (recaudado, objetivo) => {
  if (!objetivo || objetivo === 0) return 0;
  const pct = Math.round((recaudado / objetivo) * 100);
  return pct > 100 ? 100 : pct;
};

const mostrandoModalQR = ref(false);
const campanaQR = ref(null);
const copiadoExitoso = ref(false);

const abrirModalQR = (campana) => {
  campanaQR.value = campana;
  copiadoExitoso.value = false;
  mostrandoModalQR.value = true;
};

const obtenerUrlCampana = (id) => {
  return `${window.location.origin}/campana/${id}`;
};

const copiarEnlace = async () => {
  if (!campanaQR.value) return;
  const url = obtenerUrlCampana(campanaQR.value.id);
  try {
    await navigator.clipboard.writeText(url);
    copiadoExitoso.value = true;
    setTimeout(() => { copiadoExitoso.value = false; }, 3000);
  } catch (err) {
    alert('No se pudo copiar el enlace.');
  }
};

onMounted(() => {
  cargarCampanas();
});
</script>

<template>
  <div class="min-h-screen bg-slate-100 text-slate-800 font-sans">
    <header class="bg-blue-900 text-white shadow-md">
      <div class="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
        <div class="flex items-center space-x-2">
          <h1 class="text-2xl font-bold tracking-wide">APORTE</h1>
        </div>
        <p class="hidden sm:block text-sm text-blue-200">Plataforma Crowdfunding para el Deporte Amateur</p>
      </div>
    </header>

    <main class="max-w-6xl mx-auto px-4 py-8">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 class="text-2xl font-bold text-slate-900">Campañas en Curso</h2>
          <p class="text-slate-600 text-sm">Financiación colectiva y patrocinio de indumentaria deportiva.</p>
        </div>
        <button @click="abrirModalNuevo"
          class="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-lg shadow transition flex items-center gap-2">
          <span>+</span> Crear Campaña
        </button>
      </div>

      <div
        class="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-8 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div class="w-full md:w-1/2 relative">
          <input v-model="textoBusqueda" type="text" placeholder="Buscar por título o palabra clave..."
            class="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" />
        </div>

        <div class="flex flex-wrap gap-2 w-full md:w-auto">
          <button v-for="cat in categorias" :key="cat" @click="categoriaSeleccionada = cat" :class="[
            'px-3.5 py-1.5 rounded-lg text-xs font-bold transition',
            categoriaSeleccionada === cat
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          ]">
            {{ cat }}
          </button>
        </div>
      </div>

      <div v-if="cargando" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
        <p class="mt-2 text-slate-500">Cargando campañas de Firestore...</p>
      </div>

      <div v-else-if="campanasFiltradas.length === 0"
        class="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
        <p class="text-slate-500 text-lg">No se encontraron campañas con los filtros aplicados.</p>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <article v-for="c in campanasFiltradas" :key="c.id"
          class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col justify-between hover:shadow-md transition">
          <div class="p-5">
            <div class="flex justify-between items-center mb-3">
              <span
                class="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                {{ c.categoria }}
              </span>
              <span :class="[
                'text-xs font-bold px-2 py-0.5 rounded uppercase',
                c.tipo === 'patrocinio' ? 'bg-blue-600 text-white' : 'bg-emerald-100 text-emerald-700'
              ]">
                {{ c.tipo === 'patrocinio' ? 'Camiseta Virtual' : 'Donación' }}
              </span>
            </div>

            <h3 class="text-lg font-bold text-slate-900 mb-2 line-clamp-1">{{ c.titulo }}</h3>
            <p class="text-slate-600 text-sm mb-4 line-clamp-3">{{ c.descripcion }}</p>
          </div>

          <div class="px-5 pb-5 pt-0">
            <div class="w-full bg-slate-200 rounded-full h-2.5 mb-2">
              <div class="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
                :style="{ width: calcularPorcentaje(c.recaudado, c.montoObjetivo) + '%' }"></div>
            </div>

            <div class="flex justify-between items-center text-sm mb-4">
              <span class="font-bold text-emerald-600">${{ c.recaudado?.toLocaleString() }}</span>
              <span class="text-slate-500">de ${{ c.montoObjetivo?.toLocaleString() }}</span>
            </div>

            <div class="space-y-2 mb-3">
              <button v-if="c.tipo === 'patrocinio'" @click="abrirModalCamiseta(c)"
                class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition flex items-center justify-center gap-2 text-sm shadow-sm">
                Ver / Patrocinar Camiseta Virtual
              </button>

              <button @click="abrirModalAporte(c)"
                class="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold py-2 px-4 rounded-lg border border-emerald-200 transition flex items-center justify-center gap-2 text-sm">
                Simular Aporte
              </button>

              <button @click="abrirModalIngresoExterno(c)"
                class="w-full bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold py-2 px-4 rounded-lg border border-amber-200 transition flex items-center justify-center gap-2 text-sm">
                Declarar Ingreso Externo
              </button>

              <button @click="abrirModalQR(c)"
              class="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-4 rounded-lg border border-slate-300 transition flex items-center justify-center gap-2 text-sm">
              Compartir / Código QR
            </button>
            </div>

            <div class="flex justify-between items-center pt-3 border-t border-slate-100">
              <button @click="abrirModalEditar(c)"
                class="text-xs font-semibold text-blue-600 hover:text-blue-800 px-3 py-1.5 rounded hover:bg-blue-50 transition">
                Editar
              </button>
              <button @click="eliminarCampana(c.id)"
                class="text-xs font-semibold text-rose-600 hover:text-rose-800 px-3 py-1.5 rounded hover:bg-rose-50 transition">
                Eliminar
              </button>
            </div>
          </div>
        </article>
      </div>
    </main>

    <div v-if="mostrandoModal"
      class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 relative">
        <h3 class="text-xl font-bold text-slate-900 mb-4">
          {{ modoEdicion ? 'Editar Campaña' : 'Nueva Campaña' }}
        </h3>

        <form @submit.prevent="guardarCampana" class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Tipo de Campaña</label>
            <div class="grid grid-cols-2 gap-3">
              <label :class="[
                'border rounded-lg p-3 text-center cursor-pointer transition text-xs font-bold',
                formulario.tipo === 'donacion' ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-slate-300 text-slate-600'
              ]">
                <input type="radio" v-model="formulario.tipo" value="donacion" class="sr-only" />
                Donación Estándar
              </label>
              <label :class="[
                'border rounded-lg p-3 text-center cursor-pointer transition text-xs font-bold',
                formulario.tipo === 'patrocinio' ? 'border-blue-700 bg-blue-600 text-white' : 'border-slate-300 text-slate-600'
              ]">
                <input type="radio" v-model="formulario.tipo" value="patrocinio" class="sr-only" />
                Camiseta Virtual
              </label>
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Título</label>
            <input v-model="formulario.titulo" type="text" required
              class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" />
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Categoría</label>
            <select v-model="formulario.categoria"
              class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600">
              <option value="Deportista Individual">Deportista Individual</option>
              <option value="Club">Club</option>
              <option value="Liga/Torneo">Liga/Torneo</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Descripción</label>
            <textarea v-model="formulario.descripcion" rows="3" required
              class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"></textarea>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Monto Objetivo ($)</label>
              <input v-model.number="formulario.montoObjetivo" type="number" min="1000" required
                class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" />
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Monto Recaudado ($)</label>
              <input v-model.number="formulario.recaudado" type="number" min="0"
                class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" />
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Fecha Límite</label>
            <input v-model="formulario.fechaLimite" type="date" required
              class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" />
          </div>

          <div class="flex justify-end space-x-3 pt-4 border-t border-slate-100">
            <button type="button" @click="mostrandoModal = false"
              class="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition">
              Cancelar
            </button>
            <button type="submit"
              class="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow transition">
              {{ modoEdicion ? 'Actualizar' : 'Guardar' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="mostrandoModalAporte"
      class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative">
        <h3 class="text-xl font-bold text-slate-900 mb-2">Simular Aporte</h3>
        <p class="text-slate-600 text-sm mb-4">
          Campaña: <strong class="text-slate-900">{{ campanaAporte?.titulo }}</strong>
        </p>

        <form @submit.prevent="procesarAporte" class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Monto a Aportar ($)</label>
            <input v-model.number="montoAporteInput" type="number" min="100" required
              class="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-bold text-emerald-700 text-lg" />
          </div>

          <div class="flex justify-end space-x-3 pt-4 border-t border-slate-100">
            <button type="button" @click="mostrandoModalAporte = false"
              class="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition">
              Cancelar
            </button>
            <button type="submit"
              class="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow transition">
              Confirmar Aporte
            </button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="mostrandoModalIngresoExterno"
      class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative">
        <h3 class="text-xl font-bold text-slate-900 mb-1">Declarar Ingreso Externo</h3>
        <p class="text-slate-600 text-xs mb-4">Registrar fondos obtenidos por rifas o eventos locales.</p>

        <form @submit.prevent="guardarIngresoExterno" class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Concepto / Origen</label>
            <input v-model="formularioIngresoExterno.concepto" type="text" required
              placeholder="Ej: Sorteo de indumentaria en el club"
              class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600" />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Monto ($)</label>
              <input v-model.number="formularioIngresoExterno.monto" type="number" min="1" required
                class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600 font-bold text-slate-800" />
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Fecha</label>
              <input v-model="formularioIngresoExterno.fecha" type="date" required
                class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600" />
            </div>
          </div>

          <div class="flex justify-end space-x-3 pt-4 border-t border-slate-100">
            <button type="button" @click="mostrandoModalIngresoExterno = false"
              class="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition">
              Cancelar
            </button>
            <button type="submit"
              class="px-4 py-2 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow transition">
              Guardar Ingreso
            </button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="mostrandoModalCamiseta"
      class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-4 border-b pb-3">
          <div>
            <h3 class="text-xl font-bold text-slate-900">Camiseta Virtual</h3>
            <p class="text-xs text-slate-500">Seleccioná un espacio publicitario libre para promocionar tu marca.</p>
          </div>
          <button @click="mostrandoModalCamiseta = false"
            class="text-slate-400 hover:text-slate-600 text-xl font-bold">✕</button>
        </div>

        <div class="bg-slate-900 rounded-xl p-6 mb-6 text-white text-center relative shadow-inner">
          <div class="uppercase text-xs font-bold text-slate-400 tracking-widest mb-4">Indumentaria Oficial del Proyecto
          </div>

          <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div v-for="slot in (campanaCamiseta?.slotsIndumentaria || [])" :key="slot.idSlot"
              @click="seleccionarSlot(slot)" :class="[
                'p-4 rounded-xl border-2 transition flex flex-col items-center justify-center min-h-[110px] cursor-pointer relative overflow-hidden',
                slot.estado === 'reservado'
                  ? 'border-blue-500 bg-blue-900/40 opacity-90 cursor-not-allowed'
                  : (slotSeleccionado?.idSlot === slot.idSlot
                    ? 'border-blue-400 bg-blue-950/60 ring-2 ring-blue-400'
                    : 'border-slate-700 bg-slate-800 hover:border-blue-400 hover:bg-slate-750')
              ]">
              <span class="text-xs font-bold text-slate-300 mb-1">{{ slot.posicion }}</span>

              <template v-if="slot.estado === 'reservado'">
                <span class="text-emerald-400 font-extrabold text-sm uppercase tracking-wide">{{
                  slot.sponsor?.nombreEmpresa }}</span>
                <span class="text-[10px] text-blue-300 mt-1">Espacio Ocupado</span>
              </template>

              <template v-else>
                <span class="text-lg font-bold text-emerald-400">${{ slot.precio?.toLocaleString() }}</span>
                <span class="text-[10px] text-slate-400 mt-1">Disponible</span>
              </template>
            </div>
          </div>
        </div>

        <div v-if="slotSeleccionado" class="bg-blue-50 p-4 rounded-xl border border-blue-200">
          <h4 class="font-bold text-blue-900 mb-2 text-sm">
            Reservar Espacio: <span class="text-blue-700 uppercase">{{ slotSeleccionado.posicion }}</span> (${{
              slotSeleccionado.precio?.toLocaleString() }})
          </h4>

          <form @submit.prevent="procesarReser" class="space-y-3">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Empresa / Comercio</label>
                <input v-model="formularioSponsor.nombreEmpresa" type="text" required
                  placeholder="Ej: Calzados San Martín"
                  class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white" />
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-700 uppercase mb-1">CUIT (Opcional)</label>
                <input v-model="formularioSponsor.cuit" type="text" placeholder="Ej: 30-71234567-8"
                  class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white" />
              </div>
            </div>

            <div class="flex justify-end gap-3 pt-2">
              <button type="button" @click="slotSeleccionado = null"
                class="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-lg">
                Cancelar
              </button>
              <button type="button" @click="procesarReservaSlot"
                class="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow transition">
                Confirmar Patrocinio (${{ slotSeleccionado.precio?.toLocaleString() }})
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <div v-if="mostrandoModalQR"
      class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative text-center">
        <div class="flex justify-between items-center mb-4 border-b pb-3 text-left">
          <div>
            <h3 class="text-xl font-bold text-slate-900">Material de Difusión</h3>
            <p class="text-xs text-slate-500">Escaneá el QR o compartí el enlace en redes sociales.</p>
          </div>
          <button @click="mostrandoModalQR = false"
            class="text-slate-400 hover:text-slate-600 text-xl font-bold">✕</button>
        </div>

        <div class="bg-slate-50 p-6 rounded-xl border border-slate-200 inline-block mb-4 shadow-inner">
          <img
            :src="'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(obtenerUrlCampana(campanaQR?.id))"
            alt="Código QR de la Campaña" class="w-48 h-48 mx-auto rounded-lg shadow-sm" />
          <p class="text-[11px] text-slate-400 mt-2 font-mono">ID: {{ campanaQR?.id }}</p>
        </div>

        <h4 class="font-bold text-slate-800 text-base mb-1">{{ campanaQR?.titulo }}</h4>
        <p class="text-xs text-slate-500 mb-4 line-clamp-2">{{ campanaQR?.descripcion }}</p>

        <div class="flex gap-2 mb-4">
          <input type="text" readonly :value="obtenerUrlCampana(campanaQR?.id)"
            class="w-full bg-slate-100 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-600 focus:outline-none" />
          <button @click="copiarEnlace"
            class="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg text-xs transition shrink-0">
            {{ copiadoExitoso ? '✓ Copiado' : 'Copiar Link' }}
          </button>
        </div>

        <div class="pt-2 border-t border-slate-100 flex justify-end">
          <button @click="mostrandoModalQR = false"
            class="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>