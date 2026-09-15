import * as fs from 'fs';
import * as vscode from 'vscode';
import {
  DockerCliRunner,
  followDockerLogs,
  spawnDetached,
} from './dockerCliRunner';
import { createHttpPageProbe } from './httpPageProbe';
import { PreviewController } from './previewController';
import { PreviewSession } from './previewSession';
import { createVscodeConfigurationReader } from './vscodeConfig';
import { createPreviewPanel } from './previewPanel';
import { OUTPUT_CHANNEL_NAME, OutputChannelLogger } from './previewLogger';

let controller: PreviewController | undefined;

export function activate(context: vscode.ExtensionContext): void {
  const logger = new OutputChannelLogger(
    vscode.window.createOutputChannel(OUTPUT_CHANNEL_NAME),
  );
  const runner = new DockerCliRunner(
    undefined,
    logger,
    followDockerLogs,
    spawnDetached,
  );
  const session = new PreviewSession(runner);
  controller = new PreviewController({
    session,
    readConfig: createVscodeConfigurationReader(),
    previewView: createPreviewPanel(),
    showError: (message) => {
      void vscode.window.showErrorMessage(message);
    },
    getWorkspaceRoot: () => vscode.workspace.workspaceFolders?.[0]?.uri.fsPath,
    getActiveEditorPath: () =>
      vscode.window.activeTextEditor?.document.uri.fsPath,
    fileExists: (filePath) => fs.existsSync(filePath),
    readTextFile: (filePath) => {
      try {
        return fs.readFileSync(filePath, 'utf8');
      } catch {
        return undefined;
      }
    },
    pageProbe: createHttpPageProbe(),
    logger,
  });

  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (workspaceRoot) {
    void runner.stopLeftoversForWorkspace(workspaceRoot);
  }

  context.subscriptions.push(
    logger,
    vscode.commands.registerCommand('mkdocsDockerPreview.start', () =>
      controller!.startPreview(),
    ),
    vscode.commands.registerCommand('mkdocsDockerPreview.stop', () =>
      controller!.stopPreview(),
    ),
    vscode.commands.registerCommand(
      'mkdocsDockerPreview.openFromExplorer',
      (uri?: vscode.Uri) => controller!.startPreview(uri?.fsPath),
    ),
    vscode.window.onDidChangeActiveTextEditor(() => {
      void controller?.syncToActiveEditor();
    }),
    vscode.workspace.onDidChangeWorkspaceFolders(() => {
      shutdown();
    }),
    {
      dispose: () => {
        shutdown();
      },
    },
  );
}

export async function deactivate(): Promise<void> {
  if (controller) {
    controller.stopInBackground();
    await controller.dispose();
    controller = undefined;
  }
}

function shutdown(): void {
  controller?.stopInBackground();
  void controller?.dispose();
}
