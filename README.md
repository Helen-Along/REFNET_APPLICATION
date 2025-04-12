# REFNET Application

## Overview

REFNET is a comprehensive application designed to manage various aspects of a retail business, including user management, product management, order processing, feedback collection, and more. The application leverages Supabase for backend services and React Native for the frontend.

## Features

- **User Management**: Register, login, and manage user profiles.
- **Product Management**: View, add, update, and delete products.
- **Order Processing**: Place orders, view order history, and manage cart items.
- **Feedback Collection**: Collect and manage user feedback.
- **Technician and Repair Management**: Assign and manage repair tasks.
- **Dispatch Management**: Manage dispatches and track delivery status.
- **Financial Records**: View and manage financial records.
- **Materials Management**: Select and assign materials for repair tasks.

## Technologies Used

- **Frontend**: React Native, Expo
- **Backend**: Supabase
- **Storage**: AsyncStorage
- **Routing**: Expo Router

## Setup Instructions

### Prerequisites

- Node.js (v14 or later)
- Expo CLI
- Supabase account and project

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/yourusername/REFNET_APPLICATION.git
   cd REFNET_APPLICATION
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env` file in the root directory and add your Supabase URL and Anon Key:

   ```env
   EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. **Start the application:**
   ```bash
   npx expo start
   ```

## Project Structure

- **/app**: Contains the main application screens and components.
- **/components**: Reusable UI components.
- **/lib**: Utility functions and context providers.
- **/assets**: Static assets like images and fonts.
- **/config**: Configuration files and constants.

## Usage

### User Management

- **Register**: Users can register by providing their details.
- **Login**: Users can log in using their email and password.
- **Profile**: Users can view and update their profile information.

### Product Management

- **View Products**: Users can browse and search for products.
- **Product Details**: View detailed information about a product.
- **Add to Cart**: Add products to the shopping cart.
- **Checkout**: Place an order for the products in the cart.

### Feedback Collection

- **Submit Feedback**: Users can submit feedback for products and services.
- **View Feedback**: Admins can view and manage user feedback.

### Technician and Repair Management

- **Assign Repairs**: Assign repair tasks to technicians.
- **View Repairs**: Technicians can view their assigned repair tasks.

### Dispatch Management

- **Manage Dispatches**: Track and update the status of dispatches.
- **View Drivers**: View available drivers for dispatch assignments.

### Financial Records

- **View Records**: Admins can view and manage financial records.

### Materials Management

- **Select Materials**: Select materials required for repair tasks.
- **Assign Materials**: Assign selected materials to repair tasks.

## Contributing

We welcome contributions to improve the REFNET application. Please follow these steps to contribute:

1. Fork the repository.
2. Create a new branch for your feature or bugfix.
3. Commit your changes and push them to your fork.
4. Create a pull request with a detailed description of your changes.

## Contact

For any questions or support, please contact us at support@refnet.com.

## Todo

### Customer Module

- [x] Registration approved by admin
- [x] Change state in checkout to country
- [x] M-PESA as a payment method
- [x] Credit Card validation
- [ ] Notifications
- [x] Shipping fees
- [x] Receipt improvement
- [ ] Accept/Reject Delivered product
- [ ] Product and Service review

### Database Module

- [x] Use real world price for products
- [x] Add more technicians

### Shipping Module

- [ ] Categorize into pending and approved
- [x] Variable Delivery fees based on location

### Driver Module

- [x] Accept assignment and mark as delivered

### Finance module

- [x] Remove service payment approval
- [x] Should have all order details
- [x] Download receipt after order is delivered

### Stock Manager Module
- [x] View orders and stock that has been reduced
- [x] Request from stock -> Finance approval -> Supplier -> Receipt
- [ ] Rate service after completion
- [ ] Supplier to restock product
- [ ] Finance Approval for services
