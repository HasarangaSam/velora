"use client";

import { useState } from "react";

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

type AddressFormProps = {
  address?: Address;
  onSaved: (address: Address) => void;
  onCancel?: () => void;
};

export default function AddressForm({
  address,
  onSaved,
  onCancel,
}: AddressFormProps) {
  const [form, setForm] = useState({
    fullName: address?.fullName ?? "",
    phone: address?.phone ?? "",
    addressLine1: address?.addressLine1 ?? "",
    addressLine2: address?.addressLine2 ?? "",
    city: address?.city ?? "",
    district: address?.district ?? "",
    postalCode: address?.postalCode ?? "",
    isDefault: address?.isDefault ?? false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function updateField(field: keyof typeof form, value: string | boolean) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        address ? `/api/addresses/${address.id}` : "/api/addresses",
        {
          method: address ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message ?? "Unable to save the address.");
        return;
      }

      onSaved(data.address);
    } catch {
      setError("Unable to save the address.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-lg border border-slate-200 bg-white p-5"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Full name
          </label>

          <input
            value={form.fullName}
            onChange={(event) => updateField("fullName", event.target.value)}
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Phone
          </label>

          <input
            value={form.phone}
            onChange={(event) => updateField("phone", event.target.value)}
            placeholder="0712345678"
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Address line 1
        </label>

        <input
          value={form.addressLine1}
          onChange={(event) => updateField("addressLine1", event.target.value)}
          required
          className="w-full rounded-md border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Address line 2
        </label>

        <input
          value={form.addressLine2}
          onChange={(event) => updateField("addressLine2", event.target.value)}
          placeholder="Apartment, building, etc. (optional)"
          className="w-full rounded-md border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            City
          </label>

          <input
            value={form.city}
            onChange={(event) => updateField("city", event.target.value)}
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            District
          </label>

          <input
            value={form.district}
            onChange={(event) => updateField("district", event.target.value)}
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Postal code
          </label>

          <input
            value={form.postalCode}
            onChange={(event) => updateField("postalCode", event.target.value)}
            inputMode="numeric"
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={form.isDefault}
          onChange={(event) => updateField("isDefault", event.target.checked)}
        />
        Use as my default address
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {loading ? "Saving..." : address ? "Update Address" : "Save Address"}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-md border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
