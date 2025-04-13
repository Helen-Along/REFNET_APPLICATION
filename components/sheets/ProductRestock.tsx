import { BottomSheetView } from "@gorhom/bottom-sheet";
import { H3, H5, P } from "../ui/typography";
import { useRef, useState, useEffect } from "react";
import { H4 } from "../ui/typography";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import * as React from "react";
import { useCallback } from "react";
import { ScrollView, View, Image, TouchableOpacity } from "react-native";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import displayNotification from "~/lib/Notification";
import {
  Box,
  Coins,
  Group,
  ImageIcon,
  ShieldCloseIcon,
  SquareStack,
} from "lucide-react-native";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fetchSuppliers, insertNewProductToDB, supabase } from "~/lib/supabase";
import { Value } from "@rn-primitives/select";
import { formatPrice } from "~/lib/format-price";

interface Supplier {
  user_id: Number;
  full_name: string;
}

const DetailItem: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => (
  <View className="mb-4">
    <H5 className="text-sm text-gray-600 mb-1">{label}</H5>
    <H5 className="text-base text-white">{value}</H5>
  </View>
);

type ProductDetailsModalProps = {
  visible: boolean;
  product: any;
  onUpdateStock: (productId: number, newStock: number) => void;
};

export function ProductRestock({
  sheetTrigger,
  visible,
  product,
}: {
  sheetTrigger: React.ReactNode;
  visible: boolean;
  product: any;
  dispatchId: any;
  drivers: any;
  onAssign: (DriverId: number) => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [productData, setProductData] = useState(product);

  useEffect(() => {
    if (visible) {
      bottomSheetModalRef.current?.present();
      setProductData(product);
    } else {
      bottomSheetModalRef.current?.dismiss();
    }
  }, [visible, product]);

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      // Modal is closed
    }
  }, []);

  const [newStock, setNewStock] = useState("");
  const [restockAmount, setRestockAmount] = useState("");

  const onRestockInput = (text) => {
    setRestockAmount(text);
  };

  const handleRestockProduct = async () => {
    if (!restockAmount || isNaN(parseInt(restockAmount))) {
      displayNotification("Please enter a valid restock amount", "error");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("restock")
        .insert({
          product_id: productData.product_id,
          stock_amount: parseInt(restockAmount),
          created_at: new Date(),
        });

      if (error) throw error;

      displayNotification("Restock order placed successfully", "success");
      setRestockAmount("");
      bottomSheetModalRef.current?.dismiss();
    } catch (error) {
      console.error("Error placing restock order:", error);
      displayNotification("Failed to place restock order", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const [selectedDriver, setSelectedDriver] = useState<string>("");

  const presentModal = useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);

  const handleAssign = async (dispatchId: number, driverId: string) => {
    const { error } = await updateDispatchDriver(dispatchId, driverId.value);
    if (error) {
      console.error("Error updating driver:", error);
    } else {
      console.log("Driver assigned successfully");
      await updateOrderStatus(dispatchId);
    }
  };

  // Function to update the dispatch_status in the orders table
  const updateOrderStatus = async (dispatchId: number) => {
    const { data, error } = await supabase
      .from("orders")
      .update({ dispatch_status: "dispatched" })
      .eq("order_id", orderId);

    if (error) {
      console.error("Error updating order status:", error);
    } else {
      console.log("Order status updated successfully");
    }

    return { data, error };
  };

  // Function to update the driver_id in the dispatches table
  const updateDispatchDriver = async (dispatchId: number, driverId: string) => {
    const { data, error } = await supabase
      .from("dispatches")
      .update({ driver_id: driverId, status: "assigned" })
      .eq("dispatch_id", dispatchId);

    if (!error) {
      displayNotification("Driver assigned successfully", "success");
      bottomSheetModalRef.current?.dismiss();
    }

    return { data, error };
  };

  return (
    <>
      {React.cloneElement(sheetTrigger as React.ReactElement, {
        onPress: () => bottomSheetModalRef.current?.present(),
      })}
      <BottomSheetModal
        ref={bottomSheetModalRef}
        onChange={handleSheetChanges}
        backgroundStyle={{ backgroundColor: "#111" }}
        handleIndicatorStyle={{ backgroundColor: "white" }}
      >
        <BottomSheetView className="p-6 gap-6">
          <View>
            <ScrollView>
              {isLoading ? (
                <View className="flex items-center justify-center h-48">
                  <H5 className="text-gray-500">Loading...</H5>
                </View>
              ) : (
                <>
                  <Image
                    source={{
                      uri: productData.image_url.replace(
                        /^http:\/\//i,
                        "https://"
                      ),
                    }}
                    className="w-full h-48 rounded-lg mb-4"
                  />
                  <DetailItem label="Name" value={productData.name} />
                  <View className="mb-4">
                    <H5 className="text-sm text-gray-600 mb-1">
                      {"Description"}
                    </H5>
                    <H5 className="text-base text-white line-clamp-2">
                      {productData.description}
                    </H5>
                  </View>
                  <View className="flex-row w-full">
                    <View className="w-1/2">
                      <DetailItem
                        label="Current Stock"
                        value={
                          productData.stock_quantity &&
                          productData.stock_quantity.toString()
                        }
                      />
                    </View>
                  </View>

                  <H5 className="text-sm text-white mb-1 pt-6">
                    {"New Stock Order Amount"}
                  </H5>
                  <View className="flex-row items-center gap-4">
                    <Input
                      placeholder="eg. 10"
                      value={restockAmount}
                      onChangeText={onRestockInput}
                      aria-labelledby="inputLabel"
                      aria-errormessage="inputError"
                      className="border border-zinc-400  flex-1"
                      keyboardType="number-pad"
                      autoCapitalize="none"
                    />
                    <Button
                      onPress={() => handleRestockProduct()}
                      className="rounded-full w-auto bg-green-800 disabled:bg-green-400 ml-auto"
                      size={"lg"}
                      variant="default"
                    >
                      <H5 className=" text-white">{"Place Order"}</H5>
                    </Button>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    </>
  );
}
