# User flows

> **Release status:** these flows describe a private technical preview. AIONEX
> is an internal maintainer label; name, ownership, licensing, and public-release
> clearance remain pending. Use synthetic or authorized data only.

## Start and return to work

1. Open the locally served application.
2. The server sets an anonymous workspace cookie if the browser does not
   already have one.
3. The dashboard requests projects for that workspace and shows loading, error,
   empty, or project-card states.
4. Open an existing card or choose **New project**.

Projects are tied to the cookie, not to an account. A different browser profile
or a cleared cookie sees a different workspace and cannot recover the original
one through a login flow.

## Create and edit a design

1. In **New project**, enter a name and select **Graphic Design Canvas**.
2. The server creates a blank project before the editor opens.
3. Add text, rectangles, circles, or an image; change canvas size/background;
   reorder/select layers; or edit the selected object's properties.
4. Use undo/redo for the in-memory edit history.
5. Choose **Save** and wait for the save indicator to show **Saved**.
6. Return to the dashboard and reopen the project to confirm persistence.
7. Export the canvas through the browser when a local image/PDF artifact is
   needed.

Unsaved work is indicated in the header and protected by a navigation warning.
There is no claimed background autosave or version history.

## Use the design assistant

1. Open Art Flow AI and enter a short design instruction.
2. The browser sends the bounded conversation to the server.
3. The server streams provider text back as server-sent events.
4. If the response includes a valid allow-listed action block, the browser
   applies those canvas changes and marks the project unsaved.
5. Review the result and save explicitly.

If no operator API key is configured, the UI receives a clear service error;
manual canvas editing is still available. Assistant changes should always be
reviewed before saving or exporting.

## Generate an image

1. Enter an image prompt and choose whether the result should be a background
   or movable canvas image.
2. The browser sends the prompt and target dimensions.
3. The server makes one provider request, validates the returned bytes, stores
   the asset in the current workspace, and returns a same-origin URL.
4. The browser loads the stable URL onto the canvas and marks the project
   unsaved.
5. Save the project to retain its reference to that asset.

Generation may incur provider charges. A transport failure is not silently
replayed after an ambiguous request.

## Create and edit a resume

1. Create a project and select **ATS Resume Builder**.
2. Enter identity, contact, summary, experience, education, and skills data.
3. Review the derived preview while editing.
4. Add or remove experience and education cards as needed.
5. Save the resume project and confirm the saved state.
6. Use the browser print path for a local PDF after reviewing print layout.

The application does not certify ATS acceptance. Resume content and exported
layout remain the user's responsibility.

## Use resume AI tools

The following optional flows send content to the configured external provider:

- paste raw resume text and request a structured parse;
- polish the current summary;
- tighten existing experience bullets;
- suggest keywords from resume text and an optional target role; or
- adjust summary tone to professional, confident, or modern.

Each successful result is inserted into the editable form and marks the project
unsaved. The provider is instructed to preserve facts, but a person must verify
every proposed change. Do not submit personal data without authorization and an
appropriate operator data-handling decision.

## Create, inspect, and revoke a resume share

1. Complete at least the name field and select the share/publish action.
2. Read and accept the disclosure dialog. It explains that the resulting link
   exposes the resume to anyone who receives it and that AI chat sends resume
   content to the configured provider.
3. The server returns a bearer URL, expiry, and owner-only revoke route. The
   default expiry is 30 days unless the operator changes it.
4. Open the link in a separate browser context and inspect the rendered resume.
5. If AI is enabled, a visitor may ask grounded questions about the stored
   resume. Information absent from the resume should be reported as absent.
6. Return to the creating workspace and revoke the share.
7. Confirm that the former URL returns not found.

The read URL has no login. Treat it like a secret link: forwarding, browser
history, screenshots, or external logs can disclose it. Revocation requires the
original workspace cookie, so test it before deleting browser state.

## Delete a project

1. From the dashboard, choose delete on a project card.
2. Confirm the irreversible browser prompt.
3. The server deletes only the matching project row in the current workspace.

Project deletion does not currently guarantee deletion of unreferenced image
assets or previously created resume shares. Revoke shares separately and have
the operator manage the database under the applicable retention policy.

## Recover from common errors

- **Projects unavailable:** use the dashboard retry action; if it persists,
  check database availability and filesystem permissions.
- **Save failed:** keep the page open, resolve server/storage errors, and retry
  save. Do not navigate away while the unsaved indicator remains.
- **AI unavailable:** configure a valid server-side key or continue with manual
  tools; never put the key in browser code.
- **Rate limited:** wait for the indicated retry interval instead of repeatedly
  submitting.
- **Share not found:** the token is invalid, expired, or revoked. There is no
  recovery route for a share token.
