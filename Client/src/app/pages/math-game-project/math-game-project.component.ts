import { Component, OnInit, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MultiHandWebcamPanelComponent } from '../../components/multi-hand-webcam-panel/multi-hand-webcam-panel.component';
import { ClassManagerService } from '../../core/class-manager.service';
import { MultiHandMlService } from '../../core/multi-hand-ml.service';
import { WebcamService } from '../../core/webcam.service';

interface GameOption {
  label: string;
  value: number;
  thumbnail: string | null;
  progress: number;
}

@Component({
  selector: 'app-math-game-project',
  standalone: true,
  imports: [CommonModule, RouterLink, MultiHandWebcamPanelComponent],
  templateUrl: './math-game-project.html'
})
export class MathGameProjectComponent implements OnInit, OnDestroy {
  gameMode = false;
  currentQuestion = '';
  score = 0;
  difficulty: 'easy' | 'medium' | 'hard' = 'medium';
  
  options: GameOption[] = [];
  importedClasses: {name: string, thumbnail: string | null}[] = [];
  
  predictLoopId: any;
  gameLoopId: any;

  constructor(
    public classManager: ClassManagerService,
    public mlService: MultiHandMlService,
    public webcamService: WebcamService
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
    this.classManager.reset();
  }

  ngOnDestroy() {
    if (this.predictLoopId) clearTimeout(this.predictLoopId);
    if (this.gameLoopId) clearTimeout(this.gameLoopId);
  }

  setDifficulty(level: 'easy' | 'medium' | 'hard') {
    this.difficulty = level;
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

          this.classManager.classes.set(projectData.classes);
          this.mlService.importModel(projectData.modelData);
          
          // Store class data for options mapping
          this.importedClasses = projectData.classes.map((c: any) => ({
            name: c.name,
            thumbnail: c.thumbnail || null
          }));
          
          alert('Import Model thành công! Bạn có thể bắt đầu chơi Game.');
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

  startGame() {
    if (!this.mlService.isTrained()) {
      alert("Vui lòng Import Model trước khi chơi!");
      return;
    }
    this.gameMode = true;
    this.score = 0;
    this.nextQuestion();
    this.startGameLoop();
  }

  stopGame() {
    this.gameMode = false;
    if (this.gameLoopId) clearTimeout(this.gameLoopId);
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
    
    // Generate options based on available imported classes
    const optionCount = Math.min(4, this.importedClasses.length);
    const availableClasses = [...this.importedClasses].sort(() => 0.5 - Math.random()).slice(0, optionCount);
    
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
    
    this.options = availableClasses.map((cls, index) => ({
      label: cls.name,
      thumbnail: cls.thumbnail,
      value: values[index],
      progress: 0
    }));
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
          let answered = false;
          
          for (const opt of this.options) {
            if (prediction.label === opt.label) {
              opt.progress += (deltaTime / 1500) * 100; // 1.5 seconds to fill
              
              if (opt.progress >= 100) {
                answered = true;
                // Evaluate answer
                const expectedValue = eval(this.currentQuestion.replace('=', '').replace('?', '').trim());
                if (opt.value === expectedValue) {
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
        } else {
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
