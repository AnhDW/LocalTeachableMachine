import { Injectable, signal } from '@angular/core';
import * as tf from '@tensorflow/tfjs';
import * as handpose from '@tensorflow-models/handpose';
import * as knnClassifier from '@tensorflow-models/knn-classifier';

@Injectable({ providedIn: 'root' })
export class HandMlService {
  private classifier: knnClassifier.KNNClassifier | null = null;
  public detector: handpose.HandPose | null = null;
  
  public isModelLoaded = signal(false);
  public isTraining = signal(false);
  public isTrained = signal(false);
  
  public kValue = signal(3); 
  public predictions = signal<{label: string, confidences: {[label: string]: number}} | null>(null);
  
  private smoothedConfidences: {[label: string]: number} = {};
  private readonly SMOOTHING_FACTOR = 0.85;

  constructor() {
    this.init();
  }

  async init() {
    await tf.ready();
    this.classifier = knnClassifier.create();
    this.detector = await handpose.load();
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

  // Chuyển 21 điểm (3D) thành 1 mảng 1 chiều độ dài 63
  private getHandKeypoints(hands: any[]): number[] | null {
    if (hands.length === 0) return null;
    const hand = hands[0]; 
    const landmarks = hand.landmarks;
    if (!landmarks) return null;
    
    const features: number[] = [];
    for (const kp of landmarks) {
      features.push(kp[0], kp[1], kp[2]);
    }
    return features;
  }

  async train(classes: {id: string, name: string, samples: string[], trainedCount?: number}[], clearPrevious: boolean = true) {
    if (!this.classifier || !this.detector) return;
    
    this.isTraining.set(true);
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
        const hands = await this.detector.estimateHands(img);
        
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
    
    this.isTraining.set(false);
    this.isTrained.set(true);
  }

  async predict(videoElement: HTMLVideoElement) {
    if (!this.classifier || !this.detector || !this.isTrained()) return;
    if (this.classifier.getNumClasses() === 0) return;

    const hands = await this.detector.estimateHands(videoElement);
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
    }
  }

  // Same for predictImage if needed...
  async predictImage(imageElement: HTMLImageElement) {
    await this.predict(imageElement as any);
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
