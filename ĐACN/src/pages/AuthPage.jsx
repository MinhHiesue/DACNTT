import { useState } from 'react'
import { ArrowRight, BarChart3, LockKeyhole, Mail, UserRound } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { submitAuth } from '../data/authApi.js'

export function AuthPage({ mode, onAuthenticated }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const isRegister = mode === 'register'

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const session = await submitAuth(mode, isRegister ? { name, email, password } : { email, password })
      onAuthenticated(session)
      navigate(location.state?.from?.pathname || '/overview', { replace: true })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-grid-glow" />
      <section className="auth-card">
        <Link className="auth-brand" to="/login" aria-label="Northstar Market Intelligence">
          <span className="auth-brand-mark"><BarChart3 size={19} /></span>
          <span><strong>NORTHSTAR</strong><small>MARKET INTELLIGENCE</small></span>
        </Link>

        <div className="auth-heading">
          <span className="auth-eyebrow"><i /> WORKSPACE ACCESS</span>
          <h1>{isRegister ? 'Tạo tài khoản' : 'Chào mừng trở lại'}<span>.</span></h1>
          <p>{isRegister ? 'Đăng ký để bắt đầu sử dụng dashboard.' : 'Đăng nhập để tiếp tục vào workspace của bạn.'}</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {isRegister && <label className="auth-field">
            <span>Họ và tên</span>
            <span className="auth-input-wrap"><UserRound size={16} /><input autoComplete="name" required minLength={2} maxLength={80} value={name} onChange={(event) => setName(event.target.value)} placeholder="Tên hiển thị" /></span>
          </label>}
          <label className="auth-field">
            <span>Email</span>
            <span className="auth-input-wrap"><Mail size={16} /><input type="email" autoComplete="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="ban@example.com" /></span>
          </label>
          <label className="auth-field">
            <span>Mật khẩu</span>
            <span className="auth-input-wrap"><LockKeyhole size={16} /><input type="password" autoComplete={isRegister ? 'new-password' : 'current-password'} required minLength={isRegister ? 8 : undefined} maxLength={72} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={isRegister ? 'Ít nhất 8 ký tự' : 'Nhập mật khẩu'} /></span>
          </label>

          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="auth-submit" type="submit" disabled={submitting}>
            {submitting ? 'Đang xử lý...' : isRegister ? 'Tạo tài khoản' : 'Đăng nhập'}
            <ArrowRight size={16} />
          </button>
        </form>

        <p className="auth-switch">
          {isRegister ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}
          {' '}
          <Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'Đăng nhập' : 'Đăng ký'}</Link>
        </p>
        <div className="auth-foot"><span className="online-pulse" /> KẾT NỐI AN TOÀN <span>JWT AUTHENTICATION</span></div>
      </section>
      <p className="auth-disclaimer">DASHBOARD DEMO · KHÔNG PHẢI LỜI KHUYÊN ĐẦU TƯ</p>
    </main>
  )
}
