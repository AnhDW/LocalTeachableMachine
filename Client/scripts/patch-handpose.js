const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'node_modules', '@tensorflow-models', 'handpose', 'dist');

if (fs.existsSync(distDir)) {
    const files = fs.readdirSync(distDir).filter(f => f.endsWith('.js'));
    let patchedCount = 0;
    
    for (const file of files) {
        const targetFile = path.join(distDir, file);
        let content = fs.readFileSync(targetFile, 'utf8');
        let originalContent = content;

        // Replace Hand Detector URL
        content = content.replace(
            /'https:\/\/tfhub\.dev\/mediapipe\/tfjs-model\/handdetector\/1\/default\/1'/g,
            "'/models/handpose/handdetector/model.json'"
        );
        content = content.replace(
            /"https:\/\/tfhub\.dev\/mediapipe\/tfjs-model\/handdetector\/1\/default\/1"/g,
            "'/models/handpose/handdetector/model.json'"
        );

        // Replace Hand Skeleton URL
        content = content.replace(
            /'https:\/\/tfhub\.dev\/mediapipe\/tfjs-model\/handskeleton\/1\/default\/1'/g,
            "'/models/handpose/handskeleton/model.json'"
        );
        content = content.replace(
            /"https:\/\/tfhub\.dev\/mediapipe\/tfjs-model\/handskeleton\/1\/default\/1"/g,
            "'/models/handpose/handskeleton/model.json'"
        );

        // Replace Anchors URL
        content = content.replace(
            /'https:\/\/tfhub\.dev\/mediapipe\/tfjs-model\/handskeleton\/1\/default\/1\/anchors\.json\?tfjs-format=file'/g,
            "'/models/handpose/handskeleton/anchors.json'"
        );
        content = content.replace(
            /"https:\/\/tfhub\.dev\/mediapipe\/tfjs-model\/handskeleton\/1\/default\/1\/anchors\.json\?tfjs-format=file"/g,
            "'/models/handpose/handskeleton/anchors.json'"
        );

        // Remove fromTFHub flag
        content = content.replace(/\{ fromTFHub: true \}/g, "{}");
        content = content.replace(/\{fromTFHub:!0\}/g, "{}");
        content = content.replace(/\{ fromTFHub: !0 \}/g, "{}");

        if (content !== originalContent) {
            fs.writeFileSync(targetFile, content);
            console.log(`Patched ${file}`);
            patchedCount++;
        }
    }
    
    if (patchedCount > 0) {
        console.log(`Successfully patched ${patchedCount} handpose files to use local models.`);
    } else {
        console.log(`No files needed patching.`);
    }
} else {
    console.log('handpose dist directory not found. Skipping patch.');
}
