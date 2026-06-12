import type { Metadata } from 'next';
import { LegalTitle, LegalSection } from '../LegalDoc';

export const metadata: Metadata = {
  title: 'Privacy Policy — Avanor',
  description: 'Privacy Policy for Avanor, the non-custodial neobank on Solana.',
};

export default function PrivacyPage() {
  return (
    <>
      <LegalTitle updated="June 12, 2026">Privacy Policy</LegalTitle>

      <LegalSection title="1. Overview">
        <p>
          This Privacy Policy explains what information Avanor (&quot;we&quot;, &quot;us&quot;)
          collects when you use the Service, how we use it, and the choices you have. We collect
          the minimum we need to operate a non-custodial financial interface — we do not sell
          your personal information.
        </p>
      </LegalSection>

      <LegalSection title="2. Information We Collect">
        <p>
          <strong className="text-white/70">Account information.</strong> When you sign in via
          Privy (Google or GitHub), we receive a unique identifier and, where provided, your
          email address. We do not receive your social-account passwords.
        </p>
        <p>
          <strong className="text-white/70">Wallet and on-chain data.</strong> Your wallet&apos;s
          public key and on-chain activity (balances, transactions, protocol positions) are
          inherently public on the Solana blockchain. We index this public data to display it
          to you.
        </p>
        <p>
          <strong className="text-white/70">Usage and technical data.</strong> We collect
          aggregated, privacy-preserving usage analytics (page views, feature usage) and error
          reports (stack traces, browser/OS metadata) to keep the Service reliable. IP addresses
          are processed transiently for rate limiting and abuse prevention.
        </p>
        <p>
          <strong className="text-white/70">What we never collect.</strong> We never have access
          to your private keys, seed phrases, or wallet signing material. These remain within
          Privy&apos;s embedded wallet infrastructure under your control.
        </p>
      </LegalSection>

      <LegalSection title="3. How We Use Information">
        <p>
          We use the information above to operate and secure the Service, display your balances
          and history, prevent abuse and fraud, debug errors, understand aggregate product usage,
          and comply with legal obligations. We do not use your data for third-party advertising.
        </p>
      </LegalSection>

      <LegalSection title="4. Third-Party Processors">
        <p>
          We rely on a small set of infrastructure providers, each of which processes data under
          its own privacy policy: Privy (authentication, embedded wallets), Vercel (hosting,
          analytics), Railway (backend hosting), Helius (Solana RPC), and Sentry (error
          monitoring). On-chain interactions are processed by the public Solana network and are
          outside any party&apos;s control.
        </p>
      </LegalSection>

      <LegalSection title="5. Data Retention and Security">
        <p>
          Account records are retained while your account is active. We apply industry-standard
          safeguards — encrypted transport (TLS), encryption of sensitive material at rest,
          access controls, and server-side verification of authentication tokens. No system is
          perfectly secure; we cannot guarantee absolute security of information transmitted to
          the Service.
        </p>
      </LegalSection>

      <LegalSection title="6. Your Rights">
        <p>
          Depending on your jurisdiction, you may have rights to access, correct, export, or
          delete your personal information. Note that data recorded on the Solana blockchain is
          public and immutable by design — neither we nor anyone else can delete it. To exercise
          your rights over the data we hold, contact the team via the support channels listed in
          the app.
        </p>
      </LegalSection>

      <LegalSection title="7. Children">
        <p>
          The Service is not directed at, and may not be used by, anyone under 18 years of age.
        </p>
      </LegalSection>

      <LegalSection title="8. Changes to This Policy">
        <p>
          We may update this Policy from time to time. Material changes will be reflected by the
          &quot;Last updated&quot; date above and, where appropriate, an in-app notice.
        </p>
      </LegalSection>
    </>
  );
}
