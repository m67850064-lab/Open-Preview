const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// ─── Monorepo support ─────────────────────────────────────────────────────────
// Metro को workspace root भी watch करनी है ताकि shared packages मिलें।
config.watchFolders = [workspaceRoot];

// Node modules दोनों जगह से resolve हों — app-local पहले, फिर workspace root।
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// ─── Asset extensions ─────────────────────────────────────────────────────────
// Default list में जो already है उसके साथ extra formats।
config.resolver.assetExts = [
  ...config.resolver.assetExts,
  'bin',   // wasm binary helpers
  'db',    // SQLite (future use)
  'ttf',   // extra fonts
  'otf',
];

// ─── Source extensions ────────────────────────────────────────────────────────
// SVG as source (react-native-svg-transformer, अगर कभी SVG files import करनी हों)
// अभी inline SVG use हो रहा है, इसलिए यह section ready है लेकिन active नहीं।
// Uncomment करें अगर SVG file imports शुरू करें:
//
// const { assetExts, sourceExts } = config.resolver;
// config.resolver.assetExts = assetExts.filter(ext => ext !== 'svg');
// config.resolver.sourceExts = [...sourceExts, 'svg'];
// config.transformer = {
//   ...config.transformer,
//   babelTransformerPath: require.resolve('react-native-svg-transformer'),
// };

module.exports = config;
