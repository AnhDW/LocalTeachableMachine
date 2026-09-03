import { Component, OnDestroy } from '@angular/core';
import { CommonModule, KeyValuePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MlService } from '../../core/ml.service';
import { ClassManagerService } from '../../core/class-manager.service';
import { WebcamService } from '../../core/webcam.service';

@Component({
  selector: 'app-training-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, KeyValuePipe],
  templateUrl: './training-panel.html',
})
export class TrainingPanelComponent implements OnDestroy {
  showAdvanced = false;
  predictLoopId: any;
  previewMode: 'camera' | 'image' = 'camera';
  uploadedImageBase64: string | null = null;

  constructor(
    public mlService: MlService,
    public webcamService: WebcamService,
    public classManager: ClassManagerService
  ) {}

  async train() {
    // Basic validation
    const classes = this.classManager.classes();
    if (classes.length < 2) {
      alert("Please add at least 2 classes.");
      return;
    }
    const emptyClasses = classes.filter(c => c.samples.length === 0);
    if (emptyClasses.length > 0) {
      alert("All classes must have at least one sample.");
      return;
    }
    
    await this.mlService.train(classes);
    this.startPredicting();
  }

  startPredicting() {
    if (this.predictLoopId) cancelAnimationFrame(this.predictLoopId);
    
    const loop = async () => {
      if (
        this.previewMode === 'camera' && 
        this.mlService.isTrained() && 
        this.webcamService.isWebcamOn() && 
        this.webcamService.videoElement &&
        this.webcamService.videoElement.readyState >= 2 &&
        this.webcamService.videoElement.videoWidth > 0
      ) {
        await this.mlService.predict(this.webcamService.videoElement);
      }
      // If we are not in camera mode, we still keep the loop alive but it will just idle, 
      // or we can stop it and restart it when switching modes. For simplicity, we just check mode.
      this.predictLoopId = requestAnimationFrame(loop);
    };
    
    loop();
  }

  setPreviewMode(mode: 'camera' | 'image') {
    this.previewMode = mode;
    if (mode === 'image') {
      // Clear current prediction to prompt user to upload
      this.mlService.predictions.set(null);
      this.uploadedImageBase64 = null;
    }
  }

  async handleImageUpload(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        this.uploadedImageBase64 = base64;
        const imgElement = await this.mlService.base64ToImage(base64);
        await this.mlService.predictImage(imgElement);
      };
      reader.readAsDataURL(file);
    }
  }

  ngOnDestroy() {
    if (this.predictLoopId) {
      cancelAnimationFrame(this.predictLoopId);
    }
  }

  updateKValue(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.mlService.kValue.set(parseInt(val, 10));
  }
}
