<script setup>
import { ref, computed, watch } from 'vue';
import { ImagePlus, Trash2, Shirt, Building2, Trophy } from 'lucide-vue-next';

const props = defineProps({
  visible: { type: Boolean, required: true },
  modoEdicion: { type: Boolean, default: false },
  campanaInicial: { type: Object, default: null },
  enviando: { type: Boolean, default: false }
});

const emit = defineEmits(['cerrar', 'guardar']);

const subiendoImagen = ref(false);
const errorImagen = ref('');

const fechaMinima = computed(() => {
  const ahora = new Date();
  const local = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000);
  return local.toISOString().split('T')[0];
});

const formulario = ref({
  titulo: '',
  descripcion: '',
  categoria: 'Deportista Individual',
  tipo: 'donacion',
  modalidadPatrocinio: 'ambos',
  imagenUrl: '',
  montoObjetivo: 100000,
  recaudado: 0,
  fechaLimite: ''
});

const etiquetaBotonPatrocinio = computed(() => {
  if (formulario.value.categoria === 'Club') return 'Patrocinio de Club';
  if (formulario.value.categoria === 'Liga/Torneo') return 'Patrocinio de Liga/Torneo';
  return 'Patrocinio de Camiseta';
});

watch(
  () => props.visible,
  (abierto) => {
    if (!abierto) return;
    errorImagen.value = '';
    subiendoImagen.value = false;

    if (props.modoEdicion && props.campanaInicial) {
      formulario.value = {
        ...props.campanaInicial,
        imagenUrl: props.campanaInicial.imagenUrl || '',
        tipo: props.campanaInicial.tipo || 'donacion',
        modalidadPatrocinio: props.campanaInicial.modalidadPatrocinio || 'ambos'
      };
    } else {
      formulario.value = {
        titulo: '',
        descripcion: '',
        categoria: 'Deportista Individual',
        tipo: 'donacion',
        modalidadPatrocinio: 'ambos',
        imagenUrl: '',
        montoObjetivo: 100000,
        recaudado: 0,
        fechaLimite: ''
      };
    }
  }
);

const subirImagenCloudinary = async (event) => {
  const archivo = event.target.files?.[0];
  if (!archivo) return;

  errorImagen.value = '';

  if (!archivo.type.startsWith('image/')) {
    errorImagen.value = 'Seleccioná un archivo de imagen válido (JPG, PNG o WebP).';
    return;
  }

  if (archivo.size > 5 * 1024 * 1024) {
    errorImagen.value = 'La imagen no debe superar los 5 MB.';
    return;
  }

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    errorImagen.value = 'Faltan configurar las variables de Cloudinary en el archivo .env.';
    return;
  }

  subiendoImagen.value = true;
  try {
    const formData = new FormData();
    formData.append('file', archivo);
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', 'aporte_campanas');

    const respuesta = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData
    });

    if (!respuesta.ok) throw new Error('Error al subir la imagen');

    const data = await respuesta.json();
    formulario.value.imagenUrl = data.secure_url;
  } catch (err) {
    errorImagen.value = 'No se pudo subir la imagen. Intentá nuevamente.';
  } finally {
    subiendoImagen.value = false;
    event.target.value = '';
  }
};

const quitarImagen = () => {
  formulario.value.imagenUrl = '';
  errorImagen.value = '';
};

const enviarFormulario = () => {
  if (props.enviando || subiendoImagen.value) return;
  if (formulario.value.montoObjetivo < 10000) {
    alert('El monto objetivo mínimo es de $10.000.');
    return;
  }
  if (formulario.value.fechaLimite < fechaMinima.value) {
    alert('La fecha límite no puede ser anterior al día de hoy.');
    return;
  }
  emit('guardar', { ...formulario.value });
};
</script>

<template>
  <div v-if="visible" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 relative max-h-[90vh] overflow-y-auto">
      <h3 class="text-xl font-bold text-slate-900 mb-4">
        {{ modoEdicion ? 'Editar Campaña' : 'Nueva Campaña' }}
      </h3>

      <form @submit.prevent="enviarFormulario" class="space-y-4">
        <div>
          <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Categoría</label>
          <select
            v-model="formulario.categoria"
            :disabled="modoEdicion && formulario.tipo === 'patrocinio'"
            class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-slate-100 disabled:text-slate-500"
          >
            <option value="Deportista Individual">Deportista Individual</option>
            <option value="Club">Club</option>
            <option value="Liga/Torneo">Liga/Torneo</option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Tipo de Campaña</label>
          <div class="grid grid-cols-2 gap-3">
            <label
              :class="[
                'border rounded-lg p-3 text-center transition text-xs font-bold',
                modoEdicion ? 'cursor-not-allowed opacity-75' : 'cursor-pointer',
                formulario.tipo === 'donacion' ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-slate-300 text-slate-600'
              ]"
            >
              <input type="radio" v-model="formulario.tipo" value="donacion" :disabled="modoEdicion" class="sr-only" />
              Donación Estándar
            </label>
            <label
              :class="[
                'border rounded-lg p-3 text-center transition text-xs font-bold',
                modoEdicion ? 'cursor-not-allowed opacity-75' : 'cursor-pointer',
                formulario.tipo === 'patrocinio' ? 'border-blue-700 bg-blue-600 text-white' : 'border-slate-300 text-slate-600'
              ]"
            >
              <input type="radio" v-model="formulario.tipo" value="patrocinio" :disabled="modoEdicion" class="sr-only" />
              {{ etiquetaBotonPatrocinio }}
            </label>
          </div>
        </div>

        <div v-if="formulario.tipo === 'patrocinio'" class="bg-blue-50/80 border border-blue-200 rounded-xl p-3.5 text-xs text-slate-700">
          <template v-if="formulario.categoria === 'Deportista Individual'">
            <div class="flex items-center gap-2 font-bold text-blue-900 mb-1">
              <Shirt class="w-4 h-4 text-blue-600" />
              <span>Grilla de Indumentaria Oficial (6 espacios)</span>
            </div>
            <p class="text-slate-600">
              Se habilitarán espacios publicitarios en Pecho Principal, Pecho Secundario, Mangas, Espalda Superior y Zócalo Inferior.
            </p>
          </template>

          <template v-else-if="formulario.categoria === 'Club'">
            <div class="flex items-center gap-2 font-bold text-blue-900 mb-2">
              <Building2 class="w-4 h-4 text-blue-600" />
              <span>Espacios Publicitarios del Club</span>
            </div>

            <div v-if="!modoEdicion" class="grid grid-cols-3 gap-2 mb-2">
              <label
                :class="[
                  'border rounded-lg p-2 text-center cursor-pointer font-semibold transition',
                  formulario.modalidadPatrocinio === 'ambos' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-300'
                ]"
              >
                <input type="radio" v-model="formulario.modalidadPatrocinio" value="ambos" class="sr-only" />
                Camiseta + Predio
              </label>
              <label
                :class="[
                  'border rounded-lg p-2 text-center cursor-pointer font-semibold transition',
                  formulario.modalidadPatrocinio === 'camiseta' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-300'
                ]"
              >
                <input type="radio" v-model="formulario.modalidadPatrocinio" value="camiseta" class="sr-only" />
                Solo Camiseta
              </label>
              <label
                :class="[
                  'border rounded-lg p-2 text-center cursor-pointer font-semibold transition',
                  formulario.modalidadPatrocinio === 'instalaciones' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-300'
                ]"
              >
                <input type="radio" v-model="formulario.modalidadPatrocinio" value="instalaciones" class="sr-only" />
                Solo Instalaciones
              </label>
            </div>

            <p class="text-slate-600">
              <span v-if="formulario.modalidadPatrocinio === 'camiseta'">
                Incluye los 6 espacios publicitarios en la camiseta oficial del club.
              </span>
              <span v-else-if="formulario.modalidadPatrocinio === 'instalaciones'">
                Incluye Naming del Estadio/Predio y 3 espacios de cartelería en paredes del club.
              </span>
              <span v-else>
                Incluye los 6 espacios en la camiseta del club más Naming del Estadio/Predio y 3 espacios de cartelería en paredes.
              </span>
            </p>
          </template>

          <template v-else-if="formulario.categoria === 'Liga/Torneo'">
            <div class="flex items-center gap-2 font-bold text-blue-900 mb-1">
              <Trophy class="w-4 h-4 text-blue-600" />
              <span>Grilla de Patrocinio de Liga / Torneo (4 espacios)</span>
            </div>
            <p class="text-slate-600">
              Se habilitarán Naming Oficial de la Liga/Torneo, Auspicio de Premios y Trofeos, y 2 espacios de Cartelería del evento.
            </p>
          </template>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Imagen de Portada (Opcional)</label>

          <div v-if="formulario.imagenUrl" class="relative rounded-lg overflow-hidden border border-slate-200 mb-2">
            <img :src="formulario.imagenUrl" alt="Vista previa de portada" class="w-full h-40 object-cover" />
            <button
              type="button"
              @click="quitarImagen"
              class="absolute top-2 right-2 bg-slate-900/75 hover:bg-rose-600 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg inline-flex items-center gap-1 transition"
            >
              <Trash2 class="w-3.5 h-3.5" />
              <span>Quitar</span>
            </button>
          </div>

          <label
            v-else
            class="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-lg p-4 cursor-pointer bg-slate-50 hover:bg-blue-50/40 transition"
          >
            <ImagePlus class="w-6 h-6 text-slate-400 mb-1" />
            <span class="text-xs font-semibold text-slate-700">
              {{ subiendoImagen ? 'Subiendo imagen a la nube...' : 'Seleccionar foto desde tu dispositivo' }}
            </span>
            <span class="text-[11px] text-slate-400 mt-0.5">JPG, PNG o WebP (máx. 5 MB)</span>
            <input
              type="file"
              accept="image/*"
              :disabled="subiendoImagen"
              @change="subirImagenCloudinary"
              class="hidden"
            />
          </label>

          <p v-if="errorImagen" class="text-xs text-rose-600 font-medium mt-1">{{ errorImagen }}</p>
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
              min="10000"
              required
              class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Fecha Límite</label>
            <input
              v-model="formulario.fechaLimite"
              type="date"
              :min="fechaMinima"
              required
              class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>

        <div class="flex justify-end space-x-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            :disabled="enviando || subiendoImagen"
            @click="$emit('cerrar')"
            class="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            type="submit"
            :disabled="enviando || subiendoImagen"
            class="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ subiendoImagen ? 'Subiendo foto...' : (enviando ? 'Guardando...' : (modoEdicion ? 'Actualizar' : 'Guardar')) }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>