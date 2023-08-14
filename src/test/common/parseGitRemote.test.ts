import * as assert from 'assert'
import { parseGitRemote } from '../../common/parseGitRemote'

const GITHUB_SSH_REMOTE_MOCK = 'git@github.com:organization/repository.git'
const GITHUB_HTTPS_REMOTE_MOCK = 'https://github.com/organization/repository.git'
const GITLAB_SSH_REMOTE_MOCK = 'git@gitlab.com:organization/repository.git'
const GITLAB_HTTPS_REMOTE_MOCK = 'https://gitlab.com/organization/repository.git'
const BITBUCKET_SSH_REMOTE_MOCK = 'git@bitbucket.org:organization/repository.git'
const BITBUCKET_HTTPS_REMOTE_MOCK = 'https://user@bitbucket.org/organization/repository.git'

suite('parseGitRemote', () => {
  test('parses GitHub SSH remote format', () => {
    const parsed = parseGitRemote(GITHUB_SSH_REMOTE_MOCK)

    assert.strictEqual(parsed.provider, 'gh')
    assert.strictEqual(parsed.organization, 'organization')
    assert.strictEqual(parsed.repository, 'repository')
  })

  test('parses GitHub HTTPS remote format', () => {
    const parsed = parseGitRemote(GITHUB_HTTPS_REMOTE_MOCK)

    assert.strictEqual(parsed.provider, 'gh')
    assert.strictEqual(parsed.organization, 'organization')
    assert.strictEqual(parsed.repository, 'repository')
  })

  test('parses GitLab SSH remote format', () => {
    const parsed = parseGitRemote(GITLAB_SSH_REMOTE_MOCK)

    assert.strictEqual(parsed.provider, 'gl')
    assert.strictEqual(parsed.organization, 'organization')
    assert.strictEqual(parsed.repository, 'repository')
  })

  test('parses GitLab HTTPS remote format', () => {
    const parsed = parseGitRemote(GITLAB_HTTPS_REMOTE_MOCK)

    assert.strictEqual(parsed.provider, 'gl')
    assert.strictEqual(parsed.organization, 'organization')
    assert.strictEqual(parsed.repository, 'repository')
  })

  test('parses Bitbucket SSH remote format', () => {
    const parsed = parseGitRemote(BITBUCKET_SSH_REMOTE_MOCK)

    assert.strictEqual(parsed.provider, 'bb')
    assert.strictEqual(parsed.organization, 'organization')
    assert.strictEqual(parsed.repository, 'repository')
  })

  test('parses Bitbucket HTTPS remote format', () => {
    const parsed = parseGitRemote(BITBUCKET_HTTPS_REMOTE_MOCK)

    assert.strictEqual(parsed.provider, 'bb')
    assert.strictEqual(parsed.organization, 'organization')
    assert.strictEqual(parsed.repository, 'repository')
  })
})
