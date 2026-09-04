const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public', 'models', 'handpose');

async function downloadFile(url, destPath) {
    if (fs.existsSync(destPath)) {
        console.log(`Already exists: ${destPath}`);
        return;
    }
    console.log(`Downloading ${url} to ${destPath}`);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.statusText}`);
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(destPath, buffer);
    console.log(`Saved ${destPath}`);
}

async function downloadModel(baseUrl, destDir) {
    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }
    
    const modelUrl = `${baseUrl}/model.json?tfjs-format=file`;
    const modelJsonPath = path.join(destDir, 'model.json');
    
    let modelJson;
    if (fs.existsSync(modelJsonPath)) {
        console.log(`Reading existing ${modelJsonPath}`);
        modelJson = JSON.parse(fs.readFileSync(modelJsonPath, 'utf8'));
    } else {
        console.log(`Downloading ${modelUrl} to ${modelJsonPath}`);
        const res = await fetch(modelUrl);
        if (!res.ok) throw new Error(`Failed to fetch ${modelUrl}: ${res.statusText}`);
        modelJson = await res.json();
        fs.writeFileSync(modelJsonPath, JSON.stringify(modelJson, null, 2));
        console.log(`Saved ${modelJsonPath}`);
    }

    // Parse model.json to find binary weight files
    const weightsManifest = modelJson.weightsManifest;
    if (weightsManifest) {
        for (const group of weightsManifest) {
            for (const p of group.paths) {
                const weightUrl = `${baseUrl}/${p}?tfjs-format=file`;
                const weightPath = path.join(destDir, p);
                await downloadFile(weightUrl, weightPath);
            }
        }
    }
}

async function main() {
    try {
        console.log("Starting handpose model downloads...");
        
        // 1. Hand Detector
        await downloadModel(
            'https://tfhub.dev/mediapipe/tfjs-model/handdetector/1/default/1',
            path.join(publicDir, 'handdetector')
        );

        // 2. Hand Skeleton (Pose)
        await downloadModel(
            'https://tfhub.dev/mediapipe/tfjs-model/handskeleton/1/default/1',
            path.join(publicDir, 'handskeleton')
        );

        // 3. Anchors.json
        const anchorsUrl = 'https://tfhub.dev/mediapipe/tfjs-model/handskeleton/1/default/1/anchors.json?tfjs-format=file';
        const anchorsDest = path.join(publicDir, 'handskeleton', 'anchors.json');
        await downloadFile(anchorsUrl, anchorsDest);

        console.log("All downloads completed successfully!");
    } catch (e) {
        console.error("Error:", e);
    }
}

main();
