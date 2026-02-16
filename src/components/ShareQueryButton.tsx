import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Share2, Check } from 'lucide-react'

export default function ShareQueryButton() {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers / non-HTTPS contexts
      const input = document.createElement('input')
      input.value = window.location.href
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <button
      onClick={copyToClipboard}
      className="btn btn-secondary px-4 py-2 text-sm"
      title={t('reactions.copyShareLinkTitle')}
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 mr-2 inline" />
          {t('reactions.linkCopied')}
        </>
      ) : (
        <>
          <Share2 className="w-4 h-4 mr-2 inline" />
          {t('reactions.copyShareLink')}
        </>
      )}
    </button>
  )
}
