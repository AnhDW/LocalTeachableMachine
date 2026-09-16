export const GAME_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Math Calculation Game (AI Gestures)</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- Load TensorFlow.js -->
  <script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs/dist/tf.min.js"></script>
  <!-- Load MediaPipe dependencies -->
  <script src="https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js"></script>
  <!-- Load HandPose detection -->
  <script src="https://cdn.jsdelivr.net/npm/@tensorflow-models/hand-pose-detection"></script>
  <!-- Load KNN Classifier -->
  <script src="https://cdn.jsdelivr.net/npm/@tensorflow-models/knn-classifier"></script>
  <style>
    /* Add custom animations from the Angular game */
    @keyframes gradient-xy {
      0%, 100% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
    }
    .animate-gradient-xy {
      background-size: 200% 200%;
      animation: gradient-xy 10s ease infinite;
    }
  </style>
</head>
<body class="overflow-hidden bg-gray-50 m-0 p-0 font-sans">
  
  <!-- STANDBY SCREEN -->
  <div id="standbyScreen" class="absolute inset-0 z-50 p-6 flex flex-col items-center justify-center gap-6 bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-600">
    <div class="bg-white/10 backdrop-blur-2xl border border-white/20 p-8 rounded-3xl shadow-2xl max-w-2xl text-center text-white">
      <h1 class="text-4xl font-black mb-4">Math AI Game</h1>
      <p class="text-lg text-white/80 mb-6">Trò chơi Toán học tương tác bằng Trí tuệ nhân tạo! Game đã nạp sẵn Model cử chỉ tay của bạn.</p>
      
      <div class="bg-black/20 p-4 rounded-xl mb-6">
        <p class="font-bold text-sm text-white/70 uppercase mb-2">Chọn Độ Khó</p>
        <div class="flex gap-2 justify-center">
          <button id="btnEasy" class="px-6 py-2 rounded-lg font-bold transition-all bg-green-500 text-white" onclick="setDifficulty('easy')">Dễ</button>
          <button id="btnMedium" class="px-6 py-2 rounded-lg font-bold transition-all bg-white/20 text-white" onclick="setDifficulty('medium')">Vừa</button>
          <button id="btnHard" class="px-6 py-2 rounded-lg font-bold transition-all bg-white/20 text-white" onclick="setDifficulty('hard')">Khó</button>
        </div>
      </div>
      
      <button id="startBtn" onclick="startGame()" class="bg-white text-indigo-600 px-8 py-4 rounded-full font-black text-xl hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.5)]">
        START GAME
      </button>
      <p id="loadingMsg" class="mt-4 text-sm font-bold text-yellow-300 animate-pulse hidden">Đang khởi tạo AI Model (Cần mạng để tải thư viện), vui lòng đợi...</p>
    </div>
  </div>

  <!-- GAME OVERLAY -->
  <div id="gameOverlay" class="absolute inset-0 z-40 p-6 flex flex-col pointer-events-none overflow-hidden justify-center items-center hidden">
    <!-- BEAUTIFUL ANIMATED BACKGROUND -->
    <div class="absolute inset-0 z-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-600 animate-gradient-xy">
      <div class="absolute top-10 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl mix-blend-overlay"></div>
      <div class="absolute bottom-10 right-10 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl mix-blend-overlay"></div>
    </div>

    <!-- SCORE BADGE -->
    <div class="absolute top-8 left-8 pointer-events-auto z-10">
      <div class="bg-white/20 backdrop-blur-xl border border-white/30 px-6 py-2 rounded-full shadow-2xl flex items-center gap-4">
        <span class="text-lg text-white/80 font-medium tracking-wider uppercase">Score</span>
        <span id="scoreText" class="text-3xl font-black text-white drop-shadow-md">0</span>
        <div class="w-px h-8 bg-white/20 mx-2"></div>
        <span id="diffBadge" class="text-sm font-bold text-yellow-300 uppercase">EASY</span>
      </div>
    </div>

    <!-- PIP WEBCAM -->
    <div class="absolute bottom-8 right-8 pointer-events-auto group z-10">
      <div class="w-56 rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.4)] border-4 border-white/20 bg-black relative transition-transform duration-300 hover:scale-105 hover:border-white/40">
        <video id="webcamVideo" class="w-full h-full object-cover transform -scale-x-100" playsinline></video>
        <canvas id="overlayCanvas" class="absolute inset-0 w-full h-full transform -scale-x-100"></canvas>
        <div class="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-lg flex items-center gap-2 border border-white/10">
          <span id="predDot" class="w-2 h-2 rounded-full bg-red-400"></span>
          <span id="predLabel">No Gesture</span>
        </div>
      </div>
    </div>

    <!-- MAIN GAME AREA -->
    <div class="flex-1 w-full max-w-4xl flex flex-col items-center justify-center mt-12 z-10">
      <div class="bg-white/10 backdrop-blur-2xl border border-white/20 px-16 py-8 rounded-[2.5rem] shadow-2xl w-full text-center relative overflow-hidden">
        <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>
        <h2 id="questionText" class="text-6xl md:text-8xl font-black text-white drop-shadow-[0_5px_15px_rgba(0,0,0,0.3)] tracking-tight"></h2>
      </div>
      
      <div id="optionsGrid" class="mt-10 grid grid-cols-2 gap-6 w-full pointer-events-auto">
        <!-- Options generated via JS -->
      </div>
      
      <div class="mt-8 flex items-center gap-3 bg-black/20 backdrop-blur-md px-6 py-2.5 rounded-full border border-white/10 shadow-lg">
        <svg class="w-5 h-5 text-white/70 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
        <p class="text-sm font-medium text-white/90">Hold gesture for 1.5 seconds to confirm answer</p>
      </div>
    </div>
  </div>

  <script>
    // --- INJECTED DATA ---
    const CLASSES = /* INJECT_CLASSES */;
    const MODEL_DATA = /* INJECT_MODEL_DATA */;
    // ---------------------

    let difficulty = 'easy';
    let score = 0;
    let currentExpectedAnswer = -1;
    let options = [];
    
    let detector;
    let classifier;
    let isWebcamOn = false;
    let gameLoopId;
    let drawLoopId;
    let latestHands = [];
    let currentPrediction = null;

    function setDifficulty(level) {
      difficulty = level;
      document.getElementById('btnEasy').className = \`px-6 py-2 rounded-lg font-bold transition-all \${level==='easy'?'bg-green-500 text-white':'bg-white/20 text-white'}\`;
      document.getElementById('btnMedium').className = \`px-6 py-2 rounded-lg font-bold transition-all \${level==='medium'?'bg-yellow-500 text-white':'bg-white/20 text-white'}\`;
      document.getElementById('btnHard').className = \`px-6 py-2 rounded-lg font-bold transition-all \${level==='hard'?'bg-red-500 text-white':'bg-white/20 text-white'}\`;
    }

    async function startGame() {
      document.getElementById('startBtn').style.display = 'none';
      document.getElementById('loadingMsg').style.display = 'block';

      try {
        await initAI();
        await setupWebcam();
        
        document.getElementById('standbyScreen').style.display = 'none';
        document.getElementById('gameOverlay').style.display = 'flex';
        document.getElementById('diffBadge').innerText = difficulty.toUpperCase();
        
        score = 0;
        updateScore();
        nextQuestion();
        startInferenceLoop();
        startGameLoop();
      } catch (err) {
        alert("Lỗi khi khởi động AI: " + err.message);
        console.error(err);
        document.getElementById('startBtn').style.display = 'block';
        document.getElementById('loadingMsg').style.display = 'none';
      }
    }

    async function initAI() {
      const model = handPoseDetection.SupportedModels.MediaPipeHands;
      const detectorConfig = {
        runtime: 'mediapipe',
        solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/hands',
        modelType: 'full',
        maxHands: 2,
      };
      detector = await handPoseDetection.createDetector(model, detectorConfig);
      classifier = knnClassifier.create();
      
      // Load weights
      if (MODEL_DATA) {
        Object.keys(MODEL_DATA).forEach(key => {
          const data = MODEL_DATA[key];
          const tensor = tf.tensor(data.data, data.shape);
          classifier.setClassifierDataset({ ...classifier.getClassifierDataset(), [key]: tensor });
        });
      }
    }

    async function setupWebcam() {
      const video = document.getElementById('webcamVideo');
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } });
      video.srcObject = stream;
      await new Promise((resolve) => {
        video.onloadedmetadata = () => {
          video.play();
          resolve();
        };
      });
      isWebcamOn = true;
      startDrawingHands();
    }

    function startInferenceLoop() {
      const video = document.getElementById('webcamVideo');
      const loop = async () => {
        if (detector && video.readyState >= 2) {
          latestHands = await detector.estimateHands(video);
          await predict();
        }
        setTimeout(() => requestAnimationFrame(loop), 33); // 30 FPS
      };
      loop();
    }

    async function predict() {
      if (!classifier || classifier.getNumClasses() === 0) return;
      let features = null;
      if (latestHands.length === 0) features = null;
      else if (latestHands.length === 1) {
        const k = latestHands[0].keypoints3D || latestHands[0].keypoints;
        const arr = [];
        k.forEach(pt => arr.push(pt.x, pt.y, pt.z || 0));
        while(arr.length < 126) arr.push(0);
        features = arr;
      } else {
        const k1 = latestHands[0].keypoints3D || latestHands[0].keypoints;
        const k2 = latestHands[1].keypoints3D || latestHands[1].keypoints;
        const arr = [];
        k1.forEach(pt => arr.push(pt.x, pt.y, pt.z || 0));
        k2.forEach(pt => arr.push(pt.x, pt.y, pt.z || 0));
        features = arr;
      }

      if (features) {
        const tensor = tf.tensor1d(features);
        const result = await classifier.predictClass(tensor, 3);
        currentPrediction = result.label;
        tensor.dispose();
      } else {
        currentPrediction = null;
      }
      
      const dot = document.getElementById('predDot');
      const label = document.getElementById('predLabel');
      if (currentPrediction) {
        dot.className = "w-2 h-2 rounded-full bg-green-400 animate-pulse";
        label.innerText = currentPrediction;
      } else {
        dot.className = "w-2 h-2 rounded-full bg-red-400";
        label.innerText = "No Gesture";
      }
    }

    function startDrawingHands() {
      const canvas = document.getElementById('overlayCanvas');
      const video = document.getElementById('webcamVideo');
      const ctx = canvas.getContext('2d');
      const loop = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (latestHands && latestHands.length > 0) {
          for (const hand of latestHands) {
            const k = hand.keypoints;
            if (!k) continue;
            for (let i=0; i<k.length; i++) {
              ctx.beginPath();
              ctx.arc(k[i].x, k[i].y, 3, 0, 2*Math.PI);
              ctx.fillStyle = '#00FF00';
              ctx.fill();
            }
          }
        }
        requestAnimationFrame(loop);
      }
      loop();
    }

    function updateScore() {
      document.getElementById('scoreText').innerText = score;
    }

    function nextQuestion() {
      let a = 0, b = 0, operator = '';
      if (difficulty === 'easy') {
        operator = Math.random() > 0.5 ? '+' : '-';
        if (operator === '+') { a = Math.floor(Math.random()*6); b = Math.floor(Math.random()*6); }
        else { a = Math.floor(Math.random()*10)+1; b = Math.floor(Math.random()*a); }
      } else if (difficulty === 'medium') {
        operator = Math.random() > 0.5 ? '+' : '-';
        if (operator === '+') { a = Math.floor(Math.random()*30)+5; b = Math.floor(Math.random()*20)+5; }
        else { a = Math.floor(Math.random()*40)+10; b = Math.floor(Math.random()*a); }
      } else {
        const r = Math.random();
        if (r < 0.33) { operator = '+'; a = Math.floor(Math.random()*50)+20; b = Math.floor(Math.random()*50)+20; }
        else if (r < 0.66) { operator = '-'; a = Math.floor(Math.random()*80)+20; b = Math.floor(Math.random()*a); }
        else { operator = 'x'; a = Math.floor(Math.random()*10)+2; b = Math.floor(Math.random()*10)+2; }
      }
      
      document.getElementById('questionText').innerText = \`\${a} \${operator} \${b} = ?\`;
      
      if (operator === '+') currentExpectedAnswer = a + b;
      else if (operator === '-') currentExpectedAnswer = a - b;
      else if (operator === 'x') currentExpectedAnswer = a * b;

      const optionCount = Math.min(4, CLASSES.length);
      const availableClasses = [...CLASSES].sort(()=>0.5-Math.random()).slice(0, optionCount);
      
      const values = [currentExpectedAnswer];
      while(values.length < optionCount) {
        const offset = Math.floor(Math.random() * 10) - 5;
        const f = currentExpectedAnswer + offset;
        if (f !== currentExpectedAnswer && f >= 0 && !values.includes(f)) values.push(f);
      }
      values.sort(()=>0.5-Math.random());
      
      options = availableClasses.map((cls, i) => ({
        label: cls.name,
        value: values[i],
        progress: 0
      }));
      
      renderOptions();
    }

    function renderOptions() {
      const grid = document.getElementById('optionsGrid');
      grid.innerHTML = '';
      options.forEach((opt, i) => {
        const isSelected = currentPrediction === opt.label;
        const borderClass = isSelected ? 'border-white shadow-[0_0_40px_rgba(255,255,255,0.3)] bg-white/30 scale-105' : 'border-white/10 bg-white/10';
        
        grid.innerHTML += \`
          <div id="opt-\${i}" class="relative overflow-hidden rounded-[2rem] backdrop-blur-xl border-2 flex flex-col items-center p-6 h-40 justify-center transition-all duration-300 transform \${borderClass}">
            <div class="absolute top-4 left-4">
              <div class="w-12 h-12 bg-white/20 backdrop-blur-md text-white rounded-full flex items-center justify-center text-2xl shadow-inner border border-white/30">\${opt.label}</div>
            </div>
            <div class="text-6xl md:text-7xl font-black text-white drop-shadow-md ml-12 transition-transform duration-200 \${isSelected?'scale-110':''} ">\${opt.value}</div>
            <div class="absolute bottom-0 left-0 w-full h-2 bg-black/20">
              <div class="h-full bg-gradient-to-r from-green-400 to-emerald-300 transition-all duration-75 ease-linear shadow-[0_0_10px_rgba(74,222,128,0.8)]" style="width: \${opt.progress}%"></div>
            </div>
          </div>
        \`;
      });
    }

    let lastTime = 0;
    function startGameLoop() {
      const loop = (time) => {
        const dt = time - lastTime;
        lastTime = time;
        if (dt < 200) {
          let answered = false;
          let changed = false;
          options.forEach(opt => {
            if (currentPrediction === opt.label) {
              opt.progress += (dt / 1500) * 100;
              changed = true;
              if (opt.progress >= 100) {
                answered = true;
                if (opt.value === currentExpectedAnswer) score++;
                else score = Math.max(0, score - 1);
                updateScore();
                nextQuestion();
              }
            } else {
              if (opt.progress > 0) {
                opt.progress = Math.max(0, opt.progress - (dt / 500) * 100);
                changed = true;
              }
            }
          });
          if (changed && !answered) renderOptions();
        }
        gameLoopId = requestAnimationFrame(loop);
      }
      requestAnimationFrame((time) => { lastTime = time; loop(time); });
    }
  </script>
</body>
</html>`;
