import { Injectable, signal } from '@angular/core';
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import * as knnClassifier from '@tensorflow-models/knn-classifier';

@Injectable({ providedIn: 'root' })
export class MlService {
  private classifier: knnClassifier.KNNClassifier | null = null;
  private mobilenetModel: mobilenet.MobileNet | null = null;
  
  public isModelLoaded = signal(false);
  public isTraining = signal(false);
  public isTrained = signal(false);
  
  // Advanced Settings
  public kValue = signal(3); 
  
  public predictions = signal<{label: string, confidences: {[label: string]: number}} | null>(null);
  private smoothedConfidences: {[label: string]: number} = {};
  private readonly SMOOTHING_FACTOR = 0.85; // Tăng lên 0.85 để gần như tức thời (rất nhạy)

  constructor() {
    this.init();
  }

  async init() {
    // Make sure backend is ready
    await tf.ready();
    this.classifier = knnClassifier.create();
    this.mobilenetModel = await mobilenet.load({ 
      version: 2, 
      alpha: 1.0
    });
    this.isModelLoaded.set(true);
  }

  public async base64ToImage(base64: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = base64;
    });
  }

  async train(classes: {id: string, name: string, samples: string[]}[]) {
    if (!this.classifier || !this.mobilenetModel) return;
    
    this.isTraining.set(true);
    
    // Slight delay to allow UI to update to "Training..." state
    await new Promise(resolve => setTimeout(resolve, 100));
    
    this.classifier.clearAllClasses();
    this.smoothedConfidences = {};

    for (const cls of classes) {
      if (cls.samples.length === 0) continue;
      
      for (const sampleBase64 of cls.samples) {
        const img = await this.base64ToImage(sampleBase64);
        const activation = this.mobilenetModel.infer(img, true);
        this.classifier.addExample(activation, cls.name);
        activation.dispose();
      }
    }
    
    this.isTraining.set(false);
    this.isTrained.set(true);
  }

  async predict(videoElement: HTMLVideoElement) {
    if (!this.classifier || !this.mobilenetModel || !this.isTrained()) return;
    
    if (this.classifier.getNumClasses() > 0) {
      const activation = this.mobilenetModel.infer(videoElement, true);
      const result = await this.classifier.predictClass(activation, this.kValue());
      
      // Apply Exponential Moving Average (EMA) for smoother bar transitions
      Object.keys(result.confidences).forEach(label => {
        const current = this.smoothedConfidences[label] || 0;
        this.smoothedConfidences[label] = current * (1 - this.SMOOTHING_FACTOR) + result.confidences[label] * this.SMOOTHING_FACTOR;
      });

      // Recalculate top label based on smoothed confidences
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
      
      activation.dispose();
      await tf.nextFrame(); // Nhường quyền cho trình duyệt vẽ lại giao diện
    }
  }

  async predictImage(imageElement: HTMLImageElement) {
    if (!this.classifier || !this.mobilenetModel || !this.isTrained()) return;
    
    if (this.classifier.getNumClasses() > 0) {
      const activation = this.mobilenetModel.infer(imageElement, true);
      const result = await this.classifier.predictClass(activation, this.kValue());
      
      // Also apply smoothing here so UI stays consistent
      Object.keys(result.confidences).forEach(label => {
        const current = this.smoothedConfidences[label] || 0;
        this.smoothedConfidences[label] = current * (1 - this.SMOOTHING_FACTOR) + result.confidences[label] * this.SMOOTHING_FACTOR;
      });
      
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
      
      activation.dispose();
    }
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
}
