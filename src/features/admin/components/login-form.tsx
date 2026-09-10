'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/core/adapters/supabase/browser'
import { Button } from '@/core/ui/button'

const emailSchema = z.string().email('Correo inválido')
const codeSchema = z.string().regex(/^\d{6}$/, 'El código son 6 dígitos')

export function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get('next') ?? '/admin'

  const [step, setStep] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function sendCode(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const parsed = emailSchema.safeParse(email.trim())
    if (!parsed.success) return setError(parsed.error.issues[0].message)

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email: parsed.data,
      options: { shouldCreateUser: false },
    })
    setLoading(false)
    if (error) return setError(error.message)
    setStep('code')
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const parsed = codeSchema.safeParse(code.trim())
    if (!parsed.success) return setError(parsed.error.issues[0].message)

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: parsed.data,
      type: 'email',
    })
    setLoading(false)
    if (error) return setError(error.message)
    router.replace(next)
    router.refresh()
  }

  return (
    <form onSubmit={step === 'email' ? sendCode : verify} className="space-y-4">
      {step === 'email' ? (
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Correo del equipo</span>
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2"
          />
        </label>
      ) : (
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Código enviado a {email}</span>
          <input
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            required
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            className="w-full rounded-md border border-input bg-background px-3 py-2 tracking-[0.5em]"
          />
        </label>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Un momento…' : step === 'email' ? 'Enviar código' : 'Entrar'}
      </Button>

      {step === 'code' && (
        <button
          type="button"
          onClick={() => {
            setStep('email')
            setCode('')
            setError(null)
          }}
          className="w-full text-center text-xs text-muted-foreground underline"
        >
          Usar otro correo
        </button>
      )}
    </form>
  )
}
