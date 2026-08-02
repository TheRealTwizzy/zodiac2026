# Working with this repo on Windows

Everything here runs the same on Windows, macOS and Linux — there's no build
step and no shell scripts. The notes below cover the few places where
PowerShell and Bash disagree, since that's where most friction shows up.

Commands are **PowerShell** unless labelled otherwise. None of this needs an
elevated (admin) prompt.

---

## If git asks for a password

GitHub stopped accepting account passwords over HTTPS. Either:

- **Git Credential Manager** — ships with Git for Windows and opens a browser
  sign-in the first time you push. If it doesn't appear:
  ```powershell
  git config --global credential.helper manager
  ```
- **A personal access token** — create one at
  <https://github.com/settings/tokens> with the `repo` scope, then use it as
  the password when prompted. Username is your GitHub username.
- **GitHub CLI**, if you have it:
  ```powershell
  winget install --id GitHub.cli
  gh auth login
  ```

## If PowerShell refuses to run npm

A default Windows install blocks the `npm.ps1` shim:

> npm.ps1 cannot be loaded because running scripts is disabled on this system.

Either allow local scripts for your user — this does **not** need admin:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

or bypass the shim by calling the batch wrapper, which needs nothing:

```powershell
npm.cmd install
npm.cmd test
```

## Verifying before you push

```powershell
npm install
npm test                  # 148 checks
npm start                 # http://localhost:8080
```

To run the suite against a jsdom installed elsewhere, PowerShell sets the
environment variable on its own line — the `VAR=value command` prefix is Bash
syntax and will not work:

```powershell
$env:JSDOM_PATH = "C:\path\to\node_modules\jsdom"
node smoke.js
Remove-Item Env:\JSDOM_PATH        # optional, clears it again
```

Or just open `index.html` — it works with no server, no network and no Node.

