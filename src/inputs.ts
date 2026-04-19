import * as core from '@actions/core';

export interface ActionInputs {
  snapshotDate: string | undefined;
  githubToken: string;
  createIfMissing: boolean;
  targetRef: string | undefined;
  targetSha: string | undefined;
}

export function getInputs(): ActionInputs {
  const snapshotDate = core.getInput('snapshot_date').trim();
  const githubToken = core.getInput('github_token').trim();
  const targetRef = core.getInput('target_ref').trim();
  const targetSha = core.getInput('target_sha').trim();

  return {
    snapshotDate: snapshotDate === '' ? undefined : snapshotDate,
    githubToken,
    createIfMissing: core.getBooleanInput('create_if_missing'),
    targetRef: targetRef === '' ? undefined : targetRef,
    targetSha: targetSha === '' ? undefined : targetSha,
  };
}
