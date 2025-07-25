// frontend-creator/babel.config.js

module.exports = {
  presets: [
    ['@babel/preset-env', { 
      targets: { node: 'current' },
      modules: 'commonjs'
    }],
    ['@babel/preset-react', { runtime: 'automatic' }],
    '@babel/preset-typescript',
  ],
  plugins: [
    '@babel/plugin-syntax-import-meta',
    // Custom plugin to transform import.meta.env
    function() {
      return {
        visitor: {
          MemberExpression(path) {
            if (
              path.node.object &&
              path.node.object.type === 'MetaProperty' &&
              path.node.object.meta.name === 'import' &&
              path.node.object.property.name === 'meta' &&
              path.node.property.name === 'env'
            ) {
              // Replace import.meta.env with process.env
              path.replaceWithSourceString('process.env');
            }
          }
        }
      };
    }
  ],
};