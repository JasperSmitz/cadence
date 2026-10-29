"use client";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveFoodAction, deleteFoodAction } from "@/app/foods/actions";
import type { Food } from "./persistence";
import { numericFields, formatDecimal, type FieldErrors } from "./validation";

const inputClass =
  "mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 focus:outline-emerald-700";
const buttonClass =
  "rounded-lg bg-emerald-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50";
export function FoodsWorkspace({
  foods,
  search,
}: {
  foods: Food[];
  search: string;
}) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [editorKey, setEditorKey] = useState(0);
  const [editing, setEditing] = useState<Food | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formMessage, setFormMessage] = useState("");
  const [feedback, setFeedback] = useState("");
  const [pending, startTransition] = useTransition();
  const [deleting, setDeleting] = useState<Food | null>(null);
  const deleteDialog = useRef<HTMLDialogElement>(null);
  function open(food: Food | null) {
    setEditorKey((key) => key + 1);
    setEditing(food);
    setErrors({});
    setFormMessage("");
    dialog.current?.showModal();
  }
  function error(key: string) {
    return errors[key] ? (
      <p id={`${key}-error`} className="mt-1 text-sm text-red-700">
        {errors[key]}
      </p>
    ) : null;
  }
  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Foods</h1>
          <p className="mt-2 text-stone-600">
            Nutrition per 100 g. Carbohydrate excludes fiber.
          </p>
        </div>
        <button className={buttonClass} onClick={() => open(null)}>
          Add food
        </button>
      </div>
      <p role="status" className="mt-3 text-sm text-emerald-800">
        {feedback}
      </p>
      <form action="/foods" className="my-6 flex flex-wrap items-end gap-3">
        <label className="flex-1">
          Search by name
          <input
            key={search}
            name="q"
            defaultValue={search}
            className={inputClass}
            placeholder="e.g. rice, dry"
          />
        </label>
        <button className={buttonClass}>Search</button>
        {search && (
          <a href="/foods" className="py-2 text-sm underline">
            Clear
          </a>
        )}
      </form>
      {!foods.length ? (
        <div className="rounded-xl border border-dashed border-stone-300 p-8">
          <h2 className="font-medium">
            {search ? "No matching foods" : "Your food collection starts here"}
          </h2>
          <p className="mt-2 text-stone-600">
            {search
              ? "Try another name or clear the search."
              : "Add the foods you use, with values from their nutrition labels."}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {foods.map((food) => (
            <li
              key={food.id}
              className="rounded-xl border border-stone-200 bg-white p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">{food.name}</h2>
                <div className="flex gap-4">
                  <button
                    className="text-sm text-emerald-800 underline"
                    onClick={() => open(food)}
                  >
                    Edit<span className="sr-only"> {food.name}</span>
                  </button>
                  <button
                    disabled={pending}
                    className="text-sm text-red-700 underline disabled:opacity-50"
                    onClick={() => {
                      setDeleting(food);
                      setFormMessage("");
                      deleteDialog.current?.showModal();
                    }}
                  >
                    Delete<span className="sr-only"> {food.name}</span>
                  </button>
                </div>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">
                {numericFields
                  .slice(0, 5)
                  .map(([key, label, unit, precision]) => (
                    <div key={key}>
                      <dt className="text-stone-500">{label}</dt>
                      <dd className="mt-1 font-medium">
                        {food[key] === null
                          ? "Unknown"
                          : `${formatDecimal(food[key], precision)} ${unit}`}
                      </dd>
                    </div>
                  ))}
              </dl>
              {food.servingSizeMg !== null && (
                <p className="mt-3 text-sm text-stone-600">
                  Reference serving
                  {food.servingLabel ? ` (${food.servingLabel})` : ""}:{" "}
                  {formatDecimal(food.servingSizeMg, 3)} g
                </p>
              )}
              {food.packageSizeMg !== null && (
                <p className="mt-1 text-sm text-stone-600">
                  Package: {formatDecimal(food.packageSizeMg, 3)} g
                </p>
              )}
              {food.notes && (
                <p className="mt-3 text-sm whitespace-pre-wrap text-stone-600">
                  {food.notes}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
      <dialog
        ref={dialog}
        onCancel={(event) => {
          if (pending) event.preventDefault();
        }}
        className="fixed inset-0 m-auto max-h-[90vh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-xl bg-stone-50 p-6 backdrop:bg-black/40"
        aria-labelledby="editor-title"
      >
        <h2 id="editor-title" className="text-xl font-semibold">
          {editing ? "Edit food" : "Add food"}
        </h2>
        <p className="mt-2 text-sm text-stone-600">
          Values per 100 g. Use . or , for decimals, without thousands
          separators.
        </p>
        <form
          key={editorKey}
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            startTransition(async () => {
              const result = await saveFoodAction(form).catch(() => ({
                ok: false as const,
                message:
                  "Connection lost. Your values are still here; please try again.",
              }));
              if (result.ok) {
                dialog.current?.close();
                setFeedback(result.message);
                router.refresh();
              } else {
                setErrors("errors" in result ? (result.errors ?? {}) : {});
                setFormMessage(result.message);
              }
            });
          }}
          className="mt-5 space-y-4"
        >
          {editing && <input type="hidden" name="id" value={editing.id} />}
          <fieldset disabled={pending} className="space-y-4">
            <label className="block">
              Name
              <input
                autoFocus
                name="name"
                defaultValue={editing?.name ?? ""}
                maxLength={200}
                className={inputClass}
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? "name-error" : undefined}
              />
              {error("name")}
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              {numericFields.map(
                ([key, label, unit, precision, , optional]) => (
                  <label key={key} className="block">
                    {label} ({unit}){optional ? " — optional" : ""}
                    <input
                      name={key}
                      inputMode="decimal"
                      type="text"
                      defaultValue={
                        editing ? formatDecimal(editing[key], precision) : ""
                      }
                      className={inputClass}
                      aria-invalid={!!errors[key]}
                      aria-describedby={
                        errors[key] ? `${key}-error` : undefined
                      }
                    />
                    {error(key)}
                  </label>
                ),
              )}
            </div>
            <label className="block">
              Reference serving label — optional
              <input
                name="servingLabel"
                defaultValue={editing?.servingLabel ?? ""}
                maxLength={100}
                placeholder="e.g. slice"
                className={inputClass}
                aria-invalid={!!errors.servingLabel}
                aria-describedby={
                  errors.servingLabel ? "servingLabel-error" : undefined
                }
              />
              {error("servingLabel")}
            </label>
            <label className="block">
              Notes — optional
              <textarea
                name="notes"
                defaultValue={editing?.notes ?? ""}
                maxLength={2000}
                rows={3}
                className={inputClass}
                aria-invalid={!!errors.notes}
                aria-describedby={errors.notes ? "notes-error" : undefined}
              />
              {error("notes")}
            </label>
          </fieldset>
          <p role="alert" className="text-sm text-red-700">
            {formMessage}
          </p>
          <div className="flex gap-3">
            <button disabled={pending} className={buttonClass}>
              {pending ? "Saving…" : "Save food"}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => dialog.current?.close()}
              className="px-3 py-2 text-sm underline"
            >
              Cancel
            </button>
          </div>
        </form>
      </dialog>
      <dialog
        ref={deleteDialog}
        onCancel={(event) => {
          if (pending) event.preventDefault();
        }}
        className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-md rounded-xl bg-white p-6 backdrop:bg-black/40"
        aria-labelledby="delete-title"
      >
        <h2 id="delete-title" className="text-xl font-semibold">
          Delete {deleting?.name}?
        </h2>
        <p className="mt-3 text-stone-600">
          This permanently removes the food. You cannot undo this action.
        </p>
        <p role="alert" className="mt-3 text-sm text-red-700">
          {formMessage}
        </p>
        <div className="mt-5 flex gap-3">
          <button
            autoFocus
            disabled={pending}
            className="px-3 py-2 underline"
            onClick={() => deleteDialog.current?.close()}
          >
            Cancel
          </button>
          <button
            disabled={pending}
            className="rounded-lg bg-red-700 px-4 py-2 text-white disabled:opacity-50"
            onClick={() =>
              startTransition(async () => {
                const result = await deleteFoodAction(deleting?.id).catch(
                  () => ({
                    ok: false as const,
                    message:
                      "Connection lost. Refresh the list before retrying.",
                  }),
                );
                if (result.ok) {
                  deleteDialog.current?.close();
                  setFeedback(result.message);
                  router.refresh();
                } else {
                  setFormMessage(result.message);
                  router.refresh();
                }
              })
            }
          >
            {pending ? "Deleting…" : "Delete permanently"}
          </button>
        </div>
      </dialog>
    </section>
  );
}
