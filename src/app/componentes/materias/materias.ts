
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

export interface Materia {
  id: string;
  nombre: string;
  grado?: number;
  horas_semana: number;
  data?: object;
  salones?: string[] | string | null;
}

@Component({
  selector: 'app-materias',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './materias.html',
  styleUrl: './materias.scss'
})
export class Materias {
  materias: Materia[] = [];
  nuevaMateria: Materia = { id: '', nombre: '', grado: 1, horas_semana: 1, data: {}, salones: '' };
  editandoId: string | null = null;
  salones: string[] = [];
  toastVisible = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'warning' = 'success';

  ngOnInit() {
    this.cargarMaterias();
    this.cargarSalones();
    console.log('Salones materias:', this.materias);
  }

  private getAuthHeaders(includeContentType = false): HeadersInit {
    const token = localStorage.getItem('token') || '';
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`
    };
    if (includeContentType) {
      headers['Content-Type'] = 'application/json';
    }
    return headers;
  }

  private showToast(message: string, type: 'success' | 'error' | 'warning' = 'success') {
    this.toastMessage = message;
    this.toastType = type;
    this.toastVisible = true;
    setTimeout(() => {
      this.toastVisible = false;
    }, 2600);
  }

  private normalizeMateriaName(value: string) {
    return value.trim().toLowerCase();
  }

  private isNombreDuplicado(nombre: string, excludeId?: string): boolean {
    const normalized = this.normalizeMateriaName(nombre);
    return this.materias.some((m) =>
      m.id !== excludeId && this.normalizeMateriaName(m.nombre) === normalized
    );
  }

  private normalizeSalones(value: unknown): string[] {
    if (Array.isArray(value)) {
      return value.map((v) => String(v)).filter(Boolean);
    }
    if (typeof value === 'string' && value.trim().length > 0) {
      return [value.trim()];
    }
    return [];
  }

  formatSalones(value: unknown): string {
    const normalized = this.normalizeSalones(value);
    return normalized.length > 0 ? normalized.join(', ') : 'Sin salón';
  }

  async cargarSalones() {
    try {
      const res = await fetch('http://localhost:3000/salones', {
        headers: this.getAuthHeaders()
      });
      if (!res.ok) throw new Error('Error al obtener salones');
      const data = await res.json();
      this.salones = Array.isArray(data) ? data.map((s: any) => s.nombre) : [];
    } catch (err) {
      this.showToast('No se pudo cargar la lista de salones', 'error');
    }
  }

  async cargarMaterias() {
    const localKey = 'materias-caches';
    const localHashKey = 'materias-cache-hash';
    // Intenta cargar desde localStorage
    const cache = localStorage.getItem(localKey);
    localStorage.getItem(localHashKey);
    let materiasLocal: Materia[] = [];
    if (cache) {
      try {
        materiasLocal = JSON.parse(cache);
        this.materias = materiasLocal;
        console.log('Cargado desde cache localStorage');
      } catch { }
    }

    try {

      const resList = await fetch('http://localhost:3000/materias', {
        headers: this.getAuthHeaders()
      });
      if (!resList.ok) throw new Error('Error al obtener materias');
      const data = await resList.json();
      this.materias = Array.isArray(data) ? data.map((m: any) => ({
        id: m.id,
        nombre: m.nombre,
        grado: m.grado,
        horas_semana: m.horas_semana,
        data: m.data || {},
        salones: this.normalizeSalones(m.salones)
      })) : [];
      localStorage.setItem(localKey, JSON.stringify(this.materias));
    } catch (err) {
      this.showToast('No se pudo cargar la lista de materias', 'error');
    }
  }

  async agregarMateria() {
    if (!this.nuevaMateria.nombre.trim()) {
      this.showToast('Debes capturar el nombre de la materia', 'warning');
      return;
    }

    if (this.isNombreDuplicado(this.nuevaMateria.nombre)) {
      this.showToast('Ya existe una materia con ese nombre', 'warning');
      return;
    }

    const body = {
      nombre: this.nuevaMateria.nombre,
      grado: this.nuevaMateria.grado || 1,
      horas_semana: this.nuevaMateria.horas_semana || 1,
      data: this.nuevaMateria.data || {},
      salones: this.normalizeSalones(this.nuevaMateria.salones)
    };
    try {
      const res = await fetch('http://localhost:3000/materias', {
        method: 'POST',
        headers: this.getAuthHeaders(true),
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error('Error al crear la materia');
      const data = await res.json();
      this.materias.push({
        id: data.id || Date.now().toString(),
        nombre: data.nombre,
        grado: data.grado,
        horas_semana: data.horas_semana,
        salones: this.normalizeSalones(data.salones)
      });
      this.nuevaMateria = { id: '', nombre: '', grado: 1, horas_semana: 1, data: {}, salones: '' };
      this.showToast('Materia creada correctamente', 'success');
    } catch (err) {
      this.showToast('No se pudo crear la materia', 'error');
    }
  }

  async guardarEdicion() {
    if (!this.nuevaMateria.nombre.trim() || !this.editandoId) {
      this.showToast('Debes capturar el nombre de la materia', 'warning');
      return;
    }

    if (this.isNombreDuplicado(this.nuevaMateria.nombre, this.editandoId)) {
      this.showToast('Ya existe una materia con ese nombre', 'warning');
      return;
    }

    const body: any = {
      nombre: this.nuevaMateria.nombre,
      grado: this.nuevaMateria.grado || 1,
      data: this.nuevaMateria.data || {},
      horas_semana: this.nuevaMateria.horas_semana || 1,
      salones: this.normalizeSalones(this.nuevaMateria.salones)
    };
    try {
      const res = await fetch(`http://localhost:3000/materias/${this.editandoId}`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(true),
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error('Error al editar la materia');
      const data = await res.json();
      this.materias = this.materias.map(m => m.id === this.editandoId ? {
        id: this.editandoId!,
        nombre: body.nombre,
        grado: body.grado,
        horas_semana: body.horas_semana,
        data: body.data,
        salones: this.normalizeSalones(body.salones)
      } : m);
      this.nuevaMateria = { id: '', nombre: '', grado: 1, horas_semana: 1, data: {}, salones: '' };
      this.editandoId = null;
      this.showToast('Materia editada correctamente', 'success');
    } catch (err) {
      this.showToast('No se pudo editar la materia', 'error');
    }
  }

  async eliminarMateria(id: string) {

    const confirmacion = confirm('Â¿EstÃ¡s seguro de eliminar esta materia?');
    if (!confirmacion) return;

    try {
      const res = await fetch(`http://localhost:3000/materias/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });
      if (!res.ok) throw new Error('Error al eliminar la materia');
      this.materias = this.materias.filter(m => m.id !== id);
      this.showToast('Materia eliminada correctamente', 'success');
    } catch (err) {
      this.showToast('No se pudo eliminar la materia', 'error');
    }
  }

  editarMateria(materia: Materia) {
    this.editandoId = materia.id;
    this.nuevaMateria = {
      ...materia,
      salones: this.normalizeSalones(materia.salones)[0] || ''
    };
  }

  cancelarEdicion() {
    this.nuevaMateria = { id: '', nombre: '', grado: 1, horas_semana: 1, data: {}, salones: '' };
    this.editandoId = null;
  }
}
