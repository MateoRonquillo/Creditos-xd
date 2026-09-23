import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getApiMessage, hasSession, request, saveSession, type AuthResponse } from '../api';

type AuthMode = 'login' | 'register';

type LocationState = {
  from?: { pathname?: string };
  registeredEmail?: string;
};

export default function Login() {
  const location = useLocation();
  const navigate = useNavigate();
  const initialMode: AuthMode = location.pathname === '/register' ? 'register' : 'login';
  const locationState = location.state as LocationState | null;

  const [name, setName] = useState('');
  const [email, setEmail] = useState(locationState?.registeredEmail ?? '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mode = initialMode;
  const isRegister = mode === 'register';
  const title = isRegister ? 'Crear cuenta' : 'Iniciar sesion';
  const subtitle = isRegister
    ? 'Registra tus datos para guardar simulaciones y descargarlas cuando lo necesites.'
    : 'Accede con una cuenta existente para continuar con tus simulaciones guardadas.';

  const nextRoute = useMemo(() => {
    if (locationState?.from?.pathname) return locationState.from.pathname;
    return '/dashboard';
  }, [locationState?.from?.pathname]);

  useEffect(() => {
    if (hasSession()) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError = validateForm(mode, { name, email, password });
    if (validationError) {
      setError(validationError);
      setMessage('');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setMessage(isRegister ? 'Creando tu cuenta...' : 'Validando tus credenciales...');

    try {
      if (isRegister) {
        const result = await request<AuthResponse>('/auth/register', {
          method: 'POST',
          body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
        });

        if (!result.response.ok) {
          throw new Error(getApiMessage(result.body, 'No pudimos crear la cuenta. Revisa los datos e intenta nuevamente.'));
        }

        setPassword('');
        setMessage('Cuenta creada correctamente. Ahora inicia sesion con tus credenciales.');
        navigate('/login', { replace: true, state: { registeredEmail: email.trim() } });
        return;
      }

      const result = await request<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), password }),
      });

      if (!result.response.ok || !isAuthResponse(result.body)) {
        throw new Error(getApiMessage(result.body, 'Correo o contrasena incorrectos.'));
      }

      saveSession(result.body);
      navigate(nextRoute, { replace: true });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'No se pudo completar la solicitud.');
      setMessage('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchMode = () => {
    setError('');
    setMessage('');
    navigate(isRegister ? '/login' : '/register');
  };

  return (
    <main className="auth-page">
      <section className="auth-visual" aria-label="Simulador de credito">
        <div className="auth-visual-content">
          <span className="eyebrow">Banca digital</span>
          <h1>Simula, compara y decide con claridad.</h1>
          <p>
            Calcula cuotas referenciales de credito y guarda tu historial cuando tengas una cuenta activa.
          </p>
        </div>
      </section>

      <section className="auth-panel">
        <Link to="/dashboard" className="auth-brand">
          <span className="brand-mark">BE</span>
          <span>Banco Estudiantil</span>
        </Link>

        <div className="auth-copy">
          <span className="eyebrow">{isRegister ? 'Registro seguro' : 'Acceso seguro'}</span>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          {isRegister && (
            <label>
              <span>Nombre completo</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Tu nombre"
                autoComplete="name"
              />
            </label>
          )}

          <label>
            <span>Correo electronico</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="tu@correo.com"
              autoComplete="email"
            />
          </label>

          <label>
            <span>Contrasena</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Minimo 6 caracteres"
              autoComplete={isRegister ? 'new-password' : 'current-password'}
            />
          </label>

          <button className="btn btn-primary btn-full" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Procesando...' : title}
          </button>
        </form>

        <button className="auth-switch" type="button" onClick={switchMode}>
          {isRegister ? 'Ya tengo cuenta, iniciar sesion' : 'No tengo cuenta, crear una'}
        </button>
      </section>
    </main>
  );
}

function validateForm(mode: AuthMode, values: { name: string; email: string; password: string }) {
  if (mode === 'register' && values.name.trim().length < 2) {
    return 'Ingresa tu nombre para crear la cuenta.';
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    return 'Ingresa un correo electronico valido.';
  }

  if (values.password.length < 6) {
    return 'La contrasena debe tener al menos 6 caracteres.';
  }

  return '';
}

function isAuthResponse(body: unknown): body is AuthResponse {
  return Boolean(
    body
    && typeof body === 'object'
    && 'token' in body
    && typeof (body as { token?: unknown }).token === 'string'
    && 'user' in body
    && typeof (body as { user?: unknown }).user === 'object',
  );
}
