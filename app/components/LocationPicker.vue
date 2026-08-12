<script setup lang="ts">
const model = defineModel<{ latitude: number; longitude: number }>({ required: true });
const mapEl = ref<HTMLElement>();
onMounted(async () => {
  const L = await import("leaflet");
  if (!mapEl.value) return;
  const map = L.map(mapEl.value).setView([model.value.latitude || -6.2, model.value.longitude || 106.816666], 11);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap" }).addTo(map);
  const marker = L.marker([model.value.latitude || -6.2, model.value.longitude || 106.816666], { draggable: true }).addTo(map);
  const update = (lat: number, lng: number) => {
    model.value.latitude = lat;
    model.value.longitude = lng;
    marker.setLatLng([lat, lng]);
  };
  map.on("click", (event) => update(event.latlng.lat,event.latlng.lng)); marker.on("dragend", () => { const point=marker.getLatLng(); update(point.lat,point.lng); });
  onBeforeUnmount(() => map.remove());
});
</script>
<template><div><div ref="mapEl" class="h-64 rounded-xl border"/><p class="mt-2 text-xs text-slate-500">Klik atau geser pin: {{ model.latitude.toFixed(6) }}, {{ model.longitude.toFixed(6) }}</p></div></template>
