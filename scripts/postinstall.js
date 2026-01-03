#!/usr/bin/env node
/**
 * Post-install script
 *
 * Shows helpful information after installation.
 */

const message = `
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   AI Excellence Framework installed successfully!          ║
║                                                            ║
║   Quick start:                                             ║
║     npx ai-excellence init         Initialize framework    ║
║     npx ai-excellence validate     Check configuration     ║
║     npx ai-excellence doctor       Diagnose issues         ║
║                                                            ║
║   Documentation:                                           ║
║     https://ai-excellence-framework.github.io/             ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
`;

// Only show in interactive terminals, not in CI
if (process.stdout.isTTY && !process.env.CI) {
  console.log(message);
}
