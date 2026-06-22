import { HTMLInputTypeAttribute, useCallback, useMemo, useState } from 'react';

export type FormInputType = HTMLInputTypeAttribute | 'file' | 'option';
export type FormValue = string | number | boolean | File | null | undefined;
export type FormValues = Record<string, FormValue>;
export type FieldName<T extends FormValues> = Extract<keyof T, string>;

export interface FormOption<T extends FormValues> {
  label: string;
  value: T[FieldName<T>];
  testId?: string;
  disabled?: boolean;
}

export interface FormField<T extends FormValues> {
  name: FieldName<T>;
  label: string;
  placeholder?: string;
  required?: boolean;
  testId?: string;
  inputTestId?: string;
  type?: FormInputType;
  accept?: string;
  maxSize?: number;
  maxSizeMessage?: (field: FormField<T>, maxSize: number) => string;
  options?: FormOption<T>[];
  disabled?: boolean;
  validate?: (value: T[FieldName<T>], values: T) => string | undefined;
}

export interface FormBoundField<T extends FormValues> extends FormField<T> {
  value: T[FieldName<T>];
  error?: string;
  onChange: (value: T[FieldName<T>]) => void;
}

export interface UseFormOptions<T extends FormValues> {
  fields: FormField<T>[];
  initialValues?: Partial<T>;
  requiredMessage?: (field: FormField<T>) => string;
  onChange?: (values: T, field: FormField<T>) => void;
}

export interface UseFormResult<T extends FormValues> {
  fields: FormBoundField<T>[];
  values: T;
  errors: Partial<Record<FieldName<T>, string>>;
  setValue: <K extends FieldName<T>>(name: K, value: T[K]) => void;
  setValues: (values: Partial<T>) => void;
  setError: <K extends FieldName<T>>(name: K, error: string | undefined) => void;
  verify: () => boolean;
  varify: () => boolean;
  clearErrors: () => void;
  reset: (values?: Partial<T>) => void;
}

function createInitialValues<T extends FormValues>(
  fields: FormField<T>[],
  initialValues: Partial<T> | undefined,
): T {
  const values: Record<string, FormValue> = { ...(initialValues as Record<string, FormValue>) };
  for (const field of fields) {
    if (values[field.name] !== undefined) continue;
    values[field.name] = createEmptyValue(field);
  }
  return values as T;
}

function createEmptyValue<T extends FormValues>(field: FormField<T>): FormValue {
  if (field.type === 'checkbox') return false;
  if (field.type === 'file') return undefined;
  return '';
}

function isEmptyRequiredValue(value: FormValue) {
  if (typeof value === 'string') return !value.trim();
  return value === undefined || value === null || value === false;
}

export function useForm<T extends FormValues>({
  fields: rawFields,
  initialValues,
  requiredMessage = (field) => `${field.label} is required.`,
  onChange,
}: UseFormOptions<T>): UseFormResult<T> {
  const [values, setFormValues] = useState<T>(() => createInitialValues(rawFields, initialValues));
  const [errors, setErrors] = useState<Partial<Record<FieldName<T>, string>>>({});

  const setValue = useCallback(
    <K extends FieldName<T>>(name: K, value: T[K]) => {
      const field = rawFields.find((item) => item.name === name);
      setErrors((current) => (current[name] ? { ...current, [name]: undefined } : current));
      setFormValues((current) => {
        const next = { ...current, [name]: value };
        if (field) onChange?.(next, field);
        return next;
      });
    },
    [onChange, rawFields],
  );

  const setValues = useCallback((nextValues: Partial<T>) => {
    setFormValues((current) => ({ ...current, ...nextValues }));
  }, []);

  const setError = useCallback(<K extends FieldName<T>>(name: K, error: string | undefined) => {
    setErrors((current) => ({ ...current, [name]: error }));
  }, []);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const reset = useCallback(
    (nextValues?: Partial<T>) => {
      setFormValues(createInitialValues(rawFields, nextValues ?? initialValues));
      setErrors({});
    },
    [initialValues, rawFields],
  );

  const verify = useCallback(() => {
    const nextErrors: Partial<Record<FieldName<T>, string>> = {};
    for (const field of rawFields) {
      const value = values[field.name];
      if (field.required && isEmptyRequiredValue(value)) {
        nextErrors[field.name] = requiredMessage(field);
        continue;
      }
      const message = field.validate?.(value, values);
      if (message) {
        nextErrors[field.name] = message;
        continue;
      }
      if (
        field.type === 'file' &&
        field.maxSize &&
        isFileValue(value) &&
        value.size > field.maxSize
      ) {
        nextErrors[field.name] = field.maxSizeMessage
          ? field.maxSizeMessage(field, field.maxSize)
          : `${field.label} must be no larger than ${formatFileSize(field.maxSize)}.`;
      }
    }
    setErrors(nextErrors);
    return Object.values(nextErrors).every((value) => !value);
  }, [rawFields, requiredMessage, values]);

  const boundFields = useMemo(
    () =>
      rawFields.map((field) => ({
        ...field,
        value: values[field.name],
        error: errors[field.name],
        onChange: (value: T[FieldName<T>]) => setValue(field.name, value),
      })),
    [errors, rawFields, setValue, values],
  );

  return {
    fields: boundFields,
    values,
    errors,
    setValue,
    setValues,
    setError,
    verify,
    varify: verify,
    clearErrors,
    reset,
  };
}

function isFileValue(value: FormValue): value is File {
  return typeof File !== 'undefined' && value instanceof File;
}

function formatFileSize(size: number) {
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = size;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${Number.isInteger(value) ? value : value.toFixed(1)}${units[unitIndex]}`;
}
