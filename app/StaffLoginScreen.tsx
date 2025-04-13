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
import { checkUser, validateUserCredentials } from "~/lib/supabase";
import { useEmail } from "~/app/EmailContext";
import displayNotification from "~/lib/Notification";

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
              pathname: "/(StockManager)",
              params: { email: email },
            });
            break;
          case "finance_controller":
            router.push({
              pathname: "/(FinanceManager)",
              params: { email: email },
            });
            break;
          case "dispatch_manager":
            router.push({
              pathname: "/(DispatchManager)",
              params: { email: email },
            });
            break;
          case "service_manager":
            router.push({
              pathname: "/(ServiceManager)",
              params: { email: email },
            });
            break;
          case "supervisor":
            router.push({
              pathname: "/(Supervisor)",
              params: { email: email },
            });
            break;
          case "technician":
            router.push({
              pathname: "/(Technician)",
              params: { email: email },
            });
            break;
          case "supplier":
            router.push({
              pathname: "/(Supplier)",
              params: { email: email },
            });
            break;
          case "driver":
            router.push({
              pathname: "/(Driver)",
              params: { email: email },
            });
            break;
          default:
            displayNotification("Invalid role or access denied", "danger");
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
          <H1 className="text-3xl text-center">Staff Login Page</H1>
          <P
            className=" color-[#b3b3b3] pr-6 text-center"
            style={{ fontFamily: "Inter_500Medium" }}
          >
            enter your email and password {"\n"} to login to your account
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
              placeholder="Password"
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
      <View className="gap-4 divide-x-2 divide-solid divide-gray-50 flex flex-row items-center overflow-auto">
        <TouchableOpacity
          className="w-3/4 rounded-full bg-[#111] !py-4 !border-none"
          onPress={() => router.push("/SignupScreen")}
        >
          <P className="text-white text-center">Create an account</P>
        </TouchableOpacity>
        <TouchableOpacity
          className="w-1/2 rounded-full bg-[#111] !py-4 !border-none"
          onPress={() => router.push("/LoginScreen")}
        >
          <P className="text-white text-center">Customer Login</P>
        </TouchableOpacity>
      </View>
      <View className="gap-4 divide-x-2 flex flex-row"></View>
    </View>
  );
}
