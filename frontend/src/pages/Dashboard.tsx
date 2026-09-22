import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const TIPOS_CREDITOS = [
  { id: 'preciso', nombre: 'Crédito Preciso', interes: 16.50, imagen: 'https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?q=80&w=500&auto=format&fit=crop' },
  { id: 'linea-abierta', nombre: 'Línea Abierta', interes: 15.60, imagen: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=500&auto=format&fit=crop' },
  { id: 'hipotecario', nombre: 'Hipotecario Vivienda', interes: 8.90, imagen: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=500&auto=format&fit=crop' },
  { id: 'vip', nombre: 'Vivienda Interés Público', interes: 4.87, imagen: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=500&auto=format&fit=crop' },
  { id: 'vis', nombre: 'Vivienda Interés Social', interes: 4.99, imagen: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=500&auto=format&fit=crop' },
  // Imagen de Educación actualizada y estable
  { id: 'educacion', nombre: 'Educación Superior', interes: 9.50, imagen: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=500&auto=format&fit=crop' }
];

export default function Dashboard() {
  const navigate = useNavigate();
  // Referencia para controlar el contenedor del carrusel
  const scrollRef = useRef<HTMLDivElement>(null);

  const cerrarSesion = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  // Función para mover el carrusel con las flechas
  const deslizarCarrusel = (direccion: 'izquierda' | 'derecha') => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      // Desplazamos 320px que equivale aproximadamente a una tarjeta + el espacio
      const distancia = 320; 
      current.scrollBy({ 
        left: direccion === 'izquierda' ? -distancia : distancia, 
        behavior: 'smooth' 
      });
    }
  };

  return (
    <main style={{ backgroundColor: '#f4f7f9', minHeight: '100vh', fontFamily: 'system-ui, sans-serif', overflowX: 'hidden' }}>
      
      <header style={{ backgroundColor: '#fff', borderBottom: '4px solid #facc15', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', position: 'relative', zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.5rem' }}>🏦</span>
          <h1 style={{ color: '#1e3a8a', fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>Banco Estudiantil</h1>
        </div>
        <div style={{ fontSize: '0.9rem', color: '#4b5563', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ fontSize: '1.2rem' }}>👤</span> Marlon (Autenticado)</span>
          <button onClick={cerrarSesion} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem', padding: 0 }}>Salir</button>
        </div>
      </header>

      <section style={{ 
        backgroundImage: 'linear-gradient(rgba(15, 38, 92, 0.8), rgba(15, 38, 92, 0.6)), url("https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop")',
        backgroundSize: 'cover', backgroundPosition: 'center', color: '#fff', padding: '5rem 2rem', textAlign: 'center' 
      }}>
        <h2 style={{ fontSize: '3rem', fontWeight: 'bold', margin: '0 0 15px 0', letterSpacing: '-1px' }}>¿Qué crédito necesitas?</h2>
        <p style={{ fontSize: '1.2rem', opacity: 0.9, maxWidth: '600px', margin: '0 auto' }}>
          Selecciona tu producto financiero y simula tu tabla de amortización con tasas preferenciales.
        </p>
      </section>

      {/* CONTENEDOR PRINCIPAL DEL CARRUSEL */}
      <div style={{ maxWidth: '1200px', margin: '-50px auto 0', padding: '0 2rem 4rem', position: 'relative', zIndex: 10 }}>
        
        {/* Botón Izquierda */}
        <button 
          onClick={() => deslizarCarrusel('izquierda')}
          style={{ position: 'absolute', left: '5px', top: '45%', transform: 'translateY(-50%)', zIndex: 20, width: '45px', height: '45px', borderRadius: '50%', backgroundColor: '#fff', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', cursor: 'pointer', color: '#1e3a8a', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          ❮
        </button>

        <section 
          ref={scrollRef} 
          style={{ 
            display: 'flex', 
            gap: '1.5rem', 
            overflowX: 'auto', 
            padding: '10px 10px 30px 10px', 
            scrollSnapType: 'x mandatory',
            scrollbarWidth: 'none', // Oculta barra en Firefox
            msOverflowStyle: 'none', // Oculta barra en IE/Edge
          }}
        >
          {TIPOS_CREDITOS.map((credito) => (
            <article 
              key={credito.id} 
              onClick={() => navigate('/simulador', { state: { creditoSeleccionado: credito } })}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-8px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              style={{ 
                minWidth: '300px', 
                backgroundColor: '#fff', 
                borderRadius: '1rem', 
                boxShadow: '0 10px 20px rgba(0,0,0,0.1)', 
                cursor: 'pointer', 
                transition: 'transform 0.3s ease, box-shadow 0.3s ease', 
                overflow: 'hidden',
                scrollSnapAlign: 'start',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <div style={{ height: '160px', backgroundImage: `url(${credito.imagen})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
              
              <div style={{ padding: '1.5rem', textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <h3 style={{ fontWeight: 'bold', fontSize: '1.25rem', marginBottom: '1rem', color: '#1f2937' }}>{credito.nombre}</h3>
                
                <div style={{ backgroundColor: '#fefce8', border: '1px solid #fef08a', borderRadius: '0.5rem', padding: '10px' }}>
                  <p style={{ fontSize: '0.8rem', color: '#a16207', margin: '0 0 5px 0', fontWeight: '600', textTransform: 'uppercase' }}>Tasa Efectiva Anual</p>
                  <p style={{ fontSize: '2rem', fontWeight: '900', color: '#b45309', margin: 0 }}>{credito.interes}%</p>
                </div>
              </div>
            </article>
          ))}
        </section>

        {/* Botón Derecha */}
        <button 
          onClick={() => deslizarCarrusel('derecha')}
          style={{ position: 'absolute', right: '5px', top: '45%', transform: 'translateY(-50%)', zIndex: 20, width: '45px', height: '45px', borderRadius: '50%', backgroundColor: '#fff', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', cursor: 'pointer', color: '#1e3a8a', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          ❯
        </button>

      </div>
    </main>
  );
}