// CSS modules in tests: `styles.foo` returns "foo"
module.exports = new Proxy({}, { get: (_, key) => key })
