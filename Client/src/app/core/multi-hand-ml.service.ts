import { Injectable, signal } from '@angular/core';
import * as tf from '@tensorflow/tfjs';
import * as handPoseDetection from '@tensorflow-models/hand-pose-detection';
import * as knnClassifier from '@tensorflow-models/knn-classifier';

@Injectable({ providedIn: 'root' })
export class MultiHandMlService {
  private classifier: knnClassifier.KNNClassifier | null = null;
  public detector: handPoseDetection.HandDetector | null = null;
  
  public isModelLoaded = signal(false);
  public isTraining = signal(false);
  public isTrained = signal(false);
  
  public kValue = signal(3); 
  public predictions = signal<{label: string, confidences: {[label: string]: number}} | null>(null);
  public latestHands = signal<any[]>([]);
  
  private isEstimating = false;
  private smoothedConfidences: {[label: string]: number} = {};
  private readonly SMOOTHING_FACTOR = 0.85;

  constructor() {
    this.init();
  }

  async init() {
    await tf.ready();
    this.classifier = knnClassifier.create();
    
    const model = handPoseDetection.SupportedModels.MediaPipeHands;
    const detectorConfig = {
      runtime: 'mediapipe',
      solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/hands',
      modelType: 'full',
      maxHands: 2,
    } as handPoseDetection.MediaPipeHandsMediaPipeModelConfig;
    
    this.detector = await handPoseDetection.createDetector(model, detectorConfig);
    this.isModelLoaded.set(true);
  }

  public async safeEstimateHands(videoElement: any): Promise<any[]> {
    if (!this.detector || this.isEstimating) return this.latestHands();
    this.isEstimating = true;
    try {
      const hands = await this.detector.estimateHands(videoElement);
      this.latestHands.set(hands);
      this.isEstimating = false;
      return hands;
    } catch (e) {
      this.isEstimating = false;
      throw e;
    }
  }

  public async base64ToImage(base64: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = base64;
    });
  }

  // Chuyển 2 bàn tay (tối đa) thành 1 mảng 1 chiều độ dài 126
  private getHandKeypoints(hands: handPoseDetection.Hand[]): number[] | null {
    if (hands.length === 0) return null;
    
    const features: number[] = [];
    
    // Xử lý tay thứ nhất
    if (hands.length >= 1) {
      const landmarks = hands[0].keypoints3D || hands[0].keypoints;
      for (const kp of landmarks) {
        features.push(kp.x, kp.y, kp.z ?? 0);
      }
    }
    
    // Xử lý tay thứ hai hoặc Zero Padding (Thêm 63 số 0)
    if (hands.length >= 2) {
      const landmarks = hands[1].keypoints3D || hands[1].keypoints;
      for (const kp of landmarks) {
        features.push(kp.x, kp.y, kp.z ?? 0);
      }
    } else {
      for (let i = 0; i < 63; i++) {
        features.push(0);
      }
    }
    
    return features;
  }

  async train(classes: {id: string, name: string, samples: string[], trainedCount?: number}[], clearPrevious: boolean = true) {
    if (!this.classifier || !this.detector) return;
    
    this.isTraining.set(true);
    
    // Tạm dừng vòng lặp camera để dành tài nguyên cho việc train ảnh
    const wasRunning = !!this.inferenceLoopId;
    if (wasRunning) this.stopInference();
    
    // Chờ 1 chút để đảm bảo vòng lặp camera đã dừng hẳn
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (clearPrevious) {
      this.classifier.clearAllClasses();
      this.smoothedConfidences = {};
    }

    let frameCount = 0;
    for (const cls of classes) {
      const startIndex = clearPrevious ? 0 : (cls.trainedCount || 0);
      const newSamples = cls.samples.slice(startIndex);
      
      if (newSamples.length === 0) continue;
      
      for (const sampleBase64 of newSamples) {
        const img = await this.base64ToImage(sampleBase64);
        
        // Train phải gọi trực tiếp để xử lý ảnh tĩnh
        const hands = await this.safeEstimateHands(img);
        
        const features = this.getHandKeypoints(hands);
        if (features) {
          const tensor = tf.tensor1d(features);
          this.classifier.addExample(tensor, cls.name);
          tensor.dispose();
        }
        
        frameCount++;
        if (frameCount % 10 === 0) {
          await tf.nextFrame();
        }
      }
    }
    
    // Bật lại camera sau khi train xong
    if (wasRunning && this.currentVideoElement) {
      this.startInference(this.currentVideoElement);
    }
    
    this.isTraining.set(false);
    this.isTrained.set(true);
  }

  private inferenceLoopId: any = null;
  private currentVideoElement: HTMLVideoElement | null = null;

  public startInference(videoElement: HTMLVideoElement) {
    this.currentVideoElement = videoElement;
    if (this.inferenceLoopId) return;
    const loop = async () => {
      if (this.detector && videoElement.readyState >= 2) {
        try {
          // Bypass safeEstimateHands lock for background loop so it doesn't block train() if it's running
          if (!this.isEstimating) {
            this.isEstimating = true;
            const hands = await this.detector.estimateHands(videoElement);
            this.latestHands.set(hands);
            this.isEstimating = false;
          }
        } catch (e) {
          this.isEstimating = false;
          console.error("Inference error:", e);
        }
      }
      this.inferenceLoopId = setTimeout(() => requestAnimationFrame(loop), 33); // ~30 FPS
    };
    loop();
  }

  public stopInference() {
    if (this.inferenceLoopId) {
      clearTimeout(this.inferenceLoopId);
      this.inferenceLoopId = null;
    }
  }

  async predict() {
    if (!this.classifier || !this.detector || !this.isTrained()) return;
    if (this.classifier.getNumClasses() === 0) return;

    // Thay vì chạy lại estimateHands, lấy luôn kết quả mới nhất đã chạy ở Camera
    const hands = this.latestHands();
    const features = this.getHandKeypoints(hands);
    
    if (features) {
      const tensor = tf.tensor1d(features);
      const result = await this.classifier.predictClass(tensor, this.kValue());
      
      const newConfidences: {[label: string]: number} = {};
      Object.keys(result.confidences).forEach(label => {
        const current = this.smoothedConfidences[label] || 0;
        newConfidences[label] = current * (1 - this.SMOOTHING_FACTOR) + result.confidences[label] * this.SMOOTHING_FACTOR;
      });
      this.smoothedConfidences = newConfidences;
      
      let bestLabel = result.label;
      let maxConf = -1;
      for (const [lbl, conf] of Object.entries(this.smoothedConfidences)) {
        if (conf > maxConf) {
          maxConf = conf;
          bestLabel = lbl;
        }
      }

      this.predictions.set({
        label: bestLabel,
        confidences: { ...this.smoothedConfidences }
      });
      
      tensor.dispose();
    } else {
      this.predictions.set(null);
    }
  }

  async predictImage(imageElement: HTMLImageElement) {
    // For images, we still need to estimate directly
    const hands = await this.safeEstimateHands(imageElement);
    const features = this.getHandKeypoints(hands);
    // ... we don't really use predictImage in the app right now, so we can ignore full implementation
  }

  exportModel(): string | null {
    if (!this.classifier || !this.isTrained()) return null;
    const dataset = this.classifier.getClassifierDataset();
    const datasetObj: any = {};
    Object.keys(dataset).forEach((key) => {
      const data = dataset[key].dataSync();
      datasetObj[key] = {
        data: Array.from(data),
        shape: dataset[key].shape
      };
    });
    return JSON.stringify(datasetObj);
  }

  importModel(jsonStr: string) {
    if (!this.classifier) return;
    try {
      this.classifier.clearAllClasses();
      const parsed = JSON.parse(jsonStr);
      const newDataset: {[label: string]: tf.Tensor2D} = {};
      Object.keys(parsed).forEach(key => {
        newDataset[key] = tf.tensor2d(parsed[key].data, parsed[key].shape);
      });
      this.classifier.setClassifierDataset(newDataset);
      this.isTrained.set(true);
      this.smoothedConfidences = {};
    } catch (e) {
      console.error("Failed to import model", e);
    }
  }

  renameClass(oldName: string, newName: string) {
    if (!this.classifier || !this.isTrained()) return;
    const dataset = this.classifier.getClassifierDataset();
    if (dataset[oldName]) {
      dataset[newName] = dataset[oldName];
      delete dataset[oldName];
      this.classifier.setClassifierDataset(dataset);
    }
  }
}
