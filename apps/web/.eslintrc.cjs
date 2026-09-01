module.exports = {
  root: true,
  env: { browser: true, es2022: true, node: true },
  // plugin:vue/vue3-recommended sets the top-level `parser` to
  // vue-eslint-parser (needed to understand .vue's <template>/<script>
  // structure at all), but plugin:@typescript-eslint/recommended's own base
  // config *also* sets a top-level `parser` (to '@typescript-eslint/parser'
  // directly) -- and being last in `extends` below, it would otherwise win,
  // feeding raw .vue SFC source straight into a parser that doesn't
  // understand SFC syntax at all ("'>' expected" parsing the <script> tag
  // itself). This file's own top-level `parser` always overrides whatever
  // `extends` entries set, regardless of their order, so declaring it
  // explicitly here keeps vue-eslint-parser in charge of the SFC structure.
  parser: 'vue-eslint-parser',
  plugins: ['@typescript-eslint'],
  // plugin:@typescript-eslint/recommended (same version api already uses)
  // pulls in a compatibility layer that turns off base no-undef/no-unused-vars
  // for .ts content and replaces them with TS-aware versions -- without it,
  // base no-undef flags lib.dom.d.ts-only type names like RequestInit (it
  // can't tell type positions from value references) and base no-unused-vars
  // doesn't understand TS constructor parameter properties (e.g. `public
  // readonly status: number` in a constructor), both false positives.
  extends: ['eslint:recommended', 'plugin:vue/vue3-recommended', 'plugin:@typescript-eslint/recommended'],
  parserOptions: {
    // Tells vue-eslint-parser what to hand <script>/<script setup> content
    // to. Without this it fell back to the default (espree), which can't
    // parse TypeScript syntax at all -- hence "Unexpected token interface"
    // in plain .ts files and "Unexpected token <...>" inside <script
    // setup lang="ts"> blocks in .vue files.
    parser: '@typescript-eslint/parser',
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    'vue/multi-word-component-names': 'off',
  },
};
