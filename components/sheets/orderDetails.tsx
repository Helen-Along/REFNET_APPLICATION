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
import { formatDate } from "~/lib/format-date";
import { formatTime } from "~/lib/format-time";

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
};

export function OrderDetailsModal({
  sheetTrigger,
  visible,
  product,
  order,
}: {
  sheetTrigger: React.ReactNode;
  visible: boolean;
  product: any;
  order: any;
}) {
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [productData, setProductData] = useState(product);
  const [orderID, setOrderID] = useState(order.order_id)
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (visible) {
      bottomSheetModalRef.current?.present();
      setProductData(product);
      setOrderID(order.order_id)
    } else {
      bottomSheetModalRef.current?.dismiss();
    }
  }, [visible, product]);

  console.log('Order: ', order)

  const [newStock, setNewStock] = useState("");

  const handleOrderApproval = async () => {
    setUpdating(true);
    const { data, error } = await supabase
      .from("orders")
      .update({ finance_approval: "approved" })
      .eq("order_id", order.order_id);

    if (error) {
      displayNotification(error.message, 'danger');
    } else {
      const { error: dispatchError } = await supabase
        .from("dispatches")
        .insert([{ order_id: order.order_id, user_id: order.user_id }]);

      if (dispatchError) {
        displayNotification(dispatchError.message, "danger");
      } else {
        const totalAmount = productData.price;
        const { data: balanceData, error: balanceError } = await supabase
          .from("financial_records")
          .select("balance")
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (balanceError) {
          displayNotification(balanceError.message, "danger");
        } else {
          const newBalance = (balanceData.balance || 0) + totalAmount;
          const { error: insertError } = await supabase
            .from("financial_records")
            .insert([
              {
                order_id: order.order_id,
                payment_type: "incoming",
                amount: totalAmount,
                balance: newBalance,
              },
            ]);

          if (insertError) {
            displayNotification(insertError.message, "danger");
            console.log("INsert finance record balance: ", insertError.message);
          } else {
            displayNotification(
              "Order approved and dispatched successfully!",
              "success"
            );
            bottomSheetModalRef.current?.dismiss();
          }
        }
      }
    }
    setUpdating(false);
  };

  const handleOrderDecline = async (orderId: any) => {
    setUpdating(true);
    const { data, error } = await supabase
      .from("orders")
      .update({ finance_approval: "declined" })
      .eq("order_id", orderId);

    if (error) {
      displayNotification(error.message, "danger");
    } else {
      displayNotification("Order declined successfully!", "success");
      bottomSheetModalRef.current?.dismiss();
    }
    setUpdating(false);
  };

  return (
    <>
      {React.cloneElement(sheetTrigger as React.ReactElement, {
        onPress: () => bottomSheetModalRef.current?.present(),
      })}
      <BottomSheetModal
        ref={bottomSheetModalRef}
        backgroundStyle={{ backgroundColor: "#111" }}
        handleIndicatorStyle={{ backgroundColor: "white" }}
      >
        <BottomSheetView className="p-6 gap-6">
          <View>
            <View className="flex-row justify-between items-center mb-4">
              <H4 className="text-xl">Order Details</H4>
            </View>
            <ScrollView>
              {isLoading ? (
                <View className="flex items-center justify-center h-48">
                  <H5 className="text-gray-500">Loading...</H5>
                </View>
              ) : (
                <>
                  <Image
                    source={{
                      uri: productData.products.image_url.replace(
                        /^http:\/\//i,
                        "https://"
                      ),
                    }}
                    className="w-full h-48 rounded-lg mb-4"
                  />
                  <DetailItem label="Name" value={productData.products.name} />
                  <DetailItem
                    label="Description"
                    value={productData.products.description}
                  />
                  <View className="flex-row w-full">
                    <View className="w-1/2">
                      <DetailItem
                        label="Price"
                        value={`${formatPrice(
                          productData.products.price.toFixed(2)
                        )}`}
                      />
                    </View>
                    <DetailItem
                      label="Amount Paid"
                      value={`${formatPrice(
                        productData.products.price.toFixed(2)
                      )}`}
                    />
                  </View>
                  <View className="mb-4 ">
                    <H5 className="text-sm text-gray-600 mb-1">
                      {"Payment Status"}
                    </H5>
                    <H5 className="text-base w-1/3 text-center text-green-900 p-2 px-4 bg-green-50 rounded-full">
                      {productData.payment_status || "N/A"}
                    </H5>
                  </View>
                  <View className="flex-row w-full">
                    <View className="w-1/2">
                        <DetailItem
                          label="Delivery Address"
                          value={productData.delivery_address || "N/A"}
                        />
                    </View>
                  <DetailItem
                    label="Order Placed ON"
                    value={`${formatDate(
                      productData.created_at
                    )} • ${formatTime(productData.created_at)}`}
                  />
                  </View>
                  <View className="border-t-[1px] border-zinc-900 py-4">
                    <View className="flex-row items-center rounded-md w-full gap-2">
                      <Button
                        onPress={() => handleOrderDecline(order.order_id)}
                        className="rounded-full w-auto border-2 border-slate-500 bg-transparent"
                        size={"lg"}
                        variant="default"
                        disabled={updating}
                      >
                        <H4 className="text-lg text-slate-400">
                          &larr; {updating ? "Updating" : "Cancel"}
                        </H4>
                      </Button>
                      <Button
                        onPress={() => handleOrderApproval()}
                        className="rounded-full flex-1"
                        size={"lg"}
                        variant="default"
                        disabled={updating}
                      >
                        <H4 className="text-lg text-black">
                          {updating ? "Updating" : "Approve"}
                        </H4>
                      </Button>
                    </View>
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
