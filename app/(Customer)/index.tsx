import React from "react";
import {
  View,
  Image,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  ImageBackground,
  ActivityIndicator,
  Touchable,
} from "react-native";
import {
  ChevronRight,
  TrendingUp,
  Star,
  Package,
  Clock,
  GalleryVertical,
  ListTodo,
  CloudSnow,
  Wind,
  Fan,
  Bolt,
  Boxes,
  Container,
} from "lucide-react-native";
import { H1, H2, H3, H4, H5, H6, P } from "~/components/ui/typography";
import { Button } from "~/components/ui/button";
import { useEffect, useState } from "react";
import {
  checkUser,
  fetchProductsFromDB,
  fetchServicesFromDB,
} from "~/lib/supabase";
import { formatPrice } from "~/lib/format-price";
import { Ionicons } from "@expo/vector-icons";
import { useEmail } from "~/app/EmailContext";
import { Link, useNavigation } from "expo-router";
import StatsCard from "~/components/StatsCard";
import { NavigationProp } from "@react-navigation/native";
import { formatBalance } from "~/lib/formatBalance";
import { LinearGradient } from "expo-linear-gradient";
import {ServiceModal} from "~/components/sheets/ServiceModal"; // Import the ServiceModal

const { width } = Dimensions.get("window");

type RootStackParamList = {
  search: undefined;
  product: { product: string };
};
const stats = [
  {
    iconBgColor: "bg-blue-600",
    Icon: <CloudSnow color="white" size={19} />,
    Title: "Chillers",
    Description: "Industrial Cooling Solutions",
  },
  {
    iconBgColor: "bg-orange-600",
    Icon: <Wind color="white" size={19} />,
    Title: "Air Handling Units",
    Description: "Commercial HVAC Systems",
  },
  {
    iconBgColor: "bg-purple-600",
    Icon: <Fan color="white" size={19} />,
    Title: "Fan coil units",
    Description: "Providing efficient temperature control",
  },
];

const PRODUCTS_PER_PAGE = 6; // Define the number of products per page

export default function Page() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(
    null
  );
  const [isModalVisible, setModalVisible] = useState(false);

  const [products, setProducts] = useState<
    Array<{
      product_id: string;
      name: string;
      price: number;
      image_url: string;
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [customer, setCustomerDetails] = useState([]);
  const emailContext = useEmail();
  const [services, setServices] = useState<
    Array<{ id: string; name: string; description: string }>
  >([
    { id: "1", name: "Service A", description: "Description for Service A" },
    { id: "2", name: "Service B", description: "Description for Service B" },
  ]);
  const [currentPage, setCurrentPage] = useState(1); // Keep state for current page
  const [bookedServices, setBookedServices] = useState<
    Array<{ repair_id: string; customer_id: string }>
  >([]); // State to hold booked services

  useEffect(() => {
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

    const loadServices = async () => {
      try {
        const serviceData = await fetchServicesFromDB();
        const filteredServices = serviceData.filter(
          (service) =>
            !bookedServices.some(
              (booked) =>
                booked.repair_id === service.id &&
                booked.customer_id === emailContext?.email // Check against customer_id and repair_id
            )
        ); // Filter out booked services
        setServices(filteredServices);
        console.log("Fetched Services:>>>>>>> ", filteredServices);
      } catch (error) {
        console.error("Error loading services:", error);
      }
    };

    async function fetchUserDetails() {
      const response = await checkUser(emailContext?.email);
      setCustomerDetails(response);
      setBookedServices(response.booked_services || []); // Assuming booked_services is part of the user details
    }

    fetchUserDetails();
    loadProducts();
    loadServices();
  }, []);

  const paginatedProducts = products.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE
  ); // Slice products for pagination

  const totalPages = Math.ceil(products.length / PRODUCTS_PER_PAGE); // Calculate total pages

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

  const renderFeaturedCategories = () => (
    <View className="bg-white p-4 gap-6">
      <View className="flex-row justify-between items-center w-full">
        <H3 className="text-black flex-1">Categories</H3>
        <Link href="/(Customer)/search" className="">
          <H4 className="text-blue-600 text-sm">View More &rarr;</H4>
        </Link>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-4">
          {stats.map((stat) => (
            <StatsCard
              key={stat.Title}
              iconBgColor={stat.iconBgColor}
              Icon={stat.Icon}
              Title={stat.Title}
              Description={stat.Description}
              onStatPress={() => navigation.navigate("search")}
              statChartStyles={{ width: 150 }}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );

  const renderProducts = () => (
    <View className="mt-10 px-2 gap-4">
      <View className="flex-row items-center justify-between">
        <H3 className="flex-1 text-xl">Featured Products</H3>
        <Link href="/(Customer)/search" className="">
          <H4 className="text-white text-sm">View More &rarr;</H4>
        </Link>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-2">
          {products.slice(0, 4).map((product) => (
            <TouchableOpacity
              key={product.product_id}
              className="w-[250px] h-48 rounded-md shadow relative"
              onPress={() =>
                navigation.navigate("product", {
                  product: JSON.stringify(product),
                })
              }
            >
              <Image
                source={{
                  uri: product.image_url.replace(/^http:\/\//i, "https://"),
                }}
                className="w-full h-full rounded-sm mb-2"
                resizeMode="cover"
              />
              <LinearGradient
                colors={["transparent", "rgba(0, 0, 0, 0.9)"]}
                className="absolute bottom-0 left-0 h-36 w-full"
              />
              <View className="absolute bottom-0 flex-row items-end justify-between w-full px-2 pb-2">
                <H6 numberOfLines={1} className="text-base w-3/4">
                  {product.name}
                </H6>

                <H5
                  numberOfLines={1}
                  className="text-base flex-row gap-2 h-max"
                >
                  {formatBalance(product.price)}
                </H5>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
  const renderAllProducts = () => {
    const paginatedProducts = products.slice(
      (currentPage - 1) * PRODUCTS_PER_PAGE,
      currentPage * PRODUCTS_PER_PAGE
    ); // Slice products for pagination

    return (
      <View className="mt-14 ">
        <View className="flex-row items-center justify-between px-2 py-6 bg-white">
          <H3 className="flex-1 text-xl text-black">Recommendations</H3>
          <TouchableOpacity
            className="flex-row items-center"
            onPress={() => navigation.navigate("search")}
          >
            <H3 className="text-sm text-[#555]">See All</H3>
            <Ionicons name="arrow-forward-sharp" size={15} color="#555" />
          </TouchableOpacity>
        </View>
        <View className="space-x-2 bg-white">
          {paginatedProducts.map((product) => (
            <TouchableOpacity
              key={product.product_id}
              className="bg-white shadow-sm mb-4 py-10 px-2 flex-row relative border-b-2 border-zinc-500"
              onPress={() =>
                navigation.navigate("product", {
                  product: JSON.stringify(product),
                })
              }
            >
              <View className="w-full relative overflow-clip">
                <View className="flex items-start absolute right-[-14px] top-[-14px]">
                  <TouchableOpacity
                    className={`p-2 px-4 mr-4 rounded-full flex-row items-center w-auto ${
                      product.stock_quantity <= 10
                        ? "bg-orange-300"
                        : "bg-green-300"
                    }`}
                  >
                    <ListTodo
                      color={`${
                        product.stock_quantity <= 10 ? "#9a3412" : "#166534"
                      }`}
                      size={19}
                    />
                    <H5
                      className={`${
                        product.stock_quantity <= 10
                          ? "text-orange-900"
                          : "text-green-900"
                      } ml-2 text-base`}
                    >
                      InStock {product.stock_quantity}
                    </H5>
                  </TouchableOpacity>
                </View>
                <View className="flex-row justify-between items-center mb-2">
                  <H3 className="text-lg text-gray-800">{product.name}</H3>
                </View>
                <H4
                  className="text-gray-600 text-base mb-2 w-3/4"
                  numberOfLines={3}
                >
                  {product.description}
                </H4>
                <View
                  className={`rounded-md overflow-0 mt-6 pt-6 pl-6 h-48 ${
                    product.stock_quantity <= 10
                      ? "bg-orange-300"
                      : "bg-purple-300"
                  }`}
                >
                  <Image
                    source={{
                      uri: product.image_url.replace(/^http:\/\//i, "https://"),
                    }}
                    className="w-full rounded-tl-md h-full object-cover mix-blend-multiply bg-neutral-400"
                  />
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
        <View className="flex-row items-center justify-between my-4">
          <Button
            className="bg-[#111] rounded-full px-4 py-2 disabled:bg-zinc-900"
            onPress={handlePreviousPage}
            disabled={currentPage === 1}
          >
            <P className="text-white">&larr; Previous</P>
          </Button>

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
    );
  };

  const renderServiceBooking = () => (
    <View className="mt-10 px-2 gap-4 bg-zinc-950">
      <View className="flex-row items-center justify-between px-2 py-6">
        <H3 className="flex-1 text-xl">Book a Service</H3>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="gap-4">
          {services.map((service) => (
            <ServiceModal
              sheetTrigger={
                <TouchableOpacity
                  key={service.service_id}
                  className="gap-4 px-4 py-8 w-screen bg-white overflow-auto"
                  // onPress={() => setSelectedServiceId(service.id)}
                >
                  <View className="flex items-start">
                    <TouchableOpacity
                      className={`p-4 rounded-full w-auto bg-zinc-800`}
                    >
                      <Container size={26} color={"#fff"} />
                    </TouchableOpacity>
                  </View>
                  <H4 className="text-black text-xl">{service.name}</H4>
                  <P className="text-zinc-400">{service.description}</P>
                  <H4 className="text-green-600 text-xl mt-4">
                    Book for Service &rarr;
                  </H4>
                </TouchableOpacity>
              }
              serviceId={service.service_id}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-black">
      <ScrollView className="flex-1">
        <View className="pt-16">
          <View className="px-6">
            <H2 className="text-2xl border-b-0 leading-0">
              Hi there, {customer.username} 👋
            </H2>
            <H2 className="text-zinc-400 text-sm border-b-0">
              Welcome to Refnet
            </H2>
          </View>
          {/* <Image
            source={require("~/assets/images/Background.png")}
            className="w-full h-48 rounded-t-lg"
            resizeMode="cover"
          /> */}
          {renderFeaturedCategories()}
          {/* {renderPromotions()} */}
          {renderProducts()}
          {renderAllProducts()}
          {renderServiceBooking()}
          <View className="h-20" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
