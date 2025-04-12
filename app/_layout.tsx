import '~/global.css';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme, DefaultTheme, Theme, ThemeProvider } from '@react-navigation/native';
import { SplashScreen } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import { Platform, Text, View } from 'react-native';
import { NAV_THEME } from '~/lib/constants';
import { useColorScheme } from '~/lib/useColorScheme';
import { PortalHost } from '@rn-primitives/portal';
import { setAndroidNavigationBar } from '~/lib/android-navigation-bar';
import FlashMessage from "react-native-flash-message";
import { EmailProvider } from "./EmailContext"; 
import { CartProvider } from "~/lib/cart-context"
import { router } from "expo-router";

const LIGHT_THEME: Theme = {
  ...DefaultTheme,
  colors: NAV_THEME.light,
};
const DARK_THEME: Theme = {
  ...DarkTheme,
  colors: NAV_THEME.dark,
};

export {
  ErrorBoundary,
} from 'expo-router';

// Prevent the splash screen from auto-hiding before getting the color scheme.
SplashScreen.preventAutoHideAsync();
import {Stack} from 'expo-router'
import {
  useFonts,
  Inter_100Thin,
  Inter_200ExtraLight,
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  Inter_900Black,
} from "@expo-google-fonts/inter"
import { P } from '~/components/ui/typography';

export default function RootLayout({navigation}: any) {
  let [fontsLoaded] = useFonts({
    Inter_100Thin,
    Inter_200ExtraLight,
    Inter_300Light,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    Inter_900Black,
  });

  let fontSize = 24;
  let paddingVertical = 12; // Changed from 6 to 12

  const { colorScheme, setColorScheme, isDarkColorScheme } = useColorScheme();
  const [isColorSchemeLoaded, setIsColorSchemeLoaded] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      const theme = await AsyncStorage.getItem("theme");
      if (Platform.OS === "web") {
        // Adds the background color to the html element to prevent white background on overscroll.
        document.documentElement.classList.add("bg-background");
      }
      if (!theme) {
        AsyncStorage.setItem("theme", colorScheme);
        setIsColorSchemeLoaded(true);
        return;
      }

      const colorTheme = "dark";
      if (colorTheme !== colorScheme) {
        setColorScheme(colorTheme);
        setAndroidNavigationBar(colorTheme);
        setIsColorSchemeLoaded(true);
        return;
      }
      setAndroidNavigationBar(colorTheme);
      setIsColorSchemeLoaded(true);
    })().finally(() => {
      SplashScreen.hideAsync();
    });
  }, []);

  if (!isColorSchemeLoaded) {
    return null;
  }

  const theme = DARK_THEME;

  return (
    <ThemeProvider value={theme}>
      <StatusBar style={"light"} />
      <EmailProvider>
        <CartProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen
              name="LoginScreen"
              // options={{ headerShown: true, headerTitle: "" }}
            />

            <Stack.Screen
              name="StaffLoginScreen"
              // options={{ headerShown: true, headerTitle: "" }}
            />

            <Stack.Screen name="(Customer)" options={{ headerShown: false }} />
            <Stack.Screen
              name="(DispatchManager)"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="(Technician)"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="(FinanceManager)"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="(ServiceManager)"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="(StockManager)"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="(Supervisor)"
              options={{ headerShown: false }}
            />
            <Stack.Screen name="(Driver)" options={{ headerShown: false }} />
            <Stack.Screen name="(Supplier)" options={{ headerShown: false }} />
            <Stack.Screen
              name="ForgotPassword"
              options={{ headerShown: true, headerTitle: "" }}
            />
            <Stack.Screen
              name="SignupScreen"
              options={{
                headerShown: true,
                headerTitleAlign: "left",
                headerTitle: () => (
                  <P
                    onPress={() => router.push("/LoginScreen")}
                    className="text-white"
                  >
                    Back
                  </P>
                ),
              }}
            />

            <Stack.Screen
              name="ProductScreen"
              options={{ headerShown: true, headerTitle: "" }}
            />
            <Stack.Screen
              name="CheckoutScreen"
              options={{ headerShown: true, headerTitle: "" }}
            />
          </Stack>
          <FlashMessage position="top" />
          <PortalHost />
        </CartProvider>
      </EmailProvider>
    </ThemeProvider>
  );
}
