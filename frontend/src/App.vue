<script setup>
import { ref, onMounted } from 'vue';
import campanaService from './services/campanaService';

const campanas = ref([]);
const cargando = ref(true);

const cargarCampanas = async () => {
  try {
    campanas.value = await campanaService.obtenerCampanas();
  } catch (error) {
    console.error('Error al conectar con la API:', error);
  } finally {
    cargando.value = false;
  }
};

onMounted(() => {
  cargarCampanas();
});
</script>

<template>
  <main style="padding: 2rem; font-family: sans-serif; max-width: 850px; margin: 0 auto;">
    <header style="margin-bottom: 2rem; text-align: center;">
      <h1>Plataforma Aporte</h1>
      <p style="color: #555;">Plataforma de recaudacion para el deporte amateur</p>
    </header>

    <div v-if="cargando">
      <p>Cargando campañas activas...</p>
    </div>

    <div v-else-if="campanas.length === 0">
      <p>No hay campañas registradas actualmente.</p>
    </div>

    <div v-else style="display: grid; gap: 1.5rem;">
      <article 
        v-for="campana in campanas" 
        :key="campana.id"
        style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 1.5rem; background: #fafafa;"
      >
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="background: #0284c7; color: white; padding: 4px 12px; border-radius: 12px; font-size: 0.85rem; font-weight: bold;">
            {{ campana.categoria }}
          </span>
          <small style="color: #64748b;">Finaliza: {{ campana.fechaLimite }}</small>
        </div>

        <h2 style="margin: 0.75rem 0 0.5rem 0; color: #334155">{{ campana.titulo }}</h2>
        <p style="color: #334155;">{{ campana.descripcion }}</p>

        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 1rem 0;" />

        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <p style="margin: 0; font-size: 0.9rem; color: #64748b;">Recaudado / Objetivo</p>
            <p style="margin: 0; font-size: 1.2rem; font-weight: bold; color: #0f172a;">
              ${{ campana.recaudado?.toLocaleString() }} / ${{ campana.montoObjetivo?.toLocaleString() }}
            </p>
          </div>
          <span style="font-size: 0.85rem; color: #16a34a; font-weight: bold;">
            Estado: {{ campana.estado }}
          </span>
        </div>
      </article>
    </div>
  </main>
</template>