import { ITiptapJson } from '../editor';
import TiptapRender, { IRenderConfig } from './TiptapRender';

class TiptapRenderFactory {
  private static instance: TiptapRenderFactory;
  private renderInstances: Map<string, TiptapRender> = new Map();

  private constructor() {}

  public static getInstance(): TiptapRenderFactory {
    if (!TiptapRenderFactory.instance) {
      TiptapRenderFactory.instance = new TiptapRenderFactory();
    }

    return TiptapRenderFactory.instance;
  }

  public getRenderInstance(
    key: string = 'main',
    json: ITiptapJson,
    config?: IRenderConfig
  ): TiptapRender {
    if (!this.renderInstances.has(key)) {
      const render = new TiptapRender(json, config);
      this.renderInstances.set(key, render);
    } else {
      const render = this.renderInstances.get(key)!;
      render.setJson(json);
      render.setConfig(config);
    }

    return this.renderInstances.get(key)!;
  }

  public removeRenderInstance(key: string): void {
    if (this.renderInstances.has(key)) {
      this.renderInstances.delete(key);
    }
  }
}

export default TiptapRenderFactory;
