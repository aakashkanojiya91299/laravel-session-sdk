🧪 HOW TO TEST LOCALLY
======================

METHOD 1: Quick Test (Recommended)
-----------------------------------
./QUICK_TEST.sh

This script will:
✓ Install dependencies
✓ Build the package
✓ Create npm link
✓ Show next steps

METHOD 2: Manual Testing
-------------------------
1. Build the package:
   npm install
   npm run build

2. Create global link:
   npm link

3. Create a test project:
   npx create-next-app@latest test-app --typescript
   cd test-app
   npm link @yourorg/laravel-session-sdk
   npm install mysql2

4. Follow examples in LOCAL_TESTING_GUIDE.md

QUICK VERIFICATION
------------------
# Check if build succeeded:
ls -la dist/

# Should see:
# - index.js
# - index.d.ts
# - Other compiled files

# Test import:
node -e "const sdk = require('./dist'); console.log(Object.keys(sdk));"

# Should output:
# [ 'LaravelSessionClient', 'SessionDecoder', ... ]

DOCUMENTATION
-------------
See LOCAL_TESTING_GUIDE.md for:
✓ Complete step-by-step testing
✓ Multiple testing methods
✓ Debugging tips
✓ Testing checklist
✓ Common issues & solutions

UNLINK WHEN DONE
-----------------
# In test project:
npm unlink @yourorg/laravel-session-sdk

# In SDK directory:
npm unlink

