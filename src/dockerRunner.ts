export interface ContainerHandle {
  containerId: string;
  previewUrl: string;
}

export interface DockerRunner {
  start(
    dockerArgs: string[],
    image: string,
    pullArgs?: string[],
  ): Promise<ContainerHandle>;
  stop(containerId: string): Promise<void>;
  stopInBackground(containerId: string): void;
  waitForServeReady(): Promise<void>;
}
