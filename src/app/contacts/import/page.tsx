'use client';

import { useState, useRef } from 'react';
import { FileSpreadsheet, Upload, Download, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ImportContactsPage() {
  const [isImporting, setIsImporting] = useState(false);
  const [successCount, setSuccessCount] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(l => l.trim().length > 0);
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

      let count = 0;
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const data: any = {};
        headers.forEach((h, idx) => { data[h] = values[idx]; });

        if (data.name) {
          await fetch('/api/customers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: data.name,
              phone: data.phone || null,
              email: data.email || null,
              creditLimit: data.creditlimit || 0
            })
          });
          count++;
        }
      }
      setSuccessCount(count);
    } catch {
      alert('Error parsing CSV file');
    } finally {
      setIsImporting(false);
    }
  };

  const downloadSampleCsv = () => {
    const csvContent = "data:text/csv;charset=utf-8,Name,Phone,Email,CreditLimit\nKofi Mensah,+233240001122,kofi@gmail.com,5000\nAma Serwaa,+233501112233,ama@yahoo.com,2000";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "contacts_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-in fade-in max-w-4xl mx-auto pb-12">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-foreground">Import Contacts (CSV)</h1>
        <p className="text-muted-foreground text-sm">Bulk import customers and suppliers from Excel or CSV spreadsheets.</p>
      </div>

      <div className="p-8 bg-card text-card-foreground rounded-3xl border border-border shadow-sm space-y-6">
        <div className="flex justify-between items-center pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/10 text-blue-600 rounded-2xl">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">CSV Import Instructions</h3>
              <p className="text-xs text-muted-foreground">Download the official template or upload your formatted file.</p>
            </div>
          </div>
          <Button variant="outline" onClick={downloadSampleCsv} className="rounded-xl font-bold text-xs flex items-center gap-2">
            <Download className="w-4 h-4" /> Download Sample CSV
          </Button>
        </div>

        {/* Upload Box */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-border hover:border-blue-500 rounded-3xl p-12 text-center cursor-pointer bg-muted/20 hover:bg-muted/40 transition-colors flex flex-col items-center justify-center space-y-4"
        >
          <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
          <div className="w-16 h-16 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center">
            <Upload className="w-8 h-8" />
          </div>
          <div>
            <p className="text-base font-bold text-foreground">Click to browse or drop your CSV file here</p>
            <p className="text-xs text-muted-foreground mt-1">Supports standard CSV with headers: Name, Phone, Email, CreditLimit</p>
          </div>
          {isImporting && <p className="text-sm font-bold text-blue-600 animate-pulse">Processing file...</p>}
        </div>

        {successCount !== null && (
          <div className="p-4 bg-emerald-500/10 text-emerald-600 rounded-2xl border border-emerald-500/20 flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 shrink-0" />
            <p className="text-sm font-bold">Successfully imported {successCount} contact records into the database!</p>
          </div>
        )}
      </div>
    </div>
  );
}
