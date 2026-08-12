module.exports = {
  plugins: [
    require.resolve('prettier-plugin-organize-imports'),
    require.resolve('prettier-plugin-packagejson')
  ],
  arrowParens: 'avoid',
  printWidth: 100,
  proseWrap: 'never',
  singleQuote: true,
  trailingComma: 'none',
  overrides: [
    {
      files: '*.md',
      options: {
        proseWrap: 'preserve'
      }
    }
  ]
};
