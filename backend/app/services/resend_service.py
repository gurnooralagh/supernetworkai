import os
import resend
from groq import Groq

_groq = Groq(api_key=os.environ.get("GROQ_API_KEY"))
resend.api_key = os.environ.get("RESEND_API_KEY", "")

FROM_EMAIL = os.environ.get("RESEND_FROM_EMAIL", "noreply@supernetworkai.com")
APP_URL = os.environ.get("APP_URL", "http://localhost:3000")


def _generate_sender_snippet(sender_profile: dict) -> str:
    name = sender_profile.get("name", "This person")
    skills = ", ".join(sender_profile.get("skills") or [])
    intent = sender_profile.get("intent", "")
    summary = sender_profile.get("profile_summary", "")
    headline = sender_profile.get("headline", "")

    prompt = (
        f"Write a 2-3 sentence plain-English description of this person "
        f"for someone receiving a connection request from them. "
        f"Be specific and warm. Do not use bullet points.\n\n"
        f"Name: {name}\n"
        f"Headline: {headline}\n"
        f"Intent: {intent}\n"
        f"Skills: {skills}\n"
        f"Summary: {summary}"
    )

    try:
        response = _groq.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.4,
            max_tokens=150,
        )
        return response.choices[0].message.content.strip()
    except Exception:
        return f"{name} wants to connect with you on SuperNetworkAI."


def _get_receiver_email(receiver_profile: dict) -> str | None:
    return receiver_profile.get("contact_email") or receiver_profile.get("email")


def _compose_html(
    sender_profile: dict,
    receiver_profile: dict,
    match_data: dict,
    personal_message: str,
    sender_snippet: str,
) -> str:
    sender_name = sender_profile.get("name", "Someone")
    receiver_name = receiver_profile.get("name", "there")
    overall_score = int(match_data.get("overall_score", 0))
    best_category = match_data.get("best_category", "").replace("_", " ").title()
    explanation = match_data.get("explanation", "")
    sender_user_id = sender_profile.get("user_id", "")
    profile_link = f"{APP_URL}/profile/{sender_user_id}"

    cofounder_score = match_data.get("cofounder_score")
    teammate_score = match_data.get("teammate_score")
    top_management_score = match_data.get("top_management_score")

    scores_html = ""
    if cofounder_score is not None:
        scores_html += f"<li>Cofounder: <strong>{int(cofounder_score)}%</strong></li>"
    if teammate_score is not None:
        scores_html += f"<li>Teammate: <strong>{int(teammate_score)}%</strong></li>"
    if top_management_score is not None:
        scores_html += f"<li>Top Management: <strong>{int(top_management_score)}%</strong></li>"

    return f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
           color: #1a1a1a; background: #f9f9f9; margin: 0; padding: 0; }}
    .container {{ max-width: 560px; margin: 40px auto; background: #fff;
                 border-radius: 12px; overflow: hidden;
                 box-shadow: 0 2px 12px rgba(0,0,0,0.08); }}
    .header {{ background: #1a56db; padding: 28px 32px; color: white; }}
    .header h1 {{ margin: 0; font-size: 22px; font-weight: 600; }}
    .header p {{ margin: 6px 0 0; opacity: 0.85; font-size: 14px; }}
    .badge {{ display: inline-block; background: rgba(255,255,255,0.2);
              border-radius: 20px; padding: 4px 14px; font-size: 13px;
              margin-top: 10px; font-weight: 500; }}
    .body {{ padding: 28px 32px; }}
    .section {{ margin-bottom: 24px; }}
    .section-label {{ font-size: 11px; text-transform: uppercase; letter-spacing: 0.8px;
                      color: #6b7280; font-weight: 600; margin-bottom: 6px; }}
    .message-box {{ background: #f3f4f6; border-radius: 8px; padding: 16px;
                    font-size: 15px; line-height: 1.6; color: #374151; }}
    .snippet-box {{ border-left: 3px solid #1a56db; padding-left: 14px;
                    font-size: 14px; line-height: 1.6; color: #374151; }}
    .explanation {{ font-size: 14px; line-height: 1.6; color: #374151; }}
    .scores {{ list-style: none; padding: 0; margin: 0; }}
    .scores li {{ font-size: 14px; padding: 4px 0; color: #374151; }}
    .cta {{ text-align: center; margin-top: 28px; }}
    .cta a {{ background: #1a56db; color: white; text-decoration: none;
               border-radius: 8px; padding: 12px 28px; font-size: 15px;
               font-weight: 600; display: inline-block; }}
    .footer {{ border-top: 1px solid #e5e7eb; padding: 20px 32px;
               font-size: 12px; color: #9ca3af; text-align: center; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>{sender_name} wants to connect</h1>
      <p>You have a new connection request on SuperNetworkAI</p>
      <span class="badge">{overall_score}% {best_category} Match</span>
    </div>
    <div class="body">

      <div class="section">
        <div class="section-label">Their message to you</div>
        <div class="message-box">{personal_message}</div>
      </div>

      <div class="section">
        <div class="section-label">About {sender_name}</div>
        <div class="snippet-box">{sender_snippet}</div>
      </div>

      <div class="section">
        <div class="section-label">Why you match</div>
        <div class="explanation">{explanation}</div>
      </div>

      <div class="section">
        <div class="section-label">Compatibility breakdown</div>
        <ul class="scores">{scores_html}</ul>
      </div>

      <div class="cta">
        <a href="{profile_link}">View {sender_name}'s Full Profile</a>
      </div>
    </div>
    <div class="footer">
      SuperNetworkAI &mdash; Discover people aligned with your goals.
    </div>
  </div>
</body>
</html>
""".strip()


def send_connection_email(
    sender_profile: dict,
    receiver_profile: dict,
    match_data: dict,
    personal_message: str,
) -> bool:
    try:
        to_email = _get_receiver_email(receiver_profile)
        if not to_email:
            return False

        sender_name = sender_profile.get("name", "Someone")
        overall_score = int(match_data.get("overall_score", 0))
        best_category = match_data.get("best_category", "").replace("_", " ").title()

        sender_snippet = _generate_sender_snippet(sender_profile)

        html_body = _compose_html(
            sender_profile=sender_profile,
            receiver_profile=receiver_profile,
            match_data=match_data,
            personal_message=personal_message,
            sender_snippet=sender_snippet,
        )

        resend.Emails.send({
            "from": FROM_EMAIL,
            "to": [to_email],
            "subject": f"{sender_name} wants to connect — {overall_score}% {best_category} Match",
            "html": html_body,
        })

        return True

    except Exception:
        return False
