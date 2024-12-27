import * as React from "react";
import {
  ActivityIndicator,
  Image,
  Touchable,
  TouchableOpacity,
  View,
} from "react-native";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { P, H1, H5 } from "~/components/ui/typography";
import { Link, router } from "expo-router";
import { showMessage } from "react-native-flash-message";
import { checkUser, validateUserCredentials } from "~/lib/supabase";
import { useEmail } from "~/app/EmailContext";

const displayNotification = (
  message: string,
  type: "danger" | "success" | "warning"
) => {
  return showMessage({
    message,
    type,
    style: {
      paddingTop: 40,
    },
    titleStyle: {
      fontFamily: "Inter_500Medium",
      textAlign: "center",
    },
  });
};

export default function Screen() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const emailContext = useEmail();
  const { setEmail: setEmailContext } = emailContext || { setEmail: () => {} };
  const [loading, setLoading] = React.useState(false);

  const onEmailInput = (text: string) => {
    setEmail(text);
  };
  const onPasswordInput = (text: string) => {
    setPassword(text);
  };

  const handleLogin = async () => {
    setLoading(true);
    if (email && password) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(email)) {
        displayNotification("Invalid Email", "warning");
        setLoading(false);
        return;
      }
      const UserAvailable = await checkUser(email);
      if (!UserAvailable) {
        displayNotification("User does not exist", "danger");
        setLoading(false);
        return;
      }
      const isValid = await validateUserCredentials(email, password);
      if (isValid["role"]) {
        const user_role = isValid["role"];
        console.log("Role:", user_role);
        setLoading(false);

        // Route to appropriate screen based on role
        switch (user_role) {
          case "customer":
            displayNotification(
              "Customer Detected. Go to user login page",
              "danger"
            );
            setLoading(false);
            break;
          case "stock_manager":
            router.push({
              pathname: "./StockManagementScreen",
              params: { email: email },
            });
            break;
          case "finance_controller":
            router.push({
              pathname: "./FinanceControllerScreen",
              params: { email: email },
            });
            break;
          case "dispatch_manager":
            router.push({
              pathname: "DispatchManager",
              params: { email: email },
            });
            break;
          case "service_manager":
            router.push({
              pathname: "./ServiceManagerScreen",
              params: { email: email },
            });
            break;
          case "supervisor":
            router.push({
              pathname: "./SupervisorScreen",
              params: { email: email },
            });
            break;
          case "technician":
            router.push({
              pathname: "Technician",
              params: { email: email },
            });
            break;
          default:
            showMessage({
              message: "Invalid role or access denied",
              type: "danger",
              style: { paddingTop: 40 },
            });
            return;
        }

        setEmailContext(email);
      } else {
        displayNotification("Invalid Credentials", "danger");
        setLoading(false);
      }
    } else {
      displayNotification("Please fill all the fields", "warning");
      setLoading(false);
    }
  };
  return (
    <View className="flex-1 justify-between items-center gap-5 px-4 py-14">
      <Image
        source={require("../assets/images/RefnetLogo.png")}
        className="mt-14 w-1/3 h-8 absolute top-4 left-6"
        resizeMode="cover"
      />
      <View className="w-full mb-auto mt-auto gap-10 bg-zinc-950">
        <View className="gap-2">
          <H1 className="text-3xl">Staff Login Page</H1>
          <P
            className=" color-[#b3b3b3] pr-6"
            style={{ fontFamily: "Inter_500Medium" }}
          >
            Enter your email and password to login to your account
          </P>
        </View>
        <View className="w-full gap-4">
          <View className="gap-2">
            <H5 className="color-[#888888] px-2">Email Address</H5>
            <Input
              placeholder="Email address"
              value={email}
              onChangeText={onEmailInput}
              aria-labelledby="inputLabel"
              aria-errormessage="inputError"
              className="bg-[#131313] border-0 !h-14 text-white"
              autoComplete="email"
              textContentType="emailAddress"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          <View className="gap-2">
            <H5 className="color-[#888888] px-2">Password</H5>
            <Input
              placeholder="Password"
              value={password}
              onChangeText={onPasswordInput}
              aria-labelledby="inputLabel"
              aria-errormessage="inputError"
              className="bg-[#131313] border-0 !h-14 text-white"
              autoComplete="password"
              textContentType="password"
              secureTextEntry
            />
          </View>
          <H5 className="text-left text-blue-400">
            <Link href="/ForgotPassword">Forgot Password ?</Link>
          </H5>
        </View>
        <View className="gap-6">
          <Button
            onPress={handleLogin}
            className="w-full rounded-full"
            size={"lg"}
            disabled={loading}
          >
            <H5 className="text-black">
              {loading ? "Logging In" : "Login and continue"}
            </H5>
          </Button>
        </View>
      </View>
      <View className="gap-4 divide-x-2 divide-solid divide-gray-50 flex flex-row items-center">
        <TouchableOpacity className="w-1/2 rounded-full bg-[#111] !py-4 !border-none">
          <Link href="/SignupScreen">
            <P className="text-white text-center">Create an account</P>
          </Link>
        </TouchableOpacity>
        <TouchableOpacity className="w-1/2 rounded-full bg-[#111] !py-4 !border-none">
          <Link href="/LoginScreen" className="text-blue-400 ">
            <P className="text-white text-center">Customer Login</P>
          </Link>
        </TouchableOpacity>
      </View>
      <View className="gap-4 divide-x-2 flex flex-row"></View>
    </View>
  );
}
