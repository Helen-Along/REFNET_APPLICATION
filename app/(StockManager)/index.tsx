import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { supabase } from "~/lib/supabase";
import { StatisticsCard } from "~/components/StatisticsCard";
import { Input } from "~/components/ui/input";
import { H3, H4, H5, P } from "~/components/ui/typography";
import { Button } from "~/components/ui/button";
import { ProductRestock } from "~/components/sheets/ProductRestock";
import {
  AlertTriangle,
  GalleryVerticalEnd,
  Layers2,
  Package2,
  PlusIcon,
  Search,
  Truck,
} from "lucide-react-native";
import displayNotification from "~/lib/Notification";
import { AddProduct } from "~/components/sheets/addproduct";
import StatsCard from "~/components/StatsCard";

type Product = {
  product_id: number;
  name: string;
  description: string;
  price: number;
  stock_quantity: number;
  image_url: string;
};

type InventoryStats = {
  totalProducts: number;
  lowStock: number;
  deliveryRate: number;
  inventoryHealth: number;
};

const LOW_STOCK_THRESHOLD = 10;
const OPTIMAL_STOCK_THRESHOLD = 50;
const PRODUCTS_PER_PAGE = 6;

export default function Page() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<InventoryStats>({
    totalProducts: 0,
    lowStock: 0,
    deliveryRate: 0,
    inventoryHealth: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  const statistics = [
    {
      iconBgColor: "bg-blue-600",
      Icon: <GalleryVerticalEnd color="white" size={19} />,
      Title: "Total Products",
      Description: stats.totalProducts + " Products",
    },
    {
      iconBgColor: "bg-orange-600",
      Icon: <Layers2 color="white" size={19} />,
      Title: "Low Stock Items",
      Description: stats.lowStock + " Products",
    },
    {
      iconBgColor: "bg-red-600",
      Icon: <Truck color="white" size={19} />,
      Title: "Delivery Rate",
      Description: stats.deliveryRate + " Products",
    },
    {
      iconBgColor: "bg-purple-600",
      Icon: <Package2 color="white" size={19} />,
      Title: "Inventory Health",
      Description: stats.inventoryHealth + "% Health",
    },
  ];

  useEffect(() => {
    fetchProducts();
    const subscription = supabase
      .channel("products")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        handleProductChange
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const calculateStats = (products: Product[]) => {
    const totalProducts = products.length;
    const lowStockItems = products.filter(
      (p) => p.stock_quantity < LOW_STOCK_THRESHOLD
    ).length;
    const productsWithOptimalStock = products.filter(
      (p) => p.stock_quantity >= OPTIMAL_STOCK_THRESHOLD
    ).length;
    const inventoryHealth = (productsWithOptimalStock / totalProducts) * 100;
    const stockLevels = products.reduce((acc, p) => acc + p.stock_quantity, 0);
    const maxPossibleStock = totalProducts * OPTIMAL_STOCK_THRESHOLD;
    const deliveryRate = Math.min((stockLevels / maxPossibleStock) * 100, 100);

    setStats({
      totalProducts,
      lowStock: lowStockItems,
      deliveryRate: Math.round(deliveryRate),
      inventoryHealth: Math.round(inventoryHealth),
    });
  };

  const fetchProducts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("products")
        .select(
          "product_id, name, description, price, stock_quantity, image_url"
        );

      if (error) throw error;
      const productData = data || [];
      setProducts(productData);
      calculateStats(productData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleProductChange = (payload: any) => {
    fetchProducts();
  };

  const updateQuantity = async (id: number, newQuantity: number) => {
    try {
      const { error } = await supabase
        .from("products")
        .update({ stock_quantity: newQuantity })
        .eq("product_id", id);

      if (error) throw error;

      const updatedProducts = products.map((product) =>
        product.product_id === id
          ? { ...product, stock_quantity: newQuantity }
          : product
      );
      setProducts(updatedProducts);
      calculateStats(updatedProducts);
      displayNotification("Quantity updated succesfully", "success");
      return;
    } catch (err) {
      console.log(err);
      displayNotification("Error occured please try again", "danger");
    }
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE
  );

  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-100">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-100">
        <Text className="text-red-500 text-lg">{error}</Text>
        <TouchableOpacity
          className="mt-4 bg-blue-500 px-4 py-2 rounded-lg"
          onPress={fetchProducts}
        >
          <Text className="text-white font-bold">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View className="bg-white p-4 gap-6">
        <H3 className="text-black">Statistics</H3>
        <View className="flex-row flex-wrap gap-y-6 justify-between">
          {statistics.map((stat) => (
            <StatsCard
              iconBgColor={stat.iconBgColor}
              Icon={stat.Icon}
              Title={stat.Title}
              Description={stat.Description}
            />
          ))}
        </View>
      </View>

      <View className="my-4 gap-4 py-4 mt-10">
        <View className="px-2 flex-row items-center justify-between">
          <H3 className="text-2xl w-1/2">Manage Products</H3>
          <AddProduct
            sheetTrigger={
              <Button className="rounded-full px-4 py-2 bg-[#111]">
                <P className="">+ Add Product</P>
              </Button>
            }
          />
        </View>
        <View className="flex-row items-center px-4">
          <Search size={16} color={"#999"} />
          <Input
            className="my-2 mx-2 py-2 border-none border-0 bg-transparent w-full text-black"
            placeholder="Search for a product"
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>
        <View>
          {paginatedProducts.map((product) => (
            <ProductItem
              key={product.product_id}
              product={product}
              onUpdateQuantity={updateQuantity}
            />
          ))}
        </View>
        <View className="flex-row items-center justify-between my-4 px-2">
          <Button
            className="bg-[#111] rounded-full px-4 py-2 disabled:bg-zinc-900"
            onPress={handlePreviousPage}
            disabled={currentPage === 1}
          >
            <P className="text-white">&larr; Previous</P>
          </Button>

          {/* Centered Page Number */}
          <P className="text-white mx-4">
            Page {currentPage} of {totalPages}
          </P>

          <Button
            className="bg-[#111] rounded-full px-4 py-2 disabled:bg-zinc-900"
            onPress={handleNextPage}
            disabled={currentPage === totalPages}
          >
            <P className="text-white">Next &rarr;</P>
          </Button>
        </View>
      </View>
    </ScrollView>
  );
};

const ProductItem = ({
  product,
  onUpdateQuantity,
}: {
  product: Product;
  onUpdateQuantity: (id: number, newQuantity: number) => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newQuantity, setNewQuantity] = useState(
    product.stock_quantity.toString()
  );
  const [isDescriptionVisible, setIsDescriptionVisible] = useState(false);

  const handleUpdate = () => {
    const updatedQuantity = parseInt(newQuantity);
    if (isNaN(updatedQuantity) || updatedQuantity < 0) {
      Alert.alert("Invalid Input", "Please enter a valid number for quantity.");
      return;
    }
    onUpdateQuantity(product.product_id, updatedQuantity);
    setIsEditing(false);
  };

  const isLowStock = product.stock_quantity < 10;

  return (
    <View className="bg-white shadow-sm mb-3 p-4">
      <View className="flex-row gap-4">
        <View className="flex-1">
          <H3 className="text-lg text-gray-800">{product.name}</H3>
          <P className="text-sm text-gray-600 line-clamp-3">
            {product.description}
          </P>
          <Image
            source={{
              uri: product.image_url.replace(/^http:\/\//i, "https://"),
            }}
            className="w-full h-48 rounded-lg mt-6 border"
            style={{ objectFit: "cover" }}
          />
          <View className="flex-row items-center mt-8">
            {isEditing ? (
              <View className="flex-row gap-2 items-center justify-between w-full">
                <Input
                  className="bg-transparent border outline-none text-black w-1/2 rounded-full px-4"
                  value={newQuantity}
                  onChangeText={setNewQuantity}
                  keyboardType="numeric"
                  maxLength={4}
                  autoFocus
                />
                <View className="flex-row gap-2 items-center flex-1">
                  <Button
                    className="bg-blue-500 rounded-full"
                    size={"default"}
                    onPress={handleUpdate}
                  >
                    <P className="text-white">Save</P>
                  </Button>
                  <Button
                    className="bg-black rounded-full px-3 py-1"
                    size={"default"}
                    onPress={() => setIsEditing(false)}
                  >
                    <P className="text-white">Cancel</P>
                  </Button>
                </View>
              </View>
            ) : (
              <View className="flex-row items-center justify-between w-full">
                <H4
                  className={`text-base mr-2 flex items-center ${
                    isLowStock ? "text-red-500" : "text-yellow-700"
                  }`}
                >
                  <View className="flex-row items-center gap-2">
                    {isLowStock && <AlertTriangle size={14} color="#ef4444" />}
                    <H4
                      className={`text-lg ${
                        isLowStock ? "text-red-500" : "text-black"
                      }`}
                    >
                      {isLowStock
                        ? `Limited Stock: ${product.stock_quantity}`
                        : `In Stock: ${product.stock_quantity}`}
                    </H4>
                  </View>
                </H4>
                <ProductRestock
                  sheetTrigger={
                    <Button
                      className="w-max px-8 rounded-full bg-green-600"
                      size={"lg"}
                      variant="default"
                    >
                      <H4 className="text-lg text-black">
                        Product Restock &rarr;
                      </H4>
                    </Button>
                  }
                    visible={true}
                    product={product}
                    dispatchId={product.dispatch_id}
                />
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};
