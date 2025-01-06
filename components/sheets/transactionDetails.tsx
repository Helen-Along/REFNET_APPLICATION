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
  Calendar,
  Coins,
  Group,
  ImageIcon,
  ListTodo,
  MapPin,
  Package,
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
import { fetchSuppliers, insertNewProductToDB } from "~/lib/supabase";
import { Value } from "@rn-primitives/select";
import { formatDate } from "~/lib/format-date";
import { formatTime } from "~/lib/format-time";

interface Supplier {
  user_id: Number;
  full_name: string;
}

export function TransactionDetailsModal({
  sheetTrigger,
  action,
  transaction,
}: {
  sheetTrigger: React.ReactNode;
  action: string;
  transaction: string;
}) {
  // ref
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  // callbacks
  const handlePresentModalPress = useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);
  const handleSheetChanges = useCallback((index: number) => {
    console.log("handleSheetChanges", index);
  }, []);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [supplier, setSupplier] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState([]);

  useEffect(() => {
    async function fetchAllSuppliers() {
      const response = await fetchSuppliers();
      setSuppliers(response);
      console.log("Suppliers fetched: ", response);
    }
    fetchAllSuppliers();
  }, []); // Run only once when the component mounts

  const insets = useSafeAreaInsets();
  const contentInsets = {
    top: insets.top,
    bottom: insets.bottom,
    left: 12,
    right: 12,
  };

  return (
    <>
      {React.cloneElement(sheetTrigger as React.ReactElement, {
        onPress: handlePresentModalPress,
      })}
      <BottomSheetModal
        ref={bottomSheetModalRef}
        onChange={handleSheetChanges}
        backgroundStyle={{ backgroundColor: "#111" }}
        handleIndicatorStyle={{ backgroundColor: "white" }}
      >
        <BottomSheetView className="p-6 gap-6">
          <View>
            <View className="gap-4">
              <View className="w-full">
                <View className="flex-row justify-between items-center mb-2">
                  <H3 className="text-lg ">{transaction.order.product.name}</H3>
                </View>
                <H4
                  className="text-gray-400 text-base mb-2 w-3/4"
                  numberOfLines={3}
                >
                  {transaction.order.product.description}
                </H4>
                <View
                  className={`rounded-md overflow-0 mt-4 pt-6 pl-6 h-48 ${
                    transaction.status === "pending"
                      ? "bg-orange-300"
                      : "bg-purple-300"
                  }`}
                >
                  <Image
                    source={{ uri: transaction.order.product.image_url }}
                    className="w-full rounded-tl-md h-full object-cover mix-blend-multiply bg-neutral-400"
                  />
                </View>
              </View>
              <View>
                <View className="flex-row w-full ">
                  <View className="flex items-start w-1/2">
                    <H5 className="text-sm text-gray-600 mb-2">
                      {"transaction Status"}
                    </H5>
                    <Button
                      size={"sm"}
                      className={` px-4 rounded-full flex-row items-center w-auto ${
                        transaction.status === "pending"
                          ? "bg-orange-300"
                          : "bg-green-300"
                      }`}
                    >
                      <H5
                        className={`${
                          transaction.status === "pending"
                            ? "text-orange-900"
                            : "text-green-900"
                        } text-base capitalize`}
                      >
                        {transaction.status}
                      </H5>
                    </Button>
                  </View>
                  <DetailItem
                    label="Tracking Number"
                    value={transaction.tracking_number || "N/A"}
                  />
                </View>
                <View className="flex-row items-center mb-2 w-auto">
                  <H5 className="text-base text-gray-800">
                    {transaction.delivery_address}
                  </H5>
                </View>
                <View className="flex-row items-center mb-4">
                  <Package className="w-4 h-4 text-gray-400 mr-2" />
                  <H5 className="text-base text-gray-800">
                    {transaction.tracking_number}
                  </H5>
                </View>

                <View className="flex-row gap-4 w-full justify-between">
                  <Button
                    className="p-0 bg-transparent"
                    size={"lg"}
                    variant="default"
                    disabled
                  >
                    <H5 className="text-zinc-200">
                      {formatDate(transaction.created_at)} &#8226;{" "}
                      {formatTime(transaction.created_at)}
                    </H5>
                  </Button>
                  <Button
                    disabled={transaction.status === "delivered" ? true : false}
                    className="rounded-full flex-1 bg-green-800 disabled:bg-green-400"
                    size={"lg"}
                    variant="default"
                  >
                    <H5 className=" text-white">{"Accept"}</H5>
                  </Button>
                </View>

                {transaction.status !== "delivered" && (
                  <TouchableOpacity
                    className="bg-green-500 py-3 px-4 rounded-lg mt-4"
                    onPress={() =>
                      onUpdateStatus(transaction.order_id, "delivered")
                    }
                  >
                    <H5 className="text-white text-center font-semibold">
                      Mark as Delivered
                    </H5>
                  </TouchableOpacity>
                )}
                {transaction.status === "pending" && (
                  <TouchableOpacity
                    className="bg-blue-500 py-3 px-4 rounded-lg mt-4"
                    onPress={() =>
                      onUpdateStatus(transaction.order_id, "In Transit")
                    }
                  >
                    <H5 className="text-white text-center font-semibold">
                      Start Delivery
                    </H5>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    </>
  );
}
const DetailItem: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => (
  <View className="mb-2">
    <H5 className="text-sm text-gray-600 mb-1">{label}</H5>
    <P className="text-base capitalize">{value}</P>
  </View>
);
