<template>
  <NuxtLoadingIndicator
    color="linear-gradient(90deg, #ec0016 0%, #ff4052 48%, #0b4697 100%)"
    :height="3"
    :throttle="100"
  />
  <NuxtLayout>
    <NuxtPage :transition="{ name: 'page', mode: 'out-in' }" />
  </NuxtLayout>
</template>
