import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-hub',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header class="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex items-center gap-2">
        <div class="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-xl">TM</div>
        <h1 class="text-xl font-medium text-gray-700">Teachable Machine (Local)</h1>
      </header>

      <main class="flex-1 flex flex-col items-center justify-center p-6">
        <div class="text-center mb-12">
          <h2 class="text-4xl font-bold text-gray-800 mb-4">Dự Án</h2>
          <p class="text-gray-500 text-lg">Lựa chọn loại dữ liệu bạn muốn dạy cho máy học</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full">
          <!-- Image Project -->
          <a routerLink="/image" class="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-blue-400 transition-all cursor-pointer flex flex-col overflow-hidden group">
            <div class="h-48 bg-blue-50 flex items-center justify-center">
              <svg class="w-20 h-20 text-blue-500 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            </div>
            <div class="p-6">
              <h3 class="text-xl font-bold text-gray-800 mb-2">Image Project</h3>
              <p class="text-gray-600 text-sm">Dạy mô hình phân loại hình ảnh sử dụng webcam hoặc file tĩnh.</p>
            </div>
          </a>

          <!-- Audio Project -->
          <div class="bg-gray-50 rounded-xl shadow-sm border border-gray-200 opacity-60 cursor-not-allowed flex flex-col overflow-hidden relative">
            <div class="absolute inset-0 bg-gray-50/50 flex items-center justify-center z-10">
              <span class="bg-gray-800 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Coming Soon</span>
            </div>
            <div class="h-48 bg-gray-100 flex items-center justify-center">
              <svg class="w-20 h-20 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
            </div>
            <div class="p-6">
              <h3 class="text-xl font-bold text-gray-800 mb-2">Audio Project</h3>
              <p class="text-gray-600 text-sm">Dạy mô hình nhận diện âm thanh và giọng nói từ micro.</p>
            </div>
          </div>

          <!-- Hand Project -->
          <a routerLink="/hand" class="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-blue-400 transition-all cursor-pointer flex flex-col overflow-hidden group">
            <div class="h-48 bg-blue-50 flex items-center justify-center">
              <svg class="w-20 h-20 text-blue-500 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11"></path>
              </svg>
            </div>
            <div class="p-6">
              <h3 class="text-xl font-bold text-gray-800 mb-2">Hand Project (1 Hand)</h3>
              <p class="text-gray-600 text-sm">Dạy máy học nhận diện điểm khớp trên 1 bàn tay (nhanh, nhẹ).</p>
            </div>
          </a>

          <!-- Multi-Hand Project -->
          <a routerLink="/multi-hand" class="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-indigo-400 transition-all cursor-pointer flex flex-col overflow-hidden group">
            <div class="h-48 bg-indigo-50 flex items-center justify-center">
              <svg class="w-20 h-20 text-indigo-500 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
              </svg>
            </div>
            <div class="p-6">
              <h3 class="text-xl font-bold text-gray-800 mb-2">Hand Project (2 Hands)</h3>
              <p class="text-gray-600 text-sm">Dạy máy học nhận diện cùng lúc 2 bàn tay (hỗ trợ Game Toán).</p>
            </div>
          </a>

          <!-- Math Game Project -->
          <a routerLink="/math-game" class="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-purple-400 transition-all cursor-pointer flex flex-col overflow-hidden group">
            <div class="h-48 bg-purple-50 flex items-center justify-center">
              <div class="text-6xl font-black text-purple-500 group-hover:scale-110 transition-transform">+ -</div>
            </div>
            <div class="p-6">
              <h3 class="text-xl font-bold text-gray-800 mb-2">Math Game (2 Hands)</h3>
              <p class="text-gray-600 text-sm">Trò chơi tính toán toán học nhận diện kết quả thông qua 2 bàn tay.</p>
            </div>
          </a>
        </div>
      </main>
    </div>
  `
})
export class HubComponent { }
