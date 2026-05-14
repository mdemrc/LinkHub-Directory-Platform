import { useEffect, useRef, useCallback, useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';

interface CaptchaWidgetProps {
  onVerify: (token: string | null) => void;
}

declare global {
  interface Window {
    turnstile?: {
      render: (element: string | HTMLElement, options: Record<string, unknown>) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
    grecaptcha?: {
      render: (element: string | HTMLElement, options: Record<string, unknown>) => number;
      reset: (widgetId?: number) => void;
    };
    onRecaptchaLoad?: () => void;
  }
}

function loadScript(src: string, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.getElementById(id)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

export default function CaptchaWidget({ onVerify }: CaptchaWidgetProps) {
  const { settings } = useSettings();
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const provider = (settings.captcha_provider as string) || 'none';
  const siteKey = (settings.captcha_site_key as string) || '';
  const enabled = settings.captcha_enabled === 'true' || settings.captcha_enabled === true;

  const handleVerify = useCallback((token: string | null) => {
    onVerify(token);
  }, [onVerify]);

  useEffect(() => {
    if (!enabled || provider === 'none' || !siteKey || !containerRef.current) {
      onVerify(null);
      return;
    }

    let mounted = true;

    const initTurnstile = async () => {
      try {
        await loadScript('https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit', 'cf-turnstile-script');
        
        const waitForTurnstile = () => new Promise<void>((resolve) => {
          const check = () => {
            if (window.turnstile) resolve();
            else setTimeout(check, 100);
          };
          check();
        });
        await waitForTurnstile();

        if (!mounted || !containerRef.current) return;

        containerRef.current.innerHTML = '';
        const id = window.turnstile!.render(containerRef.current, {
          sitekey: siteKey,
          theme: 'dark',
          callback: (token: string) => { if (mounted) handleVerify(token); },
          'expired-callback': () => { if (mounted) handleVerify(null); },
          'error-callback': () => { if (mounted) setError('CAPTCHA failed to load'); },
        });
        widgetIdRef.current = id;
      } catch {
        if (mounted) setError('Failed to load CAPTCHA');
      }
    };

    const initRecaptcha = async () => {
      try {
        window.onRecaptchaLoad = () => {
          if (!mounted || !containerRef.current || !window.grecaptcha) return;
          containerRef.current.innerHTML = '';
          const id = window.grecaptcha.render(containerRef.current, {
            sitekey: siteKey,
            theme: 'dark',
            callback: (token: string) => { if (mounted) handleVerify(token); },
            'expired-callback': () => { if (mounted) handleVerify(null); },
            'error-callback': () => { if (mounted) setError('CAPTCHA failed to load'); },
          });
          widgetIdRef.current = id;
        };

        await loadScript('https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit', 'recaptcha-script');

        // If script was already loaded, trigger manually
        if (window.grecaptcha && containerRef.current) {
          window.onRecaptchaLoad();
        }
      } catch {
        if (mounted) setError('Failed to load CAPTCHA');
      }
    };

    if (provider === 'turnstile') initTurnstile();
    else if (provider === 'recaptcha_v2') initRecaptcha();

    return () => {
      mounted = false;
      if (provider === 'turnstile' && window.turnstile && typeof widgetIdRef.current === 'string') {
        try { window.turnstile.remove(widgetIdRef.current); } catch {}
      }
      widgetIdRef.current = null;
    };
  }, [provider, siteKey, enabled, handleVerify, onVerify]);

  if (!enabled || provider === 'none' || !siteKey) return null;

  return (
    <div>
      <div ref={containerRef} className="flex justify-center" />
      {error && <p className="text-red-400 text-sm mt-1 text-center">{error}</p>}
    </div>
  );
}
