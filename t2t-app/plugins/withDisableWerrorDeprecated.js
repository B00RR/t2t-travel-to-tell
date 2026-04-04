/**
 * Config plugin to disable -Werror for deprecated declarations in C++ builds.
 * Fixes react-native-reanimated compatibility with RN 0.81.5 ShadowNode::Shared deprecation.
 */
const { withAppBuildGradle } = require('@expo/config-plugins');

module.exports = function withDisableWerrorDeprecated(config) {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      const contents = config.modResults.contents;

      // Add C++ flags to disable deprecated warning as error
      const newContents = contents.replace(
        /android\s*\{/,
        `android {
    defaultConfig {
        externalNativeBuild {
            cmake {
                cppFlags "-Wno-deprecated-declarations"
            }
        }
    }
`
      );

      config.modResults.contents = newContents;
    }
    return config;
  });
};
