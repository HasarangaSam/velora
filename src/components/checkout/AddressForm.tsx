"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { SRI_LANKAN_DISTRICTS } from "@/lib/sri-lankan-districts";
import {
  createAddress,
  updateAddress,
  type AddressActionState,
} from "@/app/account/addresses/actions";

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

function AddressSubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
    >
      {pending ? "Saving..." : isEdit ? "Update Address" : "Save Address"}
    </button>
  );
}

const initialState: AddressActionState = {
  success: false,
  message: "",
};

export default function AddressForm({
  address,
  onSaved,
  onCancel,
}: AddressFormProps) {
  const isEdit = Boolean(address?.id);
  const actionFn = isEdit && address?.id
    ? updateAddress.bind(null, address.id)
    : createAddress;

  const [state, formAction] = useActionState(actionFn, initialState);
  const [isDefault, setIsDefault] = useState(address?.isDefault ?? false);

  useEffect(() => {
    if (state.success && state.address) {
      onSaved(state.address as Address);
    }
  }, [state.success, state.address, onSaved]);

  return (
    <form
      action={formAction}
      className="space-y-5 rounded-lg border border-slate-200 bg-white p-5"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Full name
          </label>

          <input
            name="fullName"
            defaultValue={address?.fullName ?? ""}
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
          />
          {state.errors?.fullName && (
            <p className="mt-1 text-xs text-red-600">{state.errors.fullName[0]}</p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Phone
          </label>

          <input
            name="phone"
            defaultValue={address?.phone ?? ""}
            placeholder="0712345678"
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
          />
          {state.errors?.phone && (
            <p className="mt-1 text-xs text-red-600">{state.errors.phone[0]}</p>
          )}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Address line 1
        </label>

        <input
          name="addressLine1"
          defaultValue={address?.addressLine1 ?? ""}
          required
          className="w-full rounded-md border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
        />
        {state.errors?.addressLine1 && (
          <p className="mt-1 text-xs text-red-600">{state.errors.addressLine1[0]}</p>
        )}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Address line 2
        </label>

        <input
          name="addressLine2"
          defaultValue={address?.addressLine2 ?? ""}
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
            name="city"
            defaultValue={address?.city ?? ""}
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
          />
          {state.errors?.city && (
            <p className="mt-1 text-xs text-red-600">{state.errors.city[0]}</p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            District
          </label>

          <select
            name="district"
            defaultValue={address?.district ?? ""}
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
          >
            <option value="" disabled>
              Select district
            </option>
            {SRI_LANKAN_DISTRICTS.map((district) => (
              <option key={district} value={district}>
                {district}
              </option>
            ))}
          </select>
          {state.errors?.district && (
            <p className="mt-1 text-xs text-red-600">{state.errors.district[0]}</p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Postal code
          </label>

          <input
            name="postalCode"
            defaultValue={address?.postalCode ?? ""}
            inputMode="numeric"
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
          />
          {state.errors?.postalCode && (
            <p className="mt-1 text-xs text-red-600">{state.errors.postalCode[0]}</p>
          )}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          name="isDefault"
          value="true"
          checked={isDefault}
          onChange={(event) => setIsDefault(event.target.checked)}
        />
        Use as my default address
      </label>

      {state.message && (
        <p
          className={`text-sm ${
            state.success ? "text-green-600" : "text-red-600"
          }`}
        >
          {state.message}
        </p>
      )}

      <div className="flex gap-3">
        <AddressSubmitButton isEdit={isEdit} />

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
