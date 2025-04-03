import { Injectable } from '@angular/core';
import { Receipt } from '../models/receipt.model';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';

@Injectable({
  providedIn: 'root'
})
export class ReceiptService {
  constructor() {
    (pdfMake as any).vfs = pdfFonts.pdfMake.vfs;
  }

  generateReceiptPDF(receipt: Receipt): void {
    const docDefinition = {
      content: [
        { text: 'REFNET SERVICES', style: 'header' },
        { text: `Receipt Number: ${receipt.receiptNumber}`, margin: [0, 10, 0, 5] },
        { text: `Date: ${receipt.dateCreated.toLocaleDateString()}` },
        { text: `Customer: ${receipt.customerName}` },
        { text: 'Services:', style: 'subheader', margin: [0, 15, 0, 5] },
        this.createServicesTable(receipt.services),
        { text: `Total Amount: $${receipt.totalAmount.toFixed(2)}`, style: 'total' },
        { text: `Payment Method: ${receipt.paymentMethod}`, margin: [0, 10, 0, 0] }
      ],
      styles: {
        header: {
          fontSize: 22,
          bold: true,
          alignment: 'center'
        },
        subheader: {
          fontSize: 14,
          bold: true
        },
        total: {
          fontSize: 16,
          bold: true,
          margin: [0, 10, 0, 0]
        }
      }
    };

    pdfMake.createPdf(docDefinition).download(`receipt-${receipt.receiptNumber}.pdf`);
  }

  private createServicesTable(services: Array<any>) {
    return {
      table: {
        headerRows: 1,
        widths: ['*', 'auto', 'auto', 'auto'],
        body: [
          ['Service', 'Quantity', 'Price', 'Total'],
          ...services.map(service => [
            service.name,
            service.quantity,
            `$${service.price.toFixed(2)}`,
            `$${(service.quantity * service.price).toFixed(2)}`
          ])
        ]
      }
    };
  }
}
