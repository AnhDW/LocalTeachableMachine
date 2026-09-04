import { Injectable } from '@angular/core';
import { MlService } from './ml.service';
import { ClassManagerService, ClassItem } from './class-manager.service';

export interface ProjectData {
  version: string;
  classes: ClassItem[];
  modelData: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProjectLocalService {
  constructor(
    private mlService: MlService,
    private classManager: ClassManagerService
  ) {}

  exportProject(projectName: string = 'teachable-machine-project') {
    const modelData = this.mlService.exportModel();
    if (!modelData) {
      alert('Chưa có mô hình nào được huấn luyện để export!');
      return;
    }

    // Prepare classes (remove base64 samples to keep file small, since we are only exporting weights)
    const currentClasses = this.classManager.classes();
    const cleanClasses = currentClasses.map(c => ({
      id: c.id,
      name: c.name,
      color: c.color,
      samples: [], // Do not export images
      trainedCount: 0
    }));

    const projectData: ProjectData = {
      version: '1.0',
      classes: cleanClasses,
      modelData: modelData
    };

    const jsonString = JSON.stringify(projectData);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName}.tmproj`;
    a.click();
    
    URL.revokeObjectURL(url);
  }

  async importProject(file: File): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const projectData: ProjectData = JSON.parse(content);
          
          if (!projectData.version || !projectData.classes || !projectData.modelData) {
            alert('File không đúng định dạng Project!');
            resolve(false);
            return;
          }

          // Restore classes
          this.classManager.classes.set(projectData.classes);

          // Restore model weights
          this.mlService.importModel(projectData.modelData);
          
          resolve(true);
        } catch (error) {
          console.error('Error parsing project file:', error);
          alert('Lỗi khi đọc file project!');
          resolve(false);
        }
      };
      reader.onerror = () => {
        alert('Không thể đọc file!');
        resolve(false);
      };
      reader.readAsText(file);
    });
  }
}
