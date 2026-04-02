import { describe, expect, it, vi } from 'vitest'
import {
  createBrowserCookieAdapter,
  createServerCookieAdapter,
  parseDocumentCookies,
  serializeBrowserCookie,
} from '../cookies'

describe('parseDocumentCookies', () => {
  it('parses cookie headers and decodes values', () => {
    expect(parseDocumentCookies('foo=bar; theme=dark%20mode')).toEqual([
      { name: 'foo', value: 'bar' },
      { name: 'theme', value: 'dark mode' },
    ])
  })

  it('returns an empty array for blank cookie strings', () => {
    expect(parseDocumentCookies('   ')).toEqual([])
  })
})

describe('serializeBrowserCookie', () => {
  it('serializes supported cookie options safely', () => {
    expect(
      serializeBrowserCookie({
        name: 'session',
        value: 'abc 123',
        options: {
          path: '/',
          maxAge: 3600,
          domain: 'example.com',
          secure: true,
          sameSite: 'Lax',
        },
      })
    ).toBe(
      'session=abc%20123; path=/; max-age=3600; domain=example.com; secure; samesite=lax'
    )
  })
})

describe('createBrowserCookieAdapter', () => {
  it('reads and writes cookies through the provided target', () => {
    const target = {
      cookie: 'foo=bar',
    }

    const adapter = createBrowserCookieAdapter(target)
    expect(adapter.getAll()).toEqual([{ name: 'foo', value: 'bar' }])

    adapter.setAll([
      {
        name: 'theme',
        value: 'dark',
        options: { path: '/', sameSite: 'strict' },
      },
    ])

    expect(target.cookie).toBe('theme=dark; path=/; samesite=strict')
  })
})

describe('createServerCookieAdapter', () => {
  it('delegates reads and writes to the cookie store', () => {
    const set = vi.fn()
    const adapter = createServerCookieAdapter({
      getAll: () => [{ name: 'foo', value: 'bar' }],
      set,
    })

    expect(adapter.getAll()).toEqual([{ name: 'foo', value: 'bar' }])

    adapter.setAll([
      {
        name: 'session',
        value: 'token',
        options: { path: '/' },
      },
    ])

    expect(set).toHaveBeenCalledWith('session', 'token', { path: '/' })
  })

  it('swallows write errors for read-only server cookie stores', () => {
    const adapter = createServerCookieAdapter({
      getAll: () => [],
      set: () => {
        throw new Error('read only')
      },
    })

    expect(() =>
      adapter.setAll([{ name: 'session', value: 'token' }])
    ).not.toThrow()
  })
})
