/**
 * Minimal manual mock for react-native-reanimated.
 * Avoids the official mock which requires react-native-worklets native init.
 */
const View = require('react-native').View;
const Text = require('react-native').Text;
const ScrollView = require('react-native').ScrollView;

module.exports = {
  __esModule: true,
  default: View,
  View,
  Text,
  ScrollView,
  FlatList: require('react-native').FlatList,
  Image: require('react-native').Image,
  Pressable: require('react-native').Pressable,
  useSharedValue: (v) => ({ value: v }),
  useAnimatedStyle: () => ({}),
  useAnimatedScrollHandler: () => ({}),
  useFrameCallback: () => () => {},
  useDerivedValue: (fn) => ({ value: fn ? fn() : undefined }),
  useAnimatedRef: () => () => null,
  useAnimatedGestureHandler: () => ({}),
  useEvent: (e) => e,
  useHandler: () => ({ handlers: {}, context: {} }),
  withSpring: (v) => v,
  withTiming: (v) => v,
  withDecay: (v) => v,
  withSequence: (...args) => args[args.length - 1],
  withDelay: (d, a) => a,
  cancelAnimation: jest.fn(),
  Easing: {
    linear: () => 1,
    ease: () => 1,
    quad: () => 1,
    cubic: () => 1,
  },
  Layout: jest.fn((v) => v),
  LinearTransition: jest.fn((v) => v),
  FadingTransition: jest.fn((v) => v),
  JumpingTransition: jest.fn((v) => v),
  CurvedTransition: jest.fn((v) => v),
  EntryExitTransition: jest.fn((v) => v),
  interpolate: jest.fn((v, _i, _o) => v),
  interpolateColor: jest.fn((v, _i, o) => o[0]),
  Keyframe: jest.fn(),
  runOnUI: (fn) => fn,
  runOnJS: (fn) => fn,
  scrollTo: jest.fn(),
  useScrollViewOffset: () => 0,
  measure: () => ({ width: 100, height: 100, x: 0, y: 0 }),
};
