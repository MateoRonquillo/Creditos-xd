import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getApiMessage, request, type SimulationDto } from '../api';
import { exportSimulationPdf, formatMethod, formatMoney } from '../pdf';

export default function Historial() {
  const [simulations, setSimulations] = useState<SimulationDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadingId, setDownloadingId] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadHistory() {
      setIsLoading(true);
      setError('');

      try {
        const result = await request<SimulationDto[]>('/simulations/history');
        if (!result.response.ok || !Array.isArray(result.body)) {
          throw new Error(getApiMessage(result.body, 'No pudimos cargar tu historial.'));
        }

        if (isMounted) {
          setSimulations(result.body);
        }
      } catch (caughtError) {
        if (isMounted) {
          setError(caughtError instanceof Error ? caughtError.message : 'No pudimos cargar tu historial.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadHistory();

    return () => {
      isMounted = false;
    };
  }, []);

  const downloadPdf = (simulation: SimulationDto) => {
    setDownloadingId(simulation.id);
    exportSimulationPdf({
      title: 'Simulacion guardada',
      fileName: `simulacion_${simulation.id}`,
      productName: 'Credito simulado',
      amount: simulation.amount,
      annualInterestRate: simulation.annualInterestRate,
      termMonths: simulation.termMonths,
      amortizationType: simulation.amortizationType,
      totalInterest: simulation.totalInterest,
      totalPayment: simulation.totalPayment,
      schedule: simulation.schedule,
      createdAtUtc: simulation.createdAtUtc,
    });
    setDownloadingId('');
  };

  return (
    <main className="page history-page">
      <section className="history-hero">
        <div>
          <span className="eyebrow">Historial privado</span>
          <h1>Tus simulaciones guardadas</h1>
          <p>Consulta el resumen de cada credito simulado y vuelve a descargar su PDF cuando lo necesites.</p>
        </div>
        <Link to="/simulador" className="btn btn-primary">
          Nueva simulacion
        </Link>
      </section>

      {error && <div className="alert alert-error">{error}</div>}

      {isLoading ? (
        <div className="loading-panel">Cargando historial...</div>
      ) : simulations.length === 0 ? (
        <section className="empty-history">
          <h2>Aun no tienes simulaciones guardadas.</h2>
          <p>Realiza una simulacion con sesion iniciada para verla aqui.</p>
          <Link to="/simulador" className="btn btn-secondary">
            Ir al simulador
          </Link>
        </section>
      ) : (
        <section className="history-grid">
          {simulations.map((simulation) => {
            const firstPayment = simulation.schedule[0]?.payment ?? 0;
            return (
              <article className="history-card" key={simulation.id}>
                <div className="history-card-head">
                  <span>{new Date(simulation.createdAtUtc).toLocaleDateString('es-EC')}</span>
                  <strong>{formatMoney(firstPayment)}</strong>
                </div>
                <h2>{formatMethod(simulation.amortizationType)}</h2>
                <dl className="summary-list compact-list">
                  <div>
                    <dt>Monto</dt>
                    <dd>{formatMoney(simulation.amount)}</dd>
                  </div>
                  <div>
                    <dt>Tasa anual</dt>
                    <dd>{simulation.annualInterestRate.toFixed(2)}%</dd>
                  </div>
                  <div>
                    <dt>Plazo</dt>
                    <dd>{simulation.termMonths} meses</dd>
                  </div>
                  <div>
                    <dt>Total</dt>
                    <dd>{formatMoney(simulation.totalPayment)}</dd>
                  </div>
                </dl>
                <button
                  className="btn btn-danger btn-full"
                  type="button"
                  onClick={() => downloadPdf(simulation)}
                  disabled={downloadingId === simulation.id}
                >
                  {downloadingId === simulation.id ? 'Preparando PDF...' : 'Descargar PDF'}
                </button>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
