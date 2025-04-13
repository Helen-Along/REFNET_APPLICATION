import { Image, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, router } from "expo-router";
import { useState } from "react";
import { H1, H5, P } from "~/components/ui/typography";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { checkUser, resetPassword } from "~/lib/supabase";
import displayNotification from "~/lib/Notification";


export default function Screen() {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!email || !newPassword || !confirmPassword) {
      displayNotification("Please fill all fields", "warning");
      return;
    }

    if (newPassword !== confirmPassword) {
      displayNotification("Passwords do not match", "warning");
      return;
    }

    if (newPassword.length < 6) {
      displayNotification("Password must be at least 6 characters", "warning");
      return;
    }

    setIsLoading(true);
    try {
      // First check if user exists
      const user = await checkUser(email);
      if (!user["email"]) {
        displayNotification("User not found", "danger");
        return;
      }

      // Reset the password
      const response = await resetPassword(email, newPassword);
      
      if (response.startsWith("Success")) {
        displayNotification("Password reset successful", "success");
        // Redirect based on user role
        if (user["role"] === "customer") {
          router.push("/LoginScreen");
        } else {
          router.push("/StaffLoginScreen");
        }
      } else {
        displayNotification(response.replace("Error: ", ""), "danger");
      }
    } catch (error) {
      displayNotification("Failed to reset password", "danger");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 justify-between items-center gap-5 px-4 py-14">
      <Image
        source={require("../assets/images/RefnetLogo.png")}
        className="w-1/3 h-8 absolute top-4 left-6"
        resizeMode="cover"
      />
      <View className="w-full space-y-4 mt-20 gap-6 bg-zinc-950">
        <View className="gap-2">
          <H1 className="">Reset Password</H1>
          <P className=" text-muted-foreground">
            Enter your email and new password
          </P>
        </View>
        <View className="space-y-4 gap-4">
          <H5 className="color-[#888888] px-2">Email Address</H5>
          <Input
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            className="bg-[#131313] border-0  text-white"
            autoComplete="email"
            textContentType="emailAddress"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <H5 className="color-[#888888] px-2">Password</H5>
          <Input
            placeholder="New Password"
            value={newPassword}
            onChangeText={setNewPassword}
            className="bg-[#131313] border-0  text-white"
            autoComplete="password"
            textContentType="password"
            secureTextEntry
          />
          <Input
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            className="bg-[#131313] border-0  text-white"
            autoComplete="password"
            textContentType="password"
            secureTextEntry
          />
          <Button
            onPress={handleResetPassword}
            className="w-full rounded-full"
            size={"lg"}
            disabled={isLoading}
          >
            <H5 className="text-black">
              {isLoading ? "Resetting..." : "Reset Password"}
            </H5>
          </Button>
        </View>
      </View>
    </View>
  );
}
