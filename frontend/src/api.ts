// src/api.ts
const API_BASE_URL = '/api';

export async function request(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers);
  
  // Extraemos el token guardado en el navegador (si existe)
  const token = localStorage.getItem('token'); 

  if (options.body) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  const contentType = response.headers.get('content-type') ?? '';
  
  // Procesamos la respuesta
  const body = contentType.includes('json') ? await response.json() : await response.text();
  
  return { response, body };
}