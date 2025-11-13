/**
 * PetCustomizationForm Component
 * Form for creating and editing pet customization
 */
import { useEffect, useMemo, useState } from 'react';
import type { Pet, PetCreateRequest, PetSpecies } from '../../types/pet';
import { speciesBreedMap } from '../../types/pet';
import { createPet, updatePet } from '../../api/pets';

type Mode = 'create' | 'edit';

interface PetCustomizationFormProps {
  mode?: Mode;
  initialPet?: Pet | null;
  onSubmitSuccess?: (pet: Pet) => void;
}

const speciesOptions: PetSpecies[] = ['dog', 'cat', 'bird', 'rabbit', 'fox', 'dragon'];

const colorPresets = ['Golden', 'Midnight Blue', 'Snow', 'Sunset', 'Forest', 'Starlight'];

const todayISO = () => new Date().toISOString().split('T')[0];

const defaultState: PetCreateRequest = {
  name: '',
  species: 'dog',
  breed: speciesBreedMap.dog[0],
  color_pattern: colorPresets[0],
  birthday: todayISO(),
};

export function PetCustomizationForm({
  mode = 'create',
  initialPet,
  onSubmitSuccess,
}: PetCustomizationFormProps) {
  const [form, setForm] = useState<PetCreateRequest>(initialPet ? {
    name: initialPet.name,
    species: initialPet.species,
    breed: initialPet.breed,
    color_pattern: initialPet.color_pattern ?? null,
    birthday: initialPet.birthday ?? null,
  } : defaultState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableBreeds = useMemo(() => speciesBreedMap[form.species], [form.species]);

  useEffect(() => {
    if (!availableBreeds.includes(form.breed)) {
      setForm((prev) => ({ ...prev, breed: availableBreeds[0] }));
    }
  }, [availableBreeds, form.breed]);

  const age = useMemo(() => {
    const today = new Date();
    const birthdayValue = form.birthday ?? todayISO();
    const birthday = new Date(birthdayValue);
    let years = today.getFullYear() - birthday.getFullYear();
    const monthDiff = today.getMonth() - birthday.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthday.getDate())) {
      years -= 1;
    }
    return Math.max(years, 0);
  }, [form.birthday]);

  const handleChange =
    (field: keyof PetCreateRequest) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value = event.target.value;
      const normalizedValue =
        field === 'color_pattern' || field === 'birthday' ? (value || null) : value;
      const update: Partial<PetCreateRequest> = {
        [field]: normalizedValue,
      } as Partial<PetCreateRequest>;
      setForm((prev) => ({
        ...prev,
        ...update,
      }));
    };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const payload = { ...form };
      let pet: Pet;
      pet = mode === 'create' ? await createPet(payload) : await updatePet(payload);
      onSubmitSuccess?.(pet);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save pet customization.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div>
        <label className="block text-sm font-medium text-gray-700">Pet Name</label>
        <input
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          value={form.name}
          onChange={handleChange('name')}
          maxLength={50}
          required
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">Species</label>
          <select
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 capitalize"
            value={form.species}
            onChange={handleChange('species')}
          >
            {speciesOptions.map((specie) => (
              <option key={specie} value={specie}>
                {specie.charAt(0).toUpperCase() + specie.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Breed</label>
          <select
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            value={form.breed}
            onChange={handleChange('breed')}
          >
            {availableBreeds.map((breed) => (
              <option key={breed} value={breed}>
                {breed}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">Color / Pattern</label>
          <input
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            value={form.color_pattern ?? ''}
            onChange={handleChange('color_pattern')}
            maxLength={50}
            list="color-patterns"
          />
          <datalist id="color-patterns">
            {colorPresets.map((preset) => (
              <option key={preset} value={preset} />
            ))}
          </datalist>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Birthday</label>
          <input
            type="date"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            value={form.birthday ?? ''}
            onChange={handleChange('birthday')}
            max={todayISO()}
            required
          />
          <p className="mt-1 text-xs text-gray-500">Age: {age} year(s)</p>
        </div>
      </div>

      <div className="rounded-lg border border-dashed border-indigo-300 bg-indigo-50 p-6 text-center">
        <p className="text-sm text-indigo-700">Pet Preview (Sprite placeholder)</p>
        <div className="mt-4 inline-flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-inner">
          <span className="text-4xl">
            {form.species === 'dog' && '🐶'}
            {form.species === 'cat' && '🐱'}
            {form.species === 'bird' && '🐦'}
            {form.species === 'rabbit' && '🐰'}
            {form.species === 'fox' && '🦊'}
            {form.species === 'dragon' && '🐲'}
          </span>
        </div>
        <p className="mt-3 text-sm text-gray-600">
          {form.breed} · {form.color_pattern}
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
        disabled={submitting}
      >
        {submitting ? 'Saving...' : mode === 'create' ? 'Create Pet' : 'Save Changes'}
      </button>
    </form>
  );
}

