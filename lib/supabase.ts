import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "", {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
// Check for a user in the 'users' table
export async function checkUser(email: string) {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .single();

  if (error) {
    return false;
  } else if (data) {
    return data;
  } else {
    return false;
  }
}

// Validate user credentials
export async function validateUserCredentials(email: string, password: string) {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .eq("password_hash", password)
    .single();

  if (error) {
    return error;
  } else if (data) {
    return data;
  } else {
    return error;
  }
}

// Function that adds users to the database
export async function addUserToDB(
  username: string,
  full_name: string,
  email: string,
  password_hash: string,
  phone_number: number,
  role: string
) {
  // Check If user is in the databse
  const user = await checkUser(email);
  if (user["email"]) {
    return "Exists: User already exists";
  }
  const { data, error } = await supabase
    .from("users")
    .insert([{ username, full_name, email, password_hash, phone_number, role }])
    .single();

  if (error) {
    return "Error:" + error;
  } else {
    return "Success:" + data;
  }
}

// Insert feedback to table
export async function insertFeedbackToDB(
  user_id: string,
  product_id: number,
  feedback_message: string,
  rating: number
) {
  const { data, error } = await supabase
    .from("feedback")
    .insert([{ user_id, product_id, feedback_message, rating }])
    .single();

  if (error) {
    return "Error:" + error;
  } else {
    return "Success:" + data;
  }
}

// Update user account details
// Function that updates user details
export async function updateUserDetails(
  username: string,
  full_name: string,
  email: string,
  password_hash: string,
  phone_number: number
) {
  const { data, error } = await supabase
    .from("users")
    .update({ username, full_name, email, password_hash, phone_number })
    .eq("email", email)
    .single();

  if (error) {
    return `Error: ${error.message || JSON.stringify(error)}`;
  } else {
    return `Success: ${JSON.stringify(data)}`;
  }
}

// Reset user password
export async function resetUserPassword(email: string, password_hash: string) {
  const { data, error } = await supabase
    .from("users")
    .update({ password_hash })
    .eq("email", email);

  if (error) {
    return `Error: ${error.message || JSON.stringify(error)}`;
  } else {
    return `Success: ${JSON.stringify(data)}`;
  }
}

// Reset password for a user
export async function resetPassword(email: string, newPassword: string) {
  try {
    // First check if user exists
    const user = await checkUser(email);
    if (!user["email"]) {
      return "Error: User not found";
    }

    // Update the password
    const { data, error } = await supabase
      .from("users")
      .update({ password_hash: newPassword })
      .eq("email", email);

    if (error) {
      console.error("Error resetting password:", error);
      return `Error: ${error.message}`;
    }

    return "Success: Password reset successfully";
  } catch (error) {
    console.error("Error in resetPassword:", error);
    return "Error: Failed to reset password";
  }
}

// Fetch Products data
export async function fetchProductsFromDB() {
  const { data, error } = await supabase.from("products").select("*");

  if (error) {
    return `Error: ${error.message || JSON.stringify(error)}`;
  } else {
    console.log(data);
    return data;
  }
}

// Fetch single Product from db
export async function fetchProductFromDB(id: number) {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("product_id", id)
    .single();

  if (error) {
    return `Error: ${error.message || JSON.stringify(error)}`;
  } else {
    return data;
  }
}

// Count total number of products in cart
export async function countTotalProductsInCart(user_email: string) {
  const { data, error } = await supabase
    .from("cart")
    .select("quantity")
    .eq("user_email", user_email);

  if (error) {
    return `Error: ${error.message || JSON.stringify(error)}`;
  } else {
    let total = 0;
    data.forEach((item: any) => {
      total += item.quantity;
    });
    return total;
  }
}

// Check if product exists in cart
export async function checkProductInCart(
  product_id: number,
  user_email: string
) {
  const { data, error } = await supabase
    .from("cart")
    .select("*")
    .eq("product_id", product_id)
    .eq("user_email", user_email);

  if (error) {
    return `Error: ${error.message || JSON.stringify(error)}`;
  } else {
    return data;
  }
}

// Update product quantity in cart
export async function updateProductQuantityInCart(
  product_id: number,
  quantity: number,
  user_email: string
) {
  const { data, error } = await supabase
    .from("cart")
    .update({ quantity })
    .eq("product_id", product_id)
    .eq("user_email", user_email);

  if (error) {
    return `Error: ${error.message || JSON.stringify(error)}`;
  } else {
    return `Success: ${JSON.stringify(data)}`;
  }
}

// Insert products to cart
export async function insertProductsToCart(
  product_id: number,
  quantity: number,
  user_email: string
) {
  const { data, error } = await supabase
    .from("cart")
    .insert({ product_id, quantity, user_email });

  if (error) {
    return `Error: ${error.message || JSON.stringify(error)}`;
  } else {
    return `Success: ${JSON.stringify(data)}`;
  }
}

// Remove product from cart
export async function removeProductFromCart(
  product_id: number,
  user_email: string
) {
  const { data, error } = await supabase
    .from("cart")
    .delete()
    .eq("product_id", product_id)
    .eq("user_email", user_email);

  if (error) {
    return `Error: ${error.message || JSON.stringify(error)}`;
  } else {
    return `Success: ${JSON.stringify(data)}`;
  }
}

// Fetch products from cart
export async function fetchProductsFromCart(user_email: string) {
  const { data, error } = await supabase
    .from("cart")
    .select("*")
    .eq("user_email", user_email);

  if (error) {
    return `Error: ${error.message || JSON.stringify(error)}`;
  } else {
    return data;
  }
}

// Fetch specific product category
export async function fetchProductInCategory(category_name: string) {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("category", category_name);

  if (error) {
    return `Error: ${error.message || JSON.stringify(error)}`;
  } else {
    return data;
  }
}

// Fetch
export async function fetchSubmittedRepairs(supervisor_id: number) {
  const { data, error } = await supabase
    .from("repairs")
    .select("*, users:technician_id(name), services(name, price)")
    .eq("supervisor_id", supervisor_id);

  if (error) {
    return `Error: ${error.message || JSON.stringify(error)}`;
  } else {
    console.log(data);
    return data;
  }
}

// Fecth Assigned Repairs
export async function fetchAssignedRepairs(technician_id: number) {
  const { data, error } = await supabase
    .from("assigned_repairs")
    .select(
      `
    *,
    services (name)
  `
    )
    .eq("technician_id", technician_id);

  if (error) {
    console.error("Error fetching data:", error);
  } else {
    console.log("Data:", data);
  }
}

// Fetch productName and quantity in stock
export async function fetchProductNamesAndQuantity() {
  const { data, error } = await supabase.from("products").select("*");

  if (error) {
    return `Error: ${error.message || JSON.stringify(error)}`;
  } else {
    console.log(data);
    return data;
  }
}

// Fetch service requests
export async function fetchServiceRequests() {
  const { data, error } = await supabase
    .from("repairs")
    .select(
      "*, users:customer_id(full_name), services(name, description, service_type)"
    );

  if (error) {
    return `Error: ${error.message || JSON.stringify(error)}`;
  } else {
    console.log(data);
    return data;
  }
}

// Fetch technicians
export async function fetchTechnicians() {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("role", "technician");

  if (error) {
    return `Error: ${error.message || JSON.stringify(error)}`;
  } else {
    console.log(data);
    return data;
  }
}

// fetch orders
export async function fetchOrders() {
  const { data, error } = await supabase
    .from("orders")
    .select("*, users:user_id(full_name), products:product_id(*)")
    .order("order_date", { ascending: false });

  if (error) {
    return `Error: ${error.message || JSON.stringify(error)}`;
  } else {
    return data;
  }
}

// Place user orders
export async function placeAnOrder(details: any) {
  const { data, error } = await supabase.from("orders").insert(details);
  // Update the stock_quantity of the products ordered
  const product_id = details.product_id;
  const quantity = details.quantity;

  const { data: product, error: fetchError } = await supabase
    .from("products")
    .select("stock_quantity")
    .eq("product_id", product_id)
    .single();

  if (fetchError) {
    console.error(`Error fetching product with ID ${product_id}:`, fetchError);
  }

  const updatedStock = product.stock_quantity - quantity;

  const { error: updateError } = await supabase
    .from("products")
    .update({ stock_quantity: updatedStock })
    .eq("product_id", product_id);

  if (updateError) {
    console.error(
      `Error updating stock for product ID ${product_id}:`,
      updateError
    );
  }

  if (error) {
    return `Error: ${error.message || JSON.stringify(error)}`;
  } else {
    console.log(data);
    return data;
  }
}

// Fetch customers orders
export async function fetchCustomerOrders(user_id: any) {
  const { data, error } = await supabase
    .from("orders")
    .select("*, products:product_id(*)")
    .eq("user_id", user_id)
    .order("order_date", { ascending: false });

  if (error) {
    return `Error: ${error.message || JSON.stringify(error)}`;
  } else {
    console.log(data);
    return data;
  }
}

// Submit product feedback
export async function submitFeedback(feedback: {
  user_id: number;
  // service_id: number;
  order_id: number;
  rating: number;
  comments: string;
}) {
  const { data, error } = await supabase.from("feedback").insert([feedback]);

  if (error) {
    return `Error: ${error.message || JSON.stringify(error)}`;
  } else {
    console.log("Feedback submitted:", data);
    return data;
  }
}

// Fetch available drivers
export async function fetchDrivers() {
  // Fetch user IDs from dispatches
  const { data: dispatches, error: dispatchesError } = await supabase
    .from("dispatches")
    .select("driver_id");

  if (dispatchesError) {
    console.error(dispatchesError);
    return;
  }

  const assignedDriversIDs = dispatches.map((assignment) => assignment.user_id);

  // Fetch all drivers
  const { data: allDrivers, error: driversError } = await supabase
    .from("users")
    .select("*")
    .eq("role", "driver");

  if (driversError) {
    console.error(driversError);
    return;
  }

  // Filter drivers to exclude those in assignedDriversIDs
  const availableDrivers = allDrivers.filter(
    (driver) => !assignedDriversIDs.includes(driver.user_id)
  );

  console.log('Available Drivers: ', availableDrivers)
  return availableDrivers;
}

// Fetch Products and their quantity in stock
export async function fetchProductsAndQuantityFromDB() {
  const { data, error } = await supabase
    .from("products")
    .select("product_id, name, price, stock_quantity, image_url");

  if (error) {
    return `Error: ${error.message || JSON.stringify(error)}`;
  } else {
    console.log(data);
    return data;
  }
}

// Fetch suppliers
export async function fetchSuppliers() {
  const { data, error } = await supabase
    .from("suppliers")
    .select("*, users(*)")
    .eq("users.role", "supplier");

  if (error) {
    return `Error: ${error.message || JSON.stringify(error)}`;
  } else {
    console.log(data);
    return data;
  }
}

// Add New Product to DB
export async function insertNewProductToDB(
  name: string,
  description: string,
  price: number,
  supplier_id: number,
  stock_quantity: number,
  category: string,
  image_url: string
) {
  const { data, error } = await supabase
    .from("products")
    .insert([
      {
        name,
        description,
        price,
        supplier_id,
        stock_quantity,
        category,
        image_url,
      },
    ])
    .single();

  if (error) {
    console.error(error);
    return "Error:" + error;
  } else {
    return "Success:" + data;
  }
}

export async function updateUserProfile(
  email: string,
  updates: {
    full_name?: string;
    username?: string;
    phone_number?: string;
    address?: string;
  }
) {
  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("email", email)
    .select()
    .single();

  if (error) {
    throw error;
  }
  return data;
}

// Fetch driver_id from dispatched table using orderId
export async function fetchDispatchedByOrderId(orderId: number) {
  console.log('Order Id', orderId)
  const { data, error } = await supabase
    .from("dispatches")
    .select("driver_id")
    .eq("order_id", orderId)
    .single();

  if (error) {
    console.error("Error fetching dispatched by order ID:", error);
    return null; // or handle the error as needed
  }
  return data;
}

// Fetch driver's full_name from users table using driverId
export async function fetchDriverById(driverId: string) {
  const { data, error } = await supabase
    .from("users")
    .select("full_name")
    .eq("user_id", driverId)
    .single();

  if (error) {
    console.error("Error fetching driver by ID:", error);
    return null; // or handle the error as needed
  }
  return data;
}

// Fetch delivered product IDs from the dispatches table
export async function fetchDeliveredProductIds() {
  const { data, error } = await supabase
    .from("dispatches")
    .select("order_id")
    .eq("status", "delivered");

  if (error) {
    console.error("Error fetching delivered product IDs:", error);
    return []; // Return an empty array in case of error
  }

  return data.map((dispatch) => dispatch.order_id); // Return an array of order IDs
}

// Fetch financial records
export async function fetchAllFinancialRecords() {
  const { data, error } = await supabase
    .from("financial_records")
    .select("*")

  if (error) {
    console.error("Error fetching finance records:", error);
    return []; // Return an empty array in case of error
  }

  return data
}

// Function to insert assigned repair
export async function insertAssignedRepairToDB(repair_id:number ,technician_id: number, service_id: number) {
  const { data, error } = await supabase
    .from("assigned_repairs")
    .insert([{ technician_id, service_id }])
    .single();

  if (error) {
    return `Error: ${error.message || JSON.stringify(error)}`;
  } else {
    return `Success: ${JSON.stringify(data)}`;
  }
}

// Function to update assigned repair
export async function updateAssignedRepair(repair_id: number, technician_id: number) {
  const { data, error } = await supabase
    .from("repairs")
    .update({ technician_id, status: "assigned" })
    .eq("id", repair_id)
    .single();

  if (error) {
    return `Error: ${error.message || JSON.stringify(error)}`;
  } else {
    return `Success: ${JSON.stringify(data)}`;
  }
}

// Fetch dispatched for the dispatch manager type shi :)
export async function fetchDispatches() {
  const { data, error } = await supabase
    .from("dispatches")
    .select(
      `
      *,
      users:user_id(full_name),
      order:order_id (
        *,
        product:products(*)
      )
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    return `Error: ${error.message || JSON.stringify(error)}`;
  } else {
    return data;
  }
}

// Function to update dispatch status
export async function updateDispatchStatus(orderId: number, driver_status: string) {
  console.log("Order id: >>", orderId, "Driver Status: >>", driver_status);
  const { data, error } = await supabase
    .from("dispatches")
    .update({ driver_status })
    .eq("order_id", Number(orderId))
    
  if (error) {
    console.error("No matching dispatch found for the given order ID:", orderId);
  } else {
    console.log("Dispatches data: >> ", data);
  }

  return { data, error }; // Return data and error for handling
}

// Function to update dispatch status
export async function updateOrderStatus(orderId: number, updatedOrder: any) {
  const { data, error } = await supabase
    .from("orders")
    .update({ updatedOrder })
    .eq("order_id", Number(orderId));

  if (error) {
    console.error(
      "Error requesting for return for order:",
      error
    );
  } else {
    console.log("Error requesting for return", data);
  }

  return { data, error }; // Return data and error for handling
}

export const fetchServicesFromDB = async () => {
  const { data, error } = await supabase
    .from("services") // Replace 'services' with your actual table name
    .select("*");

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const fetchUserRequestedRepairs = async (user_id: string) => {
  const { data, error } = await supabase
    .from("repairs")
    .select("*")
    .eq("customer_id", user_id);

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

// Fetch product details by product_id
export async function fetchProductDetails(product_id: number) {
  const { data, error } = await supabase
    .from("products") // Replace 'products' with your actual table name
    .select("*")
    .eq("product_id", product_id) // Assuming 'product_id' is the primary key in the products table
    .single(); // Fetch a single product

  if (error) {
    return `Error: ${error.message || JSON.stringify(error)}`;
  } else {
    return data; // Return the fetched product details
  }
}

// Fetch services requested by a specific user and their product details
export async function fetchUserRequestedServices(user_id: number) {
  const { data: repairs, error: repairsError } = await supabase
    .from("repairs")
    .select("*")
    .eq("customer_id", user_id)
    .order('created_at', { ascending: false });

  if (repairsError) {
    return `Error: ${repairsError.message || JSON.stringify(repairsError)}`;
  }

  // Fetch service details for each repair using service_id
  const servicesWithDetails = await Promise.all(
    repairs.map(async (repair) => {
      const serviceDetails = await supabase
        .from("services") // Fetching from the services table
        .select("*")
        .eq("service_id", repair.service_id) // Use service_id from the repair
        .single();

      return {
        ...repair,
        serviceDetails: serviceDetails.data, // Add service details to the repair object
      };
    })
  );

  return servicesWithDetails; // Return the repairs with service details
}

// Fetch service details by service_id
export async function fetchServiceDetails(service_id: number) {
  const { data, error } = await supabase
    .from("services") // Replace 'services' with your actual table name
    .select("*")
    .eq("service_id", service_id) // Assuming 'service_id' is the primary key in the services table
    .single(); // Fetch a single service

  if (error) {
    return `Error: ${error.message || JSON.stringify(error)}`;
  } else {
    return data; // Return the fetched service details
  }
}

// Function to update finance status of a repair
export async function updateFinanceStatus(repair_id: number, status: string) {
  const { data, error } = await supabase
    .from("repairs")
    .update({ finance_status: status })
    .eq("id", repair_id)
    .single();

  if (error) {
    return `Error: ${error.message || JSON.stringify(error)}`;
  } else {
    return `Success: ${JSON.stringify(data)}`;
  }
}

// Add a new notification to the database
export async function addNotification(user_id: string, title: string, message: string) {
  const { data, error } = await supabase
    .from('notifications')
    .insert([
      {
        user_id,
        title,
        message,
        created_at: new Date().toISOString(),
        read: false
      }
    ]);

  if (error) {
    console.error('Error adding notification:', error);
    return null;
  }
  return data;
}

// Fetch notifications for a user
export async function fetchNotifications(user_id: string) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user_id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
  return data;
}

// Mark a notification as read
export async function markNotificationAsRead(notification_id: number) {
  const { data, error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notification_id);

  if (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
  return true;
}