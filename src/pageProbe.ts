export interface PageProbe {
  exists(url: string): Promise<boolean>;
}
