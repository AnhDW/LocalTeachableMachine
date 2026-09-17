import { Component, OnInit, OnDestroy, ElementRef, ViewChild, ChangeDetectorRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MultiHandWebcamPanelComponent } from '../../components/multi-hand-webcam-panel/multi-hand-webcam-panel.component';
import { MultiHandMlService } from '../../core/multi-hand-ml.service';
import { WebcamService } from '../../core/webcam.service';
import { GAME_TEMPLATE } from './game-template';

interface GameOption {
  label: string;
  value: number;
  thumbnail: string | null;
  progress: number;
}

@Component({
  selector: 'app-math-game-project',
  standalone: true,
  imports: [CommonModule, RouterLink, MultiHandWebcamPanelComponent, FormsModule],
  templateUrl: './math-game-project.html',
})
export class MathGameProjectComponent implements OnInit, OnDestroy {
  gameMode = false;
  currentQuestion = '';
  currentExpectedAnswer = -1;
  score = 0;
  difficulty: 'easy' | 'medium' | 'hard' = 'medium';
  
  options: GameOption[] = [];
  importedClasses: {name: string, thumbnail: string | null}[] = [];
  
  mapOpt1 = '';
  mapOpt2 = '';
  mapOpt3 = '';
  mapOpt4 = '';
  mapPause = '';
  
  isPaused = false;
  
  predictLoopId: any;
  gameLoopId: any;

  constructor(
    public mlService: MultiHandMlService,
    public webcamService: WebcamService,
    private cdr: ChangeDetectorRef
  ) {
    effect(() => {
      if (this.mlService.isTrained() && !this.gameMode) {
        this.startPredicting();
      } else if (!this.mlService.isTrained()) {
        if (this.predictLoopId) clearTimeout(this.predictLoopId);
      }
    });
  }

  ngOnInit() {
    // No need to reset global class manager
  }

  ngOnDestroy() {
    if (this.predictLoopId) clearTimeout(this.predictLoopId);
    if (this.gameLoopId) clearTimeout(this.gameLoopId);
    this.mlService.stopInference();
    this.webcamService.stopWebcam();
  }

  setDifficulty(level: 'easy' | 'medium' | 'hard') {
    this.difficulty = level;
  }

  exportStandaloneGame() {
    if (!this.mlService.isTrained() || this.importedClasses.length === 0) {
      alert("Vui lòng Import Model của bạn vào trước khi xuất Game!");
      return;
    }
    
    const modelDataStr = this.mlService.exportModel();
    if (!modelDataStr) {
      alert("Lỗi khi trích xuất Model.");
      return;
    }

    const classesStr = JSON.stringify(this.importedClasses);
    
    // Inject data into template
    let finalHtml = GAME_TEMPLATE;
    finalHtml = finalHtml.replace('/* INJECT_CLASSES */', classesStr);
    finalHtml = finalHtml.replace('/* INJECT_MODEL_DATA */', modelDataStr);
    finalHtml = finalHtml.replace('/* INJECT_MAP_PAUSE */', JSON.stringify(this.mapPause));
    finalHtml = finalHtml.replace('/* INJECT_MAP_OPT1 */', JSON.stringify(this.mapOpt1));
    finalHtml = finalHtml.replace('/* INJECT_MAP_OPT2 */', JSON.stringify(this.mapOpt2));
    finalHtml = finalHtml.replace('/* INJECT_MAP_OPT3 */', JSON.stringify(this.mapOpt3));
    finalHtml = finalHtml.replace('/* INJECT_MAP_OPT4 */', JSON.stringify(this.mapOpt4));
    
    // Download file
    const blob = new Blob([finalHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'MathGame.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const projectData = JSON.parse(content);
          
          if (!projectData.version || !projectData.classes || !projectData.modelData) {
            alert('File không đúng định dạng Project!');
            return;
          }
          if (projectData.type !== 'multi-hand') {
            alert('Cảnh báo: Đây không phải là file Multi-Hand Project!');
          }
          
          if (projectData.classes.length < 2) {
            alert('Cần ít nhất 2 nhãn (cử chỉ) để chơi trắc nghiệm!');
            return;
          }

          this.mlService.importModel(projectData.modelData);
          
          // Store class data for options mapping
          this.importedClasses = projectData.classes.map((c: any) => ({
            name: c.name,
            thumbnail: c.thumbnail || null
          }));
          
          if (this.importedClasses.length >= 4) {
            this.mapOpt1 = this.importedClasses[0].name;
            this.mapOpt2 = this.importedClasses[1].name;
            this.mapOpt3 = this.importedClasses[2].name;
            this.mapOpt4 = this.importedClasses[3].name;
          }
          
          alert('Import Model thành công! Bạn có thể bắt đầu chơi Game.');
          this.cdr.detectChanges();
        } catch (error) {
          console.error('Error parsing project file:', error);
          alert('Lỗi khi đọc file project!');
        }
      };
      reader.readAsText(file);
      input.value = '';
    }
  }

  startPredicting() {
    if (this.predictLoopId) clearTimeout(this.predictLoopId);
    const loop = async () => {
      if (this.mlService.isTrained() && this.webcamService.isWebcamOn() && this.webcamService.videoElement) {
        this.mlService.startInference(this.webcamService.videoElement);
        await this.mlService.predict();
      }
      this.predictLoopId = setTimeout(() => requestAnimationFrame(loop), 66); // ~15 FPS
    };
    loop();
  }

  @ViewChild(MultiHandWebcamPanelComponent) webcamPanel!: MultiHandWebcamPanelComponent;

  startGame() {
    if (!this.mlService.isTrained()) {
      alert("Vui lòng Import Model trước khi chơi!");
      return;
    }
    if (!this.mapOpt1 || !this.mapOpt2 || !this.mapOpt3 || !this.mapOpt4) {
      alert("Bạn phải gán đủ 4 cử chỉ cho 4 ô đáp án!");
      return;
    }
    
    // Check for duplicates
    const selectedOptions = [this.mapOpt1, this.mapOpt2, this.mapOpt3, this.mapOpt4];
    if (new Set(selectedOptions).size !== 4) {
      alert("Các cử chỉ gán cho 4 đáp án không được trùng lặp!");
      return;
    }
    
    this.gameMode = true;
    this.score = 0;
    this.isPaused = false;
    this.nextQuestion();
    
    // Đợi Angular render giao diện game (có chứa webcam panel)
    setTimeout(() => {
      // Nếu webcam chưa được bật, tự động bật
      if (!this.webcamService.isWebcamOn() && this.webcamPanel) {
        this.webcamPanel.toggleWebcam();
      }
      this.startGameLoop();
    }, 100);
  }

  stopGame() {
    this.gameMode = false;
    if (this.gameLoopId) clearTimeout(this.gameLoopId);
    
    // Khi thoát khỏi game, nếu panel ở màn hình chờ đã render, luồng cam sẽ được tái kết nối tự động 
    // vì chúng ta không tắt webcamService. Trừ khi người dùng rời hẳn khỏi trang (ngOnDestroy).
    this.mlService.stopInference();
    this.startPredicting();
  }

  nextQuestion() {
    let expectedAnswer = -1;
    let a = 0;
    let b = 0;
    let operator = '';
    
    // Logic cho từng độ khó
    if (this.difficulty === 'easy') {
      // Phép cộng trừ từ 1-10
      operator = Math.random() > 0.5 ? '+' : '-';
      if (operator === '+') {
        a = Math.floor(Math.random() * 6);
        b = Math.floor(Math.random() * 6);
      } else {
        a = Math.floor(Math.random() * 10) + 1;
        b = Math.floor(Math.random() * a);
      }
    } else if (this.difficulty === 'medium') {
      // Phép cộng trừ từ 10-50
      operator = Math.random() > 0.5 ? '+' : '-';
      if (operator === '+') {
        a = Math.floor(Math.random() * 30) + 5;
        b = Math.floor(Math.random() * 20) + 5;
      } else {
        a = Math.floor(Math.random() * 40) + 10;
        b = Math.floor(Math.random() * a);
      }
    } else {
      // Khó: Cộng trừ nhân từ 20-100
      const rand = Math.random();
      if (rand < 0.33) {
        operator = '+';
        a = Math.floor(Math.random() * 50) + 20;
        b = Math.floor(Math.random() * 50) + 20;
      } else if (rand < 0.66) {
        operator = '-';
        a = Math.floor(Math.random() * 80) + 20;
        b = Math.floor(Math.random() * a);
      } else {
        operator = 'x';
        a = Math.floor(Math.random() * 10) + 2;
        b = Math.floor(Math.random() * 10) + 2;
      }
    }
    
    this.currentQuestion = `${a} ${operator} ${b} = ?`;
    if (operator === '+') expectedAnswer = a + b;
    else if (operator === '-') expectedAnswer = a - b;
    else if (operator === 'x') expectedAnswer = a * b;
    
    this.currentExpectedAnswer = expectedAnswer;
    
    const availableClasses = [this.mapOpt1, this.mapOpt2, this.mapOpt3, this.mapOpt4];
    const optionCount = 4;
    
    // Generate values
    const values = [expectedAnswer];
    while(values.length < optionCount) {
      const offset = Math.floor(Math.random() * 10) - 5;
      const fakeAnswer = expectedAnswer + offset;
      if (fakeAnswer !== expectedAnswer && fakeAnswer >= 0 && !values.includes(fakeAnswer)) {
        values.push(fakeAnswer);
      }
    }
    
    // Shuffle values
    values.sort(() => 0.5 - Math.random());
    // Map to options
    this.options = availableClasses.map((clsName, idx) => {
      const clsObj = this.importedClasses.find(c => c.name === clsName);
      return {
        label: clsName,
        thumbnail: clsObj?.thumbnail || null,
        value: values[idx],
        progress: 0
      };
    });
  }

  startGameLoop() {
    if (this.gameLoopId) cancelAnimationFrame(this.gameLoopId);
    if (this.predictLoopId) cancelAnimationFrame(this.predictLoopId); 

    let lastTime = performance.now();

    const loop = async (time: number) => {
      if (!this.gameMode) return;
      
      const deltaTime = time - lastTime;
      lastTime = time;

      if (this.webcamService.isWebcamOn() && this.webcamService.videoElement) {
        this.mlService.startInference(this.webcamService.videoElement);
        await this.mlService.predict();
        
        const prediction = this.mlService.predictions();
        if (prediction) {
          const currentLabel = prediction.label;
          
          if (this.mapPause && currentLabel === this.mapPause) {
            this.isPaused = true;
          } else {
            this.isPaused = false;
            let answered = false;
            
            for (const opt of this.options) {
              if (prediction.label === opt.label) {
                opt.progress += (deltaTime / 1500) * 100; // 1.5 seconds to fill
                
                if (opt.progress >= 100) {
                  answered = true;
                  // Evaluate answer
                  if (opt.value === this.currentExpectedAnswer) {
                    this.score++;
                  } else {
                    this.score = Math.max(0, this.score - 1);
                  }
                  this.nextQuestion();
                  break;
                }
              } else {
                opt.progress = Math.max(0, opt.progress - (deltaTime / 500) * 100);
              }
            }
          }
        } else {
          this.isPaused = false;
          // Drain all if no prediction
          this.options.forEach(opt => opt.progress = Math.max(0, opt.progress - (deltaTime / 500) * 100));
        }
      }

      // Giảm lag bằng cách chỉ chạy loop mỗi 50ms (~20 FPS) thay vì chạy liên tục
      this.gameLoopId = setTimeout(() => requestAnimationFrame(loop), 50);
    };
    this.gameLoopId = requestAnimationFrame(loop);
  }
}
