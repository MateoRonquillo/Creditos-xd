import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { request } from '../api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import '../App.css'; 

export default function Simulador() {
  const location = useLocation();
  const navigate = useNavigate();
  const creditoSeleccionado = location.state?.creditoSeleccionado;

  if (!creditoSeleccionado) {
    navigate('/dashboard');
    return null;
  }

  const [monto, setMonto] = useState('5000');
  const [plazo, setPlazo] = useState('24'); 
  const [metodo, setMetodo] = useState('german'); // Ajustado a Alemán para tu prueba
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [resultados, setResultados] = useState<any>(null);

  // FÓRMULAS MATEMÁTICAS EN EL FRONTEND
  const calcularTabla = (montoTotal: number, tasaAnual: number, meses: number, tipo: string) => {
    let saldo = montoTotal;
    const tasaMensual = (tasaAnual / 100) / 12;
    const cuotas = [];
    let totalInteres = 0;

    if (tipo === 'french') {
      // Método Francés: Cuota Fija
      const cuotaFija = montoTotal * (tasaMensual * Math.pow(1 + tasaMensual, meses)) / (Math.pow(1 + tasaMensual, meses) - 1);
      for (let i = 1; i <= meses; i++) {
        const interes = saldo * tasaMensual;
        const capital = cuotaFija - interes;
        saldo -= capital;
        totalInteres += interes;
        cuotas.push({ mes: i, cuota: cuotaFija, capital, interes, saldo: Math.max(0, saldo) });
      }
    } else {
      // Método Alemán: Amortización de Capital Fija (Tu caso de prueba)
      const capitalFijo = montoTotal / meses;
      for (let i = 1; i <= meses; i++) {
        const interes = saldo * tasaMensual;
        const cuota = capitalFijo + interes;
        saldo -= capitalFijo;
        totalInteres += interes;
        cuotas.push({ mes: i, cuota, capital: capitalFijo, interes, saldo: Math.max(0, saldo) });
      }
    }
    return { cuotas, totalInteres };
  };

  const manejarSimulacion = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const montoNum = Number(monto);
    if (montoNum < 300) {
      setError('El monto mínimo a solicitar es de $300.00');
      return;
    }

    setCargando(true);

    try {
      // 1. Calculamos todo localmente para que la interfaz nunca falle
      const calculos = calcularTabla(montoNum, creditoSeleccionado.interes, Number(plazo), metodo);
      const cuotaInicial = calculos.cuotas[0]; // Tomamos la cuota del mes 1
      const seguroFijoMensual = 4.50; // Valor de seguro referencial

      setResultados({
        cuotaMensual: cuotaInicial.cuota + seguroFijoMensual,
        capitalMes: cuotaInicial.capital,
        interesMes: cuotaInicial.interes,
        seguroMes: seguroFijoMensual,
        capitalTotal: montoNum,
        interesTotal: calculos.totalInteres,
        seguroTotal: seguroFijoMensual * Number(plazo),
        plazoMeses: Number(plazo),
        tablaCompleta: calculos.cuotas // Guardamos la tabla para el PDF
      });

      // 2. Notificamos al backend de Mateo silenciosamente
      const resCredito = await request('/credits', {
        method: 'POST',
        body: JSON.stringify({
          name: creditoSeleccionado.nombre,
          amount: montoNum,
          annualInterestRate: creditoSeleccionado.interes,
          termMonths: Number(plazo),
          amortizationType: metodo
        })
      });
      if (resCredito.response.ok) {
        await request('/simulations', {
          method: 'POST',
          body: JSON.stringify({
            creditId: resCredito.body.id,
            amount: montoNum,
            annualInterestRate: creditoSeleccionado.interes,
            termMonths: Number(plazo),
            amortizationType: metodo
          })
        });
      }
    } catch (err) {
      // Si el backend falla, la UI seguirá funcionando porque ya calculamos los datos localmente
      console.warn("No se pudo guardar en el backend, pero el cálculo local fue exitoso.");
    } finally {
      setCargando(false);
    }
  };

  const descargarPDF = () => {
    if (!resultados || !resultados.tablaCompleta) return;
    
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setTextColor(15, 38, 92);
    doc.text(`Tabla de Amortización - ${creditoSeleccionado.nombre}`, 14, 22);

    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text(`Monto Solicitado: $${resultados.capitalTotal.toFixed(2)}`, 14, 32);
    doc.text(`Tasa de Interés Anual: ${creditoSeleccionado.interes}%`, 14, 38);
    doc.text(`Plazo: ${resultados.plazoMeses} meses`, 14, 44);
    doc.text(`Método: ${metodo === 'french' ? 'Francés (Cuota Fija)' : 'Alemán (Cuota Variable)'}`, 14, 50);

    const tableColumn = ["Mes", "Cuota a Pagar", "Abono al Capital", "Interés", "Saldo Restante"];
    
    // Construimos las filas del PDF usando la tabla que calculamos localmente
    const tableRows = resultados.tablaCompleta.map((c: any) => [
      c.mes,
      `$${(c.cuota + resultados.seguroMes).toFixed(2)}`,
      `$${c.capital.toFixed(2)}`,
      `$${c.interes.toFixed(2)}`,
      `$${c.saldo.toFixed(2)}`
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 58,
      theme: 'striped',
      headStyles: { fillColor: [15, 38, 92] },
    });

    doc.save(`Amortizacion_${creditoSeleccionado.nombre.replace(/ /g, '_')}.pdf`);
  };

  return (
    <main style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ backgroundColor: '#fff', borderBottom: '4px solid #facc15', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', marginBottom: '30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.5rem', color: '#1e3a8a' }}>🏦</span>
          <h1 style={{ color: '#1e3a8a', fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>Banco Estudiantil</h1>
        </div>
        
        <div style={{ fontSize: '0.9rem', color: '#4b5563', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ fontSize: '1.2rem' }}>👤</span> Marlon (Autenticado JWT)
          </span>
          <button onClick={() => { localStorage.removeItem('token'); navigate('/login'); }} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem', padding: 0 }}>
            Salir
          </button>
        </div>
      </header>

      {/* Contenedor central del simulador */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}></div>
      <div style={{ backgroundColor: '#f0f7ff', borderBottom: '1px solid #bfdbfe', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '8px 8px 0 0' }}>
        <button onClick={() => navigate('/dashboard')} style={{ color: '#1e3a8a', background: 'none', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
          ← Cambiar crédito
        </button>
        <div style={{ textAlign: 'right', display: 'flex', gap: '15px', alignItems: 'center' }}>
          <span style={{ color: '#4b5563', fontSize: '0.9rem' }}>Simulando:</span>
          <strong style={{ color: '#1e3a8a', fontSize: '1.1rem' }}>{creditoSeleccionado.nombre}</strong>
          <span style={{ color: '#d1d5db' }}>|</span>
          <span style={{ color: '#4b5563', fontSize: '0.9rem' }}>Tasa referencial:</span>
          <strong style={{ color: '#d97706', fontSize: '1.2rem' }}>{creditoSeleccionado.interes}%</strong>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', backgroundColor: '#fff', borderRadius: '0 0 8px 8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
        
        <section style={{ padding: '40px', borderRight: '1px solid #f3f4f6' }}>
          {error && <p style={{ color: '#dc2626', fontWeight: 'bold', marginBottom: '15px' }}>{error}</p>}
          
          <form onSubmit={manejarSimulacion}>
            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', color: '#1f2937', fontWeight: '600', marginBottom: '8px' }}>
                ¿Cuánto dinero necesitas que te prestemos?
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '15px', top: '12px', color: '#6b7280', fontWeight: 'bold' }}>$</span>
                <input 
                  type="number" 
                  value={monto} 
                  onChange={(e) => setMonto(e.target.value)}
                  style={{ width: '100%', padding: '12px 12px 12px 35px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '1.1rem', fontWeight: 'bold', boxSizing: 'border-box' }}
                />
              </div>
              <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '5px' }}>Min. $300,00</p>
            </div>

            <div style={{ marginBottom: '30px' }}>
              <label style={{ display: 'block', color: '#1f2937', fontWeight: '600', marginBottom: '8px' }}>
                ¿En cuánto tiempo quieres pagarlo?
              </label>
              <select 
                value={plazo} 
                onChange={(e) => setPlazo(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '1rem', backgroundColor: '#fff', boxSizing: 'border-box' }}
              >
                <option value="12">1 año (12 meses)</option>
                <option value="24">2 años (24 meses)</option>
                <option value="36">3 años (36 meses)</option>
                <option value="48">4 años (48 meses)</option>
                <option value="60">5 años (60 meses)</option>
              </select>
            </div>

            <div style={{ marginBottom: '35px' }}>
              <label style={{ display: 'block', color: '#1f2937', fontWeight: '600', marginBottom: '15px' }}>
                ¿Cómo quieres pagar tus intereses?
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div 
                  onClick={() => setMetodo('french')}
                  style={{ padding: '20px', textAlign: 'center', borderRadius: '8px', cursor: 'pointer', border: metodo === 'french' ? '2px solid #1e3a8a' : '2px solid #e5e7eb', backgroundColor: metodo === 'french' ? '#eff6ff' : '#fff' }}
                >
                  <h4 style={{ margin: '0 0 5px 0', color: '#1f2937' }}>Método Francés</h4>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280' }}>Cuotas se mantienen fijas en el tiempo</p>
                </div>
                
                <div 
                  onClick={() => setMetodo('german')}
                  style={{ padding: '20px', textAlign: 'center', borderRadius: '8px', cursor: 'pointer', border: metodo === 'german' ? '2px solid #1e3a8a' : '2px solid #e5e7eb', backgroundColor: metodo === 'german' ? '#eff6ff' : '#fff' }}
                >
                  <h4 style={{ margin: '0 0 5px 0', color: '#1f2937' }}>Método Alemán</h4>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280' }}>Cuotas variables que decrecen en el tiempo</p>
                </div>
              </div>
            </div>

            <button type="submit" disabled={cargando} style={{ width: '100%', padding: '15px', backgroundColor: '#fff', color: '#1e3a8a', border: '2px solid #1e3a8a', borderRadius: '8px', fontWeight: 'bold', cursor: cargando ? 'not-allowed' : 'pointer', fontSize: '1.1rem' }}>
              {cargando ? 'Calculando...' : 'Simular'}
            </button>
          </form>
        </section>

        <section style={{ backgroundColor: '#f9fafb', padding: '40px', display: 'flex', flexDirection: 'column' }}>
          
          {!resultados ? (
             <div style={{ textAlign: 'center', color: '#9ca3af', marginTop: '80px' }}>
               <p>Llena los datos y presiona "Simular" para ver tus cuotas.</p>
             </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ textAlign: 'center', color: '#374151', marginBottom: '20px' }}>
                {metodo === 'german' ? 'Tu primera cuota será' : 'Tus pagos mensuales serán'}
              </h3>
              
              <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', color: '#6b7280', fontSize: '0.9rem', marginBottom: '20px' }}>
                 <div style={{ textAlign: 'center' }}><strong style={{ color: '#1f2937', display: 'block' }}>${resultados.capitalMes.toFixed(2)}</strong>Capital</div>
                 <div>+</div>
                 <div style={{ textAlign: 'center' }}><strong style={{ color: '#1f2937', display: 'block' }}>${resultados.interesMes.toFixed(2)}</strong>Interés</div>
                 <div>+</div>
                 <div style={{ textAlign: 'center' }}><strong style={{ color: '#1f2937', display: 'block' }}>${resultados.seguroMes.toFixed(2)}</strong>Seguro</div>
              </div>

              <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <p style={{ fontSize: '3rem', fontWeight: 'bold', color: '#1e3a8a', margin: '0 0 5px 0' }}>${resultados.cuotaMensual.toFixed(2)}</p>
                <p style={{ color: '#6b7280', margin: 0 }}>Durante <strong style={{ color: '#1f2937' }}>{resultados.plazoMeses} meses</strong></p>
              </div>

              <div style={{ borderTop: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb', padding: '20px 0', margin: '20px 0' }}>
                <h4 style={{ textAlign: 'center', color: '#374151', marginBottom: '20px' }}>Detalle de tu crédito</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}><span style={{ color: '#6b7280' }}>Capital:</span><strong>${resultados.capitalTotal.toFixed(2)}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}><span style={{ color: '#6b7280' }}>Total de interés:</span><strong>${resultados.interesTotal.toFixed(2)}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}><span style={{ color: '#6b7280' }}>Total seguro:</span><strong>${resultados.seguroTotal.toFixed(2)}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem' }}><strong>Total a pagar:</strong><strong style={{ color: '#1e3a8a' }}>${(resultados.capitalTotal + resultados.interesTotal + resultados.seguroTotal).toFixed(2)}</strong></div>
              </div>

              <div style={{ marginTop: 'auto' }}>
                <button onClick={descargarPDF} style={{ width: '100%', padding: '15px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                  Exportar a PDF
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}