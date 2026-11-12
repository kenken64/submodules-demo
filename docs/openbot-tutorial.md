# Create Developer AI Agents with OpenBot

Build a four-agent development team in [OpenBot](https://openbot.run), put the
agents in one shared channel, and hand them the [Snip prompt
tutorial](prompt-tutorial.md) in two coordinated messages.

The walkthrough follows a real OpenBot 0.68.0 session on macOS. Screenshots show
one possible setup: agent names, models, menu labels, and provider availability can
differ on your machine and in later releases. Account emails, device codes, and
request locations in the screenshots have been redacted.

By the end you will have:

- **Alex — Backend Developer**, who owns the API and shared contract.
- **Mike — Senior Frontend Developer**, who owns the Angular UI.
- **Alan — Senior CLI Developer**, who owns the Node.js CLI.
- **Ahmad — Senior DevSecOps**, who owns the superproject, release bundle, CI,
  Docker image, and deployment checks.
- One **Snip Project** channel where all four agents collaborate.

## Before you start

- Install OpenBot 0.68 or later (macOS, Windows, or Linux).
- Have access to at least one model provider: Claude, ChatGPT, GitHub Copilot,
  OpenCode, Gemini, or another supported provider.
- For the GitHub Copilot walkthrough, have a GitHub account and permission to
  authorize the GitHub Copilot CLI.
- Have the [Snip prompt tutorial](prompt-tutorial.md) open. It defines the six
  implementation steps, the API contract, and the branch layout the agents follow.
- Decide on a local working directory and a GitHub repository for the workshop.
  The kickoff message below uses `D:/Projects/snip-demo-workshop-day1` and
  `https://github.com/kenken64/snipdemo-day1.git` as examples. Replace them with
  your own path and repository.

## Step 1 — Install OpenBot

1. Open [openbot.run](https://openbot.run) and click **Download for macOS** (or the
   download for your platform).

   ![OpenBot landing page with the Download for macOS button](openbot-screens/01-openbot-landing.png)

2. Drag the **OpenBot** app into your **Applications** folder.

   ![Dragging the OpenBot app into Applications](openbot-screens/02-install-applications.png)

3. Launch OpenBot. On the first launch after an update, the **What's new** dialog
   appears. Review the notes and click **Got it**.

   ![OpenBot What's new dialog after updating to 0.68.0](openbot-screens/03-whats-new.png)

   > The 0.68.0 notes include a reminder that **Fast mode** is off for each Claude
   > agent after the update. Turn it on again in the model picker if you use it.

## Step 2 — Connect a model provider

OpenBot has no built-in model. Connect at least one provider before creating
agents.

1. Open **Settings → Providers**. Providers that are already usable appear under
   **Connected**.

   ![Provider settings with connected accounts](openbot-screens/06-providers.png)

   > Account emails in this screenshot have been redacted.

2. Pick a provider. Claude and ChatGPT are connected here, and OpenCode is
   available on this computer; many other providers are listed under **Other
   providers** and can be installed on demand.

   ![Provider list including GitHub Copilot](openbot-screens/07-provider-list.png)

3. Connect GitHub Copilot (optional example). Select **GitHub Copilot**, then turn
   on **Use GitHub Copilot**.

   ![GitHub Copilot provider turned off](openbot-screens/08-github-copilot-off.png)

4. Under **Runtime**, click **Download** to install the GitHub Copilot CLI that
   OpenBot uses.

   ![GitHub Copilot runtime download](openbot-screens/09-github-copilot-runtime.png)

5. OpenBot opens a device-login dialog. Copy the code or scan the QR code.

   ![GitHub Copilot device code dialog with the code redacted](openbot-screens/11-device-code.png)

6. Open <https://github.com/login/device> in your browser, enter the code, and
   click **Continue**.

   ![GitHub device authorization page with the code redacted](openbot-screens/12-github-authorize-device.png)

7. Review the permissions requested by **GitHub Copilot CLI** and click
   **Authorize github**.

   ![GitHub Copilot CLI permission request](openbot-screens/13-github-copilot-permissions.png)

8. Confirm that GitHub reports **Congratulations, you're all set!** and return to
   OpenBot.

   ![GitHub device connected confirmation](openbot-screens/14-device-connected.png)

9. Back in OpenBot, GitHub Copilot should show **Connected**, the installed runtime
   version, and its model list.

   ![GitHub Copilot settings after sign-in](openbot-screens/15-github-copilot-settings.png)

10. Optionally click **Make default** so new agents start with this provider, or
    leave the default set to Claude.

    ![GitHub Copilot connected with runtime, models, and Make default](openbot-screens/10-github-copilot-connected.png)

11. Choose a model on each agent's creation form. The picker shows every model
    exposed by the selected provider, and some providers offer an **Auto** router
    plus an **Effort** level.

    ![Claude model picker with effort level](openbot-screens/05-model-picker-claude.png)

    ![GitHub Copilot Auto model with Extra high effort](openbot-screens/16-agent-model-picker-auto.png)

    > **Model tip:** backend, frontend, and CLI work usually run well on a mid-tier
    > model or an Auto router. The DevSecOps steps involve Git submodule state,
    > idempotent bundle generation, and CI semantics, where a stronger model pays
    > off. See [Routing prompts to models](prompt-tutorial.md#routing-prompts-to-models-spend-tokens-where-they-matter)
    > for the full guidance.

> **Device codes expire.** If GitHub reports that the code is no longer valid,
> start the sign-in again from the provider screen and use the new code.

## Step 3 — Create the Backend agent

Create one agent for each role. Start with the backend owner.

**Role:** Senior Backend Developer AI Agent — designs, builds, and maintains backend
services, with attention to correctness, security, compatibility, and reliability.

1. Click the **+** next to the workspace name and choose **New agent**.

   ![Workspace menu with New agent, New channel, and New folder](openbot-screens/17-new-agent-menu.png)

2. Enter the agent details:
   - **Name:** `Alex - Backend Developer`
   - **What should this agent help with?:** the persona below.
   - **Model:** choose the provider and model you want, or leave the default.

   OpenBot does not have a separate role or description field; the persona carries
   the role, responsibilities, and working style.

   ![Creating the backend agent with its persona](openbot-screens/04-create-backend-agent.png)

   Use this persona:

   ```text
   You are a Senior Backend Developer AI Agent. Design, build, and maintain APIs, business logic, databases, and service integrations.

   Clarify requirements and define API contracts, permissions, and failure behavior. Preserve compatibility with existing clients. Protect data with input validation, resource-level authorization, database constraints, transactions, and safe migrations. Handle timeouts, retries, duplicate requests, and partial failures.

   Write maintainable code and verify core behavior with unit and integration tests. Use logs, metrics, and traces to diagnose issues. Review changes for correctness, security, and performance. Give QA acceptance scenarios and give DevSecOps migration steps, health checks, and rollback instructions.

   Senior skills include API design, database engineering, secure coding, distributed systems, automated testing, observability, and technical leadership.
   ```

3. Click **Create agent**.

4. Optional: give the agent a task immediately. Provide the repository or relevant
   code, the backend stack, the requested behavior, and any existing API contracts.
   Include authentication and authorization rules, data requirements, external
   dependencies, and deployment constraints when relevant. Use placeholders for
   secrets. For example:

   ```text
   Act as the Backend Engineer for this repository.

   Review the existing backend and implement a POST /api/links endpoint that creates
   a short link from an HTTP or HTTPS URL.

   Before making changes:
   - Inspect the existing architecture and API conventions.
   - Identify any missing requirements that affect the implementation.
   - Define the request and response schema, status codes, permissions, and errors.
   - Explain how the change preserves compatibility with existing clients.

   Implement the endpoint using the project's existing stack and storage approach.
   Validate input, enforce the agreed permissions, and handle failures consistently.
   If persistent storage is involved, explain the constraints, transaction boundaries,
   and any required migration. Address duplicate requests and retries according to
   the agreed contract.

   Verify core behavior with unit and integration tests. Include invalid input,
   permission failures where applicable, and storage or dependency failures.

   Deliver the code changes, test results, QA acceptance scenarios, and DevSecOps
   migration steps, health checks, and rollback instructions. State when a migration
   or deployment step is unnecessary.
   ```

5. Review the result. Check that the agent provides:

   - An API contract covering inputs, outputs, permissions, and failure behavior.
   - Maintainable changes that preserve existing client behavior.
   - Appropriate validation, authorization, and data integrity protections.
   - Evidence from unit and integration tests, with any unverified behavior stated.
   - Useful logs, metrics, and traces without exposing secrets or sensitive data.
   - QA acceptance scenarios covering success, errors, and relevant failure cases.
   - DevSecOps migration steps, health checks, and rollback instructions appropriate
     to the change.

## Step 4 — Create the Frontend agent

Create an agent to build and maintain the Angular URL form and links table against
the backend's shared API contract.

**Role:** Senior Frontend Developer AI Agent — builds accessible, responsive Angular
components with typed API integration, form validation, and component tests.

1. Choose **+ → New agent** again.

2. Enter:
   - **Name:** `Mike - Senior Frontend Developer`
   - **What should this agent help with?:** the persona below.
   - **Model:** your preferred provider or model.

   ![Creating the frontend agent with its persona](openbot-screens/18-create-frontend-agent.png)

   The same form with the GitHub Copilot **Auto · Extra high** model selected:

   ![Frontend agent form with Auto model and Extra high effort](openbot-screens/19-create-frontend-agent-auto.png)

   Use this persona:

   ```text
   You are a Senior Frontend Developer AI Agent. Build and maintain the Angular form and links table using the shared API contract.

   Use reactive forms to validate URLs before submission and show server errors beside the relevant fields. Prevent duplicate submissions while a request is pending. Refresh the links table after a successful submission and display the original URL, short link, and hit count. Handle loading, empty, and error states.

   Build accessible, responsive components with keyboard navigation, clear focus states, and screen reader feedback. Keep API calls and response types in a typed Angular service. Coordinate contract changes with the backend agent and test form validation, successful submission, and API failure.

   Senior skills include Angular, TypeScript, RxJS, reactive forms, accessibility, responsive design, API integration, and component testing.
   ```

3. Click **Create agent**.

4. Optional task:

   ```text
   Act as the Senior Frontend Developer for this repository.

   Review the Angular app and shared API contract, then build or update the URL form
   and links table using the project's existing conventions.

   - Keep API calls and request and response types in a typed Angular service.
   - Use reactive forms to require a valid HTTP or HTTPS URL before submission.
   - Show field-specific server errors beside the URL field and other failures in
     an accessible status message.
   - Prevent duplicate submissions while a request is pending and restore the form
     controls when the request completes or fails.
   - Refresh the links table after a successful submission. Display the original
     URL, short link, and hit count.
   - Handle loading, empty, and error states, including a failed table refresh after
     the link was successfully created.
   - Support keyboard navigation, visible focus, screen reader feedback, and
     responsive layouts.

   Coordinate any proposed API contract changes with the Backend Engineer.
   Test form validation, successful submission and refresh, duplicate submission
   prevention, and API failure. Report changes, test results, and QA scenarios.
   ```

5. Review the result:

   - Invalid URLs are rejected before a request is sent.
   - Pending requests prevent duplicate submissions; failures allow the user to retry.
   - Successful submissions refresh the table with the expected fields.
   - Loading, empty, field error, and general error states are clear and accessible.
   - API access and response types live in a typed Angular service.
   - Component tests cover validation, submission, refresh, and API failure.
   - Keyboard navigation, focus states, screen reader feedback, and responsive
     behavior have been checked.

## Step 5 — Create the CLI agent

Create an agent to build and maintain the Node.js CLI as another client of the
same backend API.

**Role:** Senior CLI Developer AI Agent — builds reliable Node.js commands with
clear help, scriptable output, shared HTTP request logic, and cross-platform
browser launching.

1. Choose **+ → New agent**.

2. Enter:
   - **Name:** `Alan - Senior CLI Developer`
   - **What should this agent help with?:** the persona below.
   - **Model:** your preferred provider or model.

   ![Creating the CLI agent with its persona](openbot-screens/20-create-cli-agent.png)

   Use this persona:

   ```text
   You are a Senior CLI Developer AI Agent. Build and maintain the Node.js add, ls, and open commands against the shared API contract.

   Validate arguments before sending requests. Use add to create a short link, ls to display links and hit counts, and open to launch a short link in the default browser. Provide help text and a configurable API base URL. Send errors to stderr and return meaningful exit codes so scripts can detect failures.

   Handle invalid input, missing links, timeouts, and API errors. Keep API request logic shared across commands. Test argument parsing, output, and exit codes with a mock API. Verify browser launching across supported platforms.

   Senior skills include Node.js, HTTP client design, command-line UX, shell scripting, cross-platform process handling, and automated testing.
   ```

3. Click **Create agent**.

4. Optional task:

   ```text
   Act as the Senior CLI Developer for this repository.

   Review the existing CLI and shared API contract, then build or update these commands:
   - add: validate the URL and create a short link.
   - ls: display links and their hit counts.
   - open: launch the requested short link in the default browser.

   Validate arguments before sending requests. Provide useful help text and a
   configurable API base URL using the project's existing conventions. Share HTTP
   request logic across commands, including timeout and API error handling.

   Keep normal output on stdout and errors on stderr. Define and document meaningful
   exit codes for success and failures. Handle invalid input, missing links, timeouts,
   API failures, and browser-launch failures without an unhandled exception.

   Coordinate any proposed API contract changes with the Backend Engineer.
   Use a mock API to test argument parsing, requests, output, and exit codes.
   Verify browser launching on each supported platform and state which platforms
   were actually checked. Report changes, test results, and QA scenarios.
   ```

5. Review the result:

   - `add`, `ls`, and `open` follow the shared API contract.
   - Invalid arguments fail before network requests; help explains command usage
     and API base URL configuration.
   - Errors go to stderr and exit codes let scripts detect failures.
   - Shared request logic handles timeouts, missing links, and API errors consistently.
   - Mock API tests verify parsing, output, and exit codes.
   - Browser launching is checked across supported platforms, with any verification
     gaps stated.

## Step 6 — Create the DevSecOps agent

Create an agent to verify releases across the frontend, API, and CLI, then manage
secure delivery to Railway.

**Role:** Senior DevSecOps AI Agent — owns CI/CD, release security, verified Docker
builds, and Railway deployment with health checks and rollback procedures.

1. Choose **+ → New agent**.

2. Enter:
   - **Name:** `Ahmad - Senior DevSecOps`
   - **What should this agent help with?:** the persona below.
   - **Model:** a stronger model is useful for this role; the screenshot uses
     GitHub Copilot **Auto · Extra high**.

   ![Creating the DevSecOps agent with its persona](openbot-screens/21-create-devsecops-agent.png)

   Use this persona:

   ```text
   You are a Senior DevSecOps AI Agent. Own CI/CD, release security, and Railway deployment.

   Verify pinned Git submodule commits and build the Docker image from those revisions. Maintain GitHub Actions with least-privilege permissions. Run end-to-end tests across the frontend, API, and CLI. Scan dependencies and the Docker image, then publish the verified image only after tests and security checks pass.

   Deploy the verified build to Railway. Configure environment variables, secrets, port binding, and health checks. Review deployment logs, run smoke tests, and roll back to the previous verified release if the deployment fails.

   Senior skills include Git submodules, GitHub Actions, Docker, dependency and image scanning, container registries, Railway deployment, and release troubleshooting.
   ```

3. Click **Create agent**.

4. Optional task:

   ```text
   Act as the Senior DevSecOps agent for this repository.

   Review the release pipeline and Railway deployment configuration.

   - Verify the Git submodule commits pinned by the selected superproject revision.
     Build from those exact revisions and record them with the release.
   - Maintain GitHub Actions with only the permissions required by each job.
   - Run end-to-end tests covering the frontend, API, and CLI.
   - Scan dependencies and the Docker image. Gate publication on successful tests
     and the agreed security checks.
   - Publish the image that passed verification and record its immutable digest.
   - Deploy that verified image to the intended Railway service. Configure environment
     variables, secrets, port binding, and health checks.
   - Review deployment logs and run smoke tests against the deployed service.
   - Record the previous verified release before deployment and roll back to it if
     the deployment fails. Recheck service health after rollback.

   Use the Backend Engineer's migration and rollback instructions when a release
   changes stored data. Report the source revisions, test and scan results, image
   digest, deployment health, and rollback outcome if applicable.
   ```

5. Review the result:

   - The release records the pinned submodule commits used to build it.
   - GitHub Actions permissions match the needs of each job.
   - End-to-end tests and dependency and image scans pass before publication.
   - The deployed image matches the verified image digest.
   - Railway configuration supports the expected environment, port, and health checks.
   - Deployment logs and smoke tests confirm the service works after deployment.
   - The previous verified release is recorded and rollback instructions cover
     application and relevant data migration behavior.

## Step 7 — Create the shared channel

A channel gives every agent the same conversation, so they can hand off work and
see each other's branch status. Direct messages are still available for one-to-one
work.

1. Click **+** next to the workspace name and choose **New channel**.

   ![Workspace menu with New channel highlighted](openbot-screens/22-new-channel-menu.png)

2. Name the channel `Snip Project`, select all four agents, and click **Create**.

   ![New channel dialog with all four agents selected](openbot-screens/23-new-channel-dialog.png)

3. The channel appears in the sidebar with the four agent avatars. It starts with
   no messages.

   ![Snip Project channel in the sidebar](openbot-screens/24-channel-created.png)

## Step 8 — Send Message 1: read and understand

The first message asks every agent to study the tutorial without changing files.
This gives you a chance to resolve misunderstandings before anyone creates branches.

1. Open **Snip Project** and paste this message into the composer:

   ```text
   Hi everyone, please read and understand this Markdown tutorial:
   https://github.com/kenken64/submodules-demo/blob/main/docs/prompt-tutorial.md

   Please do not implement anything yet. Review the architecture, shared API
   contract, branch and submodule structure, implementation steps, and verification
   checks. Each agent should explain its responsibilities, dependencies on the
   other agents, and any questions that need to be resolved before implementation.

   Wait for the implementation kickoff message before creating folders, changing
   files, initializing repositories, or starting implementation.
   ```

   ![Kickoff message in the Snip Project composer](openbot-screens/25-channel-composer.png)

2. Before sending, open the **Assigned to** control and select all four agents.
   Send the message and confirm that the **Assigned to** row lists every agent.

   ![Message assigned to all four agents](openbot-screens/26-message-one-responses.png)

3. Read the responses. Each agent should restate its responsibilities, its
   dependencies on the others, and any open questions.

   ![Agent responses to the read-and-understand message](openbot-screens/27-message-one-review.png)

4. Resolve blocking questions in the channel before continuing. Do not send the
   implementation message while an agent is still unsure about the API contract,
   branch ownership, or workspace location; those ambiguities turn into branch
   conflicts later.

## Step 9 — Send Message 2: start implementation

The second message assigns each agent its step and establishes the shared
workspace and repository.

1. Paste this message, replacing the path and repository with your own:

   ```text
   Hi everyone, start implementation now using the tutorial you reviewed:
   https://github.com/kenken64/submodules-demo/blob/main/docs/prompt-tutorial.md

   The local working directory will be:
   D:/Projects/snip-demo-workshop-day1

   The GitHub repository will be:
   https://github.com/kenken64/snipdemo-day1.git

   Create the working folder and associate the GitHub repository yourselves.
   For a new workspace, initialize Git with backend as the first branch, following
   Step 1 of the tutorial, and configure the remote with:
   git remote add origin https://github.com/kenken64/snipdemo-day1.git

   If the working folder or Git repository already exists, inspect its state and
   origin before continuing. Reuse the correct setup and preserve existing work.

   Use D:/Projects/snip-demo-workshop-day1 wherever the tutorial refers to its
   snip-demo project folder. Do not create a nested snip-demo folder. Replace every
   <REPO_URL> placeholder with https://github.com/kenken64/snipdemo-day1.git.

   Responsibilities:
   - Backend Engineer: implement Step 1 on backend and establish the shared API
     contract used by both clients.
   - Senior Frontend Developer: implement Step 2 on frontend against that contract.
   - Senior CLI Developer: implement Step 3 on cli against that contract.
   - Senior DevSecOps: coordinate the shared workspace and implement Steps 4–6:
     the main superproject, submodules, generated bundle, build script, GitHub Actions,
     and Docker release pipeline.

   Follow the tutorial's step order. Coordinate changes in this shared working
   directory so only one agent switches branches or changes repository state at a
   time. Commit, push, and verify each component before moving to the next step.
   Keep component files at their branch roots; let Git create the submodule folders
   in Step 4 rather than creating those folders in advance.

   Use each agent's configured persona while preserving the tutorial's API contract,
   branch names, file names, and architecture. Run the verification checks for every
   step. Report completed work, branches and commits, test results, and any blockers.
   ```

   > The example uses a Windows path. On macOS or Linux, substitute a path such as
   > `~/Projects/snip-demo-workshop-day1`, or approve the shared workspace OpenBot
   > offers in the next step.
   >
   > The role names in the message map to the agents you created: Backend Engineer
   > → Alex, Senior Frontend Developer → Mike, Senior CLI Developer → Alan, and
   > Senior DevSecOps → Ahmad.

2. Keep all four agents assigned, then send the message. OpenBot may ask where the
   shared workspace should live. Choose **Use this Mac** to let the agents work in
   an approved local folder, or select a different location. Each agent gets an
   isolated checkout and should push only its own branch.

   ![Workspace approval card in the Snip Project channel](openbot-screens/28-workspace-approved.png)

3. Watch the task cards. Agents report what they are doing, which branch they are
   on, and when a commit is ready for another agent. The backend must publish first
   so the frontend and CLI can build against the shared contract.

   ![Agents working with task cards and branch status](openbot-screens/29-agents-working.png)

> **Do not switch branches or edit files in the shared checkout while the agents
> work.** They depend on each other's pushed commits. Let the owner of each branch
> finish and push before you intervene.

## Step 10 — Keep the team unblocked

The agents coordinate among themselves, but they will stop for decisions that
affect security, scope, or release policy. Stay in the channel and answer those
questions.

1. Let the agents hand work off. You will see the frontend and DevSecOps agents
   waiting on the backend branch, and the DevSecOps agent assembling the
   superproject once the source branches exist.

   ![Agents coordinating branch handoffs](openbot-screens/30-agents-coordinating.png)

2. Answer blockers in the channel. The example below shows the DevSecOps agent
   pausing before publishing because `npm audit` found Angular 19 vulnerabilities.
   Choose an option button or type a reply. Your run may surface different
   questions, but the pattern is the same: give the agent a clear decision and the
   reason behind it.

   ![Agent asking whether to upgrade Angular before publishing](openbot-screens/31-blocker-question.png)

3. Follow the chosen path. Here the team upgrades the frontend branch to Angular 22.
   The owning agent updates its branch, reports the new SHA, and the other agents
   wait for that commit before rebuilding the bundle.

   ![Angular upgrade work in progress](openbot-screens/32-angular-upgrade.png)

   ![Frontend agent reporting the completed Angular upgrade](openbot-screens/33-frontend-upgrade-complete.png)

4. Expect occasional CI failures and retries. In this run, the Docker workflow
   failed because GitHub Actions could not resolve the Trivy action tag. The
   DevSecOps agent pinned a valid Trivy release, reran the workflow, and verified
   the image scan and GHCR push. Read the failed job rather than assuming the code
   is broken.

   ![DevSecOps agent diagnosing and fixing the Docker workflow](openbot-screens/34-ci-release-fix.png)

## Step 11 — Verify the release

1. When all tasks complete, read the final report. It should list the published
   branches, the commits pinned by `main`, test results, audit results, the image
   digest, and the GitHub Actions run URLs.

   ![Final session summary with branches, commits, and verification results](openbot-screens/35-session-summary.png)

2. Open the local web UI (the example uses <http://localhost:4200>) and create a
   short link. Confirm that the link appears in the table with its original URL and
   hit count.

   ![Snip web UI with a short link and hit count](openbot-screens/36-snip-running.png)

3. Verify the API directly:

   ```bash
   BASE=http://localhost:3000

   # shorten a URL → 201 { code, url, shortUrl, hits, createdAt }
   curl -s -X POST "$BASE/api/links" \
     -H 'content-type: application/json' \
     -d '{"url":"https://example.com"}'

   # list links → 200 [...]
   curl -s "$BASE/api/links"

   # follow a short code → 302 to the original
   curl -si "$BASE/<code>" | head -3
   ```

4. Confirm the repository structure:

   ```bash
   git clone --recursive <REPO_URL> snip-demo-verify
   cd snip-demo-verify
   git submodule status
   ```

   A fresh recursive clone should populate all four submodule folders from the
   commits pinned by `main`.

5. Stop the local processes when you are done. The final report normally includes
   the PIDs and commands, for example:

   ```bash
   kill 38128   # frontend
   kill 38091   # backend
   ```

6. Sign off against this checklist:

   - `backend`, `frontend`, and `cli` branches are pushed and buildable.
   - `main` pins the verified commits as Git submodules.
   - `bundle` is generated from the pinned source commits and serves the UI and API.
   - Frontend tests and CLI tests pass; dependency audits are clean or documented.
   - GitHub Actions for bundle generation and Docker build/scan/publish are green.
   - A fresh recursive clone materializes all submodule folders.
   - The local UI, API redirect, and hit counter work.
   - Railway deployment, if in scope, matches the verified image digest and passes
     its health check. See the [Railway deployment guide](railway-deployment.md).

## Troubleshooting

- **An agent cannot find the workspace.** Approve the workspace card or give the
  agent the absolute path. Agents should not create a nested project folder.
- **A provider is missing or a model is unavailable.** Open **Settings → Providers**,
  install the provider runtime, and refresh the model list. If a model still does
  not appear, choose another model for that agent.
- **The GitHub device code expired.** Start the sign-in again from the provider
  screen and use the new code. Codes are short-lived by design.
- **An agent is waiting on a question.** Answer it in the channel or use the option
  button. Do not resend the kickoff message; that restarts work the agent has
  already done.
- **Two agents changed the same branch.** Stop one, inspect the remote, and let the
  branch owner reconcile. The tutorial expects one owner per branch: backend,
  frontend, cli, and `main`/`bundle`.
- **CI fails on a dependency audit.** Treat it as a release gate, not noise. Either
  upgrade the dependency and rerun the tests, or explicitly pause publication and
  document the accepted risk.
- **A workflow action cannot be resolved.** Pin a valid released tag or commit for
  the action, then rerun the failed job.
- **The working directory or repository already exists.** Inspect its state and
  `origin` before continuing. Preserve existing work and reuse the correct remote.

## Reference

- [Snip prompt tutorial](prompt-tutorial.md) — the six implementation prompts,
  API contract, branch model, and model-routing guidance.
- [Railway deployment guide](railway-deployment.md) — deploying the generated
  `bundle` branch and verifying the public URL.
- [OpenBot](https://openbot.run) — download and product documentation.
