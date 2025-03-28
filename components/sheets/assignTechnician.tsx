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
import { fetchSuppliers, insertAssignedRepairToDB, insertNewProductToDB, supabase, updateAssignedRepair } from "~/lib/supabase";
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

export function AssignTechnicianModal({
  sheetTrigger,
  visible,
  product,
  repair,
  technicians,
  onAssign,
}: {
  sheetTrigger: React.ReactNode;
  visible: boolean;
  product: any;
  repair: any;
  technicians: any;
  onAssign: (technicianId: number) => void;
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

  const [newStock, setNewStock] = useState("");

  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const [selectedTechnician, setSelectedTechnician] = useState<string>("");

  const presentModal = useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);

  const handleAssign = async () => {
    if (!selectedTechnician || !repair.id) {
      displayNotification(
        "Please select a technician and ensure the service ID is available.",
        "warning"
      );
      return;
    }
    const technicianId = parseInt(selectedTechnician.value);
    const repairId = repair.id; 

    // Insert the assignment into the assigned_repairs table
    const result = await updateAssignedRepair(repairId, technicianId);

    if (result.startsWith("Success")) {
      displayNotification("Technician assigned successfully.", "success");
    } else {
      displayNotification(result, "danger");
    }

    bottomSheetModalRef.current?.dismiss();
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
              <H4 className="text-xl">Product Details</H4>
              <TouchableOpacity>
                <ShieldCloseIcon className="w-6 h-6 text-gray-500" />
              </TouchableOpacity>
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
                      uri: productData?.image_url?.replace(/^http:\/\//i, "https://") || "",
                    }}
                    className="w-full h-48 rounded-lg mb-4"
                  />
                  <DetailItem label="Name" value={productData.name} />
                  <DetailItem label="Category" value={productData.category} />
                  <DetailItem
                    label="Description"
                    value={productData.description}
                  />
                  <DetailItem
                    label="Price"
                    value={`${formatPrice(productData.price.toFixed(2))}`}
                  />
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
                    <DetailItem
                      label="Reorder Level"
                      value={
                        productData.reorder_level &&
                        productData.reorder_level.toString()
                      }
                    />
                  </View>

                  <View className="flex-row items-center gap-2 w-full">
                    <Select
                      value={selectedTechnician}
                      onValueChange={setSelectedTechnician}
                      className="flex-1"
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder="Select a technician"
                          className="text-white"
                          style={{ fontFamily: "Inter_500Medium" }}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Available Technicians</SelectLabel>
                          {technicians.map((tech) => (
                            <SelectItem
                              key={tech.id}
                              label={`${tech.users.username} (${tech.specialization})`}
                              value={tech.user_id.toString()}
                            />
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <Button
                      onPress={handleAssign}
                      className="rounded-full w-auto bg-green-800 disabled:bg-green-400"
                      size={"lg"}
                      variant="default"
                    >
                      <H5 className=" text-white">{"Assign"}</H5>
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
