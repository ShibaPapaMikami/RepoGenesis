import { describe, it, expect } from 'vitest';
import { projectBriefSchema, projectSpecSchema } from '../src/schema';

function validBrief(overrides: Record<string, unknown> = {}) {
  return {
    project: {
      name: 'Test Project',
      slug: 'test-project',
      description: 'This is a test project for validation',
      owner: 'Test Owner',
      created_at: '2026-01-01T00:00:00.000Z',
    },
    tech: {
      domains: ['web'],
      primary_language: 'typescript',
      frameworks: [],
      ai_tools: ['claude_code'],
      ai_tool: 'claude_cli',
      ai_tool_detail: '',
    },
    security: {
      level: 'low',
      has_api_keys: false,
      has_user_data: false,
      has_payment_data: false,
      has_ip_sensitive: false,
      has_credentials: false,
    },
    structure: {
      repo_type: 'single',
      repos: [],
    },
    workflow: {
      phases_count: 3,
    },
    ...overrides,
  };
}

describe('projectBriefSchema', () => {
  it('should pass with valid single-repo brief', () => {
    const result = projectBriefSchema.safeParse(validBrief());
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tech.ai_tools).toEqual(['claude_code']);
      expect(result.data.tech.ai_tool).toBe('claude_cli');
    }
  });

  it('should accept codex in ai_tools', () => {
    const result = projectBriefSchema.safeParse(validBrief({
      tech: {
        ...validBrief().tech,
        ai_tools: ['codex', 'claude_code'],
        ai_tool: 'claude_cli',
      },
    }));
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tech.ai_tools).toEqual(['codex', 'claude_code']);
      expect(result.data.tech.ai_tool).toBe('claude_cli');
      expect(result.data.tech.ai_tool_detail).toContain('Codex');
    }
  });

  it('should pass with legacy ai_tool only and normalize to ai_tools', () => {
    const brief = validBrief();
    delete (brief.tech as Record<string, unknown>).ai_tools;
    const result = projectBriefSchema.safeParse(brief);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tech.ai_tools).toEqual(['claude_code']);
      expect(result.data.tech.ai_tool).toBe('claude_cli');
    }
  });

  it('should fail when neither ai_tools nor legacy ai_tool are provided', () => {
    const brief = validBrief();
    delete (brief.tech as Record<string, unknown>).ai_tools;
    delete (brief.tech as Record<string, unknown>).ai_tool;
    const result = projectBriefSchema.safeParse(brief);
    expect(result.success).toBe(false);
  });

  it('should fail when project.name is empty', () => {
    const brief = validBrief();
    (brief.project as Record<string, unknown>).name = '';
    const result = projectBriefSchema.safeParse(brief);
    expect(result.success).toBe(false);
  });

  it('should fail when project.slug is invalid', () => {
    const brief = validBrief();
    (brief.project as Record<string, unknown>).slug = 'INVALID SLUG';
    const result = projectBriefSchema.safeParse(brief);
    expect(result.success).toBe(false);
  });

  it('should fail when project.description is too short', () => {
    const brief = validBrief();
    (brief.project as Record<string, unknown>).description = 'short';
    const result = projectBriefSchema.safeParse(brief);
    expect(result.success).toBe(false);
  });

  it('should allow empty tech.domains for ai-first drafts', () => {
    const brief = validBrief();
    (brief.tech as Record<string, unknown>).domains = [];
    const result = projectBriefSchema.safeParse(brief);
    expect(result.success).toBe(true);
  });

  it('should allow empty project.owner for ai-first drafts', () => {
    const brief = validBrief();
    (brief.project as Record<string, unknown>).owner = '';
    const result = projectBriefSchema.safeParse(brief);
    expect(result.success).toBe(true);
  });

  it('should pass with valid multi-repo brief', () => {
    const brief = validBrief({
      structure: {
        repo_type: 'multi',
        repos: [
          { name: 'frontend', type: 'frontend', description: 'UI app', owner: 'Alice', depends_on: [] },
          { name: 'backend', type: 'backend', description: 'API server', owner: 'Bob', depends_on: ['frontend'] },
        ],
      },
    });
    const result = projectBriefSchema.safeParse(brief);
    expect(result.success).toBe(true);
  });

  it('should fail when multi-repo has no repos', () => {
    const brief = validBrief({
      structure: {
        repo_type: 'multi',
        repos: [],
      },
    });
    const result = projectBriefSchema.safeParse(brief);
    expect(result.success).toBe(false);
  });

  it('should fail when multi-repo has duplicate names', () => {
    const brief = validBrief({
      structure: {
        repo_type: 'multi',
        repos: [
          { name: 'api', type: 'backend', description: 'API 1', owner: 'Alice', depends_on: [] },
          { name: 'api', type: 'backend', description: 'API 2', owner: 'Bob', depends_on: [] },
        ],
      },
    });
    const result = projectBriefSchema.safeParse(brief);
    expect(result.success).toBe(false);
  });

  it('should fail when depends_on references self', () => {
    const brief = validBrief({
      structure: {
        repo_type: 'multi',
        repos: [
          { name: 'api', type: 'backend', description: 'API', owner: 'Alice', depends_on: ['api'] },
        ],
      },
    });
    const result = projectBriefSchema.safeParse(brief);
    expect(result.success).toBe(false);
  });

  it('should fail when depends_on references non-existent repo', () => {
    const brief = validBrief({
      structure: {
        repo_type: 'multi',
        repos: [
          { name: 'api', type: 'backend', description: 'API', owner: 'Alice', depends_on: ['nonexistent'] },
        ],
      },
    });
    const result = projectBriefSchema.safeParse(brief);
    expect(result.success).toBe(false);
  });

  it('should fail when security.level is below minimum for flags', () => {
    const brief = validBrief({
      security: {
        level: 'low',
        has_api_keys: false,
        has_user_data: true,
        has_payment_data: false,
        has_ip_sensitive: false,
        has_credentials: false,
      },
    });
    const result = projectBriefSchema.safeParse(brief);
    expect(result.success).toBe(false);
  });

  it('should pass when security.level matches flag minimum (medium for has_user_data)', () => {
    const brief = validBrief({
      security: {
        level: 'medium',
        has_api_keys: false,
        has_user_data: true,
        has_payment_data: false,
        has_ip_sensitive: false,
        has_credentials: false,
      },
    });
    const result = projectBriefSchema.safeParse(brief);
    expect(result.success).toBe(true);
  });

  it('should require high when has_payment_data is true', () => {
    const brief = validBrief({
      security: {
        level: 'medium',
        has_api_keys: false,
        has_user_data: false,
        has_payment_data: true,
        has_ip_sensitive: false,
        has_credentials: false,
      },
    });
    const result = projectBriefSchema.safeParse(brief);
    expect(result.success).toBe(false);
  });

  it('should require high when has_credentials is true', () => {
    const brief = validBrief({
      security: {
        level: 'medium',
        has_api_keys: false,
        has_user_data: false,
        has_payment_data: false,
        has_ip_sensitive: false,
        has_credentials: true,
      },
    });
    const result = projectBriefSchema.safeParse(brief);
    expect(result.success).toBe(false);
  });
});

describe('projectSpecSchema', () => {
  function validSpec(overrides: Record<string, unknown> = {}) {
    return {
      specVersion: '1.0',
      ...validBrief(),
      ...overrides,
    };
  }

  it('should pass with valid specVersion 1.0', () => {
    const result = projectSpecSchema.safeParse(validSpec());
    expect(result.success).toBe(true);
  });

  it('should fail when specVersion is missing', () => {
    const spec = validSpec();
    delete (spec as Record<string, unknown>).specVersion;
    const result = projectSpecSchema.safeParse(spec);
    expect(result.success).toBe(false);
  });

  it('should fail when specVersion is unsupported', () => {
    const result = projectSpecSchema.safeParse(validSpec({ specVersion: '2.0' }));
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message).join(' ');
      expect(messages).toContain('Unsupported specVersion');
    }
  });

  it('should fail when specVersion is a number instead of string', () => {
    const result = projectSpecSchema.safeParse(validSpec({ specVersion: 1.0 }));
    expect(result.success).toBe(false);
  });

  it('should still enforce business rules (e.g. security level)', () => {
    const result = projectSpecSchema.safeParse(validSpec({
      security: {
        level: 'low',
        has_api_keys: false,
        has_user_data: true,
        has_payment_data: false,
        has_ip_sensitive: false,
        has_credentials: false,
      },
    }));
    expect(result.success).toBe(false);
  });
});
