# Changelog

All notable changes to the Laravel Session SDK will be documented in this file.

## [1.4.6] - 2026-01-09

### Fixed
- Fixed TypeScript compilation errors
- Removed unused imports and variables
- Fixed import paths in SessionDecoder and SessionValidator

### Added
- Added CONTRIBUTING.md with comprehensive contribution guidelines
- Added security guidelines for contributors
- Added development workflow documentation

## [1.4.5] - 2026-01-09

### Fixed
- Fixed import path issues in SessionDecoder.ts
- Resolved TypeScript compilation warnings

## [1.4.4] - 2026-01-09

### Security
- **Fixed CWE-312 (Cleartext Storage)**: Removed logging of sensitive data including passwords, tokens, and session IDs
- **Fixed CWE-359 (Privacy Violation)**: Sanitized all debug logs to prevent exposure of user information, session data, and authentication tokens
- **Fixed CWE-532 (Sensitive Info in Logs)**: Implemented comprehensive log sanitization utilities to mask sensitive information in debug output
- Added `SecurityUtils` module with functions to sanitize sensitive data in logs
- Session IDs are now masked/truncated in logs (shows only first 8 chars) by default
- Decrypted values, MAC addresses, and session payloads are no longer logged in full by default
- User IDs and email addresses are sanitized in debug output by default
- Full session data and permissions data are sanitized before logging by default

### Added
- **Log verbosity levels**: New `logLevel` configuration option
  - `'secure'` (default): Sanitized logs, no sensitive data exposed (recommended for production)
  - `'verbose'`: Full logs with sensitive data (use only in secure development environments)
- Developers can now opt-in to verbose logging when needed for debugging

### Changed
- All debug logging now uses sanitization utilities by default to prevent sensitive data exposure
- Error messages are sanitized to remove potential sensitive information by default
- Logging shows sanitized/masked versions of sensitive data in secure mode (default)
- Verbose mode available for debugging when explicitly enabled

## [1.4.2] - 2026-01-09

### Improved
- Updated installation instructions in README to clarify driver-based dependencies
- Enhanced documentation for peer dependencies (mysql2, redis)
- Improved installation section with clearer explanations

## [1.4.1] - 2026-01-08

### Added
- **Redis session driver support**: Full support for Redis session storage
  - Redis sessions can now be validated alongside database sessions
  - RedisStore implementation with debug logging
  - Database still required for user/role/permission queries when using Redis driver

### Fixed
- Enabled Redis driver support in LaravelSessionClient (was previously disabled)
- Added debug logging to RedisStore to match DatabaseStore functionality

### Improved
- Updated README with comprehensive Redis driver documentation
- Added Redis setup instructions in Laravel Setup section
- Enhanced FAQ section with Redis-related questions

## [1.4.0] - 2026-01-05

### Added
- **Conditional debug logging**: All logging now respects the `debug` configuration option
  - Logging only occurs when `debug: true` is set in configuration
  - Reduces console noise in production environments
  - All classes (`LaravelSessionClient`, `SessionDecoder`, `DatabaseStore`) now support conditional logging

### Changed
- `LaravelSessionClient` now accepts and passes `debug` flag to child components
- `SessionDecoder` constructor now accepts optional `debug` parameter (default: `false`)
- `DatabaseStore` constructor now accepts optional `debug` parameter (default: `false`)
- All `console.log` and `console.error` calls replaced with conditional logging methods

### Improved
- Better production performance by eliminating unnecessary logging
- Cleaner console output when debug mode is disabled
- Debug mode can be easily toggled via configuration

## [1.3.0] - 2025-01-02

### Added
- **Multiple permissions keys support**: `permissionsKey` now accepts an array of strings to extract multiple session keys at once
  - Example: `permissionsKey: ['permissions', 'competitionIds', 'competitionsData', 'competitionCategories']`
  - Returns an object containing all requested keys
  - Backward compatible: single string still works as before
  - Perfect for extracting competition data, categories, and other custom session keys

### Changed
- `permissionsKey` type changed from `string` to `string | string[]` to support multiple keys
- `SessionDecoder.getPermissions()` now handles both single key and array of keys
- `DatabaseStore` constructor signature updated to accept array of permission keys
- `RedisStore` constructor signature updated to accept array of permission keys
- `SessionDecoder.getNestedValue()` extracted as a private helper method for reusability

### Improved
- Better logging for permission extraction process showing which keys were found/not found
- Enhanced support for extracting multiple types of data from session (permissions, competitions, categories, etc.)
- More flexible session data extraction

## [1.2.0] - 2025-01-02

### Added
- **Dual-source permissions strategy**: Permissions are now fetched from session payload first, with automatic fallback to database tables
- **Database fallback for permissions**: If permissions are not found in the session payload, the SDK automatically fetches them from database tables (`user_roles`, `modules`, `links`)
- **Configurable permissions key**: Users can now specify custom keys for permissions in session via `permissionsKey` config option
- **Support for nested permission keys**: Dot notation support (e.g., `user.permissions`, `auth.permissions`)

### Changed
- `DatabaseStore.getUserPermissions()` now tries session payload first, then falls back to database queries
- Updated `DatabaseStore` constructor to accept `appKey` and `permissionsKey` parameters
- Updated `RedisStore` constructor to pass through `appKey` and `permissionsKey` to DatabaseStore

### Improved
- Better logging for permission extraction process
- More detailed error messages when permissions cannot be found
- Automatic detection of common permission keys in session

## [1.1.0] - 2025-01-02

### Added
- Configurable permissions key in `LaravelSessionConfig`
- Support for extracting permissions from session payload
- Extensive logging for debugging session decoding

### Changed
- `SessionDecoder.getPermissions()` now accepts configurable permission key
- Improved PHP class support (stdClass, Collections, Carbon, etc.)

## [1.0.5] - 2025-01-01

### Fixed
- Fixed stdClass handling in PHP unserialize

## [1.0.4] - 2025-01-01

### Added
- Added `getUserPermissions` method to `StoreInterface`
- Redis store now delegates permission queries to DatabaseStore

## [1.0.3] - 2024-12-31

### Initial Release
- Basic Laravel session validation
- Database and Redis session drivers
- Express and NestJS middleware support
- Session cookie decryption
- Session payload decoding
