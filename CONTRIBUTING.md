# Contributing to Timeline Timer

Pull requests are welcome. Small, focused improvements are especially helpful: bug fixes, accessibility work, keyboard behavior, cross-platform polish, tests, and documentation.

Timeline Timer has primarily been developed and tested on Windows. The project includes a dedicated [Windows development and troubleshooting guide](./WINDOWS_DEVELOPMENT.md) covering Rust, Visual Studio Build Tools, Windows SDK, linker, and icon issues. Contributions that improve Linux and macOS behavior are very welcome.

## Development

Install the platform prerequisites for Tauri v2, then run:

```sh
npm install
npm run tauri dev
```

Before opening a pull request, run:

```sh
npm test
npm run build
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
cargo check --locked --manifest-path src-tauri/Cargo.toml
```

Please keep pull requests scoped, explain the user-visible effect, add or update tests for behavioral changes, and include screenshots or a short recording for visual changes. Update documentation when settings, shortcuts, or setup steps change. Do not commit generated `dist`, `node_modules`, or Rust `target` content.

By contributing, you agree that your contribution is licensed under the [MIT License](./LICENSE).
