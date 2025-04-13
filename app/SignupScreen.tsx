import * as React from "react";
import { ActivityIndicator, Image, ScrollView, View } from "react-native";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { P, H1 } from "~/components/ui/typography";
import { Link, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { addUserToDB } from "~/lib/supabase";
import { Dropdown } from "react-native-element-dropdown";
import displayNotification from "~/lib/Notification";

export default function Screen() {
  const insets = useSafeAreaInsets();
  const contentInsets = {
    top: insets.top,
    bottom: insets.bottom,
    left: 12,
    right: 12,
  };

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [phoneNumber, setPhoneNumber] = React.useState("");
  const [userName, setUserName] = React.useState("");
  const [fullName, setFullName] = React.useState("");
  const [role, setRole] = React.useState("customer");
  const [loading, setLoading] = React.useState(false);

  const onEmailInput = (text: string) => {
    setEmail(text);
  };
  const onPasswordInput = (text: string) => {
    setPassword(text);
  };
  const onPhoneNumberInput = (text: string) => {
    setPhoneNumber(text);
  };
  const onUserNameInput = (text: string) => {
    setUserName(text);
  };
  const onFullNameInput = (text: string) => {
    setFullName(text);
  };
  const validateInputs = () => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phonePattern = /^[0-9]{10}$/;

    if (!userName || !fullName || !email || !phoneNumber || !password) {
      return "Please fill in all the fields";
    }
    if (!emailPattern.test(email)) {
      return "Please enter a valid email address";
    }
    if (!phonePattern.test(phoneNumber)) {
      return "Please enter a valid phone number (10 digits)";
    }
    return null;
  };

  const handleSignup = async () => {
    setLoading(true);
    const validationError = validateInputs();
    if (validationError) {
      displayNotification(validationError, "warning");
      setLoading(false)
      return;
    }
    if (userName && fullName && email && phoneNumber && password && role) {
      const response = await addUserToDB(
        userName,
        fullName,
        email,
        password,
        Number(phoneNumber),
        role
      );
      if (response.startsWith("Success")) {
        router.push({
          pathname: "/LoginScreen",
        });
        displayNotification("User created successfully", "success");
        setLoading(false)
        return;
      }
      displayNotification("User already exists", "danger");
      setLoading(false);
    } else {
      displayNotification("Please fill all the fields", "warning");
      setLoading(false);
    }
  };
  return (
    <View className="flex-1 justify-between items-center gap-5 px-2 pt-6">
      <ScrollView>
        <View className="w-full mb-4">
          <H1>Create an account</H1>
          <P
            className="text-lg color-[#b3b3b3]"
            style={{ fontFamily: "Inter_400Regular" }}
          >
            Welcome to refnet create an account and start managing your air
            conditioning solutions
          </P>
        </View>
        <View className="w-full mb-auto mt-auto gap-6">
          <View className="w-full gap-4">
            <Input
              placeholder="Username"
              value={userName}
              onChangeText={onUserNameInput}
              aria-labelledby="inputLabel"
              aria-errormessage="inputError"
              className="bg-[#131313] border-0  text-white"
              autoComplete="username"
              textContentType="name"
            />
            <Input
              placeholder="Full Name"
              value={fullName}
              onChangeText={onFullNameInput}
              aria-labelledby="inputLabel"
              aria-errormessage="inputError"
              className="bg-[#131313] border-0  text-white"
              autoComplete="name"
              textContentType="name"
            />
            <Input
              placeholder="Phone number"
              value={phoneNumber}
              onChangeText={onPhoneNumberInput}
              aria-labelledby="inputLabel"
              aria-errormessage="inputError"
              className="bg-[#131313] border-0  text-white"
              autoComplete="tel"
              textContentType="telephoneNumber"
              keyboardType="number-pad"
              maxLength={10}
            />
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
            <Dropdown
              style={{
                height: 56,
                backgroundColor: "#131313",
                borderRadius: 8,
                padding: 12,
                marginBottom: 16,
              }}
              placeholderStyle={{
                color: "#9ca3af",
                fontSize: 14,
                fontFamily: "Inter_400Regular",
              }}
              selectedTextStyle={{
                color: "white",
                fontSize: 14,
                fontFamily: "Inter_400Regular",
              }}
              data={[
                { label: "Customer", value: "customer" },
                { label: "Stock Manager", value: "stock_manager" },
                { label: "Finance Controller", value: "finance_controller" },
                { label: "Dispatch Manager", value: "dispatch_manager" },
                { label: "Service Manager", value: "service_manager" },
                { label: "Supervisor", value: "supervisor" },
                { label: "Technician", value: "technician" },
                { label: "Supplier", value: "supplier" },
                { label: "Driver", value: "driver" },
              ]}
              maxHeight={300}
              labelField="label"
              valueField="value"
              placeholder="Select your role"
              value={role}
              onChange={(item) => {
                setRole(item.value);
              }}
            />
          </View>
          <Button
            onPress={handleSignup}
            className="w-full rounded-full"
            size={"lg"}
            variant="default"
          >
            {loading ? (
              <View className="flex flex-row items-center gap-2">
                <ActivityIndicator size="small" color="#000" />
                <P className="text-center text-black">Create account</P>
              </View>
            ) : (
              <P className="text-center text-black">Create account</P>
            )}
          </Button>
          <P
            className="text-center text-lg pt-4 color-[#b3b3b3]"
            style={{ fontFamily: "Inter_400Regular" }}
          >
            Create your account and start managing {"\n"} your air conditioning
            solutions
          </P>
        </View>
      </ScrollView>
    </View>
  );
}
