// rollup.config.js
import svelte from 'rollup-plugin-svelte';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import css from 'rollup-plugin-css-only';
import terser from '@rollup/plugin-terser';
import json from '@rollup/plugin-json';
import nodePolyfills from 'rollup-plugin-node-polyfills';
const production = !process.env.ROLLUP_WATCH;

/* ------- shared plugin list ------- */
const basePlugins = [
	json(),
	svelte({ compilerOptions: { dev: !production } }),
	css({ output: 'bundle.css' }),
	resolve({ browser: true, dedupe: ['svelte'], exportConditions: ['svelte'], preferBuiltins: false }),
	commonjs(),
	nodePolyfills(),
	production && terser()
];

/* -------------------------------------------------
   1) CONTENT‑SCRIPT BUILD  (single file, no imports)
--------------------------------------------------*/
const contentBuild = {
	input: 'src/main.js',
	output: {
		file: 'public/build/main.js',
		format: 'iife',
		sourcemap: !production
	},
	plugins: basePlugins,
	watch: { clearScreen: false }
};

/* -------------------------------------------------
   2) EXTENSION PAGES / MULTI‑PAGE BUILD (ESM)
--------------------------------------------------*/
const pagesBuild = {
	input: {
		'extension-popup': 'src/extension-popup.js',
	},
	output: {
		dir: 'public/build',
		format: 'esm',
		sourcemap: !production,
		entryFileNames: '[name].js',
		chunkFileNames: 'chunks/[name]-[hash].js'
	},
	plugins: basePlugins,
	watch: { clearScreen: false }
};

export default [contentBuild, pagesBuild];
