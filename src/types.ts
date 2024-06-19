import { paths } from './openapi'

type codes = '400' | '401' | '403' | '404' | '500';

export type ErrorResponse =
  paths['/v1/liveness']['get']['responses'][codes]['content']['application/json'];

export const timeoutError = {
  error: {
    // @ts-ignore
    code: 'TIMEOUT_ERROR',
    message: 'No response',
    docs: '',
    requestId: 'N/A',
  },
}

export type Result<R> =
  | {
  result: R;
  error?: never;
}
  | {
  result?: never;
  error: ErrorResponse['error'] | (typeof timeoutError)['error'];
};