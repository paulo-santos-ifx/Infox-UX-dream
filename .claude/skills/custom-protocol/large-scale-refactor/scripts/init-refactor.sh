#!/bin/bash
# init-refactor.sh - Initialize refactoring environment

set -e

echo "🔧 Initializing large-scale refactor..."

# Create .refactor directory
mkdir -p .refactor

# Create initial files
cat > .refactor/task.md << 'EOF'
# Refactor Objective

[Description of the refactor - fill in]

# Problems Detected

- [Problem 1]
- [Problem 2]

# Target State

[How it should look after]

# Steps

1. [Step 1]
2. [Step 2]

# Risks

- [Risk]

# Rollback Plan

[How to revert if needed]
EOF

cat > .refactor/progress.md << 'EOF'
# Refactor Progress

## Overall
Status: NOT STARTED
Completed: 0/0 steps

## Step Details

(add as you progress)
EOF

echo "✅ Created:"
echo "  - .refactor/task.md"
echo "  - .refactor/progress.md"
echo ""
echo "📋 Next steps:"
echo "  1. Run scan: node scripts/scan.js src/"
echo "  2. Fill out .refactor/task.md with your refactor plan"
echo "  3. Start refactoring following the 5-phase pipeline"
