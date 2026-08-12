import { createConfigForNuxt } from "@nuxt/eslint-config/flat";

export default createConfigForNuxt({
  features: { standalone: true },
  dirs: {
    src: ["app"],
    pages: ["app/pages"],
    components: ["app/components"],
    composables: ["app/composables", "app/utils"],
    layouts: ["app/layouts"],
    middleware: ["app/middleware"],
  },
}).append({
  rules: {
    "vue/multi-word-component-names": "off",
    "@typescript-eslint/no-explicit-any": "off",
  },
});
