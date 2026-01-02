## [1.0.3] - 2026-01-02

### Added
- **Comprehensive Laravel class support**: Extended class support to include ALL common Laravel classes
  - All classes from v1.0.2 plus enhanced coverage
  - Complete class mapping system with addClassMapping() API
  - Documentation for all supported scenarios

### Changed
- Version bump to 1.0.3 for comprehensive class support release
- Enhanced PhpSerializer with full class mapping capabilities

### Documentation
- Added `COMPREHENSIVE_CLASS_SUPPORT.md` - Complete feature guide
- Added `SUPPORTED_CLASSES.md` - Full class reference
- Updated all version references from 1.0.2 to 1.0.3
# Changelog

All notable changes to the Laravel Session SDK will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.2] - 2026-01-02

### Added
- **Comprehensive Laravel class support**: Added support for all common Laravel/PHP classes
  - `stdClass` - Generic PHP objects
  - `Illuminate\Support\Collection` - Laravel collections
  - `Illuminate\Database\Eloquent\Collection` - Eloquent model collections
  - `Carbon\Carbon` - Date/time objects
  - `Carbon\CarbonImmutable` - Immutable date objects
  - `Illuminate\Support\MessageBag` - Validation error messages
  - `Illuminate\Support\ViewErrorBag` - Multiple error bags
  - `Illuminate\Database\Eloquent\Model` - Eloquent models
- **Custom class mapping API**: New methods for adding custom class support
  - `PhpSerializer.addClassMapping()` - Add custom class mappings
  - `PhpSerializer.getClassMappings()` - Get current class mappings

### Fixed
- **PHP class deserialization errors**: Fixed all "Class not found in given scope" errors
  - Sessions with any common Laravel class now deserialize correctly
  - Proactive support for most Laravel session scenarios

### Changed
- Completely refactored `src/decoders/PhpSerializer.ts` with comprehensive class support
- Improved error messages for truly unknown classes

### Documentation
- Added `SUPPORTED_CLASSES.md` - Complete guide to supported classes
- Added `STDCLASS_FIX.md` - Technical details of the fix
- Added `CHANGELOG.md` - This file
- Added `VERSION_1.0.2_RELEASE.md` - Release notes

## [1.0.1] - 2025-12-XX

### Added
- Initial release of Laravel Session SDK
- Support for Database and Redis session stores
- Express.js middleware
- Next.js middleware
- NestJS support
- Session validation and user authentication
- TypeScript support
- Comprehensive documentation

### Features
- Validate Laravel sessions from Node.js applications
- Automatic session decryption
- CSRF token validation
- User authentication helpers
- 2FA verification support
- Custom session data access
- Multiple framework support (Express, Next.js, NestJS)

## [1.0.0] - 2025-12-XX

### Added
- Initial development version

---

## Version History Summary

| Version | Date | Changes |
|---------|------|---------|
| 1.0.2 | 2026-01-02 | Fixed stdClass deserialization |
| 1.0.1 | 2025-12-XX | Initial public release |
| 1.0.0 | 2025-12-XX | Development version |

## Upgrade Guide

### From 1.0.1 to 1.0.2

No breaking changes. Simply update the package:

```bash
npm update laravel-session-sdk
# or
yarn upgrade laravel-session-sdk
```

The stdClass fix is backward compatible and requires no code changes.

## Migration Notes

### Version 1.0.2

**What Changed:**
- PhpSerializer now properly handles stdClass objects

**Impact:**
- ✅ Sessions with stdClass objects will now work
- ✅ No code changes required
- ✅ Fully backward compatible

**Before (1.0.1):**
```
❌ Error: Class stdClass not found in given scope
```

**After (1.0.2):**
```
✅ Session deserialized successfully
```

## Known Issues

### Version 1.0.2
- None currently known

### Version 1.0.1
- ~~stdClass deserialization fails~~ (Fixed in 1.0.2)

## Upcoming Features

See [GitHub Issues](https://github.com/aakashkanojiya91299/laravel-session-sdk/issues) for planned features and enhancements.

Potential future additions:
- Support for more session drivers (File, Cookie, etc.)
- Session writing/updating capabilities
- More helper methods for common session operations
- Performance optimizations
- Additional middleware options

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on contributing to this project.

## Support

- **Issues**: [GitHub Issues](https://github.com/aakashkanojiya91299/laravel-session-sdk/issues)
- **Documentation**: [README.md](README.md)
- **Email**: aakash.wowrooms69@gmail.com

---

**Note**: This SDK is actively maintained. Please report any issues or suggestions on GitHub.
