import { useEffect, useRef } from 'react'
import { useSettings } from '../contexts/SettingsContext'

export default function LiveChatWidget() {
  const { settings } = useSettings()
  const injectedRef = useRef(false)

  useEffect(() => {
    const enabled = settings.livechat_enabled
    const provider = settings.livechat_provider as string
    const propertyId = settings.livechat_property_id as string
    const baseUrl = settings.livechat_base_url as string
    const embedCode = settings.livechat_embed_code as string

    if (!enabled || !provider || provider === 'none') {
      return
    }

    if (injectedRef.current) return
    injectedRef.current = true

    if (provider === 'tawkto' && propertyId) {
      injectTawkTo(propertyId)
    } else if (provider === 'crisp' && propertyId) {
      injectCrisp(propertyId)
    } else if (provider === 'chatwoot' && propertyId && baseUrl) {
      injectChatwoot(baseUrl, propertyId)
    } else if (provider === 'custom' && embedCode) {
      injectCustom(embedCode)
    }

    return () => {
      injectedRef.current = false
    }
  }, [settings.livechat_enabled, settings.livechat_provider, settings.livechat_property_id, settings.livechat_base_url, settings.livechat_embed_code])

  return null
}

function injectTawkTo(propertyId: string) {
  const script = document.createElement('script')
  script.async = true
  script.src = `https://embed.tawk.to/${propertyId}/default`
  script.charset = 'UTF-8'
  script.setAttribute('crossorigin', '*')
  script.setAttribute('data-livechat', 'true')
  document.head.appendChild(script)
}

function injectCrisp(websiteId: string) {
  ;(window as any).$crisp = []
  ;(window as any).CRISP_WEBSITE_ID = websiteId
  const script = document.createElement('script')
  script.src = 'https://client.crisp.chat/l.js'
  script.async = true
  script.setAttribute('data-livechat', 'true')
  document.head.appendChild(script)
}

function injectChatwoot(baseUrl: string, websiteToken: string) {
  ;(window as any).chatwootSettings = {
    hideMessageBubble: false,
    position: 'right',
    locale: 'en',
    type: 'standard',
  }
  const normalized = baseUrl.replace(/\/+$/, '')
  const script = document.createElement('script')
  script.src = `${normalized}/packs/js/sdk.js`
  script.async = true
  script.setAttribute('data-livechat', 'true')
  script.onload = () => {
    ;(window as any).chatwootSDK?.run({
      websiteToken,
      baseUrl: normalized,
    })
  }
  document.head.appendChild(script)
}

function injectCustom(embedCode: string) {
  const container = document.createElement('div')
  container.setAttribute('data-livechat', 'true')
  container.innerHTML = embedCode

  // Extract and re-create script tags so they execute
  const scripts = container.querySelectorAll('script')
  scripts.forEach((oldScript) => {
    const newScript = document.createElement('script')
    Array.from(oldScript.attributes).forEach((attr) => {
      newScript.setAttribute(attr.name, attr.value)
    })
    if (oldScript.textContent) {
      newScript.textContent = oldScript.textContent
    }
    newScript.setAttribute('data-livechat', 'true')
    oldScript.remove()
    document.head.appendChild(newScript)
  })

  // Append remaining non-script elements if any
  if (container.childNodes.length > 0) {
    document.body.appendChild(container)
  }
}
