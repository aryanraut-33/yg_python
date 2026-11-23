#!/usr/bin/env python3
"""Tinkora · Weekly Parent Progress Email Generator & Dispatcher.

Usage:
  # 1. Preview the generated email template without sending:
  python3 scripts/send-weekly-email.py --preview

  # 2. Dispatch real weekly emails using Brevo:
  python3 scripts/send-weekly-email.py --send

Environment variables (or interactive prompt):
  BREVO_API_KEY: Brevo API v3 key (xkeysib-...)
  BREVO_SENDER: Verified sender email in Brevo
"""
import argparse
import getpass
import json
import os
import sys
import urllib.request
import urllib.error

APP_URL = "http://localhost:5173"


def render_email(parent_email: str, children: list) -> str:
    sections = []
    for c in children:
        concepts = c.get("concepts", [])
        projects = c.get("projects", [])

        if concepts:
            c_badges = " ".join(
                f'<span style="display:inline-block; margin:2px 4px 2px 0; padding:4px 8px; border:1px solid #26403A; background:#12241F; font-family:Courier,monospace; font-size:12px; color:#7BE0C3;">{cpt}</span>'
                for cpt in concepts
            )
        else:
            c_badges = '<span style="color:#A9B8B0; font-size:14px; font-style:italic;">No new concepts this week · reviewing the basics</span>'

        if projects:
            proj_str = ", ".join(projects)
            p_text = f'<p style="margin:8px 0; font-size:14px; color:#F5ECDC;">Worked on: <strong>{proj_str}</strong></p>'
        else:
            p_text = '<p style="margin:8px 0; font-size:14px; color:#A9B8B0;">Taking a breather this week.</p>'

        topic = concepts[0] if concepts else "their code"
        conversation_prompt = f"Ask {c['firstName']} how {topic} helped bring their project to life this week!"

        sections.append(f"""
        <div style="border:1px solid #26403A; background:#162A26; padding:20px; margin-bottom:20px;">
          <h3 style="margin:0 0 8px; font-family:Georgia,serif; font-size:24px; color:#FFD66B;">{c['firstName']}'s Week in Code</h3>
          {p_text}
          <div style="margin:12px 0 16px;">
            <p style="margin:0 0 6px; font-family:Courier,monospace; font-size:11px; text-transform:uppercase; letter-spacing:0.08em; color:#A9B8B0;">[ New Concepts Mastered ]</p>
            {c_badges}
          </div>
          <div style="border-left:3px solid #FF8A65; padding:8px 14px; background:#0F1F1C;">
            <p style="margin:0; font-size:13px; line-height:1.5; color:#F5ECDC;">
              <strong style="color:#FF8A65;">Conversation starter:</strong> {conversation_prompt}
            </p>
          </div>
        </div>
        """)

    child_html = "".join(sections)

    return f"""<!DOCTYPE html>
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
    {child_html}
    <div style="text-align:center; margin:32px 0 20px;">
      <a href="{APP_URL}/family" style="display:inline-block; padding:12px 24px; background:#FFD66B; color:#0F1F1C; font-weight:600; font-size:14px; text-decoration:none; border:0;">
        Open Family Dashboard &rarr;
      </a>
    </div>
    <div style="border-top:1px dashed #26403A; padding-top:18px; margin-top:32px; font-size:12px; line-height:1.5; color:#6F857C;">
      <p style="margin:0 0 6px;">You are receiving this because you agreed to weekly updates for {parent_email}.</p>
      <p style="margin:0;">To change your preferences, manage your family settings at <a href="{APP_URL}/family" style="color:#A9B8B0;">tinkora.com/family</a>.</p>
    </div>
  </div>
</body>
</html>"""


def sample_family_data():
    return {
        "parent_email": "parent@example.com",
        "children": [
            {
                "firstName": "Aarav",
                "concepts": ["for-loops", "coordinates", "colors"],
                "projects": ["Name Light Show", "Rocket Launch"],
            },
            {
                "firstName": "Ananya",
                "concepts": ["turtle-angles", "loops-in-art"],
                "projects": ["Spiral Art"],
            },
        ],
    }


def send_brevo_email(api_key: str, sender_email: str, recipient: str, html: str):
    url = "https://api.brevo.com/v3/smtp/email"
    headers = {
        "accept": "application/json",
        "content-type": "application/json",
        "api-key": api_key,
    }
    payload = {
        "sender": {"name": "Tinkora", "email": sender_email},
        "to": [{"email": recipient}],
        "subject": "This week on Tinkora: What your family built",
        "htmlContent": html,
    }
    req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = resp.read()
            print("✓ Email dispatched successfully via Brevo API:", data.decode("utf-8"))
    except urllib.error.HTTPError as e:
        print(f"✗ Brevo API error ({e.code}):", e.read().decode("utf-8"))
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(description="Tinkora weekly progress email tool")
    parser.add_argument("--preview", action="store_true", help="Render and preview HTML template")
    parser.add_argument("--send", action="store_true", help="Send test email via Brevo")
    parser.add_argument("--to", type=str, default="", help="Recipient email for test send")
    args = parser.parse_args()

    sample = sample_family_data()
    html = render_email(sample["parent_email"], sample["children"])

    if args.preview or not args.send:
        out_path = "/tmp/tinkora_weekly_email_preview.html"
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(html)
        print(f"✓ Rendered weekly progress email preview to {out_path}")
        print("  Open it in your browser to inspect:")
        print(f"  open {out_path}")
        if not args.send:
            return

    api_key = os.getenv("BREVO_API_KEY", "")
    if not api_key:
        api_key = getpass.getpass("Brevo API Key (starts with xkeysib-, hidden as you type): ").strip()

    sender = os.getenv("BREVO_SENDER", "")
    if not sender:
        sender = input("Verified sender email in Brevo: ").strip()

    recipient = args.to or input("Send test email to: ").strip()
    send_brevo_email(api_key, sender, recipient, html)


if __name__ == "__main__":
    main()
