// Unit tests make no network requests. Components that load data after mount, such as the
// site header's project list, fall back as they would offline. A test that needs a response
// stubs fetch with vi.stubGlobal.
globalThis.fetch = () => Promise.reject(new Error('Unit tests make no network requests'))
