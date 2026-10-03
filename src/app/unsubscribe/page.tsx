import { isValidUnsubscribeToken } from '@/lib/unsubscribe'
import UnsubscribeForm from './UnsubscribeForm'

export const dynamic = 'force-dynamic'

// GET ile abonelik silinmez: e-posta güvenlik tarayıcıları linkleri otomatik açtığında
// kişi yanlışlıkla listeden çıkmasın diye onay butonu gösterilir.
export default function UnsubscribePage({ searchParams }: { searchParams: { e?: string; t?: string } }) {
  const email = searchParams.e || ''
  const token = searchParams.t || ''
  const valid = !!email && isValidUnsubscribeToken(email, token)

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-dark-bg">
      <div className="w-full max-w-md bg-dark-card border border-gray-800 rounded-2xl p-8 text-center">
        <h1 className="text-2xl font-bold text-white mb-3">Abonelikten Çık</h1>
        {valid ? (
          <UnsubscribeForm email={email} token={token} />
        ) : (
          <p className="text-gray-400">Bu link geçersiz veya süresi dolmuş.</p>
        )}
        <a href="/" className="inline-block mt-6 text-sm text-purple-400 hover:text-purple-300">
          Ana sayfaya dön
        </a>
      </div>
    </main>
  )
}
