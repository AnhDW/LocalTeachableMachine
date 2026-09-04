const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '..', 'node_modules', '@tensorflow-models', 'handpose', 'dist', 'index.js');

if (fs.existsSync(targetFile)) {
    let content = fs.readFileSync(targetFile, 'utf8');

    // Patch hand detector
    content = content.replace(
        "HANDDETECT_MODEL_PATH = 'https://tfhub.dev/mediapipe/tfjs-model/handdetector/1/default/1';",
        "HANDDETECT_MODEL_PATH = '/models/handpose/handdetector/model.json';"
    );
    content = content.replace(
        "return [2 /*return*/, tfconv.loadGraphModel(HANDDETECT_MODEL_PATH, { fromTFHub: true })];",
        "return [2 /*return*/, tfconv.loadGraphModel(HANDDETECT_MODEL_PATH)];"
    );

    // Patch mesh model
    content = content.replace(
        "HANDPOSE_MODEL_PATH = 'https://tfhub.dev/mediapipe/tfjs-model/handskeleton/1/default/1';",
        "HANDPOSE_MODEL_PATH = '/models/handpose/handskeleton/model.json';"
    );
    content = content.replace(
        "return [2 /*return*/, tfconv.loadGraphModel(HANDPOSE_MODEL_PATH, { fromTFHub: true })];",
        "return [2 /*return*/, tfconv.loadGraphModel(HANDPOSE_MODEL_PATH)];"
    );

    // Patch anchors
    content = content.replace(
        ".fetch('https://tfhub.dev/mediapipe/tfjs-model/handskeleton/1/default/1/anchors.json?tfjs-format=file')",
        ".fetch('/models/handpose/handskeleton/anchors.json')"
    );

    fs.writeFileSync(targetFile, content);
    console.log('Successfully patched handpose to use local models.');
} else {
    console.log('handpose index.js not found. Skipping patch.');
}
