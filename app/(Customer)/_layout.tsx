import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Tabs } from "expo-router";
import {
  Foundation,
  MaterialCommunityIcons,
  MaterialIcons,
  Ionicons,
  FontAwesome6,
  FontAwesome5,
  Feather,
} from "@expo/vector-icons";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { useCart } from "~/lib/cart-context";
import { ArrowLeft, BackpackIcon } from "lucide-react-native";
import { TouchableOpacity, View } from "react-native";
import { H2, H4, P } from "~/components/ui/typography";
import { useRouter, useNavigation } from "expo-router";
import CustomerHome from "./index";

export default function Layout() {
  const { getCartQuantity } = useCart();
  const cartQuantity = getCartQuantity();
  const router = useRouter();
  const navigation = useNavigation();

  return (
    <GestureHandlerRootView>
      <BottomSheetModalProvider>
        <Tabs
          screenOptions={{
            tabBarStyle: {
              borderTopWidth: 1,
              borderTopColor: "#f1f1f1",
              paddingBottom: 0,
            },
            tabBarActiveTintColor: "#fff",
            tabBarInactiveTintColor: "#555555",
            headerShown: false,
            tabBarLabelStyle: { display: "none" },
            tabBarHideOnKeyboard: true,
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              tabBarIcon: ({ color }) => (
                <MaterialCommunityIcons
                  name="home-variant"
                  size={28}
                  color={color}
                />
              ),
            }}
          />
          <Tabs.Screen
            name="search"
            options={{
              tabBarIcon: ({ color }) => (
                <Ionicons
                  name={color === "#fff" ? "search" : "search-outline"}
                  size={28}
                  color={color}
                />
              ),
            }}
          />
          <Tabs.Screen
            name="cart"
            options={{
              tabBarIcon: ({ color }) => (
                <Ionicons
                  name={cartQuantity > 0 ? "bag" : "bag-outline"}
                  size={28}
                  color={color}
                />
              ),
              tabBarStyle: { display: "none" },
              headerShown: false,
              tabBarBadge: cartQuantity || undefined,
              tabBarBadgeStyle: {
                backgroundColor: "#6366f1",
                fontFamily: "Inter_500Medium",
              },
              headerLeft: () => (
                <TouchableOpacity
                  className="px-4"
                  onPress={() => router.back()}
                >
                  <ArrowLeft size={19} color="white" />
                </TouchableOpacity>
              ),
              headerTitle: () => (
                <View className="flex items-center justify-center">
                  <H4 className="text-xl text-center border-b-0 leading-0">
                    Cart
                  </H4>
                </View>
              ),
              headerTitleAlign: "center",
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              tabBarIcon: ({ color }) => (
                <Feather name="user" size={28} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="product"
            options={{
              href: null,
              headerShown: false,
              tabBarStyle: { display: "none" },
              headerStyle: { backgroundColor: "transparent" },
              headerTitle: "",
              headerLeft: () => (
                <TouchableOpacity
                  className="px-4 flex-row items-center gap-2"
                  onPress={() => router.back()}
                >
                  <ArrowLeft size={19} color="white" />
                  {/* <P className="text-xl text-center border-b-0 leading-0">
                    Product Details
                  </P> */}
                </TouchableOpacity>
              ),
            }}
          />
          <Tabs.Screen
            name="checkout"
            options={{
              href: null,
              headerShown: true,
              headerLeft: () => (
                <TouchableOpacity
                  className="px-4"
                  onPress={() => router.back()}
                >
                  <ArrowLeft size={19} color="white" />
                </TouchableOpacity>
              ),
              headerTitle: () => (
                <View className="flex items-center justify-center">
                  <H4 className="text-xl text-center border-b-0 leading-0">
                    Checkout
                  </H4>
                </View>
              ),
              headerTitleAlign: "center",
            }}
          />
        </Tabs>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
