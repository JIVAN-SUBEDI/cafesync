"use client";

import { useRouter } from "next/navigation";
import {
  checkSlugExists,
  clearTenantError,
  setSlugInput,
} from "@/store/slices/tenantSlice";

import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "../../store/index";

export default function SlugEntryPage() {
  const router = useRouter();

  const useAppDispatch = () => useDispatch<AppDispatch>();
  const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

  const dispatch = useAppDispatch();

  const { slugInput, status, error } = useAppSelector((s) => s.tenant);
  const loading = status === "loading";

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearTenantError());

    const action = await dispatch(checkSlugExists({ slug: slugInput }));

    if (checkSlugExists.fulfilled.match(action)) {
      router.push(`/${action.payload.slug}/login`);
    }
    setSlugInput("");
  };

  return (
    <div className="min-h-screen bg-[#fff7d6]">
      <div className="mx-auto max-w-md px-4 py-14">
        <div className="rounded-2xl border border-[#e7d488]/70 bg-white/70 p-6 shadow-[0_12px_30px_rgba(74,42,7,0.14)] backdrop-blur">
          <div className="mb-2 inline-flex items-center rounded-full border border-[#e7d488]/70 bg-[#fff3c4]/70 px-3 py-1 text-xs font-extrabold text-[#4A2A07]">
            Step 1 of 2
          </div>

          <h1 className="text-2xl font-black text-[#2A1B0D]">
            Enter your Slug
          </h1>
          <p className="mt-2 text-sm font-semibold text-[#6B451F]/80">
            Example:{" "}
            <span className="font-black text-[#2A1B0D]">grand-plaza</span>
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-3">
            <label className="block">
              <span className="text-xs font-extrabold uppercase tracking-wide text-[#6B451F]/70">
                 Slug
              </span>
              <input
                value={slugInput}
                onChange={(e) => dispatch(setSlugInput(e.target.value))}
                placeholder="e.g. dn-hotel"
                className="mt-2 w-full rounded-xl border border-[#e7d488]/80 bg-white/70 px-4 py-3 text-sm font-semibold text-[#2A1B0D] outline-none transition focus:border-[#FFC53D]"
              />
            </label>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {error}
              </div>
            )}

            <button
              disabled={loading}
              className="w-full rounded-xl border border-[#e7d488]/80 bg-gradient-to-br from-[#FFD86A] to-[#FFF3C4] px-4 py-3 text-sm font-extrabold text-[#2A1B0D] shadow-[0_10px_18px_rgba(74,42,7,0.10)] transition hover:brightness-[1.02] disabled:opacity-60"
            >
              {loading ? "Checking..." : "Continue"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
