'use client'

import { useState } from 'react'
import { FaPaperPlane } from 'react-icons/fa'
import RichTextEditor from './RichTextEditor'

export default function CustomEmailPanel() {
  const [customEmailTo, setCustomEmailTo] = useState('')
  const [customEmailSubject, setCustomEmailSubject] = useState('')
  const [customEmailMessage, setCustomEmailMessage] = useState('')
  const [customEmailSending, setCustomEmailSending] = useState(false)
  const [customEmailResult, setCustomEmailResult] = useState('')

  const handleCustomEmailSend = async (e: React.FormEvent) => {
    e.preventDefault()
    setCustomEmailSending(true)
    setCustomEmailResult('')

    try {
      const response = await fetch('/api/admin/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: customEmailTo,
          subject: customEmailSubject,
          message: customEmailMessage,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setCustomEmailResult('✅ ' + data.message)
        // Formu temizle
        setCustomEmailTo('')
        setCustomEmailSubject('')
        setCustomEmailMessage('')
      } else {
        setCustomEmailResult('❌ ' + (data.error || 'Gönderim başarısız'))
      }
    } catch (error) {
      setCustomEmailResult('❌ Bir hata oluştu')
    } finally {
      setCustomEmailSending(false)
    }
  }

  return (
    <div>
      <div className="bg-dark-card border border-gray-800 rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <FaPaperPlane className="w-5 h-5 text-blue-400" />
          <h2 className="text-xl font-bold text-white">Özel E-posta Gönder</h2>
        </div>

        <form onSubmit={handleCustomEmailSend} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Alıcı E-posta Adresi
            </label>
            <input
              type="email"
              value={customEmailTo}
              onChange={(e) => setCustomEmailTo(e.target.value)}
              placeholder="recipient@example.com"
              className="w-full px-4 py-3 bg-dark-bg border border-gray-700 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Konu
            </label>
            <input
              type="text"
              value={customEmailSubject}
              onChange={(e) => setCustomEmailSubject(e.target.value)}
              placeholder="E-posta konusu"
              className="w-full px-4 py-3 bg-dark-bg border border-gray-700 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Mesaj
            </label>
            <RichTextEditor
              value={customEmailMessage}
              onChange={setCustomEmailMessage}
              placeholder="E-posta mesajınızı buraya yazın..."
              minHeight={300}
            />
          </div>

          {customEmailResult && (
            <div className={`px-4 py-3 rounded-xl text-sm ${
              customEmailResult.includes('✅') 
                ? 'bg-green-500/10 border border-green-500/50 text-green-400'
                : 'bg-red-500/10 border border-red-500/50 text-red-400'
            }`}>
              {customEmailResult}
            </div>
          )}

          <button
            type="submit"
            disabled={customEmailSending}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium py-3 rounded-xl transition-all disabled:opacity-50"
          >
            <FaPaperPlane className="w-4 h-4" />
            <span>{customEmailSending ? 'Gönderiliyor...' : 'E-postayı Gönder'}</span>
          </button>

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
            <p className="text-sm text-blue-400">
              ℹ️ Bu form ile istediğiniz kişiye doğrudan e-posta gönderebilirsiniz. 
              E-posta, ayarlardan belirlediğiniz SMTP sunucusu ve imza ile gönderilecektir.
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
