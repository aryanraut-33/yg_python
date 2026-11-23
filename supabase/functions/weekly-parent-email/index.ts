// Tinkora · Weekly Parent Progress Email Edge Function
// Queries parents who have opted into weekly progress emails, compiles concepts
// learned and projects worked on by each child in the last 7 days, and dispatches
// a beautifully formatted email via the Brevo Transactional Email API.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY') || '';
const SENDER_EMAIL = Deno.env.get('BREVO_SENDER_EMAIL') || 'hello@tinkora.com';
const SENDER_NAME = 'Tinkora';
const APP_URL = Deno.env.get('APP_URL') || 'https://tinkora.com';

interface ChildSummary {
  firstName: string;
  concepts: string[];
  projectsWorked: string[];
}

function renderEmailHtml(parentEmail: string, children: ChildSummary[]): string {
  const childSections = children
    .map((c) => {
      const conceptsList =
        c.concepts.length > 0
          ? c.concepts
              .map(
                (concept) =>
                  `<span style="display:inline-block; margin:2px 4px 2px 0; padding:4px 8px; border:1px solid #26403A; background:#12241F; font-family:Courier,monospace; font-size:12px; color:#7BE0C3;">${concept}</span>`,
              )
              .join(' ')
          : `<span style="color:#A9B8B0; font-size:14px; font-style:italic;">No new concepts this week · reviewing the basics</span>`;

      const projectsText =
        c.projectsWorked.length > 0
          ? `<p style="margin:8px 0; font-size:14px; color:#F5ECDC;">Worked on: <strong>${c.projectsWorked.join(', ')}</strong></p>`
          : `<p style="margin:8px 0; font-size:14px; color:#A9B8B0;">Taking a breather this week.</p>`;

      const promptTopic = c.concepts[0] || 'their code';
      const conversationPrompt = `Ask ${c.firstName} how ${promptTopic} helped bring their project to life this week!`;

      return `
      <div style="border:1px solid #26403A; background:#162A26; padding:20px; margin-bottom:20px;">
        <h3 style="margin:0 0 8px; font-family:Georgia,serif; font-size:24px; color:#FFD66B;">${c.firstName}'s Week in Code</h3>
        ${projectsText}
        <div style="margin:12px 0 16px;">
          <p style="margin:0 0 6px; font-family:Courier,monospace; font-size:11px; text-transform:uppercase; letter-spacing:0.08em; color:#A9B8B0;">[ New Concepts Mastered ]</p>
          ${conceptsList}
        </div>
        <div style="border-left:3px solid #FF8A65; padding:8px 14px; background:#0F1F1C;">
          <p style="margin:0; font-size:13px; line-height:1.5; color:#F5ECDC;">
            <strong style="color:#FF8A65;">Conversation starter:</strong> ${conversationPrompt}
          </p>
        </div>
      </div>
      `;
    })
    .join('');

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>This week on Tinkora</title>
  </head>
  <body style="margin:0; padding:30px 15px; background:#0B1714; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,sans-serif; color:#F5ECDC;">
    <div style="max-width:560px; margin:0 auto; background:#0F1F1C; border:1px solid #26403A; padding:32px 28px;">
      <div style="border-bottom:1px solid #26403A; padding-bottom:16px; margin-bottom:24px;">
        <span style="font-family:Courier,monospace; font-size:11px; letter-spacing:0.12em; color:#7BE0C3; text-transform:uppercase;">[ Tinkora Family Progress ]</span>
        <h1 style="margin:8px 0 0; font-family:Georgia,serif; font-size:32px; font-weight:normal; color:#F5ECDC;">What your family built this week</h1>
      </div>
      <p style="font-size:15px; line-height:1.6; color:#A9B8B0; margin-bottom:24px;">
        Here is your quick summary of what your children learned on Tinkora over the past 7 days.
      </p>
      ${childSections}
      <div style="text-align:center; margin:32px 0 20px;">
        <a href="${APP_URL}/family" style="display:inline-block; padding:12px 24px; background:#FFD66B; color:#0F1F1C; font-weight:600; font-size:14px; text-decoration:none; border:0;">
          Open Family Dashboard &rarr;
        </a>
      </div>
      <div style="border-top:1px dashed #26403A; padding-top:18px; margin-top:32px; font-size:12px; line-height:1.5; color:#6F857C;">
        <p style="margin:0 0 6px;">You are receiving this because you agreed to weekly updates for ${parentEmail}.</p>
        <p style="margin:0;">To change your preferences, manage your family settings at <a href="${APP_URL}/family" style="color:#A9B8B0;">tinkora.com/family</a>.</p>
      </div>
    </div>
  </body>
  </html>
  `;
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !BREVO_API_KEY) {
    return new Response(JSON.stringify({ error: 'Missing environment configuration' }), { status: 500 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();

  // 1. Fetch parents who want weekly emails
  const { data: parents, error: pErr } = await supabase
    .from('parents')
    .select('id, weekly_email')
    .eq('weekly_email', true);

  if (pErr) {
    return new Response(JSON.stringify({ error: pErr.message }), { status: 500 });
  }

  let sentCount = 0;
  const errors: unknown[] = [];

  for (const parent of parents || []) {
    // Get parent email from auth.users
    const { data: userData, error: uErr } = await supabase.auth.admin.getUserById(parent.id);
    if (uErr || !userData.user?.email) continue;
    const parentEmail = userData.user.email;

    // Get children
    const { data: children, error: cErr } = await supabase
      .from('children')
      .select('id, first_name')
      .eq('parent_id', parent.id);

    if (cErr || !children || children.length === 0) continue;

    const childSummaries: ChildSummary[] = [];

    for (const child of children) {
      // Concepts learned in the past 7 days
      const { data: concepts } = await supabase
        .from('concepts_learned')
        .select('concept, project')
        .eq('child_id', child.id)
        .gte('learned_at', weekAgo);

      // Projects with progress updated in the past 7 days
      const { data: progress } = await supabase
        .from('progress')
        .select('key')
        .eq('child_id', child.id)
        .gte('updated_at', weekAgo);

      const uniqueConcepts = [...new Set((concepts || []).map((c) => c.concept))];
      const uniqueProjects = [...new Set((progress || []).map((p) => p.key).filter((k) => k !== 'onboarding'))];

      childSummaries.push({
        firstName: child.first_name,
        concepts: uniqueConcepts,
        projectsWorked: uniqueProjects,
      });
    }

    const html = renderEmailHtml(parentEmail, childSummaries);

    // Send email via Brevo API
    try {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          'api-key': BREVO_API_KEY,
        },
        body: JSON.stringify({
          sender: { name: SENDER_NAME, email: SENDER_EMAIL },
          to: [{ email: parentEmail }],
          subject: 'This week on Tinkora: What your family built',
          htmlContent: html,
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        errors.push({ parent: parentEmail, status: res.status, body });
      } else {
        sentCount++;
      }
    } catch (err) {
      errors.push({ parent: parentEmail, error: String(err) });
    }
  }

  return new Response(JSON.stringify({ success: true, sent: sentCount, errors }), {
    headers: { 'content-type': 'application/json' },
  });
});
