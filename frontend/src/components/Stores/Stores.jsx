import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Store, Plus, Trash2, RefreshCw, ExternalLink, 
  CheckCircle, XCircle, AlertCircle, Settings, ChevronRight
} from 'lucide-react';
import useStore from '../../store/useStore';
import { format } from 'date-fns';

// ============================================================================
// STORE CARD COMPONENT
// ============================================================================

const StoreCard = ({ store, onSelect, onDelete, onSync }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to disconnect ${store.shop_domain}?`)) {
      setIsDeleting(true);
      await onDelete(store.id);
      setIsDeleting(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    await onSync(store.id);
    setIsSyncing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <Store className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">{store.shop_domain}</h3>
            <p className="text-sm text-gray-500">
              Connected {format(new Date(store.created_at), 'MMM d, yyyy')}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-sm ${
            store.status === 'active' 
              ? 'bg-green-100 text-green-700' 
              : 'bg-gray-100 text-gray-700'
          }`}>
            {store.status === 'active' ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-gray-500">Total Audits</p>
          <p className="font-semibold">{store.audit_count || 0}</p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-gray-500">Fixes Applied</p>
          <p className="font-semibold">{store.fix_count || 0}</p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-gray-500">A/B Tests</p>
          <p className="font-semibold">{store.abtest_count || 0}</p>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => onSelect(store)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
          Select Store
        </button>
        <button
          onClick={handleSync}
          disabled={isSyncing}
          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors"
          title="Sync themes"
        >
          <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
        </button>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="p-2 text-gray-600 hover:text-red-600 hover:bg-gray-100 rounded-lg transition-colors"
          title="Disconnect store"
        >
          <Trash2 className={`w-5 h-5 ${isDeleting ? 'animate-pulse' : ''}`} />
        </button>
      </div>
    </motion.div>
  );
};

// ============================================================================
// ADD STORE MODAL
// ============================================================================

const AddStoreModal = ({ isOpen, onClose, onAdd }) => {
  const [shopDomain, setShopDomain] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!shopDomain) return;

    // Validate Shopify domain
    if (!shopDomain.includes('.myshopify.com') && !shopDomain.includes('shopify.com')) {
      setError('Please enter a valid Shopify store domain');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Initiate OAuth flow
      const cleanDomain = shopDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');
      await onAdd(cleanDomain);
      setShopDomain('');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to initiate OAuth flow');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-2xl p-6 w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-xl font-semibold mb-4">Connect Shopify Store</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Store Domain</label>
              <input
                type="text"
                value={shopDomain}
                onChange={(e) => setShopDomain(e.target.value)}
                placeholder="mystore.myshopify.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter your Shopify store domain (e.g., mystore.myshopify.com)
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !shopDomain}
                className={`flex-1 px-4 py-2 rounded-lg font-medium ${
                  isLoading || !shopDomain
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isLoading ? 'Connecting...' : 'Connect Store'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ============================================================================
// STORE CONNECTION GUIDE
// ============================================================================

const StoreConnectionGuide = () => {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6 mb-6">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <Store className="w-6 h-6 text-blue-600" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-blue-800">How to Connect Your Shopify Store</h2>
          <p className="text-sm text-blue-700 mt-1 mb-4">
            Connecting your store takes less than 2 minutes and allows you to run audits and track performance.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/50 rounded-lg p-4">
              <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center mb-2">
                <span className="text-sm font-bold text-blue-700">1</span>
              </div>
              <p className="text-sm font-medium text-blue-800">Enter Your Domain</p>
              <p className="text-xs text-blue-600 mt-1">Type your store URL (e.g., mystore.myshopify.com)</p>
            </div>
            <div className="bg-white/50 rounded-lg p-4">
              <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center mb-2">
                <span className="text-sm font-bold text-blue-700">2</span>
              </div>
              <p className="text-sm font-medium text-blue-800">Authorize Access</p>
              <p className="text-xs text-blue-600 mt-1">Log into Shopify to grant read access to your store</p>
            </div>
            <div className="bg-white/50 rounded-lg p-4">
              <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center mb-2">
                <span className="text-sm font-bold text-blue-700">3</span>
              </div>
              <p className="text-sm font-medium text-blue-800">Start Auditing</p>
              <p className="text-xs text-blue-600 mt-1">Run diagnostics and find problems hurting your sales</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN STORES COMPONENT
// ============================================================================

const Stores = () => {
  const { 
    stores, 
    currentStore, 
    storesLoading,
    fetchStores, 
    setCurrentStore, 
    addStore,
    removeStore,
    fetchThemes
  } = useStore();

  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchStores();
  }, []);

  const handleAddStore = async (shopDomain) => {
    // This would initiate the OAuth flow
    // In production, you'd redirect to Shopify OAuth
    console.log('Initiating OAuth for:', shopDomain);
    
    // For demo, add a mock store
    const mockStore = {
      id: Date.now(),
      shop_domain: shopDomain,
      status: 'active',
      created_at: new Date().toISOString(),
      audit_count: 0,
      fix_count: 0,
      abtest_count: 0
    };
    addStore(mockStore);
  };

  const handleDeleteStore = async (storeId) => {
    removeStore(storeId);
  };

  const handleSyncStore = async (storeId) => {
    // Fetch themes for the store
    await fetchThemes(storeId);
  };

  const handleSelectStore = (store) => {
    setCurrentStore(store);
    fetchThemes(store.id);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Stores</h1>
          <p className="text-gray-600">Manage your connected Shopify stores</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Store
        </button>
      </div>

      {/* Connection Guide - Show when no stores or when adding */}
      {stores.length === 0 && <StoreConnectionGuide />}

      {/* Loading State */}
      {storesLoading && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-3 text-gray-600">Loading stores...</span>
        </div>
      )}

      {/* Empty State */}
      {!storesLoading && stores.length === 0 && (
        <div className="text-center py-12">
          <Store className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No stores connected</h3>
          <p className="text-gray-500 mb-4">Connect your first Shopify store to get started</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Connect Store
          </button>
        </div>
      )}

      {/* Store Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {stores.map((store) => (
            <StoreCard
              key={store.id}
              store={store}
              onSelect={handleSelectStore}
              onDelete={handleDeleteStore}
              onSync={handleSyncStore}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Current Store Info */}
      {currentStore && (
        <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-blue-600" />
            <div>
              <h3 className="font-semibold">Currently Selected: {currentStore.shop_domain}</h3>
              <p className="text-sm text-blue-600">
                All audits and fixes will be applied to this store
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add Store Modal */}
      <AddStoreModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddStore}
      />
    </div>
  );
};

export default Stores;