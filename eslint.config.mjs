import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'

const eslintConfig = [
  ...nextCoreWebVitals,
  {
    rules: {
      // The existing effects kick off async work (dictionary init, text parsing)
      // that sets state once resolved; keep this visible without failing lint.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
  {
    ignores: ['.next/**', 'node_modules/**', 'public/**'],
  },
]

export default eslintConfig
