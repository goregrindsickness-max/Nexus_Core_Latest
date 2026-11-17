import React, { useEffect, useState } from 'react';
import { getSupabase } from '../../supabase';
import { ShoppingCart, Package, Plus } from 'lucide-react';
import { AddMarketplaceItemModal } from './AddMarketplaceItemModal';

export function ProfileMarketplaceTab({ selectedUserProfile, openCheckout, triggerNotification }: any) {
  const [marketplaceItems, setMarketplaceItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const fetchMarketplaceItems = async (targetUserId: string) => {
    if (!targetUserId) return;

    const supabase = getSupabase();
    if (!supabase) return;

    const { data, error } = await supabase
      .from('user_marketplace_items')
      .select('*')
      .eq('seller_id', targetUserId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching closet items:', error.message);
      return;
    }

    console.log('Fetched marketplace items:', data);
    setMarketplaceItems(data || []);
  };

  const fetchItems = async () => {
    setLoading(true);
    const supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }

    let resolvedId = null;

    // Strategy 1: If it's the current user (isYou), get the active auth session ID
    if (selectedUserProfile?.isYou) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) {
          resolvedId = session.user.id;
        }
      } catch (err) {
        console.error('Error fetching session:', err);
      }
    }

    // Strategy 2: Extract UUID from selectedUserProfile.id or other fields
    if (!resolvedId && selectedUserProfile?.id) {
      const match = String(selectedUserProfile.id).match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
      if (match) {
        resolvedId = match[0];
      }
    }

    // Strategy 3: Query profiles table by email
    if (!resolvedId && selectedUserProfile?.email) {
      try {
        const { data: prof } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', selectedUserProfile.email)
          .maybeSingle();
        if (prof?.id) {
          resolvedId = prof.id;
        }
      } catch (err) {
        console.error('Error querying profile by email:', err);
      }
    }

    // Strategy 4: Query profiles table by name
    if (!resolvedId && selectedUserProfile?.name) {
      try {
        const { data: prof } = await supabase
          .from('profiles')
          .select('id')
          .or(`full_name.eq.${selectedUserProfile.name},console_handle.eq.${selectedUserProfile.name}`)
          .maybeSingle();
        if (prof?.id) {
          resolvedId = prof.id;
        }
      } catch (err) {
        console.error('Error querying profile by name:', err);
      }
    }

    // Fallback: use whatever ID was initially provided or extracted
    if (!resolvedId && selectedUserProfile?.id) {
      const cleanId = String(selectedUserProfile.id).replace('real-', '');
      const match = cleanId.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
      resolvedId = match ? match[0] : cleanId;
    }

    if (!resolvedId) {
      console.warn('Could not resolve seller_id for marketplace fetch');
      setLoading(false);
      return;
    }

    await fetchMarketplaceItems(resolvedId);
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, [selectedUserProfile?.id, selectedUserProfile?.email, selectedUserProfile?.name]);

  const handleListingSuccess = () => {
    triggerNotification?.("New item listed in your gear closet!");
    fetchItems();
  };

  const isYou = selectedUserProfile?.isYou === true;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border border-zinc-900 rounded-xl bg-black/40">
        <ShoppingCart className="w-6 h-6 text-zinc-600 animate-pulse mb-3" />
        <div className="text-zinc-500 font-mono text-xs tracking-widest uppercase">Loading Marketplace...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {isYou && (
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="w-full py-3 flex items-center justify-center gap-2 bg-emerald-950/20 hover:bg-emerald-900/30 border border-emerald-900/50 hover:border-emerald-500/50 text-emerald-400 text-xs font-black tracking-widest uppercase rounded-xl transition-all group"
        >
          <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
          LIST AN ITEM
        </button>
      )}

      {marketplaceItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 border border-zinc-900/60 rounded-xl bg-black/20 text-center">
          <Package className="w-8 h-8 text-zinc-700 mb-3" />
          <h4 className="text-zinc-300 font-mono text-sm uppercase tracking-widest font-black mb-1">Gear Closet Empty</h4>
          <p className="text-zinc-500 text-[10px] uppercase font-mono max-w-[200px] mx-auto">No resale or merch items listed currently.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {marketplaceItems.map((item, idx) => (
            <div key={`profile-market-${item.id || "item"}-${idx}`} className="flex items-center justify-between p-3 bg-black border border-zinc-800/80 hover:border-zinc-700 transition-colors rounded-xl">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-12 h-12 bg-zinc-900 rounded flex items-center justify-center shrink-0 overflow-hidden border border-zinc-800">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-5 h-5 text-zinc-500" />
                  )}
                </div>
                <div className="text-left flex-1 min-w-0">
                  <div className="text-sm font-bold text-zinc-100 truncate">{item.title}</div>
                  <div className="text-[11px] text-zinc-400 font-mono mt-0.5 flex flex-wrap gap-x-2 gap-y-1">
                    <span className="text-emerald-400 font-black">${Number(item.price).toFixed(2)}</span>
                    {item.condition && <span>• {item.condition}</span>}
                    {item.size && <span>• Size: {item.size}</span>}
                  </div>
                </div>
              </div>
              <button 
                onClick={() => {
                  openCheckout('merch', {
                    name: item.title,
                    price: Number(item.price),
                    thumbnail: item.image_url,
                    sizes: item.size ? [item.size] : [],
                    bandName: selectedUserProfile.name
                  });
                  triggerNotification?.(`Added ${item.title} to order...`);
                }}
                className="ml-3 shrink-0 px-4 py-2 bg-zinc-100 hover:bg-white text-black text-[11px] font-black uppercase tracking-wider rounded transition-colors cursor-pointer"
              >
                Buy
              </button>
            </div>
          ))}
        </div>
      )}

      <AddMarketplaceItemModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onListingSuccess={handleListingSuccess} 
      />
    </div>
  );
}
