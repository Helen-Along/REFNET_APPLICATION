import { BottomSheetView } from "@gorhom/bottom-sheet";
import { H3, H5, P } from "../ui/typography";
import { useRef } from "react";
import { H4 } from "../ui/typography";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import * as React from "react";
import { useCallback } from "react";
import { ActivityIndicator, Linking, View } from "react-native";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import displayNotification from "~/lib/Notification";

export function ContactUs({ sheetTrigger }: { sheetTrigger: React.ReactNode }) {
  // ref
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  // callbacks
  const handlePresentModalPress = useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);
  const handleSheetChanges = useCallback((index: number) => {
    console.log("handleSheetChanges", index);
  }, []);

  const [email, setEmail] = React.useState("");
  const [message, setMessage] = React.useState("");
  const inputRef = useRef<Textarea>(null);
  const [loading, setLoading] = React.useState(false);

  async function handleContactUs() {
    if (email && message) {
      displayNotification("We will get back to you soon", "success");
      bottomSheetModalRef.current?.dismiss();
      return;
    }
    displayNotification("Please fill in all the fields", "danger");
  }

  return (
    <>
      {React.cloneElement(sheetTrigger as React.ReactElement, {
        onPress: handlePresentModalPress,
      })}
      <BottomSheetModal
        ref={bottomSheetModalRef}
        onChange={handleSheetChanges}
        backgroundStyle={{ backgroundColor: "#0e0e0e" }}
        handleIndicatorStyle={{ backgroundColor: "white" }}
      >
        <BottomSheetView className="p-6 gap-6">
          {/* Title and Subtitle */}
          <View className="items-center mb-8">
            <H3 className="text-2xl mb-2 text-center">
              Hey, We're here to help!
            </H3>
            <P className="text-gray-500 text-center">
              Please fill in the form and we will get {"\n"} back to you as soon
              as possible.
            </P>
          </View>
          <View className="gap-4">
            <View className="gap-1">
              <P className="">Email</P>
              <Input
                placeholder="Email"
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                className="bg-transparent "
                style={{ fontFamily: "Inter_500Medium" }}
              />
            </View>
            <View className="gap-1">
              <P className="">Message</P>
              <Textarea
                ref={inputRef}
                placeholder="What's you query"
                onChangeText={setMessage}
                aria-labelledby="textareaLabel"
                className="bg-transparent"
                style={{ fontFamily: "Inter_500Medium" }}
              />
            </View>
            <Button
              onPress={handleContactUs}
              className="w-full rounded-full"
              size={"lg"}
              variant="default"
              disabled={loading}
            >
              <H5 className=" text-black">
                {loading ? "Submitting" : "Submit Query"}
              </H5>
            </Button>
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    </>
  );
}
