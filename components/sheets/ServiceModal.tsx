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
import {
  checkUser,
  fetchProductsFromDB,
  fetchServiceDetails,
  fetchSuppliers,
  insertNewProductToDB,
  supabase,
} from "~/lib/supabase";
import { Value } from "@rn-primitives/select";
import { formatPrice } from "~/lib/format-price";
import { useEmail } from "~/app/EmailContext";

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
  product: any;
  onUpdateStock: (productId: number, newStock: number) => void;
};

export function ServiceModal({
  sheetTrigger,
  serviceId,
}: {
  sheetTrigger: React.ReactNode;
  serviceId: any;
}) {
  const emailContext = useEmail();

  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const [serviceDetails, setServiceDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [products, setProducts] = useState([]);
  const [customerId, setCustomerId] = useState();

  useEffect(() => {
    const loadServiceDetails = async () => {
      setLoading(true);
      try {
        const details = await fetchServiceDetails(Number(serviceId));
        console.log("Service details: ", details);
        setServiceDetails(details);
      } catch (error) {
        console.error("Error fetching service details:", error);
      } finally {
        setLoading(false);
      }
    };
    const loadProducts = async () => {
      try {
        const data = await fetchProductsFromDB();
        setProducts(data);
      } catch (error) {
        console.error("Error loading products:", error);
      } finally {
        setLoading(false);
      }
    };
    const updateCustomerId = async () => {
      const response = await checkUser(emailContext?.email);
      setCustomerId(response.user_id);
    };

    updateCustomerId();

    loadServiceDetails();
    loadProducts();
  }, [serviceId]);

  async function handleBookService(
    serviceId: any,
    selectedProduct: any,
    customer_id: any
  ) {
    console.log("serviceId:", serviceId);
    try {
      const { data, error } = await supabase.from("repairs").insert([
        {
          service_id: serviceId,
          product_id: selectedProduct.value,
          customer_id: customer_id,
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) {
        throw error;
      }

      // Optionally, you can handle success notification or state update here
      displayNotification("Service booked successfully!", "success");
      bottomSheetModalRef.current?.dismiss();
    } catch (error) {
      console.error("Error booking service:", error);
      displayNotification("Failed to book service. Please try again.", "error");
    }
  }

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
            <H3 className="text-2xl">{serviceDetails?.name}</H3>
            <P className="text-base text-gray-400">
              {serviceDetails?.description}
            </P>
            <View className="flex-row w-full gap-4 mt-6">
              <View className="flex-1">
                <H5 className="text-sm text-white mb-2">{"Service type"}</H5>
                <H3 className="text-sm w-1/2 text-center rounded-full p-2 px-4 bg-green-300 text-green-900 leading-0 capitalize">
                  {serviceDetails?.service_type}
                </H3>
              </View>
              <DetailItem
                label="Price"
                value={formatPrice(serviceDetails?.price)}
              />
            </View>
            <View className="flex-row items-center gap-4 w-full mt-8">
              <Select
                value={selectedProduct}
                onValueChange={setSelectedProduct}
                className="flex-1"
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder="Select a product"
                    className="text-white"
                    style={{ fontFamily: "Inter_500Medium" }}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectLabel>Select your product</SelectLabel>
                  {products.map((product) => (
                    <SelectItem
                      key={product.product_id}
                      label={`${product.name}`}
                      value={product.product_id}
                    />
                  ))}
                </SelectContent>
              </Select>
              <Button
                onPress={() =>
                  handleBookService(
                    serviceDetails?.service_id,
                    selectedProduct,
                    customerId
                  )
                }
                className="rounded-full w-auto bg-white disabled:bg-green-400"
                size={"lg"}
                variant="default"
              >
                <H5 className=" text-black">{"Book Now"}</H5>
              </Button>
            </View>
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    </>
  );
}
