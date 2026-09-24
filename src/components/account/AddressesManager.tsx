"use client";

import { useState } from "react";
import AddressForm from "@/components/checkout/AddressForm";
import { Plus, MapPin, Trash2, CheckCircle2 } from "lucide-react";

type Address = {
  id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  district: string;
  postalCode: string;
  isDefault: boolean;
};

export default function AddressesManager({
  initialAddresses,
}: {
  initialAddresses: Address[];
}) {
  const [addresses, setAddresses] = useState<Address[]>(initialAddresses);
  const [showAddForm, setShowAddForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to remove this address?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/addresses/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setAddresses((prev) => prev.filter((a) => a.id !== id));
      } else {
        alert("Failed to delete address.");
      }
    } catch {
      alert("Error deleting address.");
    } finally {
      setDeletingId(null);
    }
  }

  function handleAddressSaved(newAddress: Address) {
    setAddresses((prev) => {
      const filtered = prev.filter((a) => a.id !== newAddress.id);
      if (newAddress.isDefault) {
        return [newAddress, ...filtered.map((a) => ({ ...a, isDefault: false }))];
      }
      return [...filtered, newAddress];
    });
    setShowAddForm(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Delivery Addresses</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your saved delivery destinations.
          </p>
        </div>

        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition shadow-sm"
          >
            <Plus size={15} />
            Add New Address
          </button>
        )}
      </div>

      {showAddForm && (
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
          <h3 className="font-semibold text-slate-900 text-sm mb-4">
            Add Shipping Address
          </h3>
          <AddressForm
            onSaved={handleAddressSaved}
            onCancel={() => setShowAddForm(false)}
          />
        </div>
      )}

      {addresses.length === 0 && !showAddForm ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
          <MapPin size={36} className="mx-auto text-slate-300 mb-2" />
          <p className="font-semibold text-slate-800 text-sm">
            No saved addresses
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Add an address for quick one-click checkout.
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
          >
            + Add your first address
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((address) => (
            <div
              key={address.id}
              className={`rounded-xl border p-5 bg-white shadow-sm flex flex-col justify-between ${
                address.isDefault ? "border-blue-500 ring-1 ring-blue-500" : "border-slate-200"
              }`}
            >
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-900 text-sm">
                    {address.fullName}
                  </span>
                  {address.isDefault && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                      <CheckCircle2 size={12} /> Default
                    </span>
                  )}
                </div>
                <p>{address.addressLine1}</p>
                {address.addressLine2 && <p>{address.addressLine2}</p>}
                <p>
                  {address.city}, {address.district} {address.postalCode}
                </p>
                <p className="font-mono text-slate-500 pt-1">
                  Phone: {address.phone}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-end">
                <button
                  onClick={() => handleDelete(address.id)}
                  disabled={deletingId === address.id}
                  className="text-xs font-semibold text-slate-400 hover:text-rose-600 transition flex items-center gap-1"
                >
                  <Trash2 size={14} /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
