import { motion } from 'motion/react';
import { Printer, Receipt } from 'lucide-react';
import { Dialog, DialogContent } from '../components/ui/dialog';
import { Button } from '../components/ui/button';

interface TicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    folio: string | number;
    customerName?: string;
    items: { name: string; price: number; quantity: number }[];
    tableCost?: number;
    productsCost: number;
    totalCost: number;
    startTime?: number;
    endTime: number | Date;
    usageTime?: string;
    sellerName?: string;
  } | null;
}

export function TicketModal({ isOpen, onClose, data }: TicketModalProps) {
  if (!data) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(data.endTime).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  
  const formattedTime = new Date(data.endTime).toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #09090b;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #27272a;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #3f3f46;
        }
        @media print {
          @page {
            margin: 5mm;
            size: auto;
          }
          body {
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          .ticket-container {
            width: 100% !important;
            max-width: 80mm;
            margin: 0 auto;
            background: white !important;
            color: black !important;
            font-family: Arial, sans-serif !important;
          }
          .divider {
            border-top: 1px solid black !important;
            margin: 4px 0 !important;
          }
          .text-bold { font-weight: bold !important; }
          .text-center { text-align: center !important; }
          .text-right { text-align: right !important; }
          .flex-row { display: flex !important; justify-content: space-between !important; }
        }
      `}} />

      <DialogContent
        className="bg-zinc-950 border-zinc-800 max-w-md w-full p-0 overflow-hidden print:bg-white print:border-none print:shadow-none max-h-[90vh] flex flex-col"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        {/* Header - Hidden on Print */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-5 no-print flex-shrink-0">
          <div className="flex justify-between items-start text-white">
            <div>
              <h2 className="text-xl font-bold">Comprobante de Pago</h2>
              <div className="flex items-center gap-2 opacity-90 text-sm mt-1">
                <Receipt className="w-4 h-4" />
                <span>Folio #{data.folio}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Ticket Body */}
        <div className="p-8 space-y-6 bg-zinc-950 print:bg-white print:text-black print:p-0 ticket-container overflow-y-auto flex-1 custom-scrollbar">
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-black tracking-tighter text-white print:text-black print:text-xl">BILLAR CONTROL</h1>
            <p className="text-zinc-500 text-xs print:text-black italic">Comprobante de Venta</p>
            <div className="flex justify-center gap-4 text-[10px] text-zinc-400 font-mono mt-2 print:text-black print:text-[8px]">
              <span>{formattedDate}</span>
              <span>{formattedTime}</span>
            </div>
          </div>

          <div className="border-y border-dashed border-zinc-800 py-4 space-y-2 print:border-black print:border-solid print:py-2">
            <div className="flex justify-between text-sm print:text-[10px]">
              <span className="text-zinc-500 print:text-black">Folio:</span>
              <span className="text-white font-mono print:text-black font-bold">#{data.folio}</span>
            </div>
            {data.customerName && (
              <div className="flex justify-between text-sm print:text-[10px]">
                <span className="text-zinc-500 print:text-black">Cliente:</span>
                <span className="text-white print:text-black font-bold uppercase">{data.customerName}</span>
              </div>
            )}
            {data.sellerName && (
              <div className="flex justify-between text-sm print:text-[10px]">
                <span className="text-zinc-500 print:text-black">Atendido por:</span>
                <span className="text-white print:text-black font-bold">{data.sellerName}</span>
              </div>
            )}
          </div>

          <div className="space-y-4 print:space-y-2">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest print:text-black print:text-[8px]">Detalle de Consumo</p>
            <div className="space-y-3 print:space-y-1">
              {data.tableCost !== undefined && (
                <div className="flex justify-between text-sm print:text-[10px]">
                  <div className="flex flex-col">
                    <span className="text-zinc-300 print:text-black">Uso de Mesa</span>
                    {data.usageTime && (
                      <span className="text-[10px] text-zinc-500 print:text-black print:text-[8px]">Tiempo: {data.usageTime}</span>
                    )}
                  </div>
                  <span className="text-white font-medium print:text-black">${data.tableCost.toFixed(2)}</span>
                </div>
              )}
              {data.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm print:text-[10px]">
                  <div className="flex flex-col">
                    <span className="text-white print:text-black">{item.name}</span>
                    <span className="text-[10px] text-zinc-500 print:text-black print:text-[8px]">{item.quantity} x ${item.price}</span>
                  </div>
                  <span className="text-white font-medium print:text-black">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-dashed border-zinc-800 space-y-2 print:border-black print:border-solid print:pt-2">
            <div className="flex justify-between items-center">
              <span className="text-zinc-400 print:text-black print:text-[10px] font-bold">TOTAL A PAGAR</span>
              <span className="text-2xl font-black text-green-400 print:text-black print:text-lg">
                ${data.totalCost.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="text-center pt-4 print:pt-4">
            <p className="text-[10px] text-zinc-500 print:text-black italic">¡Gracias por su visita!</p>
          </div>
        </div>

        {/* Action Buttons - Hidden on Print */}
        <div className="p-4 bg-zinc-900 border-t border-zinc-800 flex gap-3 no-print">
          <Button variant="outline" onClick={onClose} className="flex-1 border-zinc-700 text-zinc-300">
            Cerrar
          </Button>
          <Button onClick={handlePrint} className="flex-1 bg-green-500 hover:bg-green-600 text-black font-bold">
            <Printer className="w-4 h-4 mr-2" />
            Imprimir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
