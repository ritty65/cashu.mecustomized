import { describe, expect, it } from 'vitest'
import { validateRelayUrl } from '../../../src/js/relay'

describe('relay validator', () => {
  it('valid relay', () => {
    expect(validateRelayUrl('wss://example.com', [])).toBe('valid')
  })
  it('duplicate relay', () => {
    expect(validateRelayUrl('wss://example.com', ['wss://example.com'])).toBe('duplicate')
  })
  it('invalid relay', () => {
    expect(validateRelayUrl('http://example.com', [])).toBe('invalid')
  })
})
