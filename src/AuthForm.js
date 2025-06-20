import React, { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        window.location.href = '/dashboard'
      }
    }
    checkSession()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    setError('')

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
      else window.location.href = '/dashboard'
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else {
        setMessage('✅ Daftar berhasil. Silakan cek email untuk verifikasi akun sebelum login.')
        setIsLogin(true)
        setEmail('')
        setPassword('')
      }
    }
  }

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' })
    if (error) {
      setError('❌ Gagal login dengan Google: ' + error.message)
    }
  }

  const handleResetPassword = async () => {
    if (!email) {
      setError('Masukkan email terlebih dahulu untuk reset password.')
      return
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    if (error) setError(error.message)
    else setMessage('📧 Link reset password telah dikirim ke email kamu.')
  }

  return (
   <div
  className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat p-4"
  style={{ backgroundImage: "url('/bg-login.jpg')" }}
>


      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow w-80 animate-fade-in">
        <h1 className="text-center text-2xl font-bold text-purple-600 mb-2">👋 Welcome to Keuangan UMKM</h1>
        <div className="flex justify-center mb-4">
  <img
    src="/logo-team.png"
    alt="Logo UMKM"
    className="w-24 h-24 rounded-full object-cover shadow"
  />
</div>

        <h2 className="text-xl font-bold text-center text-purple-600 mb-4">
          {isLogin ? 'Login' : 'Daftar Akun'}
        </h2>

        {message && <p className="text-green-600 text-sm mb-2">{message}</p>}
        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

        <input
          type="email"
          placeholder="Email aktif"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-3 border px-3 py-2 rounded"
          required
        />
        <input
          type="password"
          placeholder="Password (min. 6 karakter)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-3 border px-3 py-2 rounded"
          required
        />
        <button
          type="submit"
          className="bg-purple-600 text-white w-full py-2 rounded hover:bg-purple-700"
        >
          {isLogin ? 'Login' : 'Daftar'}
        </button>

        {isLogin && (
          <button
            type="button"
            onClick={handleResetPassword}
            className="text-xs text-blue-600 underline mt-2"
          >
            Lupa kata sandi?
          </button>
        )}

        <button
          type="button"
          onClick={handleGoogleLogin}
          className="mt-4 bg-red-500 text-white py-2 w-full rounded hover:bg-red-600"
        >
          🔑 Login dengan Google
        </button>

        <p className="text-sm text-center mt-4">
          {isLogin ? 'Belum punya akun?' : 'Sudah punya akun?'}{' '}
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-600 underline"
          >
            {isLogin ? 'Daftar di sini' : 'Login di sini'}
          </button>
        </p>
      </form>
    </div>
  )
}
