/**
 * Config plugin to disable -Werror for deprecated declarations in C++ builds.
 * Fixes react-native-reanimated compatibility with RN 0.81.5 ShadowNode::Shared deprecation.
 */
const { withAppBuildGradle } = require('@expo/config-plugins');

module.exports = function withDisableWerrorDeprecated(config) {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      const contents = config.modResults.contents;

      // Inject externalNativeBuild inside the existing defaultConfig block
      const newContents = contents.replace(
        /defaultConfig\s*\{/,
        `defaultConfig {
        externalNativeBuild {
            cmake {
                cppFlags "-Wno-deprecated-declarations"
            }
        }`
      );

      config.modResults.contents = newContents;
    }
    return config;
  });
};
