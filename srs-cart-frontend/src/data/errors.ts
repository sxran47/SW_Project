import type { UIMessage } from '../types/ui';

export class PreviewError extends Error {
  constructor(
    public code: string,
    message: string,
    public fields: string[] = [],
    public productIds: string[] = [],
  ) {
    super(message);
    this.name = 'PreviewError';
  }
}

export function errorMessage(error: unknown): UIMessage {
  if (error instanceof PreviewError) {
    return { kind: 'error', code: error.code, message: error.message, fields: error.fields, productIds: error.productIds };
  }
  return { kind: 'error', code: '', message: 'Unable to update this preview. Please try again.' };
}
