<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { onAuthStateChanged, signOut } from '@firebase/auth';
import { auth } from './firebase';
import { Plus, CheckCircle2, AlertCircle, X, ExternalLink, Loader2 } from 'lucide-vue-next';
import campanaService from './services/campanaService';
import NavbarHeader from './components/NavbarHeader.vue';
import BarraFiltros from './components/BarraFiltros.vue';
import CampanaCard from './components/CampanaCard.vue';
import ModalCampanaForm from './components/ModalCampanaForm.vue';
import ModalAporte from './components/ModalAporte.vue';
import ModalIngresoExterno from './components/ModalIngresoExterno.vue';
import ModalGasto from './components/ModalGasto.vue';
import ModalCamisetaVirtual from './components/ModalCamisetaVirtual.vue';
import ModalQr from './components/ModalQr.vue';
import ModalTransparencia from './components/ModalTransparencia.vue';
import ModalAuth from './components/ModalAuth.vue';

const campanas = ref([]);
const cargando = ref(true);
const enviando = ref(false);
const usuarioActual = ref(null);
const retornoMPProcesado = ref(false);
const sincronizandoPagos = ref(false);
const esperandoPagoMP = ref(false);
const urlUltimoCheckout = ref('');
const notificacionMP = ref(null);
let intervaloPollingMP = null;

const textoBusqueda = ref('');
const categoriaSeleccionada = ref('Todas');
const categorias = ['Todas', 'Deportista Individual', 'Club', 'Liga/Torneo'];

const mostrandoModalAuth = ref(false);
const mostrandoModalForm = ref(false);
const modoEdicion = ref(false);
const campanaSeleccionada = ref(null);

const mostrandoModalAporte = ref(false);
const mostrandoModalIngresoExterno = ref(false);
const mostrandoModalGasto = ref(false);
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

const detenerPollingMP = () => {
  if (intervaloPollingMP) {
    clearInterval(intervaloPollingMP);
    intervaloPollingMP = null;
  }
  esperandoPagoMP.value = false;
};

const iniciarPollingMP = () => {
  detenerPollingMP();
  esperandoPagoMP.value = true;
  let intentos = 0;

  intervaloPollingMP = setInterval(async () => {
    intentos++;
    if (intentos > 60) {
      detenerPollingMP();
      return;
    }
    if (usuarioActual.value) {
      await sincronizarPagosPendientes(usuarioActual.value);
    }
  }, 3000);
};

const limpiarParametrosUrl = () => {
  window.history.replaceState({}, document.title, window.location.pathname);
};

const procesarRetornoMercadoPago = async (user) => {
  if (retornoMPProcesado.value) return;

  const params = new URLSearchParams(window.location.search);
  const status = params.get('status') || params.get('collection_status') || params.get('mp_status');
  const paymentId = params.get('payment_id') || params.get('collection_id');
  const externalReference = params.get('external_reference');

  if (!status && !paymentId) return;

  retornoMPProcesado.value = true;
  limpiarParametrosUrl();
  detenerPollingMP();

  if (status === 'failure' || status === 'rejected') {
    notificacionMP.value = {
      tipo: 'error',
      titulo: 'Pago cancelado o rechazado',
      mensaje: 'La operación en Mercado Pago no se completó. No se realizó ningún cargo.'
    };
    return;
  }

  if (status === 'pending' || status === 'in_process') {
    notificacionMP.value = {
      tipo: 'info',
      titulo: 'Pago pendiente de acreditación',
      mensaje: 'Mercado Pago está procesando el pago. Se acreditará apenas sea aprobado.'
    };
    return;
  }

  if (status === 'approved' && paymentId && user) {
    notificacionMP.value = {
      tipo: 'info',
      titulo: 'Verificando pago con Mercado Pago...',
      mensaje: 'Estamos confirmando la acreditación en el sistema.'
    };

    try {
      const resultado = await campanaService.confirmarPagoMP({
        paymentId,
        externalReference
      });

      await cargarCampanas();

      const textoAccion = resultado.tipoOperacion === 'patrocinio'
        ? 'Tu espacio publicitario ya quedó reservado en la campaña.'
        : 'Tu aporte ya se sumó al progreso de la campaña.';

      notificacionMP.value = {
        tipo: 'success',
        titulo: '¡Pago aprobado y acreditado!',
        mensaje: `Operación #${paymentId} confirmada por $${Number(resultado.monto).toLocaleString('es-AR')}. ${textoAccion}`
      };
    } catch (error) {
      notificacionMP.value = {
        tipo: 'error',
        titulo: 'No se pudo verificar el pago',
        mensaje: error.response?.data?.error || 'Ocurrió un error al confirmar la operación.'
      };
    }
  }
};

const sincronizarPagosPendientes = async (user) => {
  if (!user || sincronizandoPagos.value) return;
  sincronizandoPagos.value = true;
  try {
    const acreditados = await campanaService.sincronizarPagosMP();
    if (acreditados && acreditados.length > 0) {
      detenerPollingMP();
      await cargarCampanas();
      const ultimo = acreditados[acreditados.length - 1];
      const textoAccion = ultimo.tipoOperacion === 'patrocinio'
        ? 'Tu espacio publicitario ya quedó reservado en la campaña.'
        : 'Tu aporte ya se sumó al progreso de la campaña.';

      notificacionMP.value = {
        tipo: 'success',
        titulo: '¡Pago aprobado y acreditado!',
        mensaje: `Operación #${ultimo.paymentId} confirmada por $${Number(ultimo.monto).toLocaleString('es-AR')}. ${textoAccion}`
      };
    }
  } catch (error) {
    // Silencioso en segundo plano
  } finally {
    sincronizandoPagos.value = false;
  }
};

const manejarCambioVisibilidad = () => {
  if (document.visibilityState === 'visible' && usuarioActual.value) {
    sincronizarPagosPendientes(usuarioActual.value);
  }
};

const cerrarSesion = async () => {
  try {
    detenerPollingMP();
    await signOut(auth);
    usuarioActual.value = null;
  } catch (error) {
    alert('Error al cerrar sesión');
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
  if (!usuarioActual.value) {
    mostrandoModalAuth.value = true;
    return;
  }
  modoEdicion.value = false;
  campanaSeleccionada.value = null;
  mostrandoModalForm.value = true;
};

const abrirModalEditar = (campana) => {
  if (!usuarioActual.value) {
    mostrandoModalAuth.value = true;
    return;
  }
  modoEdicion.value = true;
  campanaSeleccionada.value = campana;
  mostrandoModalForm.value = true;
};

const abrirModalConCampana = (campana, tipoModal) => {
  if (tipoModal !== 'qr' && tipoModal !== 'transparencia' && !usuarioActual.value) {
    mostrandoModalAuth.value = true;
    return;
  }

  campanaSeleccionada.value = campana;
  if (tipoModal === 'camiseta') mostrandoModalCamiseta.value = true;
  if (tipoModal === 'aporte') mostrandoModalAporte.value = true;
  if (tipoModal === 'ingreso') mostrandoModalIngresoExterno.value = true;
  if (tipoModal === 'gasto') mostrandoModalGasto.value = true;
  if (tipoModal === 'qr') mostrandoModalQR.value = true;
  if (tipoModal === 'transparencia') mostrandoModalTransparencia.value = true;
};

const guardarCampana = async (datos) => {
  if (enviando.value) return;
  enviando.value = true;
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
  } finally {
    enviando.value = false;
  }
};

const abrirCheckoutEnPestanaNueva = (urlCheckout) => {
  urlUltimoCheckout.value = urlCheckout;
  mostrandoModalAporte.value = false;
  mostrandoModalCamiseta.value = false;
  notificacionMP.value = null;

  const nuevaPestana = window.open(urlCheckout, '_blank');
  if (!nuevaPestana) {
    // Si el navegador bloqueó la ventana emergente, redirigimos en la misma pestaña
    window.location.href = urlCheckout;
    return;
  }

  iniciarPollingMP();
};

const iniciarPagoAporteMP = async (monto) => {
  if (enviando.value) return;
  enviando.value = true;
  try {
    const preferencia = await campanaService.crearPreferenciaPago({
      tipoOperacion: 'aporte',
      campanaId: campanaSeleccionada.value.id,
      monto
    });
    const urlCheckout = preferencia.initPoint || preferencia.sandboxInitPoint;
    if (!urlCheckout) throw new Error('No se recibió el enlace de pago de Mercado Pago');
    abrirCheckoutEnPestanaNueva(urlCheckout);
  } catch (error) {
    alert(error.response?.data?.error || error.message || 'Error al iniciar el pago con Mercado Pago');
  } finally {
    enviando.value = false;
  }
};

const iniciarPagoPatrocinioMP = async (payload) => {
  if (enviando.value) return;
  enviando.value = true;
  try {
    const preferencia = await campanaService.crearPreferenciaPago({
      tipoOperacion: 'patrocinio',
      campanaId: campanaSeleccionada.value.id,
      ...payload
    });
    const urlCheckout = preferencia.initPoint || preferencia.sandboxInitPoint;
    if (!urlCheckout) throw new Error('No se recibió el enlace de pago de Mercado Pago');
    abrirCheckoutEnPestanaNueva(urlCheckout);
  } catch (error) {
    alert(error.response?.data?.error || error.message || 'Error al iniciar el pago con Mercado Pago');
  } finally {
    enviando.value = false;
  }
};

const procesarAporte = async (monto) => {
  if (enviando.value) return;
  enviando.value = true;
  try {
    await campanaService.registrarAporte(campanaSeleccionada.value.id, monto);
    mostrandoModalAporte.value = false;
    await cargarCampanas();
  } catch (error) {
    alert(error.response?.data?.error || 'Error al registrar el aporte');
  } finally {
    enviando.value = false;
  }
};

const guardarIngresoExterno = async (datos) => {
  if (enviando.value) return;
  enviando.value = true;
  try {
    await campanaService.registrarIngresoExterno(campanaSeleccionada.value.id, datos);
    mostrandoModalIngresoExterno.value = false;
    await cargarCampanas();
  } catch (error) {
    alert(error.response?.data?.error || 'Error al registrar el ingreso externo');
  } finally {
    enviando.value = false;
  }
};

const guardarGasto = async (datos) => {
  if (enviando.value) return;
  enviando.value = true;
  try {
    await campanaService.registrarGasto(campanaSeleccionada.value.id, datos);
    mostrandoModalGasto.value = false;
    await cargarCampanas();
  } catch (error) {
    alert(error.response?.data?.error || 'Error al registrar el gasto');
  } finally {
    enviando.value = false;
  }
};

const procesarReservaSlot = async (payload) => {
  if (enviando.value) return;
  enviando.value = true;
  try {
    const actualizada = await campanaService.reservarSlot(campanaSeleccionada.value.id, payload);
    campanaSeleccionada.value = actualizada;
    alert('¡Espacio publicitario reservado con éxito!');
    await cargarCampanas();
  } catch (error) {
    alert(error.response?.data?.error || 'Error al reservar el espacio publicitario');
  } finally {
    enviando.value = false;
  }
};

const eliminarCampana = async (id) => {
  if (!usuarioActual.value) {
    mostrandoModalAuth.value = true;
    return;
  }
  if (confirm('¿Seguro que deseas eliminar esta campaña?')) {
    try {
      await campanaService.eliminarCampana(id);
      await cargarCampanas();
    } catch (error) {
      alert(error.response?.data?.error || 'Error al eliminar la campaña');
    }
  }
};

onMounted(() => {
  document.addEventListener('visibilitychange', manejarCambioVisibilidad);
  onAuthStateChanged(auth, async (user) => {
    usuarioActual.value = user;
    await procesarRetornoMercadoPago(user);
    await sincronizarPagosPendientes(user);
  });
  cargarCampanas();
});

onUnmounted(() => {
  document.removeEventListener('visibilitychange', manejarCambioVisibilidad);
  detenerPollingMP();
});
</script>

<template>
  <div class="min-h-screen bg-[#F5F5F5] text-slate-800 font-sans">
    <NavbarHeader
      :usuario="usuarioActual"
      @abrir-auth="mostrandoModalAuth = true"
      @cerrar-sesion="cerrarSesion"
    />

    <main class="max-w-6xl mx-auto px-4 py-8">
      <div
        v-if="esperandoPagoMP"
        class="mb-6 rounded-xl border border-sky-300 bg-sky-50 text-sky-950 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm"
      >
        <div class="flex items-start gap-3">
          <Loader2 class="w-5 h-5 text-[#009EE3] animate-spin shrink-0 mt-0.5" />
          <div>
            <p class="font-bold text-sm">Completá el pago en la pestaña de Mercado Pago</p>
            <p class="text-xs mt-0.5 text-sky-800">
              Apenas se acredite la operación, esta pantalla se actualizará automáticamente.
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2 self-end sm:self-center">
          <a
            v-if="urlUltimoCheckout"
            :href="urlUltimoCheckout"
            target="_blank"
            rel="noopener noreferrer"
            class="px-3 py-1.5 text-xs font-bold text-[#009EE3] bg-white border border-sky-200 hover:bg-sky-100 rounded-lg inline-flex items-center gap-1.5 transition"
          >
            <span>Abrir pago</span>
            <ExternalLink class="w-3.5 h-3.5" />
          </a>
          <button
            @click="detenerPollingMP"
            class="p-1.5 text-sky-700 hover:text-sky-950"
            title="Cerrar aviso"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
      </div>

      <div
        v-if="notificacionMP"
        :class="[
          'mb-6 rounded-xl border p-4 flex items-start justify-between gap-4 shadow-sm',
          notificacionMP.tipo === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : (notificacionMP.tipo === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : 'bg-sky-50 border-sky-200 text-sky-900')
        ]"
      >
        <div class="flex items-start gap-3">
          <CheckCircle2 v-if="notificacionMP.tipo === 'success'" class="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <AlertCircle v-else class="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
          <div>
            <p class="font-bold text-sm">{{ notificacionMP.titulo }}</p>
            <p class="text-xs mt-0.5 opacity-90">{{ notificacionMP.mensaje }}</p>
          </div>
        </div>
        <button @click="notificacionMP = null" class="opacity-60 hover:opacity-100">
          <X class="w-4 h-4" />
        </button>
      </div>

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
          :usuario-actual="usuarioActual"
          @abrir-camiseta="abrirModalConCampana(c, 'camiseta')"
          @abrir-aporte="abrirModalConCampana(c, 'aporte')"
          @abrir-ingreso="abrirModalConCampana(c, 'ingreso')"
          @abrir-gasto="abrirModalConCampana(c, 'gasto')"
          @abrir-qr="abrirModalConCampana(c, 'qr')"
          @abrir-transparencia="abrirModalConCampana(c, 'transparencia')"
          @editar="abrirModalEditar(c)"
          @eliminar="eliminarCampana"
        />
      </div>
    </main>

    <ModalAuth
      :visible="mostrandoModalAuth"
      @cerrar="mostrandoModalAuth = false"
    />

    <ModalCampanaForm
      :visible="mostrandoModalForm"
      :modo-edicion="modoEdicion"
      :campana-inicial="campanaSeleccionada"
      :enviando="enviando"
      @cerrar="mostrandoModalForm = false"
      @guardar="guardarCampana"
    />

    <ModalAporte
      :visible="mostrandoModalAporte"
      :campana="campanaSeleccionada"
      :enviando="enviando"
      @cerrar="mostrandoModalAporte = false"
      @confirmar="procesarAporte"
      @pagar-mp="iniciarPagoAporteMP"
    />

    <ModalIngresoExterno
      :visible="mostrandoModalIngresoExterno"
      :campana="campanaSeleccionada"
      :enviando="enviando"
      @cerrar="mostrandoModalIngresoExterno = false"
      @guardar="guardarIngresoExterno"
    />

    <ModalGasto
      :visible="mostrandoModalGasto"
      :campana="campanaSeleccionada"
      :enviando="enviando"
      @cerrar="mostrandoModalGasto = false"
      @guardar="guardarGasto"
    />

    <ModalCamisetaVirtual
      :visible="mostrandoModalCamiseta"
      :campana="campanaSeleccionada"
      :enviando="enviando"
      @cerrar="mostrandoModalCamiseta = false"
      @reservar="procesarReservaSlot"
      @pagar-mp="iniciarPagoPatrocinioMP"
    />

    <ModalQr
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