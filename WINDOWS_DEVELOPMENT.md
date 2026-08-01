# Windows development and troubleshooting

Timeline Timer uses Tauri v2, React, TypeScript, and Rust. A Windows development machine therefore needs both the JavaScript toolchain and the native Microsoft C++ toolchain.

Run project commands from the repository root—the directory containing `package.json` and `src-tauri`—in a new PowerShell window after installing or modifying prerequisites.

## Required software

- Current Node.js LTS and npm
- Rust through `rustup`, using the stable MSVC toolchain
- Visual Studio 2022 Build Tools or Visual Studio 2022 Community with **Desktop development with C++**
- A Windows 10 or 11 SDK, including its Universal CRT libraries
- Microsoft Edge WebView2 Runtime (normally already present on Windows 11)

For a clean machine, run the following from an elevated PowerShell window. The Visual Studio workload includes the x64/x86 MSVC compiler and the recommended Windows SDK components.

```powershell
winget install --exact --id OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements
winget install --exact --id Rustlang.Rustup --accept-package-agreements --accept-source-agreements
winget install --exact --id Microsoft.VisualStudio.2022.BuildTools --override "--wait --passive --norestart --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended" --accept-package-agreements --accept-source-agreements
winget install --exact --id Microsoft.EdgeWebView2Runtime --accept-package-agreements --accept-source-agreements
```

If Visual Studio 2022 is already installed, open **Visual Studio Installer**, select **Modify**, enable **Desktop development with C++**, and ensure an MSVC v143 toolset and a Windows 10 or 11 SDK are selected. Installing a second Build Tools edition is not necessary.

Close and reopen PowerShell and any editor terminals after installation, then initialize and verify the Rust toolchain:

```powershell
$env:Path = "$env:USERPROFILE\.cargo\bin;$env:Path"
rustup default stable-msvc
rustup target add x86_64-pc-windows-msvc
node --version
npm --version
rustc --version
cargo --version
rustc -vV
```

The host shown by `rustc -vV` should be `x86_64-pc-windows-msvc` on a typical 64-bit Windows machine.

## Install and run

From the repository root:

```powershell
npm install
npm run tauri dev
```

`npm run tauri dev` starts Vite, compiles the Rust application, and opens Timeline Timer. The browser-only UI can be started with `npm run dev`, but native window docking, close controls, and always-on-top behavior require Tauri.

To initialize the Visual Studio build environment explicitly and run everything with one pasted PowerShell command, replace the project path below:

```powershell
Set-Location 'C:\path\to\timeline-timer'; $vswhere = "${env:ProgramFiles(x86)}\Microsoft Visual Studio\Installer\vswhere.exe"; $vsDevCmd = & $vswhere -latest -products * -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -find Common7\Tools\VsDevCmd.bat | Select-Object -First 1; if (-not $vsDevCmd) { throw 'MSVC C++ Build Tools were not found. Install the Desktop development with C++ workload.' }; cmd.exe /d /c "call `"$vsDevCmd`" -arch=x64 -host_arch=x64 && npm install && npm run tauri dev"
```

For a production build:

```powershell
npm run tauri build
```

The unbundled release executable is written under `src-tauri\target\release`; installers are written under `src-tauri\target\release\bundle`.

## `cargo metadata`: program not found

Typical error:

```text
failed to run `cargo metadata` ... program not found
```

Tauri could not find Cargo. Rust may not be installed, or the terminal/editor was opened before Rust added `%USERPROFILE%\.cargo\bin` to `PATH`.

```powershell
$env:Path = "$env:USERPROFILE\.cargo\bin;$env:Path"
& "$env:USERPROFILE\.cargo\bin\rustup.exe" default stable-msvc
Get-Command cargo
cargo metadata --no-deps --format-version 1 --manifest-path .\src-tauri\Cargo.toml
```

If this works in a new PowerShell window but not in VS Code or another editor, close every editor window and reopen it so extensions inherit the updated `PATH`.

## `LNK1104: cannot open file 'msvcrt.lib'`

Typical error:

```text
linking with `link.exe` failed
LINK : fatal error LNK1104: cannot open file 'msvcrt.lib'
```

Finding `link.exe` is not sufficient. `msvcrt.lib` is supplied through the Windows SDK/UCRT library set, and the linker must receive the SDK library paths. This error usually means the C++ workload is incomplete, the Windows SDK is missing, or the build is running outside an initialized Visual Studio environment.

Confirm that an x64 SDK library exists:

```powershell
Get-ChildItem "${env:ProgramFiles(x86)}\Windows Kits\10\Lib" -Filter msvcrt.lib -Recurse -ErrorAction SilentlyContinue | Where-Object FullName -Match '\\um\\x64\\' | Select-Object -First 1 -ExpandProperty FullName
```

If this returns nothing, modify Visual Studio and install **Desktop development with C++**, MSVC v143, and a Windows SDK. If it returns a path, run the app from **Developer PowerShell for VS 2022** or use the `vswhere` launch command above.

The native project can be checked without starting the UI:

```powershell
$vswhere = "${env:ProgramFiles(x86)}\Microsoft Visual Studio\Installer\vswhere.exe"
$vsDevCmd = & $vswhere -latest -products * -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -find Common7\Tools\VsDevCmd.bat | Select-Object -First 1
cmd.exe /d /c "call `"$vsDevCmd`" -arch=x64 -host_arch=x64 && cargo check --manifest-path src-tauri\Cargo.toml"
```

Use `-arch=x64 -host_arch=x64` together with the default `stable-msvc` Rust toolchain to avoid mixing target architectures.

## Did the Visual Studio Installer finish?

These log lines indicate a successful installer run:

```text
Closing the installer with exit code 0
Exit Code: 0
```

Messages such as `Status changed to UpdateAvailable` after shutdown do not make that completed operation a failure. Open a new terminal after the installer exits; existing shells do not automatically receive the new SDK and toolchain environment.

## `icons/icon.ico` not found

Typical error:

```text
`icons/icon.ico` not found; required for generating a Windows Resource file during tauri-build
```

The expected project file is `src-tauri\icons\icon.ico`. First make sure the command is running from the repository root:

```powershell
Test-Path .\package.json
Test-Path .\src-tauri\icons\icon.ico
```

The icon is committed to this repository. If the generated icon set is missing or is being recreated, provide a square PNG or SVG source with transparency and run:

```powershell
npm install
npm run tauri icon .\src-tauri\icons\app-icon.png
```

Tauri writes the desktop icon set, including `icon.ico`, to `src-tauri\icons` by default.

## Build lock or stale development process

Cargo may print:

```text
Blocking waiting for file lock on build directory
```

This is normally informational: another Cargo or `tauri dev` process is using `src-tauri\target`. Wait for that build to finish, or stop the previous development process with `Ctrl+C` before starting another. It is not necessary to delete the target directory for ordinary linker or metadata failures.

## Verification checklist

Run these from the repository root before submitting a Windows change:

```powershell
npm test
npm run build
cargo check --manifest-path .\src-tauri\Cargo.toml
```

If the final command cannot locate Microsoft libraries from ordinary PowerShell, run it from Developer PowerShell for VS 2022 or through `VsDevCmd.bat` as shown above.

Current upstream references: [Tauri Windows prerequisites](https://v2.tauri.app/start/prerequisites/), [Tauri development command](https://v2.tauri.app/start/create-project/), and [Tauri application icons](https://v2.tauri.app/develop/icons/).
