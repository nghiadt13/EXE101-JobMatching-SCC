import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';

export type RequestContext = {
  requestId: string;
  method: string;
  path: string;
  actorId?: string;
};

@Injectable()
export class RequestContextService {
  private readonly storage = new AsyncLocalStorage<RequestContext>();

  run<T>(context: RequestContext, callback: () => T): T {
    return this.storage.run(context, callback);
  }

  get(): RequestContext | undefined {
    return this.storage.getStore();
  }

  getRequestId(): string | undefined {
    return this.get()?.requestId;
  }

  setActorId(actorId: string) {
    const current = this.storage.getStore();
    if (!current) {
      return;
    }

    current.actorId = actorId;
  }
}
