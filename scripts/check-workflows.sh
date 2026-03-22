#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "==> Validate GitHub workflow YAML"
ruby -e '
require "yaml"
Dir[File.join(ARGV[0], ".github/workflows/*.yml")].sort.each do |path|
  YAML.load_file(path)
  puts "ok #{File.basename(path)}"
end
' "$ROOT_DIR"

echo
echo "==> Validate smoke shell scripts"
bash -n "$ROOT_DIR/scripts/smoke-deployed-stack.sh"
bash -n "$ROOT_DIR/generator/scripts/smoke-orchestration.sh"
echo "ok smoke shell syntax"
