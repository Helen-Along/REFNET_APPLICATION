import React, { useState, useEffect } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import {
  User,
  Wallet,
  Languages,
  Bell,
  Lock,
  ChevronRight,
  Home,
  DollarSign,
  LogOut,
  Settings,
  ShoppingBag,
  X,
  Star,
  ArrowRight,
  MessageCircleDashed,
} from "lucide-react-native";
import { H2, H3, H4, H5, P } from "~/components/ui/typography";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { useEmail } from "~/app/EmailContext";
import {
  checkUser,
  fetchCustomerOrders,
  submitFeedback,
  fetchUserRequestedRepairs,
  fetchUserRequestedServices,
} from "~/lib/supabase";
import { formatPrice } from "~/lib/format-price";
import displayNotification from "~/lib/Notification";
import { useNavigation } from "expo-router";
import { ManageDetails } from "~/components/sheets/manage/details";
import { ManageOrders } from "~/components/sheets/manage/orders";
import { ManageReviews } from "~/components/sheets/manage/review";
import { Textarea } from "~/components/ui/textarea";
import { Services } from "~/components/sheets/manage/services";

interface customer {
  full_name: string;
  email: string;
  phone: string;
  address: string;
  user_id: number;
}

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface Order {
  id: string;
  date: string;
  status: "processing" | "shipped" | "delivered" | "returned";
  total: number;
  items: OrderItem[];
  trackingNumber?: string;
}

const personalInformationModalTrigger = [
  {
    id: "personal",
    title: "Personal Information",
    description: "Update your profile details and preferences",
    icon: User,
    screen: "personal",
    iconBgColor: "bg-blue-600",
  },
];

const ordersModalTrigger = [
  {
    id: "orders",
    title: "Manage Orders",
    description: "View and manage your orders",
    icon: ShoppingBag,
    screen: "orders",
    iconBgColor: "bg-orange-600",
  },
];

const reviewModalTrigger = [
  {
    id: "review",
    title: "Products review",
    description: "Tell us about your experience with our products",
    icon: DollarSign,
    screen: "review",
    iconBgColor: "bg-purple-600",
  },
];

const servicesModalTrigger = [
  {
    id: "services",
    title: "Service Requests",
    description: "View and manage the services you requested",
    icon: Home,
    screen: "services",
    iconBgColor: "bg-green-600",
  },
];

const mockOrders: Order[] = [
  {
    id: "ORD001",
    date: "2024-01-15",
    status: "delivered",
    total: 129.99,
    items: [
      {
        id: "ITEM001",
        name: "Wireless Earbuds",
        price: 79.99,
        quantity: 1,
        image: "https://picsum.photos/200",
      },
      {
        id: "ITEM002",
        name: "Phone Case",
        price: 24.99,
        quantity: 2,
        image: "https://picsum.photos/200",
      },
    ],
    trackingNumber: "1Z999AA1234567890",
  },
  {
    id: "ORD002",
    date: "2024-01-20",
    status: "shipped",
    total: 199.99,
    items: [
      {
        id: "ITEM003",
        name: "Smart Watch",
        price: 199.99,
        quantity: 1,
        image: "https://picsum.photos/200",
      },
    ],
    trackingNumber: "1Z999AA1234567891",
  },
  {
    id: "ORD003",
    date: "2024-01-25",
    status: "processing",
    total: 49.99,
    items: [
      {
        id: "ITEM004",
        name: "Power Bank",
        price: 49.99,
        quantity: 1,
        image: "https://picsum.photos/200",
      },
    ],
  },
];

export default function Tab() {
  const navigation = useNavigation();
  const emailContext = useEmail();
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [customer, setCustomerDetails] = useState<customer>({
    full_name: "",
    email: "",
    phone: "",
    address: "",
    user_id: 0,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [currentStep, setCurrentStep] = useState("pending");
  const [services, setServices] = useState([]);

  const handleMenuPress = (screen: any) => {
    setActiveModal(screen);
  };

  useEffect(() => {
    async function fetchUserDetails() {
      if (emailContext?.email) {
        const response = await checkUser(emailContext?.email);
        setCustomerDetails(response);
      }
    }
    fetchUserDetails();
  }, [emailContext]);

  useEffect(() => {
    async function fetchOrders() {
      if (customer.user_id) {
        const response: any = await fetchCustomerOrders(customer.user_id);
        console.log("Orders Fetched", response);
        setOrders(response);
      }
    }
    fetchOrders();
  }, [customer]);

  useEffect(() => {
    async function fetchUserServices() {
      if (customer.user_id) {
        const response: any = await fetchUserRequestedServices(
          customer.user_id
        );
        setServices(response);
      }
    }
    fetchUserServices();
  }, [customer.user_id]);

  const handleSavecustomer = () => {
    // TODO: Implement API call to save user info
    displayNotification("Profile updated successfully", "success");
    setIsEditing(false);
  };

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "processing":
        return "text-yellow-500";
      case "shipped":
        return "text-blue-500";
      case "delivered":
        return "text-green-500";
      case "returned":
        return "text-red-500";
      default:
        return "text-zinc-500";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleInitiateReturn = (orderId: string) => {
    // TODO: Implement return initiation logic
    displayNotification("Return request initiated", "success");
    setSelectedOrder(null);
  };

  const handleSubmitReview = async (order: any) => {
    const feedback = {
      user_id: customer.user_id,
      // service_id: order.product_id,
      order_id: order.order_id,
      rating: rating,
      comments: comment,
    };

    const response = await submitFeedback(feedback);
    if (typeof response === "string" && response.startsWith("Error")) {
      displayNotification(response, "danger");
    } else {
      displayNotification("Review submitted successfully", "success");
      setSelectedProduct(null);
      setRating(0);
      setComment("");
    }
  };

  const renderStars = () => (
    <View className="flex-row justify-center space-x-2 py-4">
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity key={star} onPress={() => setRating(star)}>
          <Star
            size={32}
            color={star <= rating ? "#FCD34D" : "#374151"}
            fill={star <= rating ? "#FCD34D" : "none"}
          />
        </TouchableOpacity>
      ))}
    </View>
  );

  const rendercustomerModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={activeModal === "personal"}
      onRequestClose={() => setActiveModal(null)}
    >
      <View className="flex-1 bg-black/50">
        <View className="flex-1 mt-20 bg-zinc-900 rounded-t-3xl">
          <SafeAreaView className="flex-1">
            <View className="flex-row justify-between items-center p-4 border-b border-zinc-800">
              <H3 className="text-white">Personal Information</H3>
              <TouchableOpacity onPress={() => setActiveModal(null)}>
                <X size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 p-4">
              <View className="space-y-4">
                <Input
                  placeholder="First Name"
                  value={customer.full_name}
                  onChangeText={(text) =>
                    setCustomerDetails({ ...customer, full_name: text })
                  }
                  editable={isEditing}
                  className={!isEditing ? "bg-zinc-950 text-white" : ""}
                />

                <Input
                  placeholder="Email"
                  value={customer.email}
                  onChangeText={(text) =>
                    setCustomerDetails({ ...customer, email: text })
                  }
                  keyboardType="email-address"
                  editable={isEditing}
                  className={!isEditing ? "bg-zinc-950 text-white" : ""}
                />

                <Input
                  placeholder="Phone"
                  value={customer.phone_number}
                  onChangeText={(text) =>
                    setCustomerDetails({ ...customer, phone_number: text })
                  }
                  keyboardType="phone-pad"
                  editable={isEditing}
                  className={!isEditing ? "bg-zinc-950 text-white" : ""}
                />

                <Input
                  placeholder="Address"
                  value={customer.address}
                  onChangeText={(text) =>
                    setCustomerDetails({ ...customer, address: text })
                  }
                  editable={isEditing}
                  className={!isEditing ? "bg-zinc-950 text-white" : ""}
                />

                <View className="space-y-4 pt-4">
                  {isEditing ? (
                    <View className="space-y-2 flex-row justify-between">
                      <Button variant="outline" onPress={handleSavecustomer}>
                        <P className="text-white uppercase">Save Changes</P>
                      </Button>
                      <Button
                        variant="outline"
                        onPress={() => setIsEditing(false)}
                      >
                        <P className="uppercase text-white">Cancel</P>
                      </Button>
                    </View>
                  ) : (
                    <Button
                      variant="outline"
                      onPress={() => setIsEditing(true)}
                    >
                      <P className="uppercase text-white">Edit Information</P>
                    </Button>
                  )}
                </View>
              </View>
            </ScrollView>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );

  const renderOrdersModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      statusBarTranslucent={true}
      visible={activeModal === "orders"}
      onRequestClose={() => setActiveModal(null)}
    >
      <View className="flex-1 bg-black/50">
        <View className="flex-1 mt-20 bg-zinc-900 rounded-t-3xl">
          <SafeAreaView className="flex-1">
            <View className="flex-row justify-between items-center p-4 border-b border-zinc-800">
              <H3 className="text-white">Manage Orders</H3>
              <TouchableOpacity
                onPress={() => {
                  setActiveModal(null);
                  setSelectedOrder(null);
                }}
              >
                <X size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView className="flex-1">
              {selectedOrder ? (
                <View className="space-y-4">
                  <ScrollView className="bg-white p-2 h-full">
                    <View>
                      <Image
                        source={{ uri: selectedOrder.products.image_url }}
                        className="w-full h-48 rounded-lg mb-4"
                      />
                      <DetailItem
                        label="Name"
                        value={selectedOrder.products.name}
                      />
                      <DetailItem
                        label="Category"
                        value={selectedOrder.products.category}
                      />
                      <DetailItem
                        label="Description"
                        value={selectedOrder.products.description}
                      />
                      <View className="flex-row w-full">
                        <View className="w-1/2">
                          <DetailItem
                            label="Price"
                            value={`${formatPrice(
                              selectedOrder.products.price
                            )}`}
                          />
                        </View>
                        <DetailItem
                          label="Quantity Bought"
                          value={
                            selectedOrder.quantity &&
                            selectedOrder.quantity.toString()
                          }
                        />
                      </View>
                      <View className="gap-2 w-full">
                        <H5 className="text-sm text-gray-600">
                          {"Delivery Status"}
                        </H5>
                        <View className="flex-row items-center justify-around">
                          <View className="flex-row items-center gap-2">
                            <View
                              className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                currentStep === "pending"
                                  ? "bg-green-500"
                                  : "!bg-[#2c2c2c]"
                              }`}
                            >
                              <P> 1 </P>
                            </View>
                            <H4
                              className={`text-lg capitalize ${
                                currentStep === "pending"
                                  ? "text-gray-900"
                                  : "text-gray-500"
                              }`}
                            >
                              Verification
                            </H4>
                          </View>
                          <View className="flex-row items-center gap-2">
                            <View
                              className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                currentStep === "dispatched"
                                  ? "bg-green-500"
                                  : "!bg-[#6b7280]"
                              }`}
                            >
                              <P> 2 </P>
                            </View>
                            <H4
                              className={`text-lg capitalize ${
                                currentStep === "dispatched"
                                  ? "text-gray-900"
                                  : "text-gray-500"
                              }`}
                            >
                              In Transit
                            </H4>
                          </View>
                          <View className="flex-row items-center gap-2">
                            <View
                              className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                currentStep === "delivered"
                                  ? "bg-green-500"
                                  : "!bg-[#6b7280]"
                              }`}
                            >
                              <P> 3 </P>
                            </View>
                            <H4
                              className={`text-lg capitalize ${
                                currentStep === "delivered"
                                  ? "text-gray-900"
                                  : "text-gray-500"
                              }`}
                            >
                              Delivered
                            </H4>
                          </View>
                        </View>
                      </View>
                      <View className="flex-row w-full items-center mt-6">
                        <H5 className="text-sm text-gray-600 w-1/2">
                          {"Total Price"}
                        </H5>
                        <H5 className="text-base text-gray-900 text-right flex-1">
                          {formatPrice(selectedOrder.total_price)}
                        </H5>
                      </View>
                    </View>
                    {selectedOrder.trackingNumber && (
                      <View className="bg-zinc-950 p-4 rounded-xl">
                        <P className="text-zinc-500">Tracking Number</P>
                        <P className="text-black">
                          {selectedOrder.trackingNumber}
                        </P>
                      </View>
                    )}

                    {selectedOrder.status === "delivered" && (
                      <Button
                        variant="outline"
                        className="mt-4"
                        onPress={() =>
                          handleInitiateReturn(selectedOrder.order_id)
                        }
                      >
                        <P className="uppercase text-black">Initiate Return</P>
                      </Button>
                    )}
                  </ScrollView>
                </View>
              ) : (
                <View className="p-4 space-y-4">
                  {orders.map((order) => (
                    <View
                      key={order.order_id}
                      className="bg-white rounded-lg shadow-sm p-4 mb-4"
                    >
                      <View className="flex-row justify-between items-center">
                        <View>
                          <H4 className="text-lg text-gray-800">
                            Order #{order.order_id}
                          </H4>
                          <P className="text-gray-600">
                            {formatDate(order.order_date)}
                          </P>
                        </View>
                      </View>
                      <View className="mt-4">
                        <View className="flex-row justify-between">
                          <DetailItem
                            label="Product Name"
                            value={order.products.name}
                          />
                          <Image
                            source={{
                              uri:
                                order.products.image_url ||
                                "https://placeholder.com/150",
                            }}
                            className="w-16 h-16 rounded-lg mr-4"
                          />
                        </View>
                        <View className="flex-row w-full">
                          <View className="w-1/3">
                            <DetailItem
                              label="Price"
                              value={formatPrice(order.unit_price)}
                            />
                          </View>
                          <DetailItem label="Quantity" value={order.quantity} />
                        </View>
                        <View className="flex-row gap-4 w-full justify-between">
                          <Button
                            className="rounded-full p-0 bg-transparent"
                            size={"lg"}
                            variant="default"
                          >
                            <H5 className="text-gray-700 capitalize">
                              Payment:{" "}
                              <H5 className="text-gray-900">
                                {order.payment_status}
                              </H5>
                            </H5>
                          </Button>
                          <Button
                            onPress={() => setSelectedOrder(order)}
                            className="rounded-full flex-1 bg-green-700"
                            size={"lg"}
                            variant="default"
                          >
                            <H5 className="text-white">{"Manage"}</H5>
                          </Button>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );

  const renderReviewsModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={activeModal === "review"}
      onRequestClose={() => setActiveModal(null)}
    >
      <View className="flex-1 bg-black/50">
        <View className="flex-1 mt-20 bg-zinc-900 rounded-t-3xl">
          <SafeAreaView className="flex-1">
            <View className="flex-row justify-between items-center p-4 border-b border-zinc-800">
              <H3 className="text-white">Product Reviews</H3>
              <TouchableOpacity
                onPress={() => {
                  setActiveModal(null);
                  setSelectedProduct(null);
                  setRating(0);
                  setComment("");
                }}
              >
                <X size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView className="flex-1">
              {selectedProduct ? (
                <View className="space-y-4">
                  <View className="bg-white p-2 h-full">
                    <Image
                      source={{ uri: selectedProduct.products.image_url }}
                      className="w-full h-48 rounded-lg mb-4"
                    />
                    <DetailItem
                      label="Name"
                      value={selectedProduct.products.name}
                    />
                    <DetailItem
                      label="Category"
                      value={selectedProduct.products.category}
                    />
                    <DetailItem
                      label="Description"
                      value={selectedProduct.products.description}
                    />
                    <View className="flex-row w-full">
                      <View className="w-1/2">
                        <DetailItem
                          label="Price"
                          value={`${formatPrice(
                            selectedProduct.products.price
                          )}`}
                        />
                      </View>
                      <DetailItem
                        label="Quantity Bought"
                        value={
                          selectedProduct.quantity &&
                          selectedProduct.quantity.toString()
                        }
                      />
                    </View>

                    <H5 className="text-sm text-center text-gray-600">
                      {"Rate your product experience"}
                    </H5>
                    {renderStars()}

                    <View className="flex-row">
                      <View className="mt-[8px]">
                        <MessageCircleDashed size={18} color={"#111"} />
                      </View>
                      <Textarea
                        placeholder="Please tell us more"
                        value={comment}
                        onChangeText={setComment}
                        className="bg-transparent border-0 text-sm py-0 text-black"
                      />
                    </View>
                    <View className="flex-row gap-4 w-full justify-between">
                      <Button
                        className="rounded-full border-2 border-gray-500 bg-transparent"
                        size={"lg"}
                        variant="default"
                        onPress={() => setSelectedProduct(null)}
                      >
                        <H5 className=" text-black text-2xl">&larr; </H5>
                      </Button>
                      <Button
                        onPress={() => handleSubmitReview(selectedProduct)}
                        className="rounded-full flex-1 bg-green-700"
                        size={"lg"}
                        variant="default"
                      >
                        <H5 className="">{"Continue"}</H5>
                      </Button>
                    </View>
                  </View>
                </View>
              ) : (
                <View className="p-4 space-y-4">
                  {orders.map((order) => (
                    <View
                      key={order.order_id}
                      className="bg-white rounded-lg shadow-sm p-4 mb-4"
                    >
                      <View className="flex-row items-center justify-between">
                        <View className="flex-1">
                          <View className="flex-row justify-between w-full">
                            <DetailItem
                              label="Product Name"
                              value={order.products.name}
                            />
                            <Image
                              source={{
                                uri:
                                  order.products.image_url ||
                                  "https://placeholder.com/150",
                              }}
                              className="w-16 h-16 rounded-lg"
                            />
                          </View>
                          <View className="flex-row w-full">
                            <View className="w-1/2">
                              <DetailItem
                                label="Price"
                                value={formatPrice(order.unit_price)}
                              />
                            </View>
                            <DetailItem
                              label="Quantity"
                              value={order.quantity}
                            />
                          </View>
                          <View className="flex-row w-full gap-2 mt-6">
                            {order.status === "delivered" ? (
                              <View className="w-1/2">
                                <DetailItem
                                  label="Delivered On"
                                  value={formatDate(order.updated_at)}
                                />
                              </View>
                            ) : (
                              <View className="mb-4 w-full gap-2">
                                <H5 className="text-sm text-gray-600">
                                  In Transit
                                </H5>
                                <H5 className="text-base text-gray-900 capitalize p-2 px-4 bg-green-300 text-green-900">
                                  Delivery Status: {order.status}
                                </H5>
                              </View>
                            )}
                            {order.status === "delivered" ? (
                              <Button
                                onPress={() => setSelectedProduct(order)}
                                className="rounded-full flex-1 bg-green-700"
                                size={"lg"}
                                variant="default"
                              >
                                <H5 className="text-white">{"Review"}</H5>
                              </Button>
                            ) : (
                              ""
                            )}
                          </View>
                        </View>
                        <ChevronRight size={20} color="#fff" />
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );

  const renderServicesModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={activeModal === "services"}
      onRequestClose={() => setActiveModal(null)}
    >
      <View className="flex-1 bg-black/50">
        <View className="flex-1 mt-20 bg-zinc-900 rounded-t-3xl">
          <SafeAreaView className="flex-1">
            <View className="flex-row justify-between items-center p-4 border-b border-zinc-800">
              <H3 className="text-white">Requested Services</H3>
              <TouchableOpacity onPress={() => setActiveModal(null)}>
                <X size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 p-4 bg-white">
              {services.map((service) => (
                <View key={service.id} className="mb-4">
                  {service.serviceDetails && (
                    <>
                      <DetailItem
                        label="Service Name"
                        value={service.serviceDetails.name}
                      />
                      <DetailItem
                        label="Service Description"
                        value={service.serviceDetails.description}
                      />
                      <View className="flex-row w-full">
                        <View className="w-1/2">
                          <View className="mb-4 gap-2">
                            <H5 className="text-sm text-gray-600">
                              {"Completion Status"}
                            </H5>
                            <H5
                              className={`text-sm text-center capitalize p-2 px-4 w-3/4 rounded-full ${
                                service.completion_status === "incomplete"
                                  ? "bg-orange-300 text-orange-900"
                                  : "bg-green-300 text-green-900"
                              }`}
                            >
                              {service.completion_status}
                            </H5>
                          </View>
                        </View>
                        <DetailItem
                          label="Service Price"
                          value={`${formatPrice(service.serviceDetails.price)}`}
                        />
                      </View>
                    </>
                  )}
                </View>
              ))}
            </ScrollView>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView className="flex-1">
      <ScrollView className="flex-1">
        {/* Profile Header */}
        <View className="items-center justify-center py-8 bg-zinc-900 pt-16">
          <View className="relative">
            <TouchableOpacity
              className="p-2 rounded-full shadow-sm border border-zinc-200"
              onPress={() => handleMenuPress("personal")}
            >
              <User size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          <H3 className="mt-4 text-white">
            {customer === "" ? (
              <View className="animate-pulse w-10 h-10 bg-slate-900" />
            ) : (
              customer.full_name
            )}
          </H3>
          <P className="text-zinc-500">{customer.email}</P>
        </View>

        {/* Menu Items */}
        <View className="p-4 gap-10 my-6">
          {personalInformationModalTrigger.map((item, index) => (
            <ManageDetails
              sheetTrigger={
                <TouchableOpacity
                  key={index}
                  className="bg-zinc-950 rounded-2xl gap-2"
                >
                  <View className="flex items-start">
                    <TouchableOpacity
                      className={`p-2 rounded-full w-auto ${item.iconBgColor}`}
                    >
                      <item.icon size={20} color="#fff" />
                    </TouchableOpacity>
                  </View>
                  <View className="flex-row items-center">
                    <View className="flex-1">
                      <H4 className="text-white">{item.title}</H4>
                      <P className="text-sm text-zinc-500 w-3/4">
                        {item.description}
                      </P>
                    </View>
                    <ArrowRight size={20} color="#aaa" />
                  </View>
                </TouchableOpacity>
              }
            />
          ))}
          {ordersModalTrigger.map((item, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => setActiveModal("orders")}
              className="bg-zinc-950 rounded-2xl gap-2"
            >
              <View className="flex items-start">
                <TouchableOpacity
                  className={`p-2 rounded-full w-auto ${item.iconBgColor}`}
                >
                  <item.icon size={20} color="#fff" />
                </TouchableOpacity>
              </View>
              <View className="flex-row items-center">
                <View className="flex-1">
                  <H4 className="text-white">{item.title}</H4>
                  <P className="text-sm text-zinc-500 w-3/4">
                    {item.description}
                  </P>
                </View>
                <ArrowRight size={20} color="#aaa" />
              </View>
            </TouchableOpacity>
          ))}
          {servicesModalTrigger.map((item, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => setActiveModal("services")}
              className="bg-zinc-950 rounded-2xl gap-2"
            >
              <View className="flex items-start">
                <TouchableOpacity
                  className={`p-2 rounded-full w-auto ${item.iconBgColor}`}
                >
                  <item.icon size={20} color="#fff" />
                </TouchableOpacity>
              </View>
              <View className="flex-row items-center">
                <View className="flex-1">
                  <H4 className="text-white">{item.title}</H4>
                  <P className="text-sm text-zinc-500 w-3/4">
                    {item.description}
                  </P>
                </View>
                <ArrowRight size={20} color="#aaa" />
              </View>
            </TouchableOpacity>
          ))}
          {reviewModalTrigger.map((item, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => setActiveModal("review")}
              className="bg-zinc-950 rounded-2xl gap-2"
            >
              <View className="flex items-start">
                <TouchableOpacity
                  className={`p-2 rounded-full w-auto ${item.iconBgColor}`}
                >
                  <item.icon size={20} color="#fff" />
                </TouchableOpacity>
              </View>
              <View className="flex-row items-center">
                <View className="flex-1">
                  <H4 className="text-white">{item.title}</H4>
                  <P className="text-sm text-zinc-500 w-3/4">
                    {item.description}
                  </P>
                </View>
                <ArrowRight size={20} color="#aaa" />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          className="flex-row items-center p-4 mt-auto bg-red-200"
          onPress={() => navigation.navigate("LoginScreen")}
        >
          <H3 className="text-sm text-[#555]">Log out</H3>
          <ArrowRight size={15} color="#555" className="ml-auto" />
        </TouchableOpacity>
      </ScrollView>

      {/* Modals */}
      {rendercustomerModal()}
      {renderOrdersModal()}
      {renderReviewsModal()}
      {renderServicesModal()}
    </SafeAreaView>
  );
}

const DetailItem: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => (
  <View className="mb-4">
    <H5 className="text-sm text-gray-600">{label}</H5>
    <H5 className="text-base text-gray-900">{value}</H5>
  </View>
);
