# 🛠️ Recovery Commands Reference

This document contains exact commands for each recovery option. **DO NOT RUN** until you've selected an option and created a backup.

---

## 🔐 Safety Steps (REQUIRED BEFORE ANY OPTION)

```bash
# 1. Create backup branch with timestamp
git checkout -b backup/$(date +%Y%m%d-%H%M%S)

# 2. Push backup to remote
git push origin backup/$(date +%Y%m%d-%H%M%S)

# 3. Return to main
git checkout main

# 4. Verify current frontend builds
cd frontend && npm run build && cd ..

# 5. Verify backend tests (if applicable)
cd backend && python -m pytest --version && cd ..
cd app && python -m pytest --version && cd ..
```

---

## 🟢 Option 1: Selective Merge (Backend Only)

**What This Does:**
- Restores backend improvements from `e07415f`
- Keeps current working frontend untouched
- Safest option with minimal risk

**Files That Will Change:**
- `app/` directory (all Python files)
- `backend/` directory (all Python files)  
- `supabase/` directory (migration files)
- `requirements.txt`
- **NO frontend files will be touched**

### Commands:

```bash
# Step 1: Create recovery branch
git checkout -b recovery/selective-merge

# Step 2: Restore backend files from e07415f
git checkout e07415f -- app/ backend/ supabase/ requirements.txt

# Step 3: Review what will be restored
git status
git diff --cached --stat

# Step 4: If satisfied, commit the restoration
git commit -m "restore: merge backend improvements from pre-revert state (e07415f)"

# Step 5: Test backend integration
cd backend && python -m pytest && cd ..
cd app && python -m pytest && cd ..

# Step 6: If tests pass, merge to main
git checkout main
git merge recovery/selective-merge --no-ff -m "merge: restore backend improvements"

# Step 7: Verify frontend still builds
cd frontend && npm run build && cd ..

# Step 8: Push to remote (if satisfied)
git push origin main
```

**Expected Output:**
- Backend services updated
- Frontend remains unchanged
- Build should still pass

---

## 🟡 Option 2: Full Restore (Frontend + Backend)

**What This Does:**
- Restores complete frontend from `e07415f` (Vite build, all advanced features)
- Restores all backend improvements
- **WARNING:** This will replace your current working frontend

**Files That Will Change:**
- **ALL** `frontend/` files (~100+ files)
- **ALL** `app/` and `backend/` files
- `package.json`, `package-lock.json`
- Build configuration (Vite vs React Scripts)

### Commands:

```bash
# Step 1: Create backup (already done in safety steps)
# Ensure backup branch exists and is pushed

# Step 2: Create recovery branch
git checkout -b recovery/full-restore

# Step 3: Restore frontend from e07415f
git checkout e07415f -- frontend/

# Step 4: Review conflicts (there may be many)
git status

# Step 5: Check for conflicts in key files
git diff --check

# Step 6: If conflicts exist, resolve manually:
# - Open conflicted files
# - Resolve merge conflicts
# - Stage resolved files: git add <file>

# Step 7: Restore backend files
git checkout e07415f -- app/ backend/ supabase/ requirements.txt

# Step 8: Install new frontend dependencies (Vite)
cd frontend
rm -rf node_modules package-lock.json
npm install
cd ..

# Step 9: Test frontend build (may fail initially)
cd frontend && npm run build && cd ..

# Step 10: If build fails, check errors and fix:
# - Missing dependencies
# - Import path issues
# - TypeScript errors
# - Configuration mismatches

# Step 11: Test backend
cd backend && python -m pytest && cd ..
cd app && python -m pytest && cd ..

# Step 12: If everything works, commit
git add .
git commit -m "restore: full frontend and backend from pre-revert state (e07415f)"

# Step 13: Merge to main
git checkout main
git merge recovery/full-restore --no-ff -m "merge: full restore from e07415f"

# Step 14: Final verification
cd frontend && npm run build && cd ..
cd backend && python -m pytest && cd ..

# Step 15: Push to remote (if satisfied)
git push origin main
```

**Expected Issues:**
- Build configuration conflicts (Vite vs React Scripts)
- Dependency mismatches
- Import path changes
- TypeScript errors
- May require significant debugging

---

## 🔵 Option 3: Cherry-Pick (Selective Backend Commits)

**What This Does:**
- Restores specific backend commits only
- Keeps current working frontend
- Most granular control

**Files That Will Change:**
- Only files changed in selected commits
- Primarily backend files
- Database migrations

### Commands:

```bash
# Step 1: View available commits to cherry-pick
git log --oneline e07415f..83df8bf

# Step 2: Create recovery branch
git checkout -b recovery/cherry-pick

# Step 3: Cherry-pick specific commits (examples)
# Migration commits:
git cherry-pick 2a0321e  # pet_inventory table migration
git cherry-pick 248fa03  # migration idempotency fixes

# Service improvements:
git cherry-pick 83df8bf  # inventory tracking, optimistic UI updates
git cherry-pick bfac280  # Supabase integration improvements

# Step 4: If conflicts occur during cherry-pick:
# - Git will pause and show conflicts
# - Resolve conflicts manually
# - Continue: git cherry-pick --continue
# - Or abort: git cherry-pick --abort

# Step 5: Review what was cherry-picked
git log --oneline -n 5

# Step 6: Test backend
cd backend && python -m pytest && cd ..
cd app && python -m pytest && cd ..

# Step 7: Verify frontend still builds
cd frontend && npm run build && cd ..

# Step 8: If satisfied, merge to main
git checkout main
git merge recovery/cherry-pick --no-ff -m "merge: cherry-picked backend improvements"

# Step 9: Push to remote
git push origin main
```

**Recommended Commits to Cherry-Pick:**
- `2a0321e` - pet_inventory table migration
- `83df8bf` - inventory tracking, optimistic UI updates
- `bfac280` - Supabase integration improvements
- `248fa03` - migration idempotency fixes
- `9f050aa` - Supabase authentication fixes

---

## 🔴 Option 4: Do Nothing

**What This Does:**
- Keeps current demo state
- No changes made
- No recovery performed

### Commands:

```bash
# No commands needed - just document current state

# Optional: Create a note about current state
echo "Current state preserved as of $(date)" > CURRENT_STATE.md
git add CURRENT_STATE.md
git commit -m "docs: document current demo state preservation"
git push origin main
```

**Result:**
- Current working frontend remains
- Backend remains as-is
- Lost features stay lost
- No risk, no recovery

---

## ⚠️ Conflict Resolution Guide

If conflicts occur during any option:

### 1. Identify Conflicts
```bash
git status  # Shows files with conflicts
```

### 2. Open Conflicted Files
Look for conflict markers:
```
<<<<<<< HEAD
Current code
=======
Code from e07415f
>>>>>>> e07415f
```

### 3. Resolve Conflicts
- Keep current code (HEAD)
- Keep restored code (e07415f)
- Merge both manually
- Or use a merge tool: `git mergetool`

### 4. Stage Resolved Files
```bash
git add <resolved-file>
```

### 5. Continue Operation
```bash
# For merge:
git commit

# For cherry-pick:
git cherry-pick --continue
```

---

## ✅ Verification Checklist

After any recovery option:

- [ ] Frontend builds: `cd frontend && npm run build`
- [ ] Backend tests pass: `cd backend && python -m pytest`
- [ ] App tests pass: `cd app && python -m pytest`
- [ ] No TypeScript errors: `cd frontend && npm run lint`
- [ ] Git status is clean: `git status`
- [ ] All changes committed: `git log -1`
- [ ] Backup branch exists: `git branch | grep backup`

---

## 📞 Rollback Instructions

If something goes wrong:

```bash
# Option A: Reset to backup branch
git checkout backup/YYYYMMDD-HHMMSS
git checkout -b recovery/rollback
git checkout main
git reset --hard backup/YYYYMMDD-HHMMSS
git push origin main --force  # ⚠️ Use with caution

# Option B: Revert the merge
git revert -m 1 <merge-commit-hash>
git push origin main

# Option C: Abort current operation
git merge --abort
git cherry-pick --abort
```

---

**Remember:** Always create a backup before starting any recovery operation!

