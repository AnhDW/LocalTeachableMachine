import { Component, OnDestroy, effect } from '@angular/core';
import { CommonModule, KeyValuePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MultiHandMlService } from '../../core/multi-hand-ml.service';
import { ClassManagerService } from '../../core/class-manager.service';
import { WebcamService } from '../../core/webcam.service';

@Component({
  selector: 'app-multi-hand-training-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, KeyValuePipe],
  templateUrl: './multi-hand-training-panel.html',
})
export class MultiHandTrainingPanelComponent implements OnDestroy {
  showAdvanced = false;
  predictLoopId: any;
  previewMode: 'camera' | 'image' = 'camera';
  uploadedImageBase64: string | null = null;

  constructor(
    public mlService: MultiHandMlService,
    public webcamService: WebcamService,
    public classManager: ClassManagerService
  ) {
    effect(() => {
      if (this.mlService.isTrained()) {
        this.startPredicting();
      } else {
        if (this.predictLoopId) {
          cancelAnimationFrame(this.predictLoopId);
        }
      }
    });
  }

  async train() {
    const classes = this.classManager.classes();
    if (classes.length < 2) {
      alert("Cần tạo ít nhất 2 nhãn (classes).");
      return;
    }
    
    const isIncremental = this.mlService.isTrained();
    const hasNewData = classes.some(c => c.samples.length > (c.trainedCount || 0));
    
    if (isIncremental && !hasNewData) {
      alert("Không có ảnh mới nào để học thêm!");
      return;
    }

    if (!isIncremental) {
      const emptyClasses = classes.filter(c => c.samples.length === 0);
      if (emptyClasses.length > 0) {
        alert("Mỗi nhãn phải có ít nhất 1 ảnh để học!");
        return;
      }
    }
    
    await this.mlService.train(classes, !isIncremental);
    
    this.classManager.classes.set(
      classes.map(c => ({...c, trainedCount: c.samples.length}))
    );
    
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
        this.mlService.startInference(this.webcamService.videoElement);
        await this.mlService.predict();
      }
      this.predictLoopId = requestAnimationFrame(loop);
    };
    
    loop();
  }

  setPreviewMode(mode: 'camera' | 'image') {
    this.previewMode = mode;
    if (mode === 'image') {
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
