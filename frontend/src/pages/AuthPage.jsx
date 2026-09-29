import { validatePassword, PASSWORD_HINT } from '../utils/validators';
import { useState } from 'react';
import { Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import {
  ArrowUpRight,
  ArrowLeft,
  ShieldCheck,
  Eye,
  EyeOff
} from 'lucide-react';
import Brand from '../components/layout/Brand';
import { CoinMark } from '../components/layout/Brand';
import {
  Input,
  Select,
  Button,
  Checkbox,
  IconButton
} from '../components/common/UI';
import useAuth from '../hooks/useAuth';
import authApi from '../api/authApi';
import Hologram from '../components/illustrations/Hologram';
import { motion } from 'framer-motion';
import { GradientText } from '../components/ui/Nova';
import { EASE_OUT } from '../motion/variants';
const texts = {
  login: {
    title: 'Back to your flow.',
    sub: 'A clearer picture of your money starts right here.',
    button: 'Sign in to your workspace'
  },
  register: {
    title: 'Your next chapter.',
    sub: 'Make space for better money habits — starting today.',
    button: 'Create your account'
  },
  forgot: {
    title: 'Let’s get you back.',
    sub: 'Enter your email and we’ll send a password reset link.',
    button: 'Send reset link'
  },
  reset: {
    title: 'A fresh start.',
    sub: 'Choose a strong new password for your account.',
    button: 'Reset password'
  }
};
export default function AuthPage({ mode }) {
  const { login, expired } = useAuth();
  const navigate = useNavigate(),
    location = useLocation(),
    { token } = useParams();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [success, setSuccess] = useState(''),
    [visible, setVisible] = useState(false),
    [resetLink, setResetLink] = useState('');
  const t = texts[mode];
  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const data = Object.fromEntries(new FormData(e.currentTarget));
    if (
      ['register', 'reset'].includes(mode) &&
      !validatePassword(data.password)
    ) {
      setError(PASSWORD_HINT);
      return;
    }
    if (mode === 'register' && !String(data.name || '').trim()) {
      setError('First name is required.');
      return;
    }
    if (data.confirmPassword && data.confirmPassword !== data.password) {
      setError('Your passwords do not match.');
      return;
    }
    delete data.confirmPassword;
    delete data.agree;
    setBusy(true);
    try {
      if (mode === 'login') {
        await login(data);
        const from = location.state?.from;
        navigate(
          typeof from === 'string' &&
            from.startsWith('/') &&
            !from.startsWith('//')
            ? from
            : '/dashboard',
          { replace: true }
        );
      } else if (mode === 'register') {
        data.monthlyAllowance = Number(data.monthlyAllowance || 0);
        const d = await authApi.register(data);
        setSuccess(
          d.message || 'Your account was created. You can sign in now.'
        );
      } else if (mode === 'forgot') {
        const d = await authApi.forgot(data);
        if (d.reset_token)
          setResetLink('/reset-password/' + encodeURIComponent(d.reset_token));
        setSuccess(
          'If an account exists for that email, a password reset link will be sent.'
        );
      } else {
        await authApi.reset(token, { password: data.password });
        setSuccess('Your password has been reset. You can now sign in.');
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="auth-layout" id="main">
      <section className="auth-story">
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'url(/visuals/auth-aurora.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.42,
            maskImage: 'radial-gradient(ellipse 90% 75% at 55% 40%, black 30%, transparent 85%)',
            WebkitMaskImage:
              'radial-gradient(ellipse 90% 75% at 55% 40%, black 30%, transparent 85%)'
          }}
        />
        <Brand />
        <motion.div
          initial={{ y: 24, filter: 'blur(8px)' }}
          animate={{ y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.7, ease: EASE_OUT }}
          style={{ position: 'relative' }}
        >
          <span className="pill nova-holo">
            <span className="status-dot" /> YOUR MONEY. YOUR MOMENTUM.
          </span>
          <h1 className="nova-hero-title" style={{ fontSize: 'clamp(2.3rem, 4.5vw, 3.6rem)' }}>
            Make room
            <br />
            for <GradientText>more.</GradientText>
          </h1>
          <p>
            For late-night ideas. For your next adventure.
            <br />
            For the life you’re building.
          </p>
        </motion.div>
        <div className="auth-art">
          <Hologram />
        </div>
        <small>
          <ShieldCheck size={16} /> A more intentional relationship with your
          money.
        </small>
      </section>
      <section className="auth-content">
        <Link to="/" className="text-button neutral">
          <ArrowLeft size={16} /> Back to home
        </Link>
        <motion.div initial={{y:22}} animate={{y:0}} transition={{duration:0.55,delay:0.12,ease:EASE_OUT}} className="auth-form-wrap">
          <div className="row" style={{ gap: 9, marginBottom: 6 }}>
            <CoinMark size={30} />
            <p className="eyebrow" style={{ margin: 0 }}>
              WELCOME TO CAMPUSCOIN
            </p>
          </div>
          <h2>{t.title}</h2>
          <p className="muted">{t.sub}</p>
          {expired && mode === 'login' && (
            <p className="inline-alert warning">
              Your session expired. Please sign in to continue.
            </p>
          )}
          {success ? (
            <div className="success-box" role="status">
              <h3>You’re all set.</h3>
              <p>{success}</p>
              {resetLink && (
                <p>
                  <Link to={resetLink}>
                    Development only: open password reset link
                  </Link>
                </p>
              )}
              <Link to="/login" className="button primary">
                Back to sign in <ArrowUpRight size={16} />
              </Link>
            </div>
          ) : (
            <form onSubmit={submit} className="auth-form">
              {mode === 'register' && (
                <Input
                  label="Full name"
                  name="name"
                  autoComplete="name"
                  required
                  maxLength={100}
                />
              )}
              {mode !== 'reset' && (
                <Input
                  label="Email address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@university.edu"
                  required
                />
              )}
              {['login', 'register', 'reset'].includes(mode) && (
                <div className="password-wrap">
                  <Input
                    label="Password"
                    name="password"
                    type={visible ? 'text' : 'password'}
                    minLength={mode === 'login' ? 1 : 8}
                    required
                    autoComplete={
                      mode === 'login' ? 'current-password' : 'new-password'
                    }
                    placeholder={
                      mode === 'login'
                        ? 'Your password'
                        : '8+ characters, upper/lowercase and a number'
                    }
                  />
                  <IconButton
                    label={visible ? 'Hide password' : 'Show password'}
                    type="button"
                    onClick={() => setVisible(!visible)}
                  >
                    {visible ? <EyeOff size={17} /> : <Eye size={17} />}
                  </IconButton>
                </div>
              )}
              {['register', 'reset'].includes(mode) && (
                <Input
                  label="Confirm password"
                  type={visible ? 'text' : 'password'}
                  name="confirmPassword"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              )}
              {mode === 'register' && (
                <>
                  <div className="form-grid">
                    <Select label="Academic year" name="academicYear">
                      <option value="">Choose your year (optional)</option>
                      {['1', '2', '3', '4', '5', 'postgraduate'].map((v) => (
                        <option value={v} key={v}>
                          {v === 'postgraduate' ? 'Postgraduate' : 'Year ' + v}
                        </option>
                      ))}
                    </Select>
                    <Input
                      label="Monthly allowance (PKR)"
                      name="monthlyAllowance"
                      type="number"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <Checkbox
                    name="agree"
                    required
                    label="I understand CampusCoin tracks finances and does not provide banking or financial advice."
                  />
                </>
              )}
              {mode === 'login' && (
                <div className="row between small-text">
                  <span className="muted">Secure session sign-in</span>
                  <Link className="text-button" to="/forgot-password">
                    Forgot password?
                  </Link>
                </div>
              )}
              {error && (
                <p className="inline-alert" role="alert">
                  {error}
                </p>
              )}
              <Button type="submit" loading={busy} className="full-width">
                {t.button}
                <ArrowUpRight size={17} />
              </Button>
            </form>
          )}
          <p className="auth-switch">
            {mode === 'login' ? (
              <>
                New to CampusCoin?{' '}
                <Link to="/register">Make your first move ↗</Link>
              </>
            ) : (
              <>
                Already have an account? <Link to="/login">Sign in ↗</Link>
              </>
            )}
          </p>
        </motion.div>
        <small className="muted">
          Built for campus life. Designed for your future.
        </small>
      </section>
    </main>
  );
}
