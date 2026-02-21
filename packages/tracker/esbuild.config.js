const esbuild = require('esbuild');

esbuild.buildSync({
  entryPoints: ['src/index.ts'],
  bundle: true,
  minify: true,
  outfile: 'dist/oa.js',
  format: 'iife',
  target: ['es5'],
  charset: 'utf8',
});

console.log('Built dist/oa.js');
