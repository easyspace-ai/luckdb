module.exports = {
  // TypeScript/JavaScript 文件
  '**/*.{ts,tsx,js,jsx}': ['eslint --fix', 'prettier --write'],

  // JSON/Markdown/YAML 文件
  '**/*.{json,md,yaml,yml}': ['prettier --write'],

  // Go 文件（可选）
  '**/*.go': ['gofmt -w'],
};
