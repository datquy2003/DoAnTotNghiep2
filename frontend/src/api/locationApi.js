import axios from "axios";

const VN_PROVINCES_API = "https://provinces.open-api.vn/api/?depth=1";

const COUNTRIES_API =
  "https://restcountries.com/v3.1/all?fields=name,translations,cca2";
const STATES_API = "https://countriesnow.space/api/v0.1/countries/states";

const getVietnamProvinces = async () => {
  try {
    const response = await axios.get(VN_PROVINCES_API);
    if (response.data && Array.isArray(response.data)) {
      return response.data
        .map((p) => p.name.replace("Thành phố ", "TP. ").replace("Tỉnh ", ""))
        .sort((a, b) => a.localeCompare(b, "vi"));
    }
    return [];
  } catch (error) {
    console.error("Lỗi lấy tỉnh thành VN:", error);
    return [];
  }
};

const getCountries = async () => {
  try {
    const response = await axios.get(COUNTRIES_API);

    if (response.data && Array.isArray(response.data)) {
      const countries = response.data
        .map((c) => ({
          label: c.translations?.vie?.common || c.name?.common,
          value: c.name?.common,
          code: c.cca2,
        }))
        .filter((c) => c.label)
        .sort((a, b) => a.label.localeCompare(b.label, "vi"));
      return countries;
    }
    return [];
  } catch (error) {
    console.error("Lỗi lấy quốc gia:", error);
    return [];
  }
};

const getStates = async (countryNameEn) => {
  try {
    const response = await axios.post(STATES_API, {
      country: countryNameEn,
    });

    if (response.data && !response.data.error) {
      return response.data.data.states.map((s) => s.name);
    }
    return [];
  } catch (error) {
    return [];
  }
};

export const locationApi = {
  getVietnamProvinces,
  getCountries,
  getStates,
};