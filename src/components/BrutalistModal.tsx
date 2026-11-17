import React, { useState } from 'react';
import { X, Calendar, DollarSign, StickyNote, ChevronDown } from 'lucide-react';
import { InventoryItem, Show } from '../types';

interface BrutalistModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'sale' | 'show' | 'note' | null;
  onSubmit: (type: 'sale' | 'show' | 'note', data: any) => void;
  inventory?: InventoryItem[];
  shows?: Show[];
}

export default function BrutalistModal({ isOpen, onClose, type, onSubmit, inventory, shows }: BrutalistModalProps) {

  const [saleForm, setSaleForm] = useState({
    item_name: inventory && inventory.length > 0 ? inventory[0].name : 'Symbiotic Voracity Hat',
    quantity: 1,
    item_type: inventory && inventory.length > 0 ? inventory[0].item_type : 'One Size',
    amount: inventory && inventory.length > 0 ? inventory[0].price : 34.72,
    payment_method: 'CASH' as 'CASH' | 'QR' | 'CARD' | 'PAYPAL',
  });

  React.useEffect(() => {
    if (isOpen && type === 'sale' && inventory && inventory.length > 0) {
      setSaleForm({
        item_name: inventory[0].name,
        quantity: 1,
        item_type: inventory[0].item_type,
        amount: inventory[0].price,
        payment_method: 'CASH',
      });
    }
  }, [isOpen, type, inventory]);

  const [showForm, setShowForm] = useState({
    name: 'Metastasis Obliteration Live, TX',
    festival_name: '',
    date: new Date().toISOString().split('T')[0],
    revenue: 122.0,
    show_type: 'headliner' as 'headliner' | 'support' | 'festival' | 'tour date' | 'one-off',
  });

  const [noteForm, setNoteForm] = useState({
    category: 'NOTE',
    text: '',
    tag_name: 'GENERAL INFO',
    show_id: '',
  });

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (type === 'sale') onSubmit('sale', saleForm);
    if (type === 'show') onSubmit('show', showForm);
    if (type === 'note') onSubmit('note', noteForm);
    onClose();
  };

  if (!isOpen || !type) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs">
      <div 
        id="brutalist-modal"
        className="w-full max-w-md bg-[#13161d] border-2 border-[#252830] rounded-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b-2 border-[#1a1d24] bg-zinc-900/60">
          <div className="flex items-center gap-2">
            {type === 'sale' && <DollarSign className="w-5 h-5 text-emerald-400" />}
            {type === 'show' && <Calendar className="w-5 h-5 text-teal-400" />}
            {type === 'note' && <StickyNote className="w-5 h-5 text-amber-400" />}
            <h3 className="font-display font-semibold text-sm tracking-widest uppercase">
              {type === 'sale' && 'Record Sale'}
              {type === 'show' && 'Add Tour Show'}
              {type === 'note' && 'Create Tour Note'}
            </h3>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white rounded hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleFormSubmit} className="p-4 space-y-4">
          {type === 'sale' && (
            <>
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1 uppercase tracking-wider">Item Name</label>
                <select 
                  value={saleForm.item_name}
                  onChange={(e) => {
                    const val = e.target.value;
                    const matched = inventory?.find(i => i.name === val);
                    const amount = matched ? matched.price : 10.0;
                    const item_type = matched ? matched.item_type : 'CD';
                    setSaleForm(prev => ({ ...prev, item_name: val, amount, item_type }));
                  }}
                  className="w-full bg-[#1c202a] border border-[#2e3444] rounded p-2 text-sm text-white focus:outline-none focus:border-emerald-400 font-mono"
                >
                  {inventory && inventory.length > 0 ? (
                    inventory.map((item, idx) => (
                      <option key={item.id ? `inv-${item.id}-${idx}` : `inv-${idx}`} value={item?.name}>
                        {item?.name} (${item.price.toFixed(2)} - {item.item_type})
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="Symbiotic Voracity Hat">Symbiotic Voracity Hat ($34.72)</option>
                      <option value="Drug-induced Psychosis">Drug-induced Psychosis CD ($23.87)</option>
                      <option value="Xenomorph Head">Xenomorph Head ($19.53)</option>
                    </>
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1 uppercase tracking-wider">Quantity</label>
                  <input 
                    type="number" 
                    min="1"
                    value={saleForm.quantity}
                    onChange={(e) => setSaleForm(prev => ({ ...prev, quantity: Math.max(1, parseInt(e.target.value) || 1) }))}
                    className="w-full bg-[#1c202a] border border-[#2e3444] rounded p-2 text-sm text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1 uppercase tracking-wider">Amount ($)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={saleForm.amount}
                    onChange={(e) => setSaleForm(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-[#1c202a] border border-[#2e3444] rounded p-2 text-sm text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1 uppercase tracking-wider">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['CASH', 'QR', 'CARD', 'PAYPAL'] as const).map((method, idx) => (
                    <button
                      key={`${method}-${idx}`}
                      type="button"
                      onClick={() => setSaleForm(prev => ({ ...prev, payment_method: method }))}
                      className={`py-2 text-xs font-mono rounded border uppercase transition-all ${
                        saleForm.payment_method === method 
                          ? 'bg-emerald-500/10 border-emerald-400 text-emerald-400' 
                          : 'bg-[#1c202a] border-zinc-700 text-zinc-400 hover:border-zinc-500'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {type === 'show' && (
            <>
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1 uppercase tracking-wider">Show Site / Venue Name</label>
                <input 
                  type="text" 
                  value={showForm.name}
                  onChange={(e) => setShowForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Red Rocks Amphitheatre, CO"
                  className="w-full bg-[#1c202a] border border-[#2e3444] rounded p-2 text-sm text-white focus:outline-none focus:border-teal-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1 uppercase tracking-wider">Festival Name (Optional)</label>
                <input 
                  type="text" 
                  value={showForm.festival_name}
                  onChange={(e) => setShowForm(prev => ({ ...prev, festival_name: e.target.value }))}
                  placeholder="e.g. Maryland Deathfest, Wacken Open Air"
                  className="w-full bg-[#1c202a] border border-[#2e3444] rounded p-2 text-sm text-white focus:outline-none focus:border-teal-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1 uppercase tracking-wider">Show Date</label>
                  <input 
                    type="date" 
                    value={showForm.date}
                    onChange={(e) => setShowForm(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full bg-[#1c202a] border border-[#2e3444] rounded p-2 text-sm text-white focus:outline-none focus:border-teal-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1 uppercase tracking-wider font-semibold">Venue Estimate ($)</label>
                  <input 
                    type="number" 
                    value={showForm.revenue}
                    onChange={(e) => setShowForm(prev => ({ ...prev, revenue: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-[#1c202a] border border-[#2e3444] rounded p-2 text-sm text-white focus:outline-none focus:border-teal-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1 uppercase tracking-wider">Show Type</label>
                <select
                  value={showForm.show_type}
                  onChange={(e) => setShowForm(prev => ({ ...prev, show_type: e.target.value as any }))}
                  className="w-full bg-[#1c202a] border border-[#2e3444] rounded p-2 text-sm text-white focus:outline-none focus:border-teal-400 font-mono"
                >
                  <option value="headliner">Headliner</option>
                  <option value="support">Support</option>
                  <option value="festival">Festival</option>
                  <option value="tour date">Tour Date</option>
                  <option value="one-off">One-off / Local</option>
                </select>
              </div>
            </>
          )}

          {type === 'note' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1 uppercase tracking-wider">Category</label>
                  <select 
                    value={noteForm.category}
                    onChange={(e) => setNoteForm(prev => ({ ...prev, category: e.target.value.toUpperCase() }))}
                    className="w-full bg-[#1c202a] border border-[#2e3444] rounded p-2 text-sm text-white focus:outline-none focus:border-amber-400 font-mono"
                    required
                  >
                    {["LOGISTICS", "SETTLEMENT", "STAFF", "COMP", "LOAD IN/OUT", "TECHNICAL", "PARKING", "VENUE", "CONTACT", "PAYMENT", "RESTOCK", "SECURITY", "CATERING", "GUEST LIST", "NOTE"].map((cat, idx) => (
                      <option key={`${cat}-${idx}`} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1 uppercase tracking-wider">Status Tag</label>
                  <select 
                    value={noteForm.tag_name}
                    onChange={(e) => setNoteForm(prev => ({ ...prev, tag_name: e.target.value.toUpperCase() }))}
                    className="w-full bg-[#1c202a] border border-[#2e3444] rounded p-2 text-sm text-white focus:outline-none focus:border-amber-400 font-mono"
                  >
                    {["URGENT", "COMPLETE", "IMPORTANT", "LOOK INTO", "GENERAL INFO"].map((stat, idx) => (
                      <option key={`${stat}-${idx}`} value={stat}>{stat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1 uppercase tracking-wider">Note Text Details</label>
                <textarea 
                  rows={3}
                  value={noteForm.text}
                  onChange={(e) => setNoteForm(prev => ({ ...prev, text: e.target.value }))}
                  placeholder="Insert notes about payouts, commissions, restock schedules, hotel info..."
                  className="w-full bg-[#1c202a] border border-[#2e3444] rounded p-2 text-sm text-white focus:outline-none focus:border-amber-400 resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1 uppercase tracking-wider">Assign to Show (Optional)</label>
                <div className="relative">
                  <select
                    value={noteForm.show_id}
                    onChange={(e) => setNoteForm(prev => ({ ...prev, show_id: e.target.value }))}
                    className="w-full bg-[#1c202a] border border-[#2e3444] rounded p-2 text-sm text-zinc-300 focus:outline-none focus:border-amber-400 font-mono appearance-none"
                  >
                    <option value="">-- General Tour Note --</option>
                    {shows && shows.map((show, idx) => (
                      <option key={show.id ? `show-${show.id}-${idx}` : `show-${idx}`} value={show.id}>
                        {show.name} ({new Date(show.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-zinc-450 pointer-events-none" />
                </div>
              </div>
            </>
          )}

          {/* Buttons Footer */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 text-sm font-semibold rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors border border-zinc-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`flex-1 py-2 text-sm font-semibold rounded text-black transition-colors ${
                type === 'sale' ? 'bg-emerald-400 hover:bg-emerald-300' :
                type === 'show' ? 'bg-teal-400 hover:bg-teal-300' :
                'bg-amber-400 hover:bg-amber-300'
              }`}
            >
              Confirm / Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
