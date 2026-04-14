import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
export interface salonesData {
  id: string;
  nombre: string;
  edificio?: string;
}

@Component({
  selector: 'app-salones',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './salones.html',
  styleUrls: ['./salones.scss']
})
export class SalonesComponent {
  usuarioNombre: string = '';
  usuarioCarrera: string = '';
  sidebarCollapsed = false;


  salones: salonesData[] = [];
  nuevoSalon: salonesData = { id: '', nombre: '', edificio: '' };
  editandoId: string | null = null;
  toastVisible = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'warning' = 'success';

  ngOnInit() {
    const usuarioData = localStorage.getItem('userData');
    if (usuarioData) {
      const { full_name, metadata: { division, turno } } = JSON.parse(usuarioData);
      this.usuarioNombre = full_name || 'Usuario';
      this.usuarioCarrera = `${division || ''} - ${turno || ''}`;

    } else {
      this.usuarioNombre = 'Usuario';
      this.usuarioCarrera = '';
    }
    this.cargarSalones();
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

  async cargarSalones() {
    // Intentar cargar desde localStorage primero
    const cache = localStorage.getItem('salonesCache');
    if (cache) {
      try {
        const cacheData = JSON.parse(cache);
        this.salones = Array.isArray(cacheData) ? cacheData : [];
      } catch { }
    }

    try {
      const res = await fetch('http://localhost:3000/salones', {
        headers: this.getAuthHeaders()
      });
      if (!res.ok) throw new Error('Error al obtener salones');
      const data = await res.json();
      // La nueva API devuelve { id, nombre, data } donde data puede tener edificio
      const salonesList = Array.isArray(data) ? data.map((s, idx) => ({
        id: s.id || idx,
        nombre: s.nombre,
        edificio: s.edificio ?? s?.data?.edificio ?? ''
      })) : [];
      // Solo actualiza si hay cambios
      if (JSON.stringify(salonesList) !== localStorage.getItem('salonesCache')) {
        this.salones = salonesList;
        localStorage.setItem('salonesCache', JSON.stringify(salonesList));
      }
    } catch (err) {
      this.showToast('No se pudo cargar la lista de salones', 'error');
    }
  }

  async agregarSalon() {
    if (!this.nuevoSalon.nombre.trim()) {
      this.showToast('Debes capturar el nombre del salón', 'warning');
      return;
    }

    const duplicated = this.salones.some((s) =>
      s.nombre.trim().toLowerCase() === this.nuevoSalon.nombre.trim().toLowerCase()
      && (s.edificio || '').trim().toLowerCase() === (this.nuevoSalon.edificio || '').trim().toLowerCase()
    );

    if (duplicated) {
      this.showToast('Ya existe un salón con el mismo nombre y edificio', 'warning');
      return;
    }

    const body = {
      nombre: this.nuevoSalon.nombre,
      data: {
        edificio: (this.nuevoSalon.edificio || '').trim()
      }
    };
    try {
      const res = await fetch('http://localhost:3000/salones', {
        method: 'POST',
        headers: this.getAuthHeaders(true),
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error('Error al crear el salÃ³n');
      const data = await res.json();

      if (data.error) {
        this.showToast(data.error, 'warning');
        return;
      }
      this.salones.push({
        id: data.id || Date.now(),
        nombre: data.nombre,
        edificio: data.edificio ?? data?.data?.edificio ?? (this.nuevoSalon.edificio || '').trim()
      });
      this.nuevoSalon = { id: '', nombre: '', edificio: '' };
      this.showToast('Salón creado correctamente', 'success');
    } catch (err) {
      this.showToast('No se pudo crear el salón', 'error');
    }
  }

  async eliminarSalon(id: string) {
    const confirmacion = confirm('Â¿EstÃ¡s seguro de que deseas eliminar este salÃ³n?');
    if (!confirmacion) return;
    try {
      const res = await fetch(`http://localhost:3000/salones/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });
      if (!res.ok) throw new Error('Error al eliminar el salÃ³n');
      this.salones = this.salones.filter(s => s.id !== id);
      this.showToast('Salón eliminado correctamente', 'success');
    } catch (err) {
      this.showToast('No se pudo eliminar el salón', 'error');
    }
  }

  editarSalon(salon: salonesData) {
    this.editandoId = salon.id;
    this.nuevoSalon = { ...salon };
  }

  async guardarEdicion() {
    if (!this.nuevoSalon.nombre.trim()) {
      this.showToast('Debes capturar el nombre del salón', 'warning');
      return;
    }
    if (!this.editandoId) return;

    const duplicated = this.salones.some((s) =>
      s.id !== this.editandoId
      && s.nombre.trim().toLowerCase() === this.nuevoSalon.nombre.trim().toLowerCase()
      && (s.edificio || '').trim().toLowerCase() === (this.nuevoSalon.edificio || '').trim().toLowerCase()
    );

    if (duplicated) {
      this.showToast('Ya existe un salón con el mismo nombre y edificio', 'warning');
      return;
    }

    const body: any = {
      nombre: this.nuevoSalon.nombre,
      data: {
        edificio: (this.nuevoSalon.edificio || '').trim()
      }
    };
    try {
      const res = await fetch(`http://localhost:3000/salones/${this.editandoId}`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(true),
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error('Error al editar el salÃ³n');
      const data = await res.json();
      this.salones = this.salones.map(s => s.id === this.editandoId ? {
        id: this.editandoId!,
        nombre: body.nombre,
        edificio: body.data.edificio
      } : s);
      this.nuevoSalon = { id: '', nombre: '', edificio: '' };
      this.editandoId = null;
      this.showToast('Salón editado correctamente', 'success');
    } catch (err) {
      this.showToast('No se pudo editar el salón', 'error');
    }
  }

  cancelarEdicion() {
    this.nuevoSalon = { id: '', nombre: '', edificio: '' };
    this.editandoId = null;
  }
}


