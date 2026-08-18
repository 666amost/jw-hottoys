<script setup lang="ts">
import {
  PhArrowLeft as ArrowLeft,
  PhCheckCircle as CheckCircle,
  PhHouse as House,
  PhInfo as Info,
  PhMapPin as MapPin,
  PhStorefront as Storefront,
} from "@phosphor-icons/vue";
type RegionOption = { code: string; name: string; latitude?: number | null; longitude?: number | null };

definePageMeta({ middleware: "auth" });

const route = useRoute();
const loading = ref(false);
const error = ref("");
const regionError = ref("");
const mapNotice = ref("");
const districtsLoading = ref(false);
const villagesLoading = ref(false);
const provinces = ref<RegionOption[]>([]);
const cities = ref<RegionOption[]>([]);
const selectedProvinceCode = ref("31");
const selectedCityCode = ref("3174");
const selectedDistrictCode = ref("");
const selectedVillageCode = ref("");
const districts = ref<RegionOption[]>([]);
const villages = ref<RegionOption[]>([]);
let districtRequest = 0;
let villageRequest = 0;

const form = reactive({
  label: "Rumah",
  recipientName: "",
  phone: "",
  provinceCode: "31",
  cityCode: "3174",
  districtCode: "",
  subdistrictCode: "",
  postalCode: "",
  addressLine: "",
  landmark: "",
  latitude: -6.261493,
  longitude: 106.8106,
  isDefault: true,
});

const returnPath = computed(() => {
  const next = typeof route.query.next === "string" ? route.query.next : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/account/addresses";
});
const returnLabel = computed(() => returnPath.value === "/checkout" ? "Kembali ke checkout" : "Kembali ke daftar alamat");

async function loadDistricts(cityCode: string) {
  const request = ++districtRequest;
  districtsLoading.value = true;
  regionError.value = "";
  districts.value = [];
  villages.value = [];
  selectedDistrictCode.value = "";
  selectedVillageCode.value = "";
  form.districtCode = "";
  form.subdistrictCode = "";
  try {
    const result = await $fetch<{ regions: RegionOption[] }>("/api/regions", { query: { level: "districts", parent: cityCode } });
    if (request === districtRequest) districts.value = result.regions;
  } catch {
    if (request === districtRequest) regionError.value = "Daftar kecamatan gagal dimuat. Silakan coba pilih kota kembali.";
  } finally {
    if (request === districtRequest) districtsLoading.value = false;
  }
}

async function loadVillages(districtCode: string) {
  const request = ++villageRequest;
  villagesLoading.value = true;
  regionError.value = "";
  villages.value = [];
  selectedVillageCode.value = "";
  form.subdistrictCode = "";
  try {
    const result = await $fetch<{ regions: RegionOption[] }>("/api/regions", { query: { level: "villages", parent: districtCode } });
    if (request === villageRequest) villages.value = result.regions;
  } catch {
    if (request === villageRequest) regionError.value = "Daftar kelurahan gagal dimuat. Silakan pilih kecamatan kembali.";
  } finally {
    if (request === villageRequest) villagesLoading.value = false;
  }
}

async function provinceChanged() {
  form.provinceCode = selectedProvinceCode.value;
  const result = await $fetch<{ regions: RegionOption[] }>("/api/regions", { query: { level: "cities", parent: selectedProvinceCode.value } });
  cities.value = result.regions;
  const firstCity = cities.value[0];
  selectedCityCode.value = firstCity?.code || "";
  form.cityCode = firstCity?.code || "";
  if (firstCity) await loadDistricts(firstCity.code);
}

async function cityChanged() {
  form.cityCode = selectedCityCode.value;
  if (selectedCityCode.value) await loadDistricts(selectedCityCode.value);
}

async function districtChanged() {
  form.districtCode = selectedDistrictCode.value;
  if (selectedDistrictCode.value) await loadVillages(selectedDistrictCode.value);
}

async function villageChanged() {
  form.subdistrictCode = selectedVillageCode.value;
  mapNotice.value = "";
  const village = villages.value.find(item => item.code === selectedVillageCode.value);
  if (!village) return;
  if (Number.isFinite(village.latitude) && Number.isFinite(village.longitude)) {
    form.latitude = village.latitude!;
    form.longitude = village.longitude!;
    return;
  }
  const province = provinces.value.find(item => item.code === selectedProvinceCode.value)?.name || "";
  const city = cities.value.find(item => item.code === selectedCityCode.value)?.name || "";
  const district = districts.value.find(item => item.code === selectedDistrictCode.value)?.name || "";
  try {
    const point = await $fetch<
      | { found?: true; latitude: number; longitude: number }
      | { found: false; message: string }
    >("/api/geocode", { query: { province, city, district, subdistrict: village.name, postalCode: form.postalCode } });
    if (point.found === false) {
      mapNotice.value = point.message;
      return;
    }
    if (Number.isFinite(point.latitude) && Number.isFinite(point.longitude)) {
      form.latitude = point.latitude;
      form.longitude = point.longitude;
    }
  } catch {
    mapNotice.value = "Pusat peta belum tersedia. Gunakan lokasi saya atau geser pin secara manual.";
  }
}

async function save() {
  if (loading.value) return;
  if (!form.districtCode || !form.subdistrictCode) {
    error.value = "Pilih kecamatan dan kelurahan sesuai alamat pengiriman.";
    return;
  }
  loading.value = true;
  error.value = "";
  try {
    await $fetch("/api/account/addresses", { method: "POST", body: form });
    await refreshNuxtData("/api/account/addresses");
    await navigateTo({ path: returnPath.value, query: returnPath.value === "/checkout" ? { addressAdded: "1" } : { created: "1" } });
  } catch (cause: any) {
    error.value = cause?.data?.error?.message
      || cause?.data?.data?.error?.message
      || cause?.data?.statusMessage
      || cause?.statusMessage
      || "Alamat gagal disimpan.";
    loading.value = false;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

onMounted(async () => {
  const result = await $fetch<{ regions: RegionOption[] }>("/api/regions", { query: { level: "provinces" } });
  provinces.value = result.regions;
  const cityResult = await $fetch<{ regions: RegionOption[] }>("/api/regions", { query: { level: "cities", parent: selectedProvinceCode.value } });
  cities.value = cityResult.regions;
  await loadDistricts(selectedCityCode.value);
});
useSeoMeta({ title: "Alamat Baru" });
</script>

<template>
  <main class="pb-24 sm:pb-16">
    <section class="border-b border-slate-200/80 bg-gradient-to-br from-white via-white to-blue-50/50">
      <div class="container-shell py-8 sm:py-11">
        <NuxtLink :to="returnPath" class="inline-flex items-center gap-2 text-xs font-black text-slate-500 transition hover:text-[#0b4697]"><ArrowLeft :size="16" /> {{ returnLabel }}</NuxtLink>
        <p class="eyebrow mt-5">Delivery address</p>
        <h1 class="section-title mt-2">Tambah alamat baru</h1>
        <p class="mt-3 max-w-2xl text-sm leading-6 text-slate-500">Lengkapi tujuan pengiriman secara bertahap agar kurir dapat menemukan lokasi dengan tepat.</p>
      </div>
    </section>

    <section class="container-shell py-7 sm:py-10">
      <form class="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_310px]" @submit.prevent="save">
        <div class="grid min-w-0 gap-5">
          <div v-if="error" role="alert" class="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{{ error }}</div>

          <section class="surface overflow-hidden">
            <header class="flex items-center gap-3 border-b border-slate-100 px-5 py-5 sm:px-6">
              <span class="grid size-10 place-items-center rounded-xl bg-blue-50 text-[#0b4697]"><House :size="21" weight="fill" /></span>
              <div><p class="text-[9px] font-black uppercase tracking-[.14em] text-[#0b4697]">Kontak penerima</p><h2 class="mt-0.5 text-lg font-black">Alamat ini untuk siapa?</h2></div>
            </header>
            <div class="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
              <fieldset class="sm:col-span-2">
                <legend class="text-xs font-black text-slate-800">Simpan sebagai</legend>
                <div class="mt-2 flex gap-2">
                  <button type="button" class="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-black transition sm:max-w-40" :class="form.label === 'Rumah' ? 'border-[#0b4697] bg-blue-50 text-[#0b4697] ring-2 ring-blue-100' : 'border-slate-200 text-slate-600 hover:border-slate-300'" :aria-pressed="form.label === 'Rumah'" @click="form.label = 'Rumah'"><House :size="18" weight="fill" /> Rumah</button>
                  <button type="button" class="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-black transition sm:max-w-40" :class="form.label === 'Toko' ? 'border-[#0b4697] bg-blue-50 text-[#0b4697] ring-2 ring-blue-100' : 'border-slate-200 text-slate-600 hover:border-slate-300'" :aria-pressed="form.label === 'Toko'" @click="form.label = 'Toko'"><Storefront :size="18" weight="fill" /> Toko</button>
                </div>
              </fieldset>
              <label class="field-label"><span>Nama penerima <span class="text-red-600">*</span></span><input v-model="form.recipientName" class="field" required autocomplete="name" placeholder="Nama lengkap penerima"><small class="field-helper">Gunakan nama yang dikenali di lokasi tujuan.</small></label>
              <label class="field-label"><span>Nomor telepon <span class="text-red-600">*</span></span><input v-model="form.phone" class="field" required minlength="8" maxlength="20" pattern="[0-9+() -]{8,20}" inputmode="tel" autocomplete="tel" placeholder="Contoh: 081234567890" title="Masukkan nomor telepon 8–20 karakter"><small class="field-helper">Minimal 8 karakter. Digunakan kurir jika membutuhkan petunjuk.</small></label>
            </div>
          </section>

          <section class="surface overflow-hidden">
            <header class="flex items-center gap-3 border-b border-slate-100 px-5 py-5 sm:px-6">
              <span class="grid size-10 place-items-center rounded-xl bg-red-50 text-[#ec0016]"><MapPin :size="21" weight="fill" /></span>
              <div><p class="text-[9px] font-black uppercase tracking-[.14em] text-[#ec0016]">Wilayah pengiriman</p><h2 class="mt-0.5 text-lg font-black">Pilih Alamat lengkapmu</h2></div>
            </header>
            <div class="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
              <label class="field-label"><span>Provinsi <span class="text-red-600">*</span></span><select v-model="selectedProvinceCode" class="field" required @change="provinceChanged"><option v-for="province in provinces" :key="province.code" :value="province.code">{{ province.name }}</option></select></label>
              <label class="field-label"><span>Kota/Kabupaten <span class="text-red-600">*</span></span><select v-model="selectedCityCode" class="field" required @change="cityChanged"><option v-for="city in cities" :key="city.code" :value="city.code">{{ city.name }}</option></select></label>
              <label class="field-label"><span>Kecamatan <span class="text-red-600">*</span></span><select v-model="selectedDistrictCode" class="field" required :disabled="districtsLoading || !districts.length" @change="districtChanged"><option value="" disabled>{{ districtsLoading ? "Memuat kecamatan..." : "Pilih kecamatan" }}</option><option v-for="district in districts" :key="district.code" :value="district.code">{{ district.name }}</option></select></label>
              <label class="field-label"><span>Kelurahan <span class="text-red-600">*</span></span><select v-model="selectedVillageCode" class="field" required :disabled="villagesLoading || !villages.length" @change="villageChanged"><option value="" disabled>{{ villagesLoading ? "Memuat kelurahan..." : selectedDistrictCode ? "Pilih kelurahan" : "Pilih kecamatan dahulu" }}</option><option v-for="village in villages" :key="village.code" :value="village.code">{{ village.name }}</option></select></label>
              <p v-if="regionError" class="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-bold leading-5 text-amber-800 sm:col-span-2">{{ regionError }}</p>
              <label class="field-label"><span>Kode pos <span class="text-red-600">*</span></span><input v-model="form.postalCode" class="field" required minlength="5" maxlength="10" inputmode="numeric" autocomplete="postal-code" placeholder="Contoh: 15141"></label>
              <label class="field-label"><span>Patokan <span class="font-semibold text-slate-400">(opsional)</span></span><input v-model="form.landmark" class="field" maxlength="150" placeholder="Contoh: Sebelah minimarket"></label>
              <label class="field-label sm:col-span-2"><span>Alamat lengkap <span class="text-red-600">*</span></span><textarea v-model="form.addressLine" class="field min-h-28 resize-y leading-6" required minlength="8" autocomplete="street-address" placeholder="Nama jalan, nomor rumah/bangunan, RT/RW, blok, atau lantai" /><small class="field-helper">Tidak perlu mengulang kecamatan, kelurahan, kota, atau provinsi.</small></label>
            </div>
          </section>

          <p v-if="mapNotice" class="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-bold leading-5 text-amber-800">{{ mapNotice }}</p>
          <LocationPicker v-model="form" />
        </div>

        <aside class="surface overflow-hidden lg:sticky lg:top-40">
          <div class="border-b border-slate-100 p-5"><h2 class="font-black">Simpan alamat</h2><p class="mt-1 text-xs leading-5 text-slate-500">Periksa kembali kontak, wilayah, dan posisi pin.</p></div>
          <div class="p-5">
            <label class="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-slate-200 p-4">
              <span><span class="block text-sm font-black">Alamat utama</span><span class="mt-1 block text-[11px] leading-4 text-slate-500">Dipilih otomatis saat checkout.</span></span>
              <span class="relative shrink-0"><input v-model="form.isDefault" type="checkbox" class="peer sr-only"><span class="block h-6 w-11 rounded-full bg-slate-300 transition peer-checked:bg-[#0b4697] after:absolute after:left-1 after:top-1 after:size-4 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-5" /></span>
            </label>
            <div class="mt-4 flex gap-2 rounded-xl bg-blue-50 p-3 text-[11px] leading-5 text-slate-600"><Info :size="17" weight="fill" class="mt-0.5 shrink-0 text-[#0b4697]" />Lima kota Jakarta, Kota Tangerang, dan Tangerang Selatan dikirim dengan BCE Express. Wilayah Indonesia lainnya menggunakan JNE.</div>
            <AppButton type="submit" class="mt-5 w-full" :disabled="loading || districtsLoading || villagesLoading"><CheckCircle :size="18" weight="fill" /> {{ loading ? "Menyimpan alamat..." : "Simpan alamat" }}</AppButton>
          </div>
        </aside>
      </form>
    </section>
  </main>
</template>
