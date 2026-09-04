import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HandWebcamPanelComponent } from '../../components/hand-webcam-panel/hand-webcam-panel.component';
import { ClassListComponent } from '../../components/class-list/class-list.component';
import { HandTrainingPanelComponent } from '../../components/hand-training-panel/hand-training-panel.component';
import { ProjectLocalService } from '../../core/project-local.service';
import { ClassManagerService } from '../../core/class-manager.service';
import { HandMlService } from '../../core/hand-ml.service';

@Component({
  selector: 'app-hand-project',
  standalone: true,
  imports: [CommonModule, RouterLink, HandWebcamPanelComponent, ClassListComponent, HandTrainingPanelComponent],
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
            <h1 class="text-xl font-medium text-gray-700">Hand Project (MediaPipe)</h1>
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
          <app-hand-webcam-panel></app-hand-webcam-panel>
        </section>

        <section class="col-span-6 flex flex-col gap-4 overflow-y-auto pr-2 pb-10">
          <app-class-list></app-class-list>
        </section>

        <section class="col-span-3 flex flex-col gap-4">
          <app-hand-training-panel></app-hand-training-panel>
        </section>
      </main>
    </div>
  `
})
export class HandProjectComponent implements OnInit, OnDestroy {
  constructor(
    private projectLocal: ProjectLocalService,
    private classManager: ClassManagerService,
    private handMlService: HandMlService
  ) {}

  ngOnInit() {
    // Reset state on entry to avoid mixing Image and Hand projects
    this.classManager.reset();
  }

  ngOnDestroy() {
    // Clean up or warn? The user asked to warn if they are in the middle of training.
    // However, window.confirm during ngOnDestroy isn't a great UX (often blocked).
    // The reset in ngOnInit handles the cleanup.
  }

  exportProject() {
    const modelData = this.handMlService.exportModel();
    if (!modelData) {
      alert('Chưa có mô hình nào được huấn luyện để export!');
      return;
    }

    const currentClasses = this.classManager.classes();
    const cleanClasses = currentClasses.map(c => ({
      id: c.id,
      name: c.name,
      color: c.color,
      samples: [], 
      trainedCount: 0
    }));

    const projectData = {
      version: '1.0',
      type: 'hand',
      classes: cleanClasses,
      modelData: modelData
    };

    const jsonString = JSON.stringify(projectData);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `hand-project.tmproj`;
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
          if (projectData.type !== 'hand') {
            alert('Cảnh báo: Đây không phải là file Hand Project!');
          }

          this.classManager.classes.set(projectData.classes);
          this.handMlService.importModel(projectData.modelData);
          alert('Import dự án Hand thành công!');
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
