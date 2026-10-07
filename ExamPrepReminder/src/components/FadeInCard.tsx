import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors, radius, space } from '../theme';

interface Props {
  children: React.ReactNode;
  index?: number;
  style?: StyleProp<ViewStyle>;
}

/** Card that fades and slides up on mount; `index` staggers the entrance. */
export function FadeInCard({ children, index = 0, style }: Props) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 450, delay: index * 90, useNativeDriver: true }).start();
  }, [anim, index]);
  return (
    <Animated.View
      style={[
        styles.card,
        { opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }] },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
