module.exports = {
  preset: 'jest-expo',
  setupFiles: ['<rootDir>/jest.setup.ws.js'],
  testPathIgnorePatterns: ['/node_modules/'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|react-native-url-polyfill))',
  ],
};
