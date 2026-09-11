import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { SiteHeader } from '@/features/marketing/components/site-header'
import { SiteFooter } from '@/features/marketing/components/site-footer'
import { WhatsAppFloat } from '@/features/marketing/components/whatsapp-float'
import { CookieConsent } from '@/features/marketing/components/cookie-consent'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <NuqsAdapter>
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <WhatsAppFloat />
      </div>
      <CookieConsent />
    </NuqsAdapter>
  )
}
