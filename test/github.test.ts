import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createLightweightTag, getApiContext, lookupTag, type TagLookupResult } from '../src/github';

function jsonResponse(body: unknown, init: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    headers: {
      'Content-Type': 'application/json',
    },
    ...init,
  });
}

describe('GitHub API helpers', () => {
  const originalFetch = global.fetch;
  const originalRepository = process.env.GITHUB_REPOSITORY;

  beforeEach(() => {
    process.env.GITHUB_REPOSITORY = 'y-writings/snapshot-tag-action';
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.GITHUB_REPOSITORY = originalRepository;
    vi.restoreAllMocks();
  });

  it('returns a parsed API context from environment variables', () => {
    const context = getApiContext('token-value');

    expect(context).toEqual({
      token: 'token-value',
      owner: 'y-writings',
      repo: 'snapshot-tag-action',
      apiBaseUrl: 'https://api.github.com',
    });
  });

  it('reports a missing tag when the API returns 404', async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response('Not Found', { status: 404, statusText: 'Not Found' }));

    const context = getApiContext('token-value');

    await expect(lookupTag(context, 'v2026.04.19')).resolves.toEqual({
      exists: false,
      ref: 'refs/tags/v2026.04.19',
    } satisfies TagLookupResult);
  });

  it('returns a clear error when lookup is forbidden', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: 'Resource not accessible by integration' }), {
        status: 403,
        statusText: 'Forbidden',
      }),
    );

    const context = getApiContext('token-value');

    await expect(lookupTag(context, 'v2026.04.19')).rejects.toThrow(
      'GitHub API rejected tag lookup with 403 Forbidden. Ensure the workflow token can read repository contents.',
    );
  });

  it('dereferences an existing lightweight tag to its commit SHA', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      jsonResponse(
        {
          ref: 'refs/tags/v2026.04.19',
          object: {
            type: 'commit',
            sha: 'abc123',
          },
        },
        { status: 200 },
      ),
    );

    const context = getApiContext('token-value');

    await expect(lookupTag(context, 'v2026.04.19')).resolves.toEqual({
      exists: true,
      ref: 'refs/tags/v2026.04.19',
      sha: 'abc123',
    });
  });

  it('dereferences an existing annotated tag to its commit SHA', async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(
          {
            ref: 'refs/tags/v2026.04.19',
            object: {
              type: 'tag',
              sha: 'tag-object-sha',
            },
          },
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        jsonResponse(
          {
            sha: 'tag-object-sha',
            object: {
              type: 'commit',
              sha: 'commit-sha',
            },
          },
          { status: 200 },
        ),
      );

    const context = getApiContext('token-value');

    await expect(lookupTag(context, 'v2026.04.19')).resolves.toEqual({
      exists: true,
      ref: 'refs/tags/v2026.04.19',
      sha: 'commit-sha',
    });
  });

  it('treats create conflicts as idempotent when the remote tag already points to the expected commit', async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ message: 'Reference already exists' }), { status: 422, statusText: 'Unprocessable Entity' }))
      .mockResolvedValueOnce(
        jsonResponse(
          {
            ref: 'refs/tags/v2026.04.19',
            object: {
              type: 'commit',
              sha: 'abc123',
            },
          },
          { status: 200 },
        ),
      );

    const context = getApiContext('token-value');

    await expect(createLightweightTag(context, 'v2026.04.19', 'abc123')).resolves.toEqual({
      created: false,
      ref: 'refs/tags/v2026.04.19',
      sha: 'abc123',
    });
  });

  it('fails loudly when a conflicting remote tag points somewhere else', async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ message: 'Reference already exists' }), { status: 409, statusText: 'Conflict' }))
      .mockResolvedValueOnce(
        jsonResponse(
          {
            ref: 'refs/tags/v2026.04.19',
            object: {
              type: 'commit',
              sha: 'def456',
            },
          },
          { status: 200 },
        ),
      );

    const context = getApiContext('token-value');

    await expect(createLightweightTag(context, 'v2026.04.19', 'abc123')).rejects.toThrow(
      'tag v2026.04.19 already exists and points to def456, expected abc123',
    );
  });
});
