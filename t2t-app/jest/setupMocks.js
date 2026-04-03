// Jest setup file (runs BEFORE test modules load)
// Mocks modules that require native code not available in jest.

jest.mock('react-native-worklets', () => ({
  Worklets: {
    createRunOnJS: function(fn) { return fn; },
    createRunOnUI: function(fn) { return fn; },
  },
  runOnUI: function(fn) { return fn; },
  runOnJS: function(fn) { return fn; },
  createAnimatedPropAdapter: function(p) { return p; },
}));

jest.mock('react-native-worklets-core', function() { return {}; }, { virtual: true });

jest.mock('react-native-reanimated', function() {
  var RN = require('react-native');

  var mockFns = {
    useSharedValue: function(v) { return { value: v }; },
    useAnimatedStyle: function() { return {}; },
    useAnimatedScrollHandler: function() { return {}; },
    useFrameCallback: function() { return function() {}; },
    useDerivedValue: function(fn) { return { value: fn ? fn() : undefined }; },
    useAnimatedRef: function() { return function() { return null; }; },
    useAnimatedGestureHandler: function() { return {}; },
    useEvent: function(e) { return e; },
    useHandler: function() { return { handlers: {}, context: {} }; },
    useAnimatedReaction: function() {},
    withSpring: function(v) { return v; },
    withTiming: function(v) { return v; },
    withDecay: function(v) { return v; },
    withSequence: function() { return arguments[arguments.length - 1]; },
    withDelay: function(d, a) { return a; },
    cancelAnimation: jest.fn(),
    Easing: { linear: function() { return 1; }, ease: function() { return 1; }, quad: function() { return 1; }, cubic: function() { return 1; } },
    Layout: jest.fn(function(v) { return v; }),
    LinearTransition: jest.fn(function(v) { return v; }),
    FadingTransition: jest.fn(function(v) { return v; }),
    JumpingTransition: jest.fn(function(v) { return v; }),
    CurvedTransition: jest.fn(function(v) { return v; }),
    EntryExitTransition: jest.fn(function(v) { return v; }),
    interpolate: jest.fn(function(v) { return v; }),
    interpolateColor: jest.fn(function(v, _i, o) { return o[0]; }),
    Keyframe: jest.fn(),
    runOnUI: function(fn) { return fn; },
    runOnJS: function(fn) { return fn; },
    scrollTo: jest.fn(),
    useScrollViewOffset: function() { return 0; },
    measure: function() { return { width: 100, height: 100, x: 0, y: 0 }; },
    createAnimatedComponent: function(C) { return C; },
    AnimateProps: {},
    AnimatedPropAdapter: function() {},
    isSharedValue: function(v) { return v && typeof v.value !== 'undefined'; },
    useWorkletCallback: function(fn) { return fn; },
  };

  var DefaultObj = {
    createAnimatedComponent: mockFns.createAnimatedComponent,
    View: RN.View,
    Text: RN.Text,
    ScrollView: RN.ScrollView,
    FlatList: RN.FlatList,
    Image: RN.Image,
    Pressable: RN.Pressable,
    useSharedValue: mockFns.useSharedValue,
    useAnimatedStyle: mockFns.useAnimatedStyle,
    withSpring: mockFns.withSpring,
    withTiming: mockFns.withTiming,
    cancelAnimation: mockFns.cancelAnimation,
    Easing: mockFns.Easing,
    Layout: mockFns.Layout,
    LinearTransition: mockFns.LinearTransition,
    runOnUI: mockFns.runOnUI,
    runOnJS: mockFns.runOnJS,
    useDerivedValue: mockFns.useDerivedValue,
    useAnimatedRef: mockFns.useAnimatedRef,
    useAnimatedGestureHandler: mockFns.useAnimatedGestureHandler,
    useAnimatedReaction: mockFns.useAnimatedReaction,
    scrollTo: mockFns.scrollTo,
    measure: mockFns.measure,
  };

  var result = Object.assign({
    __esModule: true,
    default: DefaultObj,
    View: RN.View,
    Text: RN.Text,
    ScrollView: RN.ScrollView,
    FlatList: RN.FlatList,
    Image: RN.Image,
    Pressable: RN.Pressable,
  }, mockFns);

  return result;
});
