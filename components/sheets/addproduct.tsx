import { BottomSheetView } from "@gorhom/bottom-sheet";
import { H3, H5, P } from "../ui/typography";
import { useRef, useState, useEffect } from "react";
import { H4 } from "../ui/typography";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import * as React from "react";
import { useCallback } from "react";
import { ScrollView, View, Image } from "react-native";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import displayNotification from "~/lib/Notification";
import { Box, Coins, Group, ImageIcon, SquareStack } from "lucide-react-native";
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

interface Supplier {
  user_id: Number,
  full_name: string,
}

export function AddProduct({
  sheetTrigger,
}: {
  sheetTrigger: React.ReactNode;
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

  async function handleAddProduct() {
    setLoading(true)
    if (name && description && supplier && category && price && stockQuantity && imageUrl) {
      const response = await insertNewProductToDB(
        name,
        description,
        Number(price),
        Number(supplier),
        Number(stockQuantity),
        category,
        imageUrl
      );
      if (response.startsWith("Success")) {
        displayNotification("Products added Successfully", "success");
        bottomSheetModalRef.current?.dismiss();
        setLoading(false)
        return;
      } else {
        displayNotification(response, "danger");
        setLoading(false);
      }
      setLoading(false)
    } else {
      displayNotification("Please fill in all the fields", "danger");
    }
    setLoading(false);
  }

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
          {/* Title and Subtitle */}
          <View className="items-center mb-8">
            <H3 className="text-2xl mb-2 text-center">Add new product</H3>
            <P className="text-gray-500 text-center">
              Please fill in the form to add a new product
            </P>
          </View>
          <ScrollView>
            <View className="gap-4">
              <View className="gap-2">
                <P className="text-white">Name</P>
                <View className="flex-row items-center px-2 rounded-md w-full">
                  <Box size={14} color={"white"} />
                  <Input
                    placeholder="Product Name"
                    onChangeText={setName}
                    className="bg-transparent  text-white border-0 flex-1"
                    autoComplete="name"
                    textContentType="name"
                    keyboardType="default"
                  />
                </View>
              </View>
              <View className="gap-2">
                <P className="text-white">Description</P>
                <Textarea
                  placeholder="Description"
                  className="bg-transparent border-0"
                  onChangeText={setDescription}
                />
              </View>
              <View className="flex-row">
                <Select
                  onValueChange={(option) => setSupplier(option.value)}
                  className="w-1/2"
                >
                  <P className="text-white pb-2">Supplier</P>
                  <View className="flex-row items-center w-full">
                    <Group size={14} color={"white"} />
                    <SelectTrigger className="bg-transparent border-0 flex-1">
                      <SelectValue
                        className="text-foreground text-sm native:text-lg bg-transparent"
                        placeholder="Select a supplier"
                        style={{ fontFamily: "Inter_400Regular" }}
                      />
                    </SelectTrigger>
                  </View>

                  <SelectContent insets={contentInsets} className="w-[250px]">
                    <SelectGroup>
                      <SelectLabel className="uppercase border-b-[1px] border-b-white">
                        Select Supplier
                      </SelectLabel>
                      <ScrollView>
                        {suppliers.map((supplier) => (
                          <SelectItem
                            key={supplier.supplier_id}
                            label={supplier.users.full_name}
                            value={supplier.supplier_id}
                          >
                            {supplier.full_name}
                          </SelectItem>
                        ))}
                      </ScrollView>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <Select
                  defaultValue={{ value: "Chillers", label: "Chillers" }}
                  onValueChange={(option) => setCategory(option.value)}
                  className="w-1/2"
                >
                  <P className="text-white pb-2">Category</P>
                  <View className="flex-row items-center w-full">
                    <Group size={14} color={"white"} />
                    <SelectTrigger className="bg-transparent border-0 flex-1">
                      <SelectValue
                        className="text-foreground text-sm native:text-lg bg-transparent"
                        placeholder="Select a category"
                        style={{ fontFamily: "Inter_400Regular" }}
                      />
                    </SelectTrigger>
                  </View>
                  <SelectContent insets={contentInsets} className="w-[250px]">
                    <SelectGroup>
                      <SelectLabel className="uppercase border-b-[1px] border-b-white">
                        Select Category
                      </SelectLabel>
                      <ScrollView>
                        <SelectItem label="Chillers" value="Chillers">
                          Chillers
                        </SelectItem>
                        <SelectItem
                          label="Air Handling Units"
                          value="Air Handling Units"
                        >
                          Air Handling Units
                        </SelectItem>
                        <SelectItem
                          label="Fan Coil Units"
                          value="Fan Coil Units"
                        >
                          Fan Coil Units
                        </SelectItem>
                        <SelectItem label="VRF Multi" value="VRF Multi">
                          VRF Multi
                        </SelectItem>
                        <SelectItem
                          label="Ducted Split Systems"
                          value="Ducted Split Systems"
                        >
                          Ducted Split Systems
                        </SelectItem>
                        <SelectItem label="Residential" value="Residential">
                          Residential
                        </SelectItem>
                        <SelectItem label="Accessories" value="Accessories">
                          Accessories
                        </SelectItem>
                      </ScrollView>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </View>
              <View className="flex-row justify-between">
                <View className="gap-2 w-1/3">
                  <P className="text-white">Price</P>
                  <View className="flex-row items-center px-2 rounded-md">
                    <Coins size={14} color={"white"} />
                    <Input
                      placeholder="001000"
                      onChangeText={setPrice}
                      className="bg-transparent  border-0 text-white"
                      autoComplete="off"
                      textContentType="none"
                      keyboardType="numeric"
                      maxLength={6}
                    />
                  </View>
                </View>
                <View className="gap-2 w-2/3 pl-6">
                  <P className="text-white">Quantity</P>
                  <View className="flex-row items-center px-2 rounded-md">
                    <SquareStack size={14} color={"white"} />
                    <Input
                      placeholder="0100"
                      onChangeText={setStockQuantity}
                      className="bg-transparent  border-0 text-white"
                      textContentType="none"
                      keyboardType="numeric"
                      maxLength={4}
                    />
                  </View>
                </View>
              </View>
              <View className="gap-2">
                <P className="text-white">Image Url</P>
                <View className="flex-row items-center rounded-md">
                  {imageUrl ? (
                    <Image
                      source={{
                        uri: imageUrl.replace(/^http:\/\//i, "https://"),
                      }}
                      className="w-10 h-10 bg-white rounded-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <ImageIcon size={14} color={"white"} />
                  )}
                  <Input
                    placeholder="Paste the url for the product"
                    onChangeText={setImageUrl}
                    className="bg-transparent  text-white border-0"
                    autoComplete="name"
                    textContentType="name"
                    keyboardType="default"
                  />
                </View>
              </View>
              <Button
                onPress={handleAddProduct}
                className="w-full rounded-full"
                size={"lg"}
                variant="default"
                disabled={loading}
              >
                <H5 className=" text-black">
                  {loading ? "Adding" : "Add New Product"}
                </H5>
              </Button>
            </View>
          </ScrollView>
        </BottomSheetView>
      </BottomSheetModal>
    </>
  );
}
