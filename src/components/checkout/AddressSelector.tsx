"use client";

import { useState } from "react";
import { Check, Pencil, Plus, Trash2 } from "lucide-react";
import AddressForm from "@/components/checkout/AddressForm";

export type CheckoutAddress = {
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

type AddressSelectorProps = {
  addresses: CheckoutAddress[];
  selectedAddressId: string | null;
  onSelect: (address: CheckoutAddress) => void;
  onAddressChanged: () => void;
};

export default function AddressSelector({
  addresses,
  selectedAddressId,
  onSelect,
  onAddressChanged,
}: AddressSelectorProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<CheckoutAddress | null>(
    null,
  );

  const [error, setError] = useState("");

  async function deleteAddress(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this address?",
    );

    if (!confirmed) {
      return;
    }

    setError("");

    try {
      const response = await fetch(`/api/addresses/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message ?? "Unable to delete the address.");
        return;
      }

      onAddressChanged();
    } catch {
      setError("Unable to delete the address.");
    }
  }

  function handleSaved(address: CheckoutAddress) {
    setShowForm(false);
    setEditingAddress(null);
    onSelect(address);
    onAddressChanged();
  }

  if (showForm || editingAddress) {
    return (
      <AddressForm
        address={editingAddress ?? undefined}
        onSaved={handleSaved}
        onCancel={() => {
          setShowForm(false);
          setEditingAddress(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      {addresses.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-300 px-5 py-8 text-center">
          <p className="text-sm text-slate-500">
            You do not have a saved delivery address yet.
          </p>
        </div>
      )}

      {addresses.map((address) => {
        const selected = selectedAddressId === address.id;

        return (
          <div
            key={address.id}
            className={`rounded-lg border p-5 transition ${
              selected
                ? "border-blue-600 bg-blue-50/40"
                : "border-slate-200 bg-white"
            }`}
          >
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => onSelect(address)}
                className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                  selected
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-slate-300"
                }`}
                aria-label={`Select address for ${address.fullName}`}
              >
                {selected && <Check size={13} />}
              </button>

              <button
                type="button"
                onClick={() => onSelect(address)}
                className="min-w-0 flex-1 text-left"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-slate-900">
                    {address.fullName}
                  </p>

                  {address.isDefault && (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                      Default
                    </span>
                  )}
                </div>

                <p className="mt-1 text-sm text-slate-500">{address.phone}</p>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {address.addressLine1}
                  {address.addressLine2 && `, ${address.addressLine2}`}
                  <br />
                  {address.city}, {address.district} {address.postalCode}
                </p>
              </button>

              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setEditingAddress(address)}
                  className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Edit address"
                >
                  <Pencil size={16} />
                </button>

                <button
                  type="button"
                  onClick={() => deleteAddress(address.id)}
                  className="rounded-md p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  aria-label="Delete address"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="button"
        onClick={() => setShowForm(true)}
        className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 hover:border-blue-400 hover:text-blue-600"
      >
        <Plus size={17} />
        Add New Address
      </button>
    </div>
  );
}
