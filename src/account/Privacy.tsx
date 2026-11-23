// /privacy: plain-language privacy notice and terms. DRAFT until the legal review planned before
// payments (Phase 4). Keep this in step with what the code and the database actually do.
import { SiteNav } from '../ui/SiteNav';
import { POLICY_VERSION } from './family';
import './account.css';

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: 'Who we are',
    body: [
      'Tinkora is a website where children aged 10 to 14 learn Python by building projects. This notice explains what we keep about your family, why, and how you stay in control.',
    ],
  },
  {
    title: 'What we keep',
    body: [
      "Your email address, to sign you in and, if you choose, to send a weekly progress email.",
      "Your child's first name and year of birth. Never a surname, photo, school or address.",
      "Your child's code and progress, so they can carry on where they stopped.",
      'What happens while they code: runs, errors, hints and finished steps. We use this only to find confusing lessons and fix them.',
      'A record of your consent: what you agreed to, when, and which version of this notice.',
    ],
  },
  {
    title: "What we don't do",
    body: [
      'No ads, ever. We never sell or rent data.',
      'No third-party trackers or analytics tools. Usage events go into our own database only.',
      "Your child's Python runs inside your own browser. Their code is never run on our servers.",
      "Children can't message other people, and nobody can contact your child through Tinkora.",
      'Camera projects (coming later) keep video on your device. It is never uploaded or stored.',
    ],
  },
  {
    title: 'Where it lives and who can see it',
    body: [
      'Data is stored with our database provider, Supabase, in Mumbai, India.',
      "Only you can see your family's data, through your own sign-in. Our database rules block every other family, and we test that they do.",
      'A small number of people who run Tinkora can access the database to fix problems. They never use it for anything else.',
    ],
  },
  {
    title: 'How long we keep it',
    body: [
      'We keep your data while your account is open. When you delete your account, everything is deleted straight away.',
    ],
  },
  {
    title: 'Your choices and rights',
    body: [
      'Download everything we hold about your family, any time, from the Family page.',
      "Correct your child's details, or remove a child's profile, from the Family page.",
      'Turn the weekly email on or off from the Family page.',
      'Withdraw your consent by deleting your account. Everything is erased.',
      'Questions or complaints go to our grievance contact. Their email address will be listed here before launch.',
    ],
  },
  {
    title: 'Terms of use, in short',
    body: [
      'A parent or legal guardian aged 18 or over creates the account and is responsible for how it is used.',
      "Your child's projects are theirs. We only keep and show them so your child can use them.",
      'Be kind and safe: no personal details (phone numbers, addresses, school names) in project titles or text.',
      'Tinkora is free during the beta. If that ever changes, we will tell you first, and nothing your child built will be locked away.',
      'We may update this notice. If we do, we will ask you to agree again before your child continues.',
    ],
  },
];

export function Privacy() {
  return (
    <div className="acct-page">
      <SiteNav onHome={false} />
      <main className="acct privacy">
        <p className="label">[ Privacy notice and terms · version {POLICY_VERSION} ]</p>
        <h1 className="acct-title">Your family's data, in plain words</h1>
        <p className="privacy-draft">Draft: this notice will be reviewed by a lawyer before Tinkora starts charging.</p>
        {SECTIONS.map((s, i) => (
          <section key={s.title} className="privacy-section">
            <h2 className="privacy-h">
              <span className="privacy-no">{String(i + 1).padStart(2, '0')}</span> {s.title}
            </h2>
            <ul>
              {s.body.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </section>
        ))}
      </main>
    </div>
  );
}
