// Core exports - no external dependencies
export { LaravelSessionClient } from './LaravelSessionClient';
export { SessionDecoder } from './decoders/SessionDecoder';
export { PhpSerializer } from './decoders/PhpSerializer';
export { DatabaseStore } from './stores/DatabaseStore';
export { SessionValidator } from './validators/SessionValidator';

// Next.js middleware - safe to export (no external deps)
export {
  createNextJsMiddleware,
  validateNextJsSession,
  NextApiRequestWithSession,
} from './middleware/nextjs';

// Types
export * from './types';
