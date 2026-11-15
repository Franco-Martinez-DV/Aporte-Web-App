<script setup>
import { ref, watch } from 'vue';
import { FileUp, FileText, Trash2, ExternalLink } from 'lucide-vue-next';

const props = defineProps({
  visible: { type: Boolean, required: true },
  campana: { type: Object, default: null },
  enviando: { type: Boolean, default: false }
});

const emit = defineEmits(['cerrar', 'guardar']);

const subiendoArchivo = ref(false);
const errorArchivo = ref('');
const nombreArchivo = ref('');

const formulario = ref({
  concepto: '',
  monto: 0,
  fecha: new Date().toISOString().split('T')[0],
  comprobanteUrl: '',
  tipoArchivo: 'pdf'
});

watch(
  () => props.visible,
  (abierto) => {
    if (abierto) {
      errorArchivo.value = '';
      subiendoArchivo.value = false;
      nombreArchivo.value = '';
      formulario.value = {
        concepto: '',
        monto: 0,
        fecha: new Date().toISOString().split('T')[0],
        comprobanteUrl: '',
        tipoArchivo: 'pdf'
      };
    }
  }
);

const subirComprobante = async (event) => {
  const archivo = event.target.files?.[0];
  if (!archivo) return;

  errorArchivo.value = '';

  const esPdf = archivo.type === 'application/pdf';
  const esImagen = archivo.type.startsWith('image/');

  if (!esPdf && !esImagen) {
    errorArchivo.value = 'Formato no válido. Subí una factura en PDF o imagen (JPG, PNG).';
    return;
  }

  if (archivo.size > 10 * 1024 * 1024) {
    errorArchivo.value = 'El archivo no debe superar los 10 MB.';
    return;
  }

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    errorArchivo.value = 'Faltan configurar las variables de Cloudinary en .env.';
    return;
  }

  subiendoArchivo.value = true;
  try {
    const formData = new FormData();
    formData.append('file', archivo);
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', 'aporte_comprobantes');

    const respuesta = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
      method: 'POST',
      body: formData
    });

    if (!respuesta.ok) throw new Error('Error al subir el comprobante');

    const data = await respuesta.json();
    formulario.value.comprobanteUrl = data.secure_url;
    formulario.value.tipoArchivo = esPdf ? 'pdf' : 'imagen';
    nombreArchivo.value = archivo.name;
  } catch (err) {
    errorArchivo.value = 'No se pudo subir el comprobante. Intentá nuevamente.';
  } finally {
    subiendoArchivo.value = false;
    event.target.value = '';
  }
};

const quitarComprobante = () => {
  formulario.value.comprobanteUrl = '';
  nombreArchivo.value = '';
  errorArchivo.value = '';
};

const enviarGasto = () => {
  if (props.enviando || subiendoArchivo.value) return;

  if (!formulario.value.concepto.trim()) {
    alert('Ingresá el concepto o detalle de la compra.');
    return;
  }
  if (!formulario.value.monto || formulario.value.monto <= 0) {
    alert('Ingresá un monto válido mayor a 0.');
    return;
  }
  if (!formulario.value.comprobanteUrl) {
    alert('Adjuntá el PDF o foto de la factura comercial.');
    return;
  }

  emit('guardar', { ...formulario.value });
};
</script>

<template>
  <div v-if="visible" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative max-h-[90vh] overflow-y-auto">
      <h3 class="text-xl font-bold text-slate-900 mb-1">Rendir Gasto / Factura</h3>
      <p class="text-slate-600 text-xs mb-4">
        Justificá el uso de los fondos de <strong class="text-slate-900">{{ campana?.titulo }}</strong> adjuntando el comprobante.
      </p>

      <form @submit.prevent="enviarGasto" class="space-y-4">
        <div>
          <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Concepto / Detalle del Gasto</label>
          <input
            v-model="formulario.concepto"
            type="text"
            required
            placeholder="Ej: Compra de pasajes / Juego de camisetas"
            class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Importe ($)</label>
            <input
              v-model.number="formulario.monto"
              type="number"
              min="1"
              required
              class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 font-bold text-slate-800"
            />
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Fecha Factura</label>
            <input
              v-model="formulario.fecha"
              type="date"
              required
              class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Factura Comercial (PDF o Imagen)</label>

          <div
            v-if="formulario.comprobanteUrl"
            class="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3"
          >
            <div class="flex items-center gap-2 min-w-0">
              <FileText class="w-5 h-5 text-blue-600 shrink-0" />
              <div class="truncate">
                <p class="text-xs font-bold text-slate-800 truncate">{{ nombreArchivo || 'Comprobante adjunto' }}</p>
                <a
                  :href="formulario.comprobanteUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-[11px] text-blue-600 hover:underline inline-flex items-center gap-1"
                >
                  <span>Vista previa</span>
                  <ExternalLink class="w-3 h-3" />
                </a>
              </div>
            </div>
            <button
              type="button"
              @click="quitarComprobante"
              class="text-rose-600 hover:bg-rose-100 p-1.5 rounded-lg transition shrink-0"
              title="Quitar archivo"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>

          <label
            v-else
            class="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-lg p-4 cursor-pointer bg-slate-50 hover:bg-blue-50/40 transition"
          >
            <FileUp class="w-6 h-6 text-slate-400 mb-1" />
            <span class="text-xs font-semibold text-slate-700">
              {{ subiendoArchivo ? 'Subiendo factura a la nube...' : 'Seleccionar PDF o foto de factura' }}
            </span>
            <span class="text-[11px] text-slate-400 mt-0.5">PDF, JPG o PNG (máx. 10 MB)</span>
            <input
              type="file"
              accept="application/pdf,image/*"
              :disabled="subiendoArchivo"
              @change="subirComprobante"
              class="hidden"
            />
          </label>

          <p v-if="errorArchivo" class="text-xs text-rose-600 font-medium mt-1">{{ errorArchivo }}</p>
        </div>

        <div class="flex justify-end space-x-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            :disabled="enviando || subiendoArchivo"
            @click="$emit('cerrar')"
            class="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            type="submit"
            :disabled="enviando || subiendoArchivo"
            class="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ subiendoArchivo ? 'Subiendo...' : (enviando ? 'Guardando...' : 'Registrar Gasto') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>