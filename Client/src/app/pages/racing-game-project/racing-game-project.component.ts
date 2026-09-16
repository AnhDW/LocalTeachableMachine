import { Component, OnInit, OnDestroy, effect, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MultiHandWebcamPanelComponent } from '../../components/multi-hand-webcam-panel/multi-hand-webcam-panel.component';
import { MultiHandMlService } from '../../core/multi-hand-ml.service';
import { WebcamService } from '../../core/webcam.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-racing-game-project',
  standalone: true,
  imports: [CommonModule, RouterLink, MultiHandWebcamPanelComponent, FormsModule],
  templateUrl: './racing-game-project.html',
})
export class RacingGameProjectComponent implements OnInit, OnDestroy {
  @ViewChild('gameCanvas') gameCanvas!: ElementRef<HTMLCanvasElement>;
  
  gameMode = false;
  score = 0;
  gameOver = false;
  
  importedClasses: {name: string, thumbnail: string | null}[] = [];
  
  // Mappings
  mapLeft = '';
  mapRight = '';
  mapGas = '';
  mapBrake = '';
  
  // Game State
  carX = 200;
  carSpeedX = 0;
  baseSpeed = 5;
  currentSpeed = 5;
  obstacles: {x: number, y: number, width: number, height: number, color: string}[] = [];
  
  predictLoopId: any;
  gameLoopId: any;
  
  currentAction = 'none'; // 'left', 'right', 'gas', 'brake', 'none'

  constructor(
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
  }

  ngOnDestroy() {
    if (this.predictLoopId) clearTimeout(this.predictLoopId);
    if (this.gameLoopId) cancelAnimationFrame(this.gameLoopId);
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

          if (!projectData.classes || !projectData.modelData) {
            alert('File không hợp lệ!');
            return;
          }

          if (projectData.classes.length < 2) {
            alert('Cần ít nhất 2 nhãn (cử chỉ) để chơi đua xe!');
            return;
          }

          this.mlService.importModel(projectData.modelData);
          
          this.importedClasses = projectData.classes.map((c: any) => ({
            name: c.name,
            thumbnail: c.thumbnail || null
          }));
          
          // Auto-assign mappings to the first 4 classes if available
          if (this.importedClasses.length > 0) this.mapLeft = this.importedClasses[0].name;
          if (this.importedClasses.length > 1) this.mapRight = this.importedClasses[1].name;
          if (this.importedClasses.length > 2) this.mapGas = this.importedClasses[2].name;
          if (this.importedClasses.length > 3) this.mapBrake = this.importedClasses[3].name;
          
        } catch (err) {
          alert('Lỗi đọc file: ' + err);
        }
      };
      reader.readAsText(file);
    }
    input.value = '';
  }

  startPredicting() {
    if (this.predictLoopId) clearTimeout(this.predictLoopId);
    
    const loop = async () => {
      if (this.mlService.isTrained() && this.webcamService.isWebcamOn() && this.webcamService.videoElement) {
        this.mlService.startInference(this.webcamService.videoElement);
        await this.mlService.predict();
        
        const prediction = this.mlService.predictions();
        if (prediction && this.gameMode && !this.gameOver) {
          const label = prediction.label;
          if (label === this.mapLeft) this.currentAction = 'left';
          else if (label === this.mapRight) this.currentAction = 'right';
          else if (label === this.mapGas) this.currentAction = 'gas';
          else if (label === this.mapBrake) this.currentAction = 'brake';
          else this.currentAction = 'none';
        }
      }
      this.predictLoopId = setTimeout(loop, 66); // ~15 FPS cho predict
    };
    loop();
  }

  startGame() {
    if (!this.mapLeft || !this.mapRight) {
      alert("Bạn phải chọn cử chỉ cho Rẽ Trái và Rẽ Phải!");
      return;
    }
    this.gameMode = true;
    this.gameOver = false;
    this.score = 0;
    this.carX = 200; // Center of 400px width canvas
    this.obstacles = [];
    this.currentSpeed = this.baseSpeed;
    this.currentAction = 'none';
    
    // Ensure canvas is ready
    setTimeout(() => {
      this.startGameLoop();
    }, 100);
  }

  stopGame() {
    this.gameMode = false;
    if (this.gameLoopId) cancelAnimationFrame(this.gameLoopId);
    this.mlService.stopInference();
    this.startPredicting(); // resume standby predicting
  }

  startGameLoop() {
    if (this.gameLoopId) cancelAnimationFrame(this.gameLoopId);
    
    const canvas = this.gameCanvas?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let frameCount = 0;
    
    const loop = () => {
      if (!this.gameMode || this.gameOver) return;
      
      // Update Logic
      frameCount++;
      
      // Action handling
      if (this.currentAction === 'left') {
        this.carSpeedX = -6;
      } else if (this.currentAction === 'right') {
        this.carSpeedX = 6;
      } else {
        this.carSpeedX = 0;
      }
      
      if (this.currentAction === 'gas') {
        this.currentSpeed = Math.min(this.baseSpeed + 8, this.currentSpeed + 0.2);
      } else if (this.currentAction === 'brake') {
        this.currentSpeed = Math.max(this.baseSpeed - 3, this.currentSpeed - 0.5);
      } else {
        // Return to base speed slowly
        if (this.currentSpeed > this.baseSpeed) this.currentSpeed -= 0.1;
        if (this.currentSpeed < this.baseSpeed) this.currentSpeed += 0.1;
      }
      
      this.carX += this.carSpeedX;
      // Boundaries
      if (this.carX < 30) this.carX = 30;
      if (this.carX > canvas.width - 30) this.carX = canvas.width - 30;
      
      // Spawn obstacles
      if (frameCount % Math.max(20, Math.floor(60 - this.currentSpeed * 2)) === 0) {
        this.obstacles.push({
          x: Math.random() * (canvas.width - 60) + 30,
          y: -50,
          width: 40 + Math.random() * 40,
          height: 30 + Math.random() * 20,
          color: ['#EF4444', '#F59E0B', '#10B981', '#3B82F6'][Math.floor(Math.random() * 4)]
        });
      }
      
      // Move obstacles and collision
      for (let i = this.obstacles.length - 1; i >= 0; i--) {
        const obs = this.obstacles[i];
        obs.y += this.currentSpeed;
        
        // Car rect: x - 20, y: canvas.height - 80, width: 40, height: 60
        const carRect = { x: this.carX - 20, y: canvas.height - 80, w: 40, h: 60 };
        
        // Collision Detection
        if (
          carRect.x < obs.x + obs.width &&
          carRect.x + carRect.w > obs.x &&
          carRect.y < obs.y + obs.height &&
          carRect.h + carRect.y > obs.y
        ) {
          this.gameOver = true;
        }
        
        // Remove off-screen
        if (obs.y > canvas.height + 50) {
          this.obstacles.splice(i, 1);
        }
      }
      
      this.score += Math.floor(this.currentSpeed / 2);
      
      // Render
      ctx.fillStyle = '#1E293B'; // Dark road
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Road stripes
      ctx.fillStyle = '#475569';
      for(let i = 0; i < canvas.height; i += 40) {
        const yOffset = (i + (frameCount * this.currentSpeed)) % canvas.height;
        ctx.fillRect(canvas.width / 2 - 5, yOffset, 10, 20);
      }
      
      // Draw obstacles
      for (const obs of this.obstacles) {
        ctx.fillStyle = obs.color;
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        // Shadow/3D effect
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(obs.x, obs.y + obs.height - 5, obs.width, 5);
      }
      
      // Draw car
      ctx.fillStyle = '#38BDF8';
      ctx.fillRect(this.carX - 20, canvas.height - 80, 40, 60);
      ctx.fillStyle = '#0284C7';
      ctx.fillRect(this.carX - 15, canvas.height - 70, 30, 20); // windshield
      
      // Draw action text
      ctx.fillStyle = 'white';
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';
      if (this.currentAction !== 'none') {
        ctx.fillText(this.currentAction.toUpperCase(), canvas.width / 2, 40);
      }
      
      if (this.gameOver) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.font = '40px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('CRASHED!', canvas.width / 2, canvas.height / 2 - 20);
        ctx.font = '24px sans-serif';
        ctx.fillText('Score: ' + this.score, canvas.width / 2, canvas.height / 2 + 20);
      } else {
        this.gameLoopId = requestAnimationFrame(loop);
      }
    };
    
    this.gameLoopId = requestAnimationFrame(loop);
  }
}
