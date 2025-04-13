import * as React from "react";
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  TouchableOpacity,
  View,
} from "react-native";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { P, H1, H2, H4, H5 } from "~/components/ui/typography";
import { Link, router } from "expo-router";
import { checkUser, validateUserCredentials } from "~/lib/supabase";
import { useEmail } from "~/app/EmailContext";
import { useNavigation } from "@react-navigation/native";
import displayNotification from "~/lib/Notification";

export default function LoginScreen() {
  const navigation = useNavigation(); // Use hook to access navigation
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const emailContext = useEmail();
  const { setEmail: setEmailContext } = emailContext || { setEmail: () => {} };
  const [loading, setLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");

  const onEmailInput = (text: string) => {
    setEmail(text);
  };

  const onPasswordInput = (text: string) => {
    setPassword(text);
  };

  const handleLogin = async () => {
    setLoading(true);
    setErrorMessage("");

    // Check if both email and password are provided
    if (!email || !password) {
      displayNotification("Please fill all the fields", "warning");
      setLoading(false);
      return;
    }

    // Validate email format
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      displayNotification("Invalid Email", "warning");
      setLoading(false);
      return;
    }

    // Check if user exists
    const UserAvailable = await checkUser(email);
    if (!UserAvailable) {
      displayNotification("Email not registered", "danger");
      setLoading(false);
      return;
    }

    // Validate user credentials
    const isValid = await validateUserCredentials(email, password);

    // Handle user role or invalid password
    if (isValid) {
      const user_role = isValid["role"];
      console.log(user_role);

      const user_status = isValid["status"];
      console.log("User status: ", user_status);
      if (user_status === "inactive") {
        displayNotification(
          "Account not active, Please contact admin",
          "danger"
        );
        setLoading(false)
        return;
      }

      if (user_role === "customer") {
        console.log("User is a Customer");
        setEmailContext(email);
        router.push("/(Customer)");
      } else {
        displayNotification("Invalid Credentials for this role", "danger");
      }
    } else {
      displayNotification("Invalid Credentials", "danger");
    }

    setLoading(false); // Move this to the end to maintain consistent loading state
  };
  return (
    <SafeAreaView className="flex-1 justify-between items-center px-4 py-14">
      <Image
        source={require("../assets/images/RefnetLogo.png")}
        className="mt-14 w-1/3 h-8 absolute top-4 left-6"
        resizeMode="cover"
      />
      <View className="w-full mb-auto mt-auto gap-10 bg-zinc-950">
        <View className="gap-2">
          <H1 className="text-3xl">Sign in to your Account</H1>
          <P
            className=" color-[#b3b3b3] pr-6"
            style={{ fontFamily: "Inter_500Medium" }}
          >
            Enter your email and password to login to your account
          </P>
        </View>
        <View className="w-full gap-6">
          <View className="gap-2">
            <H5 className="color-[#888888] px-2">Email Address</H5>
            <Input
              placeholder="example@gmail.com"
              value={email}
              onChangeText={onEmailInput}
              aria-labelledby="inputLabel"
              aria-errormessage="inputError"
              className="bg-[#131313] border-0  text-white"
              autoComplete="email"
              textContentType="emailAddress"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          <View className="gap-2">
            <H5 className="color-[#888888] px-2">Password</H5>
            <Input
              placeholder="password123"
              value={password}
              onChangeText={onPasswordInput}
              aria-labelledby="inputLabel"
              aria-errormessage="inputError"
              className="bg-[#131313] border-0  text-white"
              autoComplete="password"
              textContentType="password"
              secureTextEntry
            />
          </View>
          <H5 className="text-left text-blue-400">
            <Link href="/ForgotPassword">Forgot Password ?</Link>
          </H5>
        </View>
        <Button
          onPress={handleLogin}
          className="w-full rounded-full"
          size={"lg"}
          variant="default"
          disabled={loading}
        >
          <H4 className="text-lg text-black">
            {loading ? "Logging In" : "Login and continue"}
          </H4>
        </Button>
      </View>
      <View className="gap-4 divide-x-2 divide-solid divide-gray-50 flex flex-row items-center overflow-auto">
        <TouchableOpacity
          className="w-3/4 rounded-full bg-[#111] !py-4 !border-none"
          onPress={() => router.push("/SignupScreen")}
        >
          <P className="text-white text-center">Create an account</P>
        </TouchableOpacity>
        <TouchableOpacity
          className="w-max px-6 rounded-full bg-[#111] !py-4 !border-none"
          onPress={() => router.push("/StaffLoginScreen")}
        >
          <P className="text-white text-center">Staff Login</P>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
