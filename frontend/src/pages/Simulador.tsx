import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  getApiMessage,
  hasSession,
  request,
  subscribeToSessionChanges,
  type CreditDto,
  type SimulationDto,
} from '../api';
import { CREDIT_OPTIONS, type CreditOption } from '../credits';
import { exportSimulationPdf, formatMethod, formatMoney, type PdfInstallment } from '../pdf';

type LocationState = {
  creditoSeleccionado?: CreditOption;
};

type SimulationResult = {
  firstPayment: number;
  firstPrincipal: number;
  firstInterest: number;
  insuranceMonthly: number;
  amount: number;
  totalInterest: number;
  totalInsurance: number;
  totalPayment: number;
  termMonths: number;
  schedule: PdfInstallment[];
  savedSimulationId?: string;
};

const INSURANCE_MONTHLY = 4.5;

export default function Simulador() {
  const location = useLocation();
  const state = location.state as LocationState | null;
  const initialCredit = state?.creditoSeleccionado ?? CREDIT_OPTIONS[0];

  const [selectedCreditId, setSelectedCreditId] = useState(initialCredit.id);
  const [amount, setAmount] = useState('5000');
  const [term, setTerm] = useState('24');
  const [method, setMethod] = useState<'french' | 'german'>('german');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(hasSession);
  const [result, setResult] = useState<SimulationResult | null>(null);

  const selectedCredit = useMemo(
    () => CREDIT_OPTIONS.find((credit) => credit.id === selectedCreditId) ?? CREDIT_OPTIONS[0],
    [selectedCreditId],
  );

  useEffect(() => subscribeToSessionChanges(() => setIsAuthenticated(hasSession())), []);

  const handleSimulation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setNotice('');

    const amountValue = Number(amount);
    const termValue = Number(term);

    if (!Number.isFinite(amountValue) || amountValue < 300) {
      setError('El monto minimo a solicitar es de $300.00.');
      return;
    }

    if (!Number.isFinite(termValue) || termValue < 1) {
      setError('Selecciona un plazo valido para la simulacion.');
      return;
    }

    const localResult = buildSimulationResult(amountValue, selectedCredit.interes, termValue, method);
    setResult(localResult);

    if (!isAuthenticated) {
      setNotice('Calculo referencial listo. Inicia sesion para guardar y exportar tu simulacion.');
      return;
    }

    setIsLoading(true);

    try {
      const creditResult = await request<CreditDto>('/credits', {
        method: 'POST',
        body: JSON.stringify({
          name: selectedCredit.nombre,
          amount: amountValue,
          annualInterestRate: selectedCredit.interes,
          termMonths: termValue,
          amortizationType: method,
        }),
      });

      if (!creditResult.response.ok || !isCreditDto(creditResult.body)) {
        throw new Error(getApiMessage(creditResult.body, 'No pudimos guardar el credito.'));
      }

      const simulationResult = await request<SimulationDto>('/simulations', {
        method: 'POST',
        body: JSON.stringify({
          creditId: creditResult.body.id,
          amount: amountValue,
          annualInterestRate: selectedCredit.interes,
          termMonths: termValue,
          amortizationType: method,
        }),
      });

      if (!simulationResult.response.ok || !isSimulationDto(simulationResult.body)) {
        throw new Error(getApiMessage(simulationResult.body, 'No pudimos guardar la simulacion.'));
      }

      setResult({
        ...localResult,
        savedSimulationId: simulationResult.body.id,
      });
      setNotice('Simulacion guardada correctamente en tu historial.');
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'El calculo fue exitoso, pero no se pudo guardar.');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadPdf = () => {
    if (!result) return;

    exportSimulationPdf({
      title: 'Tabla de amortizacion',
      fileName: `simulacion_${selectedCredit.nombre}_${result.savedSimulationId ?? 'local'}`,
      productName: selectedCredit.nombre,
      amount: result.amount,
      annualInterestRate: selectedCredit.interes,
      termMonths: result.termMonths,
      amortizationType: method,
      totalInterest: result.totalInterest,
      totalPayment: result.totalPayment,
      schedule: result.schedule,
      insuranceMonthly: result.insuranceMonthly,
    });
  };

  return (
    <main className="page simulator-page">
      <section className="simulator-hero">
        <div>
          <span className="eyebrow">Simula tu credito</span>
          <h1>Calcula cuotas referenciales al instante.</h1>
          <p>
            Puedes simular sin iniciar sesion. Para guardar tu historial y exportar el PDF necesitas una cuenta.
          </p>
        </div>
        <div className="hero-metric">
          <span>Tasa seleccionada</span>
          <strong>{selectedCredit.interes.toFixed(2)}%</strong>
        </div>
      </section>

      <section className="simulator-toolbar">
        <Link to="/dashboard" className="text-link">
          Cambiar desde creditos
        </Link>
        <div>
          <span>{selectedCredit.nombre}</span>
          <strong>{selectedCredit.rango}</strong>
        </div>
      </section>

      <section className="simulator-layout">
        <form className="simulator-form" onSubmit={handleSimulation}>
          <div className="form-group">
            <label htmlFor="credit-type">Tipo de credito</label>
            <select id="credit-type" value={selectedCreditId} onChange={(event) => setSelectedCreditId(event.target.value)}>
              {CREDIT_OPTIONS.map((credit) => (
                <option key={credit.id} value={credit.id}>
                  {credit.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="amount">Cuanto dinero necesitas</label>
            <div className="money-input">
              <span>$</span>
              <input
                id="amount"
                type="number"
                min="300"
                step="50"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
            </div>
            <small>Minimo $300.00</small>
          </div>

          <div className="form-group">
            <label htmlFor="term">En cuanto tiempo quieres pagarlo</label>
            <select id="term" value={term} onChange={(event) => setTerm(event.target.value)}>
              <option value="12">12 meses</option>
              <option value="24">24 meses</option>
              <option value="36">36 meses</option>
              <option value="48">48 meses</option>
              <option value="60">60 meses</option>
              <option value="72">72 meses</option>
            </select>
          </div>

          <fieldset className="method-group">
            <legend>Metodo de amortizacion</legend>
            <button
              type="button"
              className={method === 'french' ? 'method-card is-selected' : 'method-card'}
              onClick={() => setMethod('french')}
            >
              <strong>Frances</strong>
              <span>Cuota fija mensual</span>
            </button>
            <button
              type="button"
              className={method === 'german' ? 'method-card is-selected' : 'method-card'}
              onClick={() => setMethod('german')}
            >
              <strong>Aleman</strong>
              <span>Capital fijo y cuotas decrecientes</span>
            </button>
          </fieldset>

          {error && <div className="alert alert-error">{error}</div>}
          {notice && <div className="alert alert-success">{notice}</div>}

          <button className="btn btn-primary btn-full" type="submit" disabled={isLoading}>
            {isLoading ? 'Guardando...' : 'Simular'}
          </button>
        </form>

        <aside className="result-panel">
          {!result ? (
            <div className="empty-state">
              <span>Resultado</span>
              <h2>Completa los datos para ver tu cuota.</h2>
              <p>El calculo se muestra aqui sin necesidad de iniciar sesion.</p>
            </div>
          ) : (
            <div className="result-content">
              <span className="eyebrow">{formatMethod(method)}</span>
              <h2>{method === 'german' ? 'Tu primera cuota sera' : 'Tu cuota mensual sera'}</h2>
              <strong className="payment-value">{formatMoney(result.firstPayment)}</strong>

              <div className="payment-breakdown">
                <div>
                  <span>Capital</span>
                  <strong>{formatMoney(result.firstPrincipal)}</strong>
                </div>
                <div>
                  <span>Interes</span>
                  <strong>{formatMoney(result.firstInterest)}</strong>
                </div>
                <div>
                  <span>Seguro</span>
                  <strong>{formatMoney(result.insuranceMonthly)}</strong>
                </div>
              </div>

              <dl className="summary-list">
                <div>
                  <dt>Capital solicitado</dt>
                  <dd>{formatMoney(result.amount)}</dd>
                </div>
                <div>
                  <dt>Total de interes</dt>
                  <dd>{formatMoney(result.totalInterest)}</dd>
                </div>
                <div>
                  <dt>Total seguro</dt>
                  <dd>{formatMoney(result.totalInsurance)}</dd>
                </div>
                <div>
                  <dt>Total a pagar</dt>
                  <dd>{formatMoney(result.totalPayment)}</dd>
                </div>
              </dl>

              {isAuthenticated ? (
                <button className="btn btn-danger btn-full" type="button" onClick={downloadPdf}>
                  Exportar a PDF
                </button>
              ) : (
                <div className="login-required">
                  Inicia sesion para guardar y exportar tu simulacion.
                </div>
              )}
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}

function buildSimulationResult(amount: number, annualRate: number, termMonths: number, method: 'french' | 'german'): SimulationResult {
  const schedule = calculateSchedule(amount, annualRate, termMonths, method);
  const firstRow = schedule[0];
  const totalInterest = roundMoney(schedule.reduce((sum, row) => sum + row.interest, 0));
  const totalInsurance = roundMoney(INSURANCE_MONTHLY * termMonths);
  const totalPayment = roundMoney(amount + totalInterest + totalInsurance);

  return {
    firstPayment: roundMoney(firstRow.payment + INSURANCE_MONTHLY),
    firstPrincipal: firstRow.principal,
    firstInterest: firstRow.interest,
    insuranceMonthly: INSURANCE_MONTHLY,
    amount,
    totalInterest,
    totalInsurance,
    totalPayment,
    termMonths,
    schedule,
  };
}

function calculateSchedule(amount: number, annualRate: number, termMonths: number, method: 'french' | 'german'): PdfInstallment[] {
  const monthlyRate = annualRate / 100 / 12;
  let balance = amount;
  const schedule: PdfInstallment[] = [];

  if (method === 'french') {
    const payment = monthlyRate === 0
      ? amount / termMonths
      : (amount * monthlyRate) / (1 - (1 + monthlyRate) ** -termMonths);

    for (let period = 1; period <= termMonths; period += 1) {
      const interest = balance * monthlyRate;
      const principal = period === termMonths ? balance : payment - interest;
      const actualPayment = principal + interest;
      balance -= principal;
      schedule.push(toInstallment(period, actualPayment, principal, interest, balance));
    }
  } else {
    const fixedPrincipal = amount / termMonths;

    for (let period = 1; period <= termMonths; period += 1) {
      const interest = balance * monthlyRate;
      const principal = period === termMonths ? balance : fixedPrincipal;
      const payment = principal + interest;
      balance -= principal;
      schedule.push(toInstallment(period, payment, principal, interest, balance));
    }
  }

  return schedule;
}

function toInstallment(period: number, payment: number, principal: number, interest: number, balance: number): PdfInstallment {
  return {
    period,
    payment: roundMoney(payment),
    principal: roundMoney(principal),
    interest: roundMoney(interest),
    balance: roundMoney(Math.max(balance, 0)),
  };
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function isCreditDto(body: unknown): body is CreditDto {
  return Boolean(body && typeof body === 'object' && 'id' in body && typeof (body as { id?: unknown }).id === 'string');
}

function isSimulationDto(body: unknown): body is SimulationDto {
  return Boolean(body && typeof body === 'object' && 'id' in body && Array.isArray((body as { schedule?: unknown }).schedule));
}
