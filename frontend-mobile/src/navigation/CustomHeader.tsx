import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Appbar, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StackHeaderProps } from '@react-navigation/stack';
import theme from '../theme';

interface CustomHeaderProps extends StackHeaderProps {
  backgroundColor?: string;
  textColor?: string;
  showBackButton?: boolean;
  rightComponent?: React.ReactNode;
}

/**
 * Custom header component with consistent theming and safe area handling
 */
const CustomHeader: React.FC<CustomHeaderProps> = ({
  navigation,
  route,
  options,
  back,
  backgroundColor = theme.colors.surface,
  textColor = theme.colors.onSurface,
  showBackButton = true,
  rightComponent,
}) => {
  const insets = useSafeAreaInsets();
  const title = options.title || route.name;

  const handleBackPress = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor }]}>
      <Appbar.Header 
        style={[styles.header, { backgroundColor }]}
        statusBarHeight={0}
      >
        {back && showBackButton && (
          <Appbar.BackAction 
            onPress={handleBackPress}
            color={textColor}
          />
        )}
        
        <Appbar.Content 
          title={title}
          titleStyle={[styles.title, { color: textColor }]}
        />
        
        {rightComponent && (
          <View style={styles.rightComponent}>
            {rightComponent}
          </View>
        )}
      </Appbar.Header>
    </View>
  );
};

/**
 * Header for server selection screens with primary color background
 */
export const ServerHeader: React.FC<StackHeaderProps> = (props) => (
  <CustomHeader
    {...props}
    backgroundColor={theme.colors.primary}
    textColor={theme.colors.onPrimary}
  />
);

/**
 * Header for main app screens with surface background
 */
export const MainHeader: React.FC<StackHeaderProps> = (props) => (
  <CustomHeader
    {...props}
    backgroundColor={theme.colors.surface}
    textColor={theme.colors.onSurface}
  />
);

/**
 * Header for authentication screens (hidden by default)
 */
export const AuthHeader: React.FC<StackHeaderProps> = (props) => (
  <CustomHeader
    {...props}
    backgroundColor={theme.colors.background}
    textColor={theme.colors.onBackground}
    showBackButton={false}
  />
);

const styles = StyleSheet.create({
  container: {
    elevation: 4,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    ...Platform.select({
      android: {
        elevation: 4,
      },
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
      },
    }),
  },
  header: {
    elevation: 0,
    shadowOpacity: 0,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: theme.fonts.headlineMedium.fontFamily,
  },
  rightComponent: {
    marginRight: 8,
  },
});

export default CustomHeader;