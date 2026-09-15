import * as vscode from 'vscode';
import { PreviewView, ShowLiveOptions } from './previewController';

export const PREVIEW_VIEW_TYPE = 'mkdocsDockerPreview.preview';

export function createPreviewPanel(): PreviewView {
  return new WebviewPreviewView();
}

class WebviewPreviewView implements PreviewView {
  private panel: vscode.WebviewPanel | undefined;

  isOpen(): boolean {
    return this.panel !== undefined;
  }

  showLoading(): void {
    const panel = this.ensurePanel();
    panel.webview.html = loadingHtml();
    panel.reveal(undefined, true);
  }

  showLive(url: string, options?: ShowLiveOptions): void {
    const reveal = options?.reveal !== false;
    if (!reveal && !this.panel) {
      return;
    }
    const panel = this.ensurePanel();
    panel.webview.html = liveHtml(url);
    if (reveal) {
      panel.reveal(undefined, true);
    }
  }

  private ensurePanel(): vscode.WebviewPanel {
    if (this.panel) {
      return this.panel;
    }
    this.panel = vscode.window.createWebviewPanel(
      PREVIEW_VIEW_TYPE,
      'MkDocs Preview',
      { viewColumn: vscode.ViewColumn.Beside, preserveFocus: true },
      { enableScripts: true, retainContextWhenHidden: true },
    );
    this.panel.onDidDispose(() => {
      this.panel = undefined;
    });
    return this.panel;
  }
}

function loadingHtml(): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline';">
  <style>
    html, body {
      height: 100%;
      margin: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: sans-serif;
      background: var(--vscode-editor-background, #1e1e1e);
      color: var(--vscode-foreground, #ccc);
    }
    .wrap { text-align: center; }
    .spinner {
      width: 32px;
      height: 32px;
      margin: 0 auto 12px;
      border: 3px solid rgba(127, 127, 127, 0.35);
      border-top-color: var(--vscode-progressBar-background, #89d185);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="spinner"></div>
    <p>Building documentation…</p>
  </div>
</body>
</html>`;
}

function liveHtml(url: string): string {
  const safeUrl = escapeHtml(url);
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; frame-src http://127.0.0.1:* http://localhost:*; style-src 'unsafe-inline';">
  <style>
    html, body, iframe { margin: 0; padding: 0; height: 100%; width: 100%; border: 0; }
  </style>
</head>
<body>
  <iframe src="${safeUrl}" title="MkDocs Preview"></iframe>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
