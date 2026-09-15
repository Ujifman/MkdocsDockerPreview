import * as vscode from 'vscode';
import { SETTINGS_SECTION } from './defaults';
import { ConfigurationReader } from './previewSettings';

export function createVscodeConfigurationReader(): ConfigurationReader {
  return {
    get<T>(key: string, defaultValue: T): T {
      return vscode.workspace
        .getConfiguration(SETTINGS_SECTION)
        .get<T>(key, defaultValue);
    },
  };
}
