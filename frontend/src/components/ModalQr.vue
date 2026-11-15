<script setup>
import { ref, watch } from 'vue';
import { Printer, Copy, Check } from 'lucide-vue-next';
import { obtenerUrlCampana, formatearMoneda } from '../helpers/formatters';

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

const escaparHTML = (texto) => {
  if (!texto) return '';
  return String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
};

const imprimirFolleto = () => {
  if (!props.campana) return;

  const c = props.campana;
  const urlCampana = obtenerUrlCampana(c.id);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(urlCampana)}`;
  const ventanaImpresion = window.open('', '_blank', 'width=850,height=950');

  if (!ventanaImpresion) {
    alert('Habilitá las ventanas emergentes en tu navegador para generar el folleto imprimible.');
    return;
  }

  const bloqueImagen = c.imagenUrl
    ? `<div class="portada-wrapper">
         <img src="${escaparHTML(c.imagenUrl)}" alt="Portada" class="portada" onerror="this.parentElement.style.display='none'" />
       </div>`
    : '';

  const htmlFolleto = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Folleto - ${escaparHTML(c.titulo)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #F5F5F5;
      color: #0F172A;
      padding: 24px;
    }
    .hoja {
      max-width: 720px;
      margin: 0 auto;
      background: #FFFFFF;
      border: 2px solid #E2E8F0;
      border-radius: 16px;
      overflow: hidden;
    }
    .header {
      background: #0077FF;
      color: #FFFFFF;
      padding: 22px 28px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .marca {
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -0.5px;
    }
    .submarca {
      font-size: 12px;
      opacity: 0.9;
    }
    .badge {
      background: rgba(255, 255, 255, 0.2);
      padding: 6px 12px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .portada-wrapper {
      width: 100%;
      height: 230px;
      overflow: hidden;
      background: #E2E8F0;
    }
    .portada {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .contenido {
      padding: 28px;
    }
    .titulo {
      font-size: 28px;
      font-weight: 800;
      color: #0F172A;
      line-height: 1.2;
      margin-bottom: 12px;
    }
    .descripcion {
      font-size: 15px;
      color: #334155;
      line-height: 1.55;
      margin-bottom: 22px;
    }
    .datos-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      margin-bottom: 24px;
    }
    .dato-box {
      background: #F8FAFC;
      border: 1px solid #CBD5E1;
      border-radius: 12px;
      padding: 14px 18px;
    }
    .dato-label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748B;
      margin-bottom: 4px;
    }
    .dato-valor {
      font-size: 20px;
      font-weight: 800;
      color: #0077FF;
    }
    .qr-seccion {
      border: 2px dashed #0077FF;
      background: #EFF6FF;
      border-radius: 14px;
      padding: 22px;
      display: flex;
      align-items: center;
      gap: 24px;
    }
    .qr-img {
      width: 175px;
      height: 175px;
      background: #FFFFFF;
      padding: 8px;
      border-radius: 10px;
      border: 1px solid #BFDBFE;
      flex-shrink: 0;
    }
    .qr-texto h2 {
      font-size: 19px;
      font-weight: 800;
      color: #0F172A;
      margin-bottom: 8px;
    }
    .qr-texto p {
      font-size: 13px;
      color: #334155;
      line-height: 1.45;
      margin-bottom: 10px;
    }
    .url-box {
      display: inline-block;
      background: #FFFFFF;
      border: 1px solid #93C5FD;
      color: #0077FF;
      font-family: monospace;
      font-size: 12px;
      font-weight: 700;
      padding: 6px 10px;
      border-radius: 6px;
      word-break: break-all;
    }
    .footer {
      text-align: center;
      font-size: 11px;
      color: #64748B;
      padding: 14px;
      border-top: 1px solid #E2E8F0;
      background: #F8FAFC;
    }
    @media print {
      body { background: #FFFFFF; padding: 0; }
      .hoja { border: 1px solid #CBD5E1; box-shadow: none; }
      @page { size: A4 portrait; margin: 12mm; }
    }
  </style>
</head>
<body>
  <div class="hoja">
    <div class="header">
      <div>
        <div class="marca">APORTE</div>
        <div class="submarca">Financiamiento Colectivo y Patrocinio Deportivo</div>
      </div>
      <span class="badge">${escaparHTML(c.categoria)}</span>
    </div>

    ${bloqueImagen}

    <div class="contenido">
      <h1 class="titulo">${escaparHTML(c.titulo)}</h1>
      <p class="descripcion">${escaparHTML(c.descripcion)}</p>

      <div class="datos-grid">
        <div class="dato-box">
          <div class="dato-label">Meta Económica Propuesta</div>
          <div class="dato-valor">$${formatearMoneda(c.montoObjetivo)}</div>
        </div>
        <div class="dato-box">
          <div class="dato-label">Fecha Límite de Campaña</div>
          <div class="dato-valor" style="color: #0F172A;">${escaparHTML(c.fechaLimite || 'Sin fecha límite')}</div>
        </div>
      </div>

      <div class="qr-seccion">
        <img src="${qrUrl}" alt="Código QR" class="qr-img" />
        <div class="qr-texto">
          <h2>¡Sumá tu apoyo a este proyecto!</h2>
          <p>
            Escaneá este código QR con la cámara de tu celular para realizar una donación o patrocinar un espacio en nuestra indumentaria oficial.
          </p>
          <div class="url-box">${escaparHTML(urlCampana)}</div>
        </div>
      </div>
    </div>

    <div class="footer">
      Campaña verificada en plataforma Aporte • ID de seguimiento: ${escaparHTML(c.id)}
    </div>
  </div>

  <script>
    window.onload = function () {
      setTimeout(function () {
        window.print();
      }, 350);
    };
  <\/script>
</body>
</html>`;

  ventanaImpresion.document.open();
  ventanaImpresion.document.write(htmlFolleto);
  ventanaImpresion.document.close();
};
</script>

<template>
  <div v-if="visible" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative text-center">
      <div class="flex justify-between items-center mb-4 border-b pb-3 text-left">
        <div>
          <h3 class="text-xl font-bold text-slate-900">Material de Difusión</h3>
          <p class="text-xs text-slate-500">Escaneá el QR, compartí el enlace o imprimí el folleto.</p>
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

      <div class="flex gap-2 mb-3">
        <input
          type="text"
          readonly
          :value="obtenerUrlCampana(campana?.id)"
          class="w-full bg-slate-100 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-600 focus:outline-none"
        />
        <button
          @click="copiarEnlace"
          class="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg text-xs transition shrink-0 inline-flex items-center gap-1.5"
        >
          <Check v-if="copiadoExitoso" class="w-4 h-4" />
          <Copy v-else class="w-4 h-4" />
          <span>{{ copiadoExitoso ? 'Copiado' : 'Copiar Link' }}</span>
        </button>
      </div>

      <button
        @click="imprimirFolleto"
        class="w-full mb-4 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-lg text-xs transition flex items-center justify-center gap-2 shadow-sm"
      >
        <Printer class="w-4 h-4" />
        <span>Imprimir / Guardar Folleto PDF</span>
      </button>

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