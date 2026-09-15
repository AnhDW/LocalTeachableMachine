import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MultiHandWebcamPanelComponent } from '../../components/multi-hand-webcam-panel/multi-hand-webcam-panel.component';
import { ClassListComponent } from '../../components/class-list/class-list.component';
import { MultiHandTrainingPanelComponent } from '../../components/multi-hand-training-panel/multi-hand-training-panel.component';
import { ProjectLocalService } from '../../core/project-local.service';
import { ClassManagerService } from '../../core/class-manager.service';
import { MultiHandMlService } from '../../core/multi-hand-ml.service';

@Component({
  selector: 'app-multi-hand-project',
  standalone: true,
  imports: [CommonModule, RouterLink, MultiHandWebcamPanelComponent, ClassListComponent, MultiHandTrainingPanelComponent],
  template: `
    <div class="min-h-screen bg-gray-50 text-gray-800 font-sans">
      <header class="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <a routerLink="/" class="text-gray-500 hover:text-blue-600 transition-colors flex items-center gap-1 cursor-pointer">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            <span class="font-medium">Hub</span>
          </a>
          <div class="h-6 w-px bg-gray-300"></div>
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-xl">TM</div>
            <h1 class="text-xl font-medium text-gray-700">Hand Project (2 Hands)</h1>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <input type="file" #fileInput (change)="onFileSelected($event)" accept=".tmproj,.json" class="hidden" />
          <button (click)="fileInput.click()" class="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md">Import Project</button>
          <button (click)="exportProject()" class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm">Export Project</button>
        </div>
      </header>

      <main class="p-6 grid grid-cols-12 gap-6 h-[calc(100vh-73px)]">
        <section class="col-span-3 flex flex-col gap-4">
          <app-multi-hand-webcam-panel></app-multi-hand-webcam-panel>
        </section>

        <section class="col-span-6 flex flex-col gap-4 overflow-y-auto pr-2 pb-10">
          <div class="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-lg text-sm mb-2">
            <strong>Hướng dẫn:</strong> Đây là công cụ Train 2 bàn tay. Train xong bạn có thể Export Project (.tmproj) và Import vào Math Game.
          </div>
          <app-class-list></app-class-list>
        </section>

        <section class="col-span-3 flex flex-col gap-4">
          <app-multi-hand-training-panel></app-multi-hand-training-panel>
        </section>
      </main>
    </div>
  `
})
export class MultiHandProjectComponent implements OnInit, OnDestroy {
  constructor(
    private projectLocal: ProjectLocalService,
    private classManager: ClassManagerService,
    private multiHandMlService: MultiHandMlService
  ) {}

  ngOnInit() {
    this.classManager.reset();
  }

  ngOnDestroy() {
  }

  exportProject() {
    const modelData = this.multiHandMlService.exportModel();
    if (!modelData) {
      alert('Chưa có mô hình nào được huấn luyện để export!');
      return;
    }

    const currentClasses = this.classManager.classes();
    const cleanClasses = currentClasses.map(c => ({
      id: c.id,
      name: c.name,
      color: c.color,
      thumbnail: c.samples.length > 0 ? c.samples[0] : null,
      samples: [], 
      trainedCount: 0
    }));

    const projectData = {
      version: '1.0',
      type: 'multi-hand',
      classes: cleanClasses,
      modelData: modelData
    };

    const jsonString = JSON.stringify(projectData);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `multi-hand-project.tmproj`;
    a.click();
    
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

          this.classManager.classes.set(projectData.classes);
          this.multiHandMlService.importModel(projectData.modelData);
          alert('Import dự án Multi-Hand thành công!');
        } catch (error) {
          console.error('Error parsing project file:', error);
          alert('Lỗi khi đọc file project!');
        }
      };
      reader.readAsText(file);
      input.value = '';
    }
  }
}
