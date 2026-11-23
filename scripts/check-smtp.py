"""Checks the Brevo SMTP settings that Supabase uses to send sign-in emails.

Run it yourself in a terminal (it asks for the key privately, so it never appears on screen):
    python3 scripts/check-smtp.py

It logs in to Brevo and checks that the sender address is accepted, then stops
BEFORE sending anything. No email is sent.
"""
import getpass
import smtplib

HOST, PORT = "smtp-relay.brevo.com", 587

login = input("Brevo SMTP Login (SMTP & API → SMTP, e.g. xxxx@smtp-brevo.com): ").strip()
key = getpass.getpass("Brevo SMTP key (starts with xsmtpsib-, hidden as you type): ").strip()
sender = input("Sender email (exactly as in Supabase → SMTP Settings): ").strip()

if key.startswith("xkeysib-"):
    print("\n✗ That's an API key, not an SMTP key. In Brevo → SMTP & API → SMTP, generate an SMTP key (xsmtpsib-...).")
    raise SystemExit(1)

try:
    with smtplib.SMTP(HOST, PORT, timeout=20) as s:
        s.ehlo()
        s.starttls()
        s.ehlo()
        try:
            s.login(login, key)
        except smtplib.SMTPAuthenticationError as e:
            print(f"\n✗ Login refused ({e.smtp_code}): {e.smtp_error.decode(errors='replace')}")
            print("  Check the SMTP Login and the SMTP key. If both are right, your Brevo account may not be activated for sending yet.")
            raise SystemExit(1)
        print("✓ Logged in to Brevo")
        code, msg = s.mail(sender)
        if code >= 400:
            print(f"\n✗ Brevo refused the sender ({code}): {msg.decode(errors='replace')}")
            print("  Verify this address in Brevo → Senders, and use exactly the same address in Supabase.")
            raise SystemExit(1)
        code, msg = s.rcpt(sender)
        if code >= 400:
            print(f"\n✗ Brevo refused the message ({code}): {msg.decode(errors='replace')}")
            raise SystemExit(1)
        s.rset()  # stop here: nothing is sent
        print("✓ Sender accepted")
        print("\nAll good. Copy these exact values into Supabase → Authentication → Emails → SMTP Settings:")
        print(f"  Host {HOST}, Port {PORT}, Username {login}, Sender email {sender}")
except (OSError, smtplib.SMTPException) as e:
    print(f"\n✗ Couldn't talk to Brevo: {e}")
    raise SystemExit(1)
