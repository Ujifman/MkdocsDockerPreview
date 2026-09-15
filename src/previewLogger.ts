export const OUTPUT_CHANNEL_NAME = 'MkdocsDockerPreview';

export interface PreviewLogger {
  info(message: string): void;
  error(message: string): void;
  append(text: string): void;
  clear(): void;
  show(): void;
  dispose(): void;
}

export interface OutputChannelLike {
  append(value: string): void;
  appendLine(value: string): void;
  clear(): void;
  show(preserveFocus?: boolean): void;
  dispose(): void;
}

export type Clock = () => Date;

export class OutputChannelLogger implements PreviewLogger {
  constructor(
    private readonly channel: OutputChannelLike,
    private readonly now: Clock = () => new Date(),
  ) {}

  info(message: string): void {
    this.channel.appendLine(this.format('INFO', message));
  }

  error(message: string): void {
    this.channel.appendLine(this.format('ERROR', message));
    this.show();
  }

  append(text: string): void {
    this.channel.append(text);
  }

  clear(): void {
    this.channel.clear();
  }

  show(): void {
    this.channel.show(true);
  }

  dispose(): void {
    this.channel.dispose();
  }

  private format(level: string, message: string): string {
    return `[${this.now().toISOString()}] ${level} ${message}`;
  }
}
