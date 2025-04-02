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

export function AssignMaterialsModal({
  sheetTrigger,
  visible,
  product,
  repair,
  onAssign,
  selectedMaterials,
  onMaterialSelect,
}: {
  sheetTrigger: React.ReactNode;
  visible: boolean;
  product: any;
  repair: any;
  onAssign: any;
  selectedMaterials: number[];
  onMaterialSelect: (materialId: number) => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [productData, setProductData] = useState(product);
  const [materials, setMaterials] = useState()
  const [selectedMaterial, setSelectedMaterial] = useState()
  console.log('Materials: ', materials)
  const fetchMaterials = async () => {
    try {
      const { data, error } = await supabase.from("materials").select("*");
      if (error) throw error;
      setMaterials(data || []);
      console.log('Fetching materials: ', data)
    } catch (err) {
      console.error("Error fetching materials:", err);
    }
  };
    useEffect(() => {
    if (visible) {
        bottomSheetModalRef.current?.present();
        setProductData(product);
        fetchMaterials()
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

  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  const presentModal = useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);

  const handleAssign = (action: any) => {
    if (action === "accept") {
      // Update technician_status to 'accepted' using repair id
      supabase
        .from("repairs")
        .update({ technician_status: "accepted", supplier_status: 'assigned' })
        .eq("id", repair.id)
        .then((response) => {
          if (response.error) {
            displayNotification("Error updating status", "danger");
            bottomSheetModalRef.current?.dismiss();
          } else {
            displayNotification("Status updated to accepted", "success");
            bottomSheetModalRef.current?.dismiss();
          }
        });
    } else if (action === "decline") {
      // Update technician_status to 'declined' using repair id
      supabase
        .from("repairs")
        .update({ technician_status: "declined" })
        .eq("id", repair.id)
        .then((response) => {
          if (response.error) {
            displayNotification("Error updating status", "danger");
            bottomSheetModalRef.current?.dismiss();
          } else {
            displayNotification("Status updated to declined", "success");
            bottomSheetModalRef.current?.dismiss();
          }
        });
    }
  };

  const handleAssignMaterials = () => {
    supabase
      .from("repairs")
      .update({ materials_assigned: selectedMaterial, supplier_status: 'assigned' })
      .eq("id", repair.id)
      .then((response) => {
        if (response.error) {
          displayNotification("Error assigning materials", "danger");
        } else {
          displayNotification("Materials assigned successfully", "success");
          bottomSheetModalRef.current?.dismiss();
        }
      });
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
                  {/* <Image
                    source={{
                      uri: productData?.image_url?.replace(
                        /^http:\/\//i,
                        "https://"
                      ),
                    }}
                    className="w-full h-48 rounded-lg mb-4"
                  /> */}
                  <DetailItem label="Name" value={productData.name} />
                  <DetailItem label="Category" value={productData.category} />
                  <H5 className="text-sm text-gray-600 mb-1">
                    {"Select Material"}
                  </H5>
                  <Select
                    value={selectedMaterial}
                    onValueChange={setSelectedMaterial}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder="Select material"
                        className="text-white"
                        style={{ fontFamily: "Inter_500Medium" }}
                      />
                    </SelectTrigger>
                    <ScrollView>
                      <SelectContent style={{ maxHeight: 200 }}>
                        <SelectGroup>
                          <SelectLabel>Materials</SelectLabel>
                          {materials?.map((material: any) => (
                            <SelectItem
                              key={material.name}
                              value={material.id}
                              label={material.name}
                            />
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </ScrollView>
                  </Select>
                  <View className="flex-row items-center gap-2 w-2/3 pt-4 ml-auto">
                    <Button
                      onPress={handleAssignMaterials}
                      className="rounded-full flex-1 bg-green-800 disabled:bg-green-400"
                      size={"lg"}
                      variant="default"
                    >
                      <H5 className=" text-white">{"Assign Material"}</H5>
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
