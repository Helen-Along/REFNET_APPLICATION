export interface Receipt {
  receiptNumber: string;
  dateCreated: Date;
  customerName: string;
  services: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
  totalAmount: number;
  paymentMethod: string;
}
