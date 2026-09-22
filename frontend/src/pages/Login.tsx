import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { request } from '../api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [mensajeAyuda, setMensajeAyuda] = useState(''); 
  const navigate = useNavigate();

  const manejarAccion = async (e: React.FormEvent, esRegistro: boolean) => {
    e.preventDefault();
    if (!email.includes('@') || !email.includes('.')) { setError('Ingresa un correo electrónico válido.'); return; }
    if (password.length < 5) { setError('La contraseña debe tener al menos 5 caracteres.'); return; }
    
    setError('');
    setMensajeAyuda('Conectando con el servidor...');

    try {
      const endpoint = esRegistro ? '/auth/register' : '/auth/login';
      const payload = esRegistro ? { name: 'Marlon', email, password } : { email, password };
      const result = await request(endpoint, { method: 'POST', body: JSON.stringify(payload) });

      if (result.response.ok) {
        if (esRegistro) {
          setMensajeAyuda('¡Registro exitoso! Ahora presiona "Ingresar".');
        } else {
          localStorage.setItem('token', result.body.token);
          navigate('/dashboard');
        }
      } else {
        setError(esRegistro ? 'El usuario ya existe.' : 'Credenciales incorrectas.');
        setMensajeAyuda('');
      }
    } catch (err) {
      setError('Error de red al conectar con los microservicios.');
      setMensajeAyuda('');
    }
  };

  return (
    <main style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#fff', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* PANEL IZQUIERDO: Imagen Institucional */}
      <section style={{ 
        flex: 1, 
        display: 'flex', 
        backgroundImage: 'linear-gradient(to right, rgba(30, 58, 138, 0.8), rgba(30, 58, 138, 0.4)), url("https://images.unsplash.com/photo-1601597111158-2fceff292cdc?q=80&w=2070&auto=format&fit=crop")',
        backgroundSize: 'cover', 
        backgroundPosition: 'center',
        padding: '4rem',
        color: '#fff',
        flexDirection: 'column',
        justifyContent: 'center'
      }}>
        <div style={{ maxWidth: '500px' }}>
          <h1 style={{ fontSize: '3.5rem', fontWeight: 'bold', marginBottom: '1rem', lineHeight: 1.1 }}>
            Construye tu futuro financiero
          </h1>
          <p style={{ fontSize: '1.25rem', opacity: 0.9 }}>
            Simulador de créditos con arquitectura de microservicios. Rápido, seguro y en tiempo real.
          </p>
        </div>
      </section>

      {/* PANEL DERECHO: Formulario */}
      <section style={{ width: '100%', maxWidth: '500px', padding: '4rem 3rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', backgroundColor: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2rem' }}>
          <span style={{ fontSize: '2rem' }}>🏦</span>
          <h2 style={{ color: '#1e3a8a', fontSize: '1.8rem', fontWeight: 'bold', margin: 0 }}>Banco Estudiantil</h2>
        </div>
        
        <h3 style={{ fontSize: '1.25rem', color: '#374151', marginBottom: '1.5rem', fontWeight: '600' }}>Acceso al Sistema</h3>
        
        {error && <p style={{ color: '#ef4444', marginBottom: '15px', fontSize: '0.9rem', fontWeight: 'bold', backgroundColor: '#fef2f2', padding: '10px', borderRadius: '5px' }}>{error}</p>}
        {mensajeAyuda && <p style={{ color: '#10b981', marginBottom: '15px', fontSize: '0.9rem', fontWeight: 'bold', backgroundColor: '#ecfdf5', padding: '10px', borderRadius: '5px' }}>{mensajeAyuda}</p>}

        <form style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div>
            <label style={{ display: 'block', color: '#4b5563', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>Usuario / Correo</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #d1d5db', boxSizing: 'border-box', outline: 'none', fontSize: '1rem' }} placeholder="tu@correo.com" />
          </div>
          <div>
            <label style={{ display: 'block', color: '#4b5563', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>Contraseña</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: '100%', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #d1d5db', boxSizing: 'border-box', outline: 'none', fontSize: '1rem' }} placeholder="••••••••" />
          </div>
          
          <button type="submit" onClick={(e) => manejarAccion(e, false)} style={{ width: '100%', backgroundColor: '#1e3a8a', color: '#fff', fontWeight: 'bold', padding: '1rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', fontSize: '1rem', marginTop: '10px', transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#172554'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1e3a8a'}>
            Iniciar Sesión
          </button>
          <button type="button" onClick={(e) => manejarAccion(e, true)} style={{ width: '100%', backgroundColor: '#f3f4f6', color: '#4b5563', fontWeight: '600', padding: '0.75rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', fontSize: '0.875rem', transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}>
            Crear cuenta de prueba
          </button>
        </form>
      </section>
    </main>
  );
}