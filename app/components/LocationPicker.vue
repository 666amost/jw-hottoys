<script setup lang="ts">
import { PhCrosshair as Crosshair, PhMapPin as MapPin, PhWarningCircle as WarningCircle } from "@phosphor-icons/vue";

const model = defineModel<{ latitude: number; longitude: number }>({ required: true });
const mapEl = ref<HTMLElement>();
const mapReady = ref(false);
const locating = ref(false);
const locationError = ref("");
let map: import("leaflet").Map | undefined;
let marker: import("leaflet").Marker | undefined;

function update(lat: number, lng: number, recenter = false) {
  model.value = { ...model.value, latitude: lat, longitude: lng };
  marker?.setLatLng([lat, lng]);
  if (recenter) map?.flyTo([lat, lng], Math.max(map.getZoom(), 16));
}

function useCurrentLocation() {
  locationError.value = "";
  if (!navigator.geolocation) {
    locationError.value = "Perangkat ini tidak mendukung pencarian lokasi.";
    return;
  }
  locating.value = true;
  navigator.geolocation.getCurrentPosition(
    position => {
      update(position.coords.latitude, position.coords.longitude, true);
      locating.value = false;
    },
    error => {
      locationError.value = error.code === error.PERMISSION_DENIED
        ? "Izin lokasi ditolak. Geser pin secara manual atau aktifkan izin lokasi browser."
        : "Lokasi perangkat belum dapat ditemukan. Geser pin secara manual.";
      locating.value = false;
    },
    { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
  );
}

onMounted(async () => {
  const L = await import("leaflet");
  if (!mapEl.value) return;

  const latitude = model.value.latitude ?? -6.2;
  const longitude = model.value.longitude ?? 106.816666;
  map = L.map(mapEl.value, { zoomControl: true }).setView([latitude, longitude], 13);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
    maxZoom: 19,
  }).addTo(map);

  const markerIcon = L.divIcon({
    className: "jwlab-map-marker",
    html: '<span class="jwlab-map-marker__pin"><span /></span>',
    iconSize: [42, 48],
    iconAnchor: [21, 46],
  });
  marker = L.marker([latitude, longitude], { draggable: true, icon: markerIcon }).addTo(map);

  map.on("click", (event) => update(event.latlng.lat, event.latlng.lng));
  marker.on("dragend", () => {
    const point = marker!.getLatLng();
    update(point.lat, point.lng);
  });
  mapReady.value = true;
  requestAnimationFrame(() => map?.invalidateSize());
});

watch(() => [model.value.latitude, model.value.longitude] as const, ([latitude, longitude], previous) => {
  if (!map || !marker || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
  marker.setLatLng([latitude, longitude]);
  if (previous && (latitude !== previous[0] || longitude !== previous[1])) map.flyTo([latitude, longitude], Math.max(map.getZoom(), 15));
});

onBeforeUnmount(() => map?.remove());
</script>

<template>
  <section class="overflow-hidden rounded-2xl border border-slate-200 bg-white" aria-labelledby="location-picker-title">
    <div class="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 p-4 sm:px-5">
      <div class="flex items-start gap-3">
      <span class="grid size-10 shrink-0 place-items-center rounded-xl bg-red-50 text-[#ec0016]"><MapPin :size="21" weight="fill" /></span>
      <div>
        <h2 id="location-picker-title" class="text-sm font-black text-slate-900">Tandai lokasi di peta</h2>
        <p class="mt-1 text-xs leading-5 text-slate-500">Klik peta atau geser pin merah tepat ke lokasi penerima.</p>
      </div>
      </div>
      <button type="button" class="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-black text-[#0b4697] transition hover:border-[#0b4697] disabled:opacity-50" :disabled="locating" @click="useCurrentLocation">
        <Crosshair :size="17" :class="locating ? 'animate-spin' : ''" /> {{ locating ? "Mencari..." : "Gunakan lokasi saya" }}
      </button>
    </div>
    <p v-if="locationError" role="alert" class="flex items-start gap-2 border-b border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800 sm:px-5"><WarningCircle :size="17" class="shrink-0" />{{ locationError }}</p>
    <div class="relative">
      <div ref="mapEl" class="h-72 w-full bg-slate-100 sm:h-80" />
      <div v-if="!mapReady" class="absolute inset-0 grid place-items-center bg-slate-100 text-xs font-bold text-slate-500">Memuat peta...</div>
    </div>
    <div class="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-4 py-3 text-[10px] text-slate-500 sm:px-5">
      <span class="font-bold text-slate-700">Koordinat lokasi</span>
      <span class="font-mono">{{ model.latitude.toFixed(6) }}, {{ model.longitude.toFixed(6) }}</span>
    </div>
  </section>
</template>
