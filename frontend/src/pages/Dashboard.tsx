import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CREDIT_OPTIONS } from '../credits';

export default function Dashboard() {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollCarousel = (direction: 'left' | 'right') => {
    scrollRef.current?.scrollBy({
      left: direction === 'left' ? -340 : 340,
      behavior: 'smooth',
    });
  };

  return (
    <main className="page dashboard-page">
      <section className="hero hero-dashboard">
        <div className="hero-content">
          <span className="eyebrow">Simulador de credito</span>
          <h1>Calcula tu cuota mensual antes de solicitar.</h1>
          <p>
            Elige un tipo de credito, ajusta monto y plazo, y compara el costo referencial de forma clara.
          </p>
          <button className="btn btn-primary" type="button" onClick={() => navigate('/simulador')}>
            Simular ahora
          </button>
        </div>
      </section>

      <section className="content-band">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Productos</span>
            <h2>Selecciona el credito que quieres simular</h2>
          </div>
          <div className="carousel-controls" aria-label="Controles del carrusel">
            <button type="button" aria-label="Ver creditos anteriores" onClick={() => scrollCarousel('left')}>
              ‹
            </button>
            <button type="button" aria-label="Ver mas creditos" onClick={() => scrollCarousel('right')}>
              ›
            </button>
          </div>
        </div>

        <div className="credit-carousel" ref={scrollRef}>
          {CREDIT_OPTIONS.map((credit) => (
            <article className="credit-card" key={credit.id}>
              <img src={credit.imagen} alt={credit.nombre} />
              <div className="credit-card-body">
                <span className="credit-rate">{credit.interes.toFixed(2)}% anual</span>
                <h3>{credit.nombre}</h3>
                <p>{credit.descripcion}</p>
                <dl>
                  <div>
                    <dt>Monto</dt>
                    <dd>{credit.rango}</dd>
                  </div>
                  <div>
                    <dt>Plazo</dt>
                    <dd>{credit.plazoMaximo}</dd>
                  </div>
                </dl>
                <button
                  className="btn btn-secondary btn-full"
                  type="button"
                  onClick={() => navigate('/simulador', { state: { creditoSeleccionado: credit } })}
                >
                  Simular credito
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="benefits-band">
        <div className="section-heading compact">
          <span className="eyebrow">Beneficios</span>
          <h2>Informacion simple para decidir mejor</h2>
        </div>
        <div className="benefit-grid">
          <article>
            <strong>Flexibilidad</strong>
            <p>Ajusta monto, plazo y metodo de amortizacion en segundos.</p>
          </article>
          <article>
            <strong>Tasas referenciales</strong>
            <p>Compara productos con una visualizacion limpia de costos.</p>
          </article>
          <article>
            <strong>Historial privado</strong>
            <p>Con una cuenta puedes guardar y volver a descargar simulaciones.</p>
          </article>
        </div>
      </section>
    </main>
  );
}
