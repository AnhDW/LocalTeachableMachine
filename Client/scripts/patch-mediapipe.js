const fs = require('fs');
const path = require('path');

const pkgPath = path.join(__dirname, '..', 'node_modules', '@mediapipe', 'hands', 'package.json');

if (fs.existsSync(pkgPath)) {
    let content = fs.readFileSync(pkgPath, 'utf8');
    const pkg = JSON.parse(content);
    
    // Remove 'module' field to force Vite to treat it as CommonJS,
    // which resolves the [MISSING_EXPORT] "Hands" error.
    if (pkg.module) {
        delete pkg.module;
        fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
        console.log('Successfully patched @mediapipe/hands/package.json for Vite compatibility.');
    } else {
        console.log('@mediapipe/hands/package.json already patched.');
    }
    
    // Patch hands.js to provide static export hints for Vite/esbuild
    const handsJsPath = path.join(__dirname, '..', 'node_modules', '@mediapipe', 'hands', 'hands.js');
    if (fs.existsSync(handsJsPath)) {
        let jsContent = fs.readFileSync(handsJsPath, 'utf8');
        if (!jsContent.includes('exports.Hands = exports.Hands;')) {
            jsContent += '\n// Vite static analysis hints\nexports.Hands = exports.Hands;\nexports.HAND_CONNECTIONS = exports.HAND_CONNECTIONS;\nexports.VERSION = exports.VERSION;\n';
            fs.writeFileSync(handsJsPath, jsContent);
            console.log('Successfully patched hands.js for Vite compatibility.');
        } else {
            console.log('hands.js already patched.');
        }
    }
} else {
    console.log('@mediapipe/hands directory not found. Skipping patch.');
}
