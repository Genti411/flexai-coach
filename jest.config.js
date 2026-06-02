module.exports = {
  preset: 'jest-expo',
  setupFiles: ['<rootDir>/jest.setup.ws.js'],
  testPathIgnorePatterns: ['/node_modules/'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|react-native-url-polyfill|react-native-svg|react-native-reanimated|react-native-worklets))',
  ],
  moduleNameMapper: {
    '\\.css$': '<rootDir>/jest.mock.css.js',
    '@react-native-async-storage/async-storage':
      '@react-native-async-storage/async-storage/jest/async-storage-mock',
    '^react-native-worklets$':
      '<rootDir>/node_modules/react-native-worklets/lib/module/mock.js',
  },
};
