# Private engineering demo script

> **Audience and status:** use this script only for an authorized private
> technical review. It is not a public launch script or sales claim. AIONEX is
> an internal maintainer label; naming, ownership, licensing, and public-release
> clearance remain pending.

## Safety setup

Use synthetic content only. Run the server on `127.0.0.1` with a temporary
SQLite database and a clean browser profile. Keep `OPENAI_API_KEY` blank for the
default walkthrough; if provider behavior must be reviewed, use a dedicated,
budget-limited key and explicitly acknowledge that prompts and resume content
leave the application. Do not expose the server through a public tunnel.

Suggested synthetic resume identity:

- Name: Jordan Example
- Title: Product Designer
- Email: jordan@example.invalid
- Summary: “Designs accessible workflow tools and documents decisions.”

## Walkthrough (about 10 minutes)

### 1. Establish the release boundary

Open the repository's rights-status document before the app. State:

> This is a private single-node technical preview. The current names are working
> labels, public-release rights are not cleared, and no production or customer
> use is claimed.

Point out that manual editing works without an AI key and that the workspace
cookie is not an account.

### 2. Dashboard and project lifecycle

1. Open the home page and show the dashboard loading/empty state.
2. Create a design project named **Synthetic launch canvas**.
3. Return home and show the new project card.
4. Reopen it, rename it, and note the **Unsaved** status.

Expected evidence: the server creates a workspace cookie, project APIs return
only that workspace's rows, and the UI distinguishes unsaved/saving/saved.

### 3. Canvas editing

1. Add a rectangle and a text object.
2. Move or resize an object and inspect the layers/properties controls.
3. Use undo and redo.
4. Change the canvas background or preset size.
5. Save, return home, reopen, and confirm that the objects remain.
6. Briefly switch to a narrow viewport to show responsive drawers and usable
   bottom-sheet behavior.

Do not claim real-time collaboration; `/ws` is only a bounded echo stub.

### 4. Explicit AI degraded state

With no key configured, ask Art Flow AI for a small canvas change. Show the
clear unavailable error, then continue editing manually. This demonstrates
that provider absence is handled as a feature-level degraded state rather than
an application failure.

If an authorized key is used, explain before submitting that the message is
sent to the configured OpenAI endpoint. Review any returned action before
saving. Do not include real names, client material, or confidential prompts.

### 5. Resume project

1. Create an **ATS Resume Builder** project named **Synthetic resume**.
2. Enter the synthetic identity, summary, one fictional experience entry, one
   education entry, and a few skills.
3. Show the derived resume preview and save status.
4. Save and reopen the project.
5. Open the print dialog only if the review needs to inspect the local PDF path;
   cancel without printing if the environment is shared.

State clearly that the product does not certify ATS acceptance.

### 6. Resume AI tools (optional)

With no key, demonstrate one explicit unavailable response. With an authorized
key, use only the synthetic summary, review the rewrite for invented facts, and
do not save it unless it remains accurate. Explain that behavioral prompting
does not guarantee factual output.

### 7. Share, inspect, revoke

1. Select the resume share/publish action.
2. Read the disclosure dialog aloud: the URL is a bearer link, it expires, and
   AI chat sends the resume to the provider when enabled.
3. Create the share and note its expiry.
4. Open the URL in a private browser context and inspect the escaped resume.
5. Return to the owner browser and revoke it.
6. Refresh the visitor tab and confirm a not-found response.

Do not paste the URL into chat, email, issue trackers, or recorded notes. The
demonstration token is still a read credential until revoked.

### 8. Close with engineering evidence

Show the architecture and security-model documents, then summarize the covered
automated invariants: workspace isolation, input bounds, security headers,
stored-name escaping, share revocation, asset isolation, missing-key behavior,
and no replay after streamed output. Describe the checks as scoped evidence,
not certification.

## Cleanup

1. Confirm the resume share is revoked.
2. Delete the synthetic projects if they are no longer needed.
3. Stop the local server.
4. Remove the temporary database and browser profile through the approved local
   cleanup process.
5. If an API key was used, review provider usage and rotate it if the demo
   environment or recording could have exposed it.

## Reviewer questions to invite

- Which boundary would have to change first for a multi-user pilot?
- What data leaves the browser in each AI flow?
- What happens after a provider disconnects mid-stream?
- How does an owner revoke a resume link, and what happens if its cookie is lost?
- Which items block public release independently of technical readiness?
