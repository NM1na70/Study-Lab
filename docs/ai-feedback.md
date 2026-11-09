# Optional Owner AI Feedback

Core learning and Review Due require no API key or external service — optional feedback is advice for saved writing/report reasoning, never a factual grade, self-review replacement or completion action

## Owner Setup

Use a host development/server process on direct localhost — Docker bridge clients and LAN clients intentionally cannot pass the owner socket check, even if they know the token or forge forwarding headers

Create a temporary high-entropy owner capability in the launching Ubuntu terminal without storing it in Git or browser storage

```bash
source scripts/dev-env.sh
read -r -s -p 'Owner token (at least 32 random characters): ' STUDY_OWNER_TOKEN
printf '\n'
export STUDY_OWNER_TOKEN
pnpm start
```

Generate the token with a trusted password manager — do not reuse a password or API key, and do not paste secrets into source files, screenshots or issue reports

Open localhost, choose AI Settings, unlock with the owner token, enter the OpenAI API key and choose Connect OpenAI API, then Test Connection — key input clears after submission and connection testing retrieves model metadata without generating feedback

The key stays only in server memory — disconnect or restart clears it, browser reload locks the owner controls, and neither browser storage nor SQLite backups contain credentials

The owner token itself stays in the server environment and temporary browser memory — stop the process and unset STUDY_OWNER_TOKEN when finished

Core study may be exposed on a trusted LAN, but owner AI operations still require direct loopback access — this single-learner capability boundary is not an account system or multi-user authentication

## Consent, Context And Billing

ChatGPT subscription billing does not supply API credits — separately funded API access and model permission are required, with current pricing/account controls checked on the provider dashboard

Each Review My Answer or Explain This Feedback action needs the disclosure checkbox — the saved writing or report reasoning, current task/rubric/checklist and bounded evidence context go to OpenAI

No hidden answer key, worked solution, unrelated lesson history, owner token or provider key is included in the model context — the provider key is used only in the HTTPS authorisation header

Requests use the Responses API with store:false, a strict four-field JSON output contract and no tools — provider retention/account policy still applies, so do not submit secrets or personal data

Model: gpt-5.6-terra with reasoning effort none, maximum 900 output tokens, at most 10,000 context characters and 4,000 answer/reasoning characters — evidence material is bounded to 2,500 characters and response bytes to 65,536

One provider operation may run at a time, feedback attempts are limited to three per minute and twenty per UTC day, and each operation times out after 25 seconds — failures/cancellations consume an attempt, duplicate completed IDs return cached feedback without another provider call, and a changed context cannot reuse an ID

These application limits are not a monetary spending guarantee — manage API billing separately, and remember that cancelling locally cannot guarantee reversal of provider processing or charges

Output is labelled AI Advice and rendered as text — it records assistance once without changing saved answers, factual correctness, reasoning self-review or completion

Network, authentication, quota, refusal, malformed output, timeout and cancellation failures leave normal study available — no automatic retries or background paid requests occur

## Verification And Provider Documentation

See [the evaluation matrix](ai-evaluation.md) for representative inputs and future live review targets

All automated feedback calls use mocks and fake credentials — tests cover ordinary writing, overclaims, uncertainty, prompt injection, missing evidence, ownership, consent, duplication, limits and failure paths

A mock contract test cannot establish real model quality, model availability or account billing — no real key, live paid generation or live connection test was used for this change

Implementation reference pages reviewed on 5 November 2026: [Responses text generation](https://developers.openai.com/api/docs/guides/text), [structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs), [production keys](https://developers.openai.com/api/docs/guides/production-best-practices), [error codes](https://developers.openai.com/api/docs/guides/error-codes) and [model contract](https://developers.openai.com/api/docs/models/gpt-5.6-terra)

Before changing the model or request contract, check current official documentation and rerun mocked boundary/evaluation tests — live owner-funded evaluation remains an explicit later task
