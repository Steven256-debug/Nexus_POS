import { useState } from 'react';
import { Banknote, Smartphone, CreditCard } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function SplitPaymentDialog({
  isOpen,
  onClose,
  total,
  isProcessing,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  isProcessing: boolean;
  onConfirm: (cashAmount: number, momoAmount: number, cardAmount: number) => void;
}) {
  const [cashAmount, setCashAmount] = useState<string>('');
  const [momoAmount, setMomoAmount] = useState<string>('');
  const [cardAmount, setCardAmount] = useState<string>('');

  const handleConfirm = () => {
    onConfirm(
      parseFloat(cashAmount || '0'),
      parseFloat(momoAmount || '0'),
      parseFloat(cardAmount || '0')
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-3xl p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-center mb-1">Multiple Payment Split</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-3">
          <div className="text-center p-4 bg-muted/60 rounded-2xl border border-border">
            <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Total Amount Due</p>
            <p className="text-4xl font-black text-blue-600">GH₵{total.toFixed(2)}</p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1 flex items-center gap-1.5">
                <Banknote className="w-4 h-4 text-emerald-600" /> Cash Amount (GH₵)
              </label>
              <Input type="number" placeholder="0.00" value={cashAmount} onChange={e => setCashAmount(e.target.value)} className="rounded-xl h-11 font-bold text-lg" />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-blue-600" /> Mobile Money (GH₵)
              </label>
              <Input type="number" placeholder="0.00" value={momoAmount} onChange={e => setMomoAmount(e.target.value)} className="rounded-xl h-11 font-bold text-lg" />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-purple-600" /> Card Payment (GH₵)
              </label>
              <Input type="number" placeholder="0.00" value={cardAmount} onChange={e => setCardAmount(e.target.value)} className="rounded-xl h-11 font-bold text-lg" />
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={isProcessing} className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl px-6">
            {isProcessing ? 'Processing...' : 'Confirm Split Payment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
