import { Component, Input } from '@angular/core';
import { Receipt } from '../../models/receipt.model';
import { ReceiptService } from '../../services/receipt.service';

@Component({
  selector: 'app-service-receipt',
  templateUrl: './service-receipt.component.html',
  styleUrls: ['./service-receipt.component.scss']
})
export class ServiceReceiptComponent {
  @Input() receipt: Receipt;

  constructor(private receiptService: ReceiptService) {}

  downloadReceipt(): void {
    this.receiptService.generateReceiptPDF(this.receipt);
  }
}
