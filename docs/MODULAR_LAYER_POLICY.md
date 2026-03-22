# MODULAR_LAYER_POLICY.md

## Purpose

rules / skills / provider-specific helpers のような optional layer を、generator core と混ぜずに導入するための方針を定義する。

## Core Rule

RepoGenesis の core は次だけを責務にする。

- `ProjectSpec` の validation
- starter repository の構造生成
- provider-neutral な project truth (`PROJECT.md`, `docs/`, runbooks) の生成
- generated output の再現性と検査

optional layer は、project ごとに opt-in で乗る追加運用知識として扱う。

## What belongs in core

- repository structure
- planning docs
- security / versioning baseline
- provider-neutral `docs/AI_TOOLING.md`
- doctor / manifest / runbook bundle のような contract surface

## What belongs in optional layer

- tool-specific helper instructions
- curated skills
- review workflow packs
- release / deploy helper guides
- provider-specific command / context / extension artifacts

## What must stay out of both by default

- project 固有 business logic
- unreviewed hooks
- editor settings の強制配布
- runtime behavior を変える code injection
- user ごとに分岐する personalized output

## Introduction Rules

1. optional layer は generator output の source of truth を上書きしてはならない。
2. optional layer は `copy + pin` または reviewable artifact として repository に残る必要がある。
3. provider-specific artifact は thin overlay に留め、shared rule は core docs に戻す。
4. high-risk artifact は opt-in と review を必須にする。
5. optional layer の追加時は、install / remove / audit の追跡方法を先に決める。

## Acceptance Gate

新しい modular layer を追加する前に次を満たす。

- core を入れなくても project が成立する
- 追加 artifact の path と owner が明確
- remove 時に project を壊さない
- CLI / local ZIP / remote ZIP で contract が一致する
- docs と manifest だけで現状を追える

## Current Application

現時点では次の扱いにする。

- `docs/AI_TOOLING.md`: core
- `AGENTS.md` / `CLAUDE.md` / `GEMINI.md`: thin wrapper
- `skills/README.md` / `repogenesis.skills.json`: optional layer contract
- curated registry artifacts: optional layer

## Non-Goals

- generator core に skill 本文を埋め込むこと
- optional layer の自動配布
- provider-specific workflow を project truth へ昇格させること
