import React, { useState } from 'react';
import { Dumbbell, Mail, Lock, User, ArrowRight, AlertCircle } from 'lucide-react';
import { 
  loginWithGoogle, 
  loginWithApple, 
  loginWithEmail, 
  registerWithEmail 
} from '../services/firebaseAuth';

export default function AuthScreen() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegistering) {
        await registerWithEmail(name, email, password);
      } else {
        await loginWithEmail(email, password);
      }
    } catch (err) {
      setError('Verifique seu e-mail e senha (mínimo 6 caracteres).');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (providerFn) => {
    setError('');
    setLoading(true);
    try {
      await providerFn();
    } catch (err) {
      setError('Não foi possível conectar com a conta selecionada.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#000000' }}>
      <div style={{ width: '100%', maxWidth: '420px', backgroundColor: '#0b1118', minHeight: '100vh', padding: '32px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderLeft: '1px solid #141d26', borderRight: '1px solid #141d26' }}>
        
        {/* Identidade do App */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px', textAlign: 'center' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', backgroundColor: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px', boxShadow: '0 0 20px rgba(34, 197, 94, 0.2)' }}>
            <Dumbbell style={{ width: '28px', height: '28px', color: '#22c55e' }} />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#ffffff', letterSpacing: '1px', margin: 0 }}>FitFLOW</h1>
          <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
            {isRegistering ? 'Crie sua conta para salvar seus treinos' : 'Entre para acompanhar sua evolução'}
          </p>
        </div>

        {/* Botões Sociais (Google e Apple) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
          <button
            type="button"
            disabled={loading}
            onClick={() => handleSocialLogin(loginWithGoogle)}
            style={{ width: '100%', backgroundColor: '#ffffff', color: '#000000', fontWeight: '800', fontSize: '13px', padding: '12px', borderRadius: '12px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
          >
            <span>G</span>
            <span>Continuar com Google</span>
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => handleSocialLogin(loginWithApple)}
            style={{ width: '100%', backgroundColor: '#141d26', color: '#ffffff', fontWeight: '800', fontSize: '13px', padding: '12px', borderRadius: '12px', border: '1px solid #222f3e', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
          >
            <span></span>
            <span>Continuar com Apple</span>
          </button>
        </div>

        {/* Divisor */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#141d26' }} />
          <span style={{ fontSize: '10px', color: '#6b7280', fontWeight: 'bold', textTransform: 'uppercase' }}>ou com e-mail</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#141d26' }} />
        </div>

        {/* Alerta de Erro */}
        {error && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#f87171', padding: '10px', borderRadius: '10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <AlertCircle style={{ width: '16px', height: '16px', flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Formulário de E-mail */}
        <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {isRegistering && (
            <div style={{ position: 'relative' }}>
              <User style={{ width: '16px', height: '16px', color: '#6b7280', position: 'absolute', left: '12px', top: '13px' }} />
              <input
                type="text"
                placeholder="Seu nome"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ width: '100%', backgroundColor: '#141d26', border: '1px solid #222f3e', borderRadius: '12px', padding: '12px 12px 12px 38px', color: '#ffffff', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          )}

          <div style={{ position: 'relative' }}>
            <Mail style={{ width: '16px', height: '16px', color: '#6b7280', position: 'absolute', left: '12px', top: '13px' }} />
            <input
              type="email"
              placeholder="Seu e-mail"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', backgroundColor: '#141d26', border: '1px solid #222f3e', borderRadius: '12px', padding: '12px 12px 12px 38px', color: '#ffffff', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ position: 'relative' }}>
            <Lock style={{ width: '16px', height: '16px', color: '#6b7280', position: 'absolute', left: '12px', top: '13px' }} />
            <input
              type="password"
              placeholder="Sua senha"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', backgroundColor: '#141d26', border: '1px solid #222f3e', borderRadius: '12px', padding: '12px 12px 12px 38px', color: '#ffffff', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', backgroundColor: '#22c55e', color: '#000000', fontWeight: '900', fontSize: '13px', padding: '13px', borderRadius: '12px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '4px', boxShadow: '0 4px 14px rgba(34, 197, 94, 0.3)' }}
          >
            <span>{loading ? 'Aguarde...' : isRegistering ? 'CRIAR CONTA' : 'ENTRAR'}</span>
            <ArrowRight style={{ width: '16px', height: '16px' }} />
          </button>
        </form>

        {/* Alternar Entrar / Cadastrar */}
        <button
          type="button"
          onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
          style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '12px', marginTop: '20px', cursor: 'pointer' }}
        >
          {isRegistering ? 'Já tem uma conta? ' : 'Ainda não tem conta? '}
          <span style={{ color: '#22c55e', fontWeight: 'bold' }}>
            {isRegistering ? 'Entrar' : 'Cadastre-se'}
          </span>
        </button>

      </div>
    </div>
  );
}