# Session Restart Protocol

You are resuming work on this project. Follow these steps exactly.

## Step 1: Read Constitution
Read `claude.md` in the project root. This contains absolute rules you must follow.

## Step 2: Read Current State
Read `docs/ACTIVE_CONTEXT.md`. This is the single source of truth for what has been done, what is in progress, and what is blocked.

## Step 3: Read Requirements
Read `docs/REQUIREMENTS.md` to understand what the system must do.

## Step 4: Summarize
Before taking any action, output a summary:
- Current phase
- What was last completed
- What is in progress
- What is blocked
- What the next step should be

## Step 5: Wait
Do not proceed until the user confirms the summary is correct and gives a specific task.

## Rules
- Do not guess what happened since last session.
- Do not assume any work was done outside this repository.
- If files have changed since ACTIVE_CONTEXT.md was last updated, flag the discrepancy.
- Never skip steps 1-4.
