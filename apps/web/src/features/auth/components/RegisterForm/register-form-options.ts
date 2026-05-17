import { USER_GENDER_VALUES } from '../../../../lib/schemas/user-demographics.schema';
import { COUNTRIES } from '../CountrySelector/CountrySelector.data';
import type { SelectOption } from '../../../../core/components/SelectField/SelectField';

type Translate = (key: string) => string;

export function buildCountryOptions(): SelectOption[] {
  return COUNTRIES.map((country) => ({
    value: country.code,
    label: `${country.flag} ${country.dialCode} ${country.name}`,
    flag: country.flag,
  }));
}

export function buildGenderOptions(t: Translate): SelectOption[] {
  return USER_GENDER_VALUES.map((gender) => ({
    value: gender,
    label: t(`demographics.gender.options.${gender}`),
  }));
}

export function resolveCountryDialing(countryCode: string | number) {
  return COUNTRIES.find((country) => country.code === countryCode);
}
